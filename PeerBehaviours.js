import {convertPlaintextToHashTree} from "./TreeManager.js";
import {AppendOnlyLog} from "./SimulatedAppendOnlyLog.js";
import {
    chance_of_sometimes_being_malicious,
    max_peer_time_before_first_request, min_peer_time_before_first_request,
    peer_timeout
} from "./SimulationParameters.js";

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

/*function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}*/

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

let purePeerStrategy = async (peerNum, aol, urls, requester) => {

    for (const url of urls){
        //console.log("Peer " + peerNum + " requesting " + url);
        //console.log("new url: " + url)
        let response = await requester(url);

        await doP2PProtocolWithPlaintext(response, url, aol, peerNum)
    }
}
let consistentlyMaliciousPeerStrategy = async (peerNum, aol, urls, requester) => {
    for (const url of urls){
        //console.log("Peer " + peerNum + " requesting " + url);
        //console.log("new url: " + url)

        let response = url + "_malicious"

        await doP2PProtocolWithPlaintext(response, url, aol, peerNum)
    }
}
let sometimesMaliciousPeerStrategy = async (peerNum, aol, urls, requester) => {
    for (const url of urls){

        let doc;
        if (Math.random() <= chance_of_sometimes_being_malicious){
            doc = url + "_malicious";
        }
        else{
            doc = requester(url);
        }

        await doP2PProtocolWithPlaintext(doc, url, aol, peerNum)
    }
}
let startPeer = async (peerNum, aol, urls, requester, documentChangeStrategy) => {
    const delayToWait = Math.max(Math.random() * max_peer_time_before_first_request * 1000, min_peer_time_before_first_request * 1000);

    const thisPeersUrls = [...urls]
    shuffle(thisPeersUrls)

    let mainLoop = async () => {
        // print the second mark when the peer starts
        //console.log("Pure Peer " + peerNum + " starting again");

        await documentChangeStrategy(peerNum, aol, thisPeersUrls, requester)

        setTimeout(mainLoop, peer_timeout * 1000);
    }
    setTimeout(mainLoop, delayToWait)
}

export let startNetworkWithConfig = async (purePeers, ConsistentMalicious, SometimesMalicious, urlsToRequest, requestMethod) => {
    const aol = new AppendOnlyLog(purePeers + ConsistentMalicious + SometimesMalicious);

    for (let i = 0; i < purePeers; i++) {
        startPeer(i, aol, urlsToRequest, requestMethod, purePeerStrategy)
    }
    for (let i = purePeers; i < purePeers + ConsistentMalicious; i++) {
        startPeer(i, aol, urlsToRequest, requestMethod, consistentlyMaliciousPeerStrategy)
    }
    for (let i = purePeers + ConsistentMalicious; i < purePeers + ConsistentMalicious + SometimesMalicious; i++) {
        startPeer(i, aol, urlsToRequest, requestMethod, sometimesMaliciousPeerStrategy)
    }

    return aol;
}