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

let startPurePeer = async (peerNum, aol) => {

    await delay(Math.random() * 2000)

    // print the second mark when the peer starts
    console.log("Pure Peer " + peerNum + " started");


    let doc;
    let hashTree;

    for (let i = 0; i < websites.length; i++) {
        doc = websites[i];

        hashTree = await convertPlaintextToHashTree(doc);

        let {wasSuccess, index} = await aol.tryAddNewVersion(hashTree, peerNum)

        if (!wasSuccess){
            await aol.tryAddNewValidation(index, peerNum)
        }
    }

    /*    if (Math.random() >= 0.5){
            // First crawl a website and create structure 1
            doc = await crawlWebsite('debug1');
            hashTree = await convertPlaintextToHashTree(doc)
            //console.log("Printing Tree")
            //console.log(hashTree)
            //console.log("Calling Print")
            //hashTree.print();
        }
        else {
            doc = await crawlWebsite('debug2');
            hashTree = await convertPlaintextToHashTree(doc)

            //console.log("Printing Tree")
            //console.log(hashTree2)
            //console.log("Calling Print")
            //hashTree2.print();
        }*/
}

let startConsistenlyMaliciousPeer = async (peerNum, aol) => {

        await delay(Math.random() * 2000)

        // print the second mark when the peer starts
        console.log("Consistently Malicious Peer " + peerNum + " started");

    let doc;
    let hashTree;

    for (let i = 0; i < websites.length; i++) {
        doc = maliciouswebsites[i];

        hashTree = await convertPlaintextToHashTree(doc);

        let {wasSuccess, index} = await aol.tryAddNewVersion(hashTree, peerNum)

        if (!wasSuccess){
            await aol.tryAddNewValidation(index, peerNum)
        }
    }


}

let startSometimesMaliciousPeer = async (peerNum, aol) => {

    await delay(Math.random() * 2000)

    // print the second mark when the peer starts
    console.log("Consistently Malicious Peer " + peerNum + " started");

    let doc;
    let hashTree;

    for (let i = 0; i < websites.length; i++) {
        if (Math.random() >= 0.5){
            doc = maliciouswebsites[i];
        }
        else{
            doc = websites[i];
        }

        hashTree = await convertPlaintextToHashTree(doc);

        let {wasSuccess, index} = await aol.tryAddNewVersion(hashTree, peerNum)

        if (!wasSuccess){
            await aol.tryAddNewValidation(index, peerNum)
        }
    }
}

export {startPurePeer, startConsistenlyMaliciousPeer, startSometimesMaliciousPeer}