import {logistic_k, logistic_L, logistic_x0, minimum_confidence, only_most_trusted} from "./SimulationParameters.js";

const trust_for_new_resource = 4;
const trust_for_validating_resource = 1;
const popolous_multiplier = (1/10);


// Needs to be rewritten and refactored to work with key-like ids instead of numbers
async function get_unique_peers(aol){

    //return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    // return list with numers 0 to 5

    const numberOfPeers = await aol.getNumberOfPeers();

    //console.log("Total number of peers: ", numberOfPeers)

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
        if (isNaN(trustMatrix[i][peerId])){
            console.log("ful trust of user: NaN while calculating trust of " + peerId + " from " + i)
            console.table(trustMatrix)
        }

        userTrust += trustMatrix[i][peerId];
    }

    // TODO: THE PROBLEM IS SOMETHING RIGHT HERE
    // THE PROBLEM IS WHEN PEERS CHURN...UNFORTUNETLY.
    // !==============
    // !=====================
    // !===============
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
    let bonus = 1;
    // the trust of the version is the sum of the trust of the peers that validated it plus the peer who placed it there
    for (let i = 0; i < websites.get(url).get(hash).validations.length; i++) {
        let user_trust = await calculate_full_trust_of_user(aol, websites.get(url).get(hash).validations[i].peerId);
        trust += user_trust;
        bonus += popolous_multiplier;
    }

    trust *= bonus;

    return trust;

}

function inverseLogsticFunction(x){

    // Curves maximum value
    const L = logistic_L;

    // The logistic growth rate of the curve
    const k = logistic_k;

    // The x value of the sigmoid's midpoint on the x axis
    // Basically controls the bias of future versions vs previous versions
    let x0 = logistic_x0;

    let logisticPart = (L/(1+Math.exp((-k)*(x-x0))));

    return 1 - logisticPart;
}

async function calculate_trust_of_version_at_time(aol, url, hash, slot){
    let websites = await aol.read();

    let websiteExistsInAOL = websites.has(url) && websites.get(url).has(hash);
    if (!websiteExistsInAOL){
        console.log("couldn't find either url or hash")
        return 0;
    }

    let trust = await calculate_full_trust_of_user(aol, websites.get(url).get(hash).peerId);
    let timeSinceInitialSubmission = Math.abs(websites.get(url).get(hash).time - slot);
    let initialUserScaleValue = inverseLogsticFunction(timeSinceInitialSubmission)
    trust *= initialUserScaleValue;


    // Bonus works to restrict karma whoring
    let bonus = 1;
    // the trust of the version is the sum of the trust of the peers that validated it plus the peer who placed it there
    for (let i = 0; i < websites.get(url).get(hash).validations.length; i++) {
        let user_trust = await calculate_full_trust_of_user(aol, websites.get(url).get(hash).validations[i].peerId);

        // Scale the trust accumulated with the time since the validation
        let timeSinceValidation = Math.abs(websites.get(url).get(hash).validations[i].time - slot)
        //console.log(websites.get(url).get(hash).validations[i].time)
        //console.log(slot)
        //console.log(timeSinceValidation)
        let scaleValue = inverseLogsticFunction(timeSinceValidation)
        //console.log("Scale value: ", scaleValue, "Time since validation:", timeSinceValidation)

        trust += user_trust * scaleValue;
        bonus += popolous_multiplier * scaleValue;
    }

    trust *= bonus;

    return trust;

}

export async function calculate_approximate_timeline_of_url(aol, url, endOfTimelineSlot, withConfidence = false){
    let websites = await aol.read()

    let calculatedTimeline = []
    for (let time = 0; time < endOfTimelineSlot; time++){

        let hashes = websites.get(url)

        let mostTrustedVersionScore = -1;
        let mostTrustedVersionHash = "";
        let totalTrustOfAllVersions = 0;
        let totalVersions = 0;

        for (const [hash, hashinfo] of hashes) {
            let trust = await calculate_trust_of_version_at_time(aol, url, hash, time)
            //console.log(" hash: " + hash + " trust: " + trust)
            totalTrustOfAllVersions += trust;
            totalVersions += 1;
            if (trust > mostTrustedVersionScore){
                mostTrustedVersionScore = trust;
                mostTrustedVersionHash = hash;
            }
        }

        ///console.log("Most trusted version at time " + time + " is " + mostTrustedVersionHash + " with score " + mostTrustedVersionScore)

        if (only_most_trusted){
            //console.log("CalculatedTimeline: ", calculatedTimeline)
            if (withConfidence === false && (calculatedTimeline.length === 0 || calculatedTimeline[calculatedTimeline.length - 1].hash !== mostTrustedVersionHash)){
                calculatedTimeline.push({timeStart: time, hash: mostTrustedVersionHash})
            }
            else if (withConfidence === true){
                let confidence = mostTrustedVersionScore / totalTrustOfAllVersions;
                calculatedTimeline.push({timeStart: time, hash: mostTrustedVersionHash, confidence: confidence, totalVersions: totalVersions})
            }
        }else{
            // run through all versions again and calculate their confidence
            let trustedVersions = []
            for (const [hash, hashinfo] of hashes) {
                let trust = await calculate_trust_of_version_at_time(aol, url, hash, time)
                //console.log(" hash: " + hash + " trust: " + trust)
                if (trust/totalTrustOfAllVersions > minimum_confidence){
                    trustedVersions.push({hash: hash, confidence: trust/totalTrustOfAllVersions})
                }
            }
            calculatedTimeline.push({timeStart: time, versions: trustedVersions, totalVersions: totalVersions})
        }

    }

    return calculatedTimeline;
    //console.log(calculatedTimeline)


}

let latestTrustMatrix;
let latestVersionLength;

async function calculate_trust_matrix(aol){
    let logHistoryLength = await aol.getLogLength();

    if (latestTrustMatrix !== undefined && latestVersionLength === logHistoryLength){
        return latestTrustMatrix;
    }

    latestVersionLength = logHistoryLength;

    let uniquePeers = await get_unique_peers(aol);

    // Create 2d array of trust values between peers
    let trustMatrix = [];
    for (let i = 0; i < uniquePeers.length; i++) {
        trustMatrix.push([]);
        for (let j = 0; j < uniquePeers.length; j++) {
            let test = await calculate_user_trust_of_user(aol, i, j);
            if (isNaN(test)){
                console.log("NaN While calculating trust of " + i + " and " + j)
            }
            trustMatrix[i].push(test);
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

export {calculate_user_trust_of_user, printTrustMatrix, printTrustOfEachPeer, calculate_trust_of_version, calculate_trust_of_version_at_time}
