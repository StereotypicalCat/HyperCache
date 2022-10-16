import {convertPlaintextToHashTree} from "./TreeManager.js";
import {AppendOnlyLog} from "./SimulatedAppendOnlyLog.js";
import {max_peer_time_before_first_request} from "./SimulationParameters.js";

/*
let testUrls = [
    'testUrl1',
    'testUrl2',
    'testUrl3',
    'testUrl4'
]

let websites = [
    '<!DOCTYPE html><html><body><p>This is a test <b>bold</b> text</p><p>Other text</p></body></html>',
    '<!DOCTYPE html><html><body><p>This is a test <i>italic</i> text</p><p>Other text</p></body></html>',
    '<!DOCTYPE html><html><body><p>What did alice say to me? asked bob</p></body></html>',
    '<!DOCTYPE html><html><body><p>Alice says you look really good in that outfit</p></body></html>'
]

let maliciouswebsites = [
    '<!DOCTYPE html><html><body><p>This is a test <b>italic</b> text</p><p>Other text</p></body></html>',
    '<!DOCTYPE html><html><body><p>This is a test <i>bold</i> text</p><p>Other text</p></body></html>',
    '<!DOCTYPE html><html><body><p>What did alice say to me? bob violently asked</p></body></html>',
    '<!DOCTYPE html><html><body><p>Alice says you look absolutely terrible</p></body></html>'
]
*/
// https://javascript.info/task/shuffle
function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}


const amountOfWebsites = 100;

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}


let doP2PProtocol = async (document, url, aol, peerNum) => {
    let hashTree = await convertPlaintextToHashTree(document);

    let wasSuccess = await aol.tryAddNewVersion(hashTree, peerNum, url)

    if (!wasSuccess){
        await aol.tryAddNewValidation(hashTree, peerNum, url)
    }
}

let doP2PProtocolWithPlaintext = async (plaintext, url, aol, peerNum) => {

    let hashTree = {
        value: plaintext
    }

    let wasSuccess = await aol.tryAddNewVersion(hashTree, peerNum, url)

    if (!wasSuccess){
        await aol.tryAddNewValidation(hashTree, peerNum, url)
    }
}

let startPurePeer = async (peerNum, aol, urls, requester) => {

    const delayToWait = Math.random() * max_peer_time_before_first_request * 1000;

    const thisPeersUrls = [...urls]
    shuffle(thisPeersUrls)

    let mainLoop = async () => {
        // print the second mark when the peer starts
        //console.log("Pure Peer " + peerNum + " starting again");

        for (const url of thisPeersUrls){
            //console.log("Peer " + peerNum + " requesting " + url);
            //console.log("new url: " + url)
            let response = await requester(url);

            await doP2PProtocolWithPlaintext(response, url, aol, peerNum)

        }

        setTimeout(mainLoop, delayToWait);

    }

    setTimeout(mainLoop, delayToWait)
}

let startConsistenlyMaliciousPeer = async (peerNum, aol, urls, requester) => {

        await delay(Math.random() * 2000)

        // print the second mark when the peer starts
        console.log("Consistently Malicious Peer " + peerNum + " started");



    for (let i = 0; i < amountOfWebsites; i++) {
        let doc = "wrongHash" + i;;

        await doP2PProtocolWithPlaintext(doc, "url" + i, aol, peerNum)
    }


}

let startSometimesMaliciousPeer = async (peerNum, aol, urls, requester) => {

    await delay(Math.random() * 2000)

    // print the second mark when the peer starts
    console.log("Sometimes Malicious Peer " + peerNum + " started");

    let doc;
    let hashTree;

    for (let i = 0; i < amountOfWebsites; i++) {
        if (Math.random() >= 0.5){
            doc = "wrongHash" + i;
        }
        else{
            doc = "correctHash" + i;
        }

        await doP2PProtocolWithPlaintext(doc, "url" + i, aol, peerNum)
    }
}

let startNetworkWithConfig = async (purePeers, ConsistentMalicious, SometimesMalicious, urlsToRequest, requestMethod) => {
    const aol = new AppendOnlyLog(purePeers + ConsistentMalicious + SometimesMalicious);

    for (let i = 0; i < purePeers; i++) {
        startPurePeer(i, aol, urlsToRequest, requestMethod);
    }
    for (let i = purePeers; i < purePeers + ConsistentMalicious; i++) {
        startConsistenlyMaliciousPeer(i, aol, urlsToRequest, requestMethod)
    }
    for (let i = purePeers + ConsistentMalicious; i < purePeers + ConsistentMalicious + SometimesMalicious; i++) {
        startSometimesMaliciousPeer(i, aol, urlsToRequest, requestMethod)
    }

    return aol;
}



export {startPurePeer, startConsistenlyMaliciousPeer, startSometimesMaliciousPeer, startNetworkWithConfig}