
// Import and create the append only log
import {AppendOnlyLog} from "./SimulatedAppendOnlyLog.js";
import {convertPlaintextToHashTree} from "./TreeConverter.js";
import {JSDOM} from "jsdom";

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
    // This peer should do 3 things

    // First crawl a website and create structure 1
    let doc = await crawlWebsite('debug1');
    let hashTree = await convertPlaintextToHashTree(doc)

    //console.log("Printing Tree")
    //console.log(hashTree)
    console.log("Calling Print")
    hashTree.print();

    let doc2 = await crawlWebsite('debug2');
    let hashTree2 = await convertPlaintextToHashTree(doc2)

    //console.log("Printing Tree")
    //console.log(hashTree2)
    console.log("Calling Print")
    hashTree2.print();
}

startPeer(1, aol)