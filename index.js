
// Import and create the append only log


// import crypto library and generate and print a UUID
import pkg from 'uuid';
import {startNetworkWithConfig} from "./PeerBehaviours.js";
import {calculate_trust_of_version, printTrustMatrix, printTrustOfEachPeer} from "./TrustManager.js";
import {
    calculateConfusionMatrix,
    calculateTemporalIncorrectness,
    getBestAndWorstTrustRatios,
    printUsefulStats,
    printWebsiteTimelines, testDifferentValuesOfLogisticFunction
} from "./TestHelpers.js";
import {get_requestable_urls, GetWebsiteFakedPlaintext, request_website} from "./WebsiteManager.js";
import {
    amount_of_consistently_malicious_peers,
    amount_of_pure_peers,
    amount_of_sometimes_malicious_peers, logistic_k, logistic_x0,
    max_time, updateValue
} from "./SimulationParameters.js";
import _ from "lodash";
import {getTime} from "./TimeManager.js";
import util from "util";
const { v4: uuidv4 } = pkg;

// Think about attack vector where adversary sends wrong log to new user (is this out of scope / countered by braha protocol)


//let aol = await startNetworkWithConfig(60, 40, 10)


let aol = await startNetworkWithConfig(amount_of_pure_peers, amount_of_consistently_malicious_peers, amount_of_sometimes_malicious_peers, await get_requestable_urls(), request_website, max_time)

setTimeout(async () => {

    //let {bestratio, worstratio} = await getBestAndWorstTrustRatios(aol);
    //console.log(bestratio)
    //console.log(worstratio)

    //await printUsefulStats(aol);
    //await printWebsiteTimelines(aol, true);

    //let val = await GetWebsiteFakedPlaintext();
    //console.log(val)

   // await aol.printAsConsoleLog();

    //let ratio = await calculateTemporalIncorrectness(aol)
    //console.log(ratio)

    //await printWebsiteTimelines(aol, true);
    //let val = await GetWebsiteFakedPlaintext();
    //console.log(val)

    //let confusion_matrix = await calculateConfusionMatrix(aol);
    //console.log(confusion_matrix);

    //await printWebsiteTimelines(aol, true);
    //let val = await GetWebsiteFakedPlaintext();
    //console.log(val)

    //await aol.printAsConsoleLog();
    let endTime = getTime();
    //await printWebsiteTimelines(aol, true);
    //let val = await GetWebsiteFakedPlaintext();
    //console.log(val)
    let ratio = await calculateConfusionMatrix(aol, endTime)
    console.log(ratio)
    //await aol.printLogHistory()

    //await testDifferentValuesOfLogisticFunction(aol);


}, (max_time*1000) + 3 * 1000);

setTimeout(async () => {
    console.log("About half the time has passed....");
}, (max_time*1000) / 2);