
// Import and create the append only log
import {AppendOnlyLog, messageType} from "./SimulatedAppendOnlyLog.js";
import {convertPlaintextToHashTree} from "./TreeManager.js";
import {JSDOM} from "jsdom";
import {printTrustMatrix, printTrustOfEachPeer, calculate_trust_of_version} from "./TrustManager.js";

// import crypto library and generate and print a UUID
import pkg from 'uuid';
const { v4: uuidv4 } = pkg;


// Think about attack vector where adversary sends wrong log to new user (is this out of scope / countered by braha protocol)
const aol = new AppendOnlyLog();



let crawlWebsite = async (url) => {

    let retDoc;

    if (url == "debug1"){
        retDoc = '<!DOCTYPE html><html><body><p>This is a test <b>bold</b> text</p><p>Other text</p></body></html>'
    }

    else if (url == "debug2"){
        retDoc = '<!DOCTYPE html><html><body><p>This is a test <i>italic</i> text</p><p>Other text</p></body></html>'
    }
    //let testDoc = '<!DOCTYPE html><html><body class="test" otherAttribute="hello"><p class="Helloitsme">Element1</p><p>Element2</p><p>Element3</p></body></html>'
    return retDoc
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

let startPeer = async (peerNum, aol) => {

    await delay(Math.random() * 2000)

    // print the second mark when the peer starts
    console.log("peer " + peerNum + " started");

    // This peer should do 3 things

    let doc;
    let hashTree;

    if (Math.random() >= 0.5){
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
    }

    let {wasSuccess, index} = await aol.tryAddNewVersion(hashTree, peerNum)

    if (!wasSuccess){
        await aol.tryAddNewValidation(index, peerNum)
    }
}

for (let i = 0; i < 5; i++) {
    // Replace with something like public/private key
    //     startPeer(uuidv4(), aol)
    startPeer(i, aol)
}

// Wait 10 seconds, then the read log
setTimeout(async () => {
    //console.log(await aol.read());
    // print versions and validations from log
    let {validations, versions} = await aol.read();
    console.log("Printing Versions")
    console.log(versions)
    console.log("Printing Validations")
    console.log(validations)
    // Printing Trust Matrix
    console.log("Printing Trust Matrix")
    await aol.print();
    await printTrustMatrix(aol);
    // print trust of all users
    console.log("Printing Trust of all users")
    await printTrustOfEachPeer(aol);

    console.log("trust of the different versions")
    // For each distinct version, call the calculate_trust_of_version function
    let distinctVersions = [...new Set(versions.map(item => item.tree.value))];
    for (let i = 0; i < distinctVersions.length; i++) {
        console.log("version " + distinctVersions[i] + " has trust " + await calculate_trust_of_version(aol, distinctVersions[i]))
    }


}, 6000);