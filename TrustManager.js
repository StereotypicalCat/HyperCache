
const trust_for_new_resource = 20;
const trust_for_validating_resource = 5;

// TODO:
// Somehting is wrong with calulcating peer trust. Mixed up peerId and indexes.
// Calculate trust of version

async function get_unique_peers(aol){
    let {versions, validations} = await aol.read();
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
    }
    return uniquePeers;
}

async function calculate_user_trust_of_user(aol, peerIdSource, peerIdTarget){

    if (peerIdSource === peerIdTarget){
        return Infinity;
    }

    let {versions, validations} = await aol.read();

    let trust = 0;
    for (let i = 0; i < versions.length; i++) {
        // For each version the target peer has added, check if the source peer has validated it
        if (versions[i].peerId === peerIdTarget){
            for (let j = 0; j < validations.length; j++) {
                if (validations[j].index === i && validations[j].peerId === peerIdSource){
                    trust += trust_for_new_resource;
                }
            }
        }

        // For each version the source peer has added, check if the target peer has validated it
        if (versions[i].peerId === peerIdSource){
            for (let j = 0; j < validations.length; j++) {
                if (validations[j].index === i && validations[j].peerId === peerIdTarget){
                    trust += trust_for_validating_resource;
                }
            }
        }
    }
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


async function calculate_trust_of_version(aol, hash){
    let {versions, validations} = await aol.read();

    let trust = 0;

    for (let i = 0; i < versions.length; i++) {
        if (versions[i].tree.value === hash){
            for (let j = 0; j < validations.length; j++) {
                if (validations[j].index === i){
                    trust += validationse;
                }
            }
        }
    }

    return trust;

}

async function calculate_trust_matrix(aol){
    let uniquePeers = await get_unique_peers(aol);

    // Create 2d array of trust values between peers
    let trustMatrix = [];
    for (let i = 0; i < uniquePeers.length; i++) {
        trustMatrix.push([]);
        for (let j = 0; j < uniquePeers.length; j++) {
            trustMatrix[i].push(await calculate_user_trust_of_user(aol, uniquePeers[i], uniquePeers[j]));
        }
    }

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

export {calculate_user_trust_of_user, printTrustMatrix, printTrustOfEachPeer}
