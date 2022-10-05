
const trust_for_new_resource = 20;
const trust_for_validating_resource = 5;

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

async function printTrustMatrix(aol){
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

    // Create 2d array of trust values between peers
    let trustMatrix = [];
    for (let i = 0; i < uniquePeers.length; i++) {
        trustMatrix.push([]);
        for (let j = 0; j < uniquePeers.length; j++) {
            trustMatrix[i].push(await calculate_user_trust_of_user(aol, uniquePeers[i], uniquePeers[j]));
        }
    }


    console.table(trustMatrix)

}

export {calculate_user_trust_of_user, printTrustMatrix}
