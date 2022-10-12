
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

    //console.log("trust of the different versions")
    // For each distinct version, call the calculate_trust_of_version function
    //let distinctVersions = [...new Set(versions.map(item => item.tree.value))];
    //for (let i = 0; i < distinctVersions.length; i++) {
    //    console.log("version " + distinctVersions[i] + " has trust " + await calculate_trust_of_version(aol, distinctVersions[i]))
    //}


}, 6000);