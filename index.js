
// Import and create the append only log
import {AppendOnlyLog} from "./SimulatedAppendOnlyLog.js";
import {convertPlaintextToHashTree} from "./TreeConverter.js";
import {JSDOM} from "jsdom";

const aol = new AppendOnlyLog();



let crawlWebsite = async (url) => {
    let testDoc = '<!DOCTYPE html><html><body class="test" otherAttribute="hello"><p class="Helloitsme">Element1</p><p>Element2</p><p>Element3</p></body></html>'
    return testDoc
}




function generateHashTree(doc) {



    return undefined;
}

let startPeer = async (peerNum, aol) => {
    // This peer should do 3 things

    // First crawl a website and create structure 1
    let doc = await crawlWebsite('filler');
    let hashTree = await convertPlaintextToHashTree(doc)

    console.log("Printing Tree")
    console.log(hashTree)
    console.log("Calling Print")
    hashTree.print();
}

startPeer(1, aol)