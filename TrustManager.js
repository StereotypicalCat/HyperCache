const trust_for_new_resource = 4;
const trust_for_validating_resource = 1;
const popolous_multiplier = 1.05;


// Needs to be rewritten and refactored to work with key-like ids instead of numbers
async function get_unique_peers(aol){

    //return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    // return list with numers 0 to 5

    const numberOfPeers = await aol.getNumberOfPeers();

    return Array.from(Array(numberOfPeers).keys());


    // uncomment if switching from linear peer ids to
    /*let {versions, validations} = await aol.read();
    // Count number of unique peers
    let uniquePeers = [];
    for (let i = 0; i < versions.length; i++) {
        if (!uniquePeers.includes(versions[i].peerId)){
            uniquePeers.push(versions[i].peerId)
        }
    }
    for (let i = 0; i < validations.length; i++) {
        if (!uniquePeers.includes(validations[i].peerId)){
            uniquePeers.push(validations[i].peerId)
        }
    }*/

    return uniquePeers;
}

async function calculate_user_trust_of_user(aol, peerIdSource, peerIdTarget){

    if (peerIdSource === peerIdTarget){
        return Infinity;
    }

    let websites = await aol.read();


    let trust = 0;

    // loop through all websites
    for (let [url, versions] of websites) {
        for (let [hash, versionInfo] of versions){

            // if the source peer placed the version
            if (versionInfo.peerId === peerIdSource){
                // if the target peer validated the version
                for(let i = 0; i < versionInfo.validations.length; i++){
                    if (versionInfo.validations[i].peerId === peerIdTarget){
                        trust += trust_for_validating_resource;
                    }
                }
            }

            // if the source peer validated the version
            if (versionInfo.peerId === peerIdTarget) {
                for (let i = 0; i < versionInfo.validations.length; i++) {
                    if (versionInfo.validations[i].peerId === peerIdSource) {
                        trust += trust_for_new_resource;
                    }
                }

            }

        }
    }

        // For each version the target peer has added, check if the source peer has validated it


        // For each version the source peer has added, check if the target peer has validated it

    //console.log("Peer " + peerIdSource + " has trust " + trust + " for peer " + peerIdTarget);

    return trust;
}

async function calculate_full_trust_of_user(aol, peerId){
    let trustMatrix = await calculate_trust_matrix(aol);

    let userTrust = 0;

    for (let i = 0; i < trustMatrix.length; i++) {
        if (i === peerId){
            continue;
        }
        userTrust += trustMatrix[i][peerId];
    }

    return userTrust;
}

async function calculate_trust_of_version(aol, url, hash){
    let websites = await aol.read();


    let websiteExistsInAOL = websites.has(url) && websites.get(url).has(hash);
    if (!websiteExistsInAOL){
        console.log("couldn't find either url or hash")
        return 0;
    }

    let trust = await calculate_full_trust_of_user(aol, websites.get(url).get(hash).peerId);

    // Bonus works to restrict karma whoring
    let bonus = popolous_multiplier;
    // the trust of the version is the sum of the trust of the peers that validated it plus the peer who placed it there
    for (let i = 0; i < websites.get(url).get(hash).validations.length; i++) {
        let user_trust = await calculate_full_trust_of_user(aol, websites.get(url).get(hash).validations[i].peerId);
        trust += user_trust;
        bonus *= popolous_multiplier;
    }

    trust *= bonus;



    return trust;

}

let latestTrustMatrix;
let latestVersionLength;

async function calculate_trust_matrix(aol){
    let logHistoryLength = await aol.getLogLength();

    if (latestTrustMatrix !== undefined && latestVersionLength === logHistoryLength){
        //console.log("reusing trust matrix.")
        return latestTrustMatrix;
    }

    latestVersionLength = logHistoryLength;

    let uniquePeers = await get_unique_peers(aol);

    // Create 2d array of trust values between peers
    let trustMatrix = [];
    for (let i = 0; i < uniquePeers.length; i++) {
        trustMatrix.push([]);
        for (let j = 0; j < uniquePeers.length; j++) {
            trustMatrix[i].push(await calculate_user_trust_of_user(aol, uniquePeers[i], uniquePeers[j]));
        }
    }

    latestTrustMatrix = trustMatrix;
    return trustMatrix;

}

async function printTrustMatrix(aol){
    let trustMatrix = await calculate_trust_matrix(aol);

    console.table(trustMatrix)
}

async function printTrustOfEachPeer(aol){
    let uniquePeers = await get_unique_peers(aol);

    for (let i = 0; i < uniquePeers.length; i++) {
        console.log("Peer " + uniquePeers[i] + " has trust " + await calculate_full_trust_of_user(aol, uniquePeers[i]));
    }
}

export {calculate_user_trust_of_user, printTrustMatrix, printTrustOfEachPeer, calculate_trust_of_version}
