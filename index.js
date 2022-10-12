
// Import and create the append only log
import {AppendOnlyLog} from "./SimulatedAppendOnlyLog.js";
import {convertPlaintextToHashTree} from "./TreeManager.js";
import {JSDOM} from "jsdom";
import {printTrustMatrix, printTrustOfEachPeer, calculate_trust_of_version} from "./TrustManager.js";
import {startPurePeer, startSometimesMaliciousPeer, startConsistenlyMaliciousPeer} from "./PeerBehaviours.js";

// import crypto library and generate and print a UUID
import pkg from 'uuid';
const { v4: uuidv4 } = pkg;


// Think about attack vector where adversary sends wrong log to new user (is this out of scope / countered by braha protocol)
const aol = new AppendOnlyLog();





let crawlWebsite = async (url) => {

    let retDoc;

    //let testDoc = '<!DOCTYPE html><html><body class="test" otherAttribute="hello"><p class="Helloitsme">Element1</p><p>Element2</p><p>Element3</p></body></html>'
    return retDoc
}




let purePeersToGenerate = 10;
let consistenlyMaliciousPeersToGenerate = 2;
let sometimesMaliciousPeersToGenerate = 2;

for (let i = 0; i < purePeersToGenerate; i++) {
    startPurePeer(i, aol)
}
for (let i = purePeersToGenerate; i < purePeersToGenerate + consistenlyMaliciousPeersToGenerate; i++) {
    startConsistenlyMaliciousPeer(i, aol)
}
for (let i = purePeersToGenerate + consistenlyMaliciousPeersToGenerate; i < purePeersToGenerate + consistenlyMaliciousPeersToGenerate + sometimesMaliciousPeersToGenerate; i++) {
    startSometimesMaliciousPeer(i, aol)
}

// Wait 10 seconds, then the read log
setTimeout(async () => {
    //console.log(await aol.read());
    // print versions and validations from log
    //let {validations, versions} = await aol.read();
    //console.log("Printing Versions")
    //console.log(versions)
    //console.log("Printing Validations")
    //console.log(validations)
    // Printing Trust Matrix

    await aol.printLogHistory()

    console.log("Printing Trust Matrix")
    //await aol.print();
    await printTrustMatrix(aol);
    // print trust of all users
    console.log("Printing Trust of all users")
    await printTrustOfEachPeer(aol);

    console.log("trust of the different versions")

    let websites = await aol.read()
    // for each url in the websites, print each hash and the trust of that hash
    for (const [url, hashes] of websites){
        console.log("==== " + url + " ====")
        for (const [hash, hashinfo] of hashes) {
            let trust = await calculate_trust_of_version(aol, url, hash)
            console.log(" hash: " + hash + " trust: " + trust)
        }
    }


}, 6000);