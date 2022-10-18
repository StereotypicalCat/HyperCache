
// Import and create the append only log


// import crypto library and generate and print a UUID
import pkg from 'uuid';
import {startNetworkWithConfig} from "./PeerBehaviours.js";
import {calculate_trust_of_version, printTrustMatrix, printTrustOfEachPeer} from "./TrustManager.js";
import {getBestAndWorstTrustRatios, printUsefulStats, printWebsiteTimelines} from "./TestHelpers.js";
import {get_requestable_urls, GetWebsiteFakedPlaintext, request_website} from "./WebsiteManager.js";
import {max_time} from "./SimulationParameters.js";
const { v4: uuidv4 } = pkg;

// Think about attack vector where adversary sends wrong log to new user (is this out of scope / countered by braha protocol)


//let aol = await startNetworkWithConfig(60, 40, 10)

let aol = await startNetworkWithConfig(3, 0, 0, await get_requestable_urls(), request_website)

// Wait 10 seconds, then the read log
setTimeout(async () => {

    //let {bestratio, worstratio} = await getBestAndWorstTrustRatios(aol);
    //console.log(bestratio)
    //console.log(worstratio)

    //await printUsefulStats(aol);
    await printWebsiteTimelines(aol);


    let val = await GetWebsiteFakedPlaintext();
    console.log(val)

}, (max_time*1000) + 2 * 1000);

setTimeout(async () => {
    console.log("About half the time has passed....");
}, (max_time*1000) / 2);