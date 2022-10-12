
// Import and create the append only log


// import crypto library and generate and print a UUID
import pkg from 'uuid';
import {startNetworkWithConfig} from "./PeerBehaviours.js";
import {calculate_trust_of_version, printTrustMatrix, printTrustOfEachPeer} from "./TrustManager.js";
import {getBestAndWorstTrustRatios} from "./TestHelpers.js";
const { v4: uuidv4 } = pkg;

// Think about attack vector where adversary sends wrong log to new user (is this out of scope / countered by braha protocol)


let aol = await startNetworkWithConfig(60, 40, 10)

// Wait 10 seconds, then the read log
setTimeout(async () => {

    let {bestratio, worstratio} = await getBestAndWorstTrustRatios(aol);
    console.log(bestratio)
    console.log(worstratio)

}, 10000);