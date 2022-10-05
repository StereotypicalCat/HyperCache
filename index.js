
// Import and create the append only log
import {AppendOnlyLog, messageType} from "./SimulatedAppendOnlyLog.js";
import {convertPlaintextToHashTree} from "./TreeManager.js";
import {JSDOM} from "jsdom";
import {printTrustMatrix} from "./TrustManager.js";

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




function generateHashTree(doc) {



    return undefined;
}

let startPeer = async (peerNum, aol) => {

    setTimeout(async () => {}, Math.random() * 1000);

    // This peer should do 3 things

    let doc;
    let hashTree;

    if (peerNum % 2 === 0){
        // First crawl a website and create structure 1
        doc = await crawlWebsite('debug1');
        hashTree = await convertPlaintextToHashTree(doc)
        //console.log("Printing Tree")
        //console.log(hashTree)
        //console.log("Calling Print")
        //hashTree.print();
    }
    if (peerNum % 2 === 1){
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

for (let i = 0; i < 3; i++) {
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
}, 3000);