import {convertPlaintextToHashTree} from "./TreeManager.js";

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

let startPurePeer = async (peerNum, aol) => {

    await delay(Math.random() * 2000)

    // print the second mark when the peer starts
    console.log("Pure Peer " + peerNum + " started");



    for (let i = 0; i < websites.length; i++) {
        let doc = websites[i];

        await doP2PProtocolWithPlaintext(doc, testUrls[i], aol, peerNum)

    }
}

let startConsistenlyMaliciousPeer = async (peerNum, aol) => {

        await delay(Math.random() * 2000)

        // print the second mark when the peer starts
        console.log("Consistently Malicious Peer " + peerNum + " started");



    for (let i = 0; i < websites.length; i++) {
        let doc = maliciouswebsites[i];

        await doP2PProtocolWithPlaintext(doc, testUrls[i], aol, peerNum)
    }


}

let startSometimesMaliciousPeer = async (peerNum, aol) => {

    await delay(Math.random() * 2000)

    // print the second mark when the peer starts
    console.log("Soemitimes Malicious Peer " + peerNum + " started");

    let doc;
    let hashTree;

    for (let i = 0; i < websites.length; i++) {
        if (Math.random() >= 0.5){
            doc = maliciouswebsites[i];
        }
        else{
            doc = websites[i];
        }

        await doP2PProtocolWithPlaintext(doc, testUrls[i], aol, peerNum)
    }
}




export {startPurePeer, startConsistenlyMaliciousPeer, startSometimesMaliciousPeer}