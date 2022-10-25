import {startNetworkWithConfig} from "./PeerBehaviours.js";
import {calculate_trust_of_version, printTrustMatrix, printTrustOfEachPeer} from "./TrustManager.js";
import {
    calculateConfusionMatrix,
    calculateTemporalCorrectnessStats,
    printUsefulStats,
    printWebsiteTimelines, testDifferentValuesOfLogisticFunction
} from "./TestHelpers.js";
import {
    get_requestable_urls,
    getAllCorrectWebsitesForUrl,
    GetWebsiteFakedPlaintext,
    request_website
} from "./WebsiteManager.js";
import {
    amount_of_consistently_malicious_peers,
    amount_of_pure_peers,
    amount_of_sometimes_malicious_peers, logistic_k, logistic_x0,
    max_time, updateValue
} from "./SimulationParameters.js";
import _ from "lodash";
import {getTime} from "./TimeManager.js";
import util from "util";
import cliProgress from "cli-progress";
// create a new progress bar instance and use shades_classic theme
// Think about attack vector where adversary sends wrong log to new user (is this out of scope / countered by braha protocol)


let calculatePostStats = async (aol) => {
    console.log("calculating post stats...")
    let endTime = getTime();

    //await printUsefulStats(aol);

    //await printWebsiteTimelines(aol, true);
    //let val = await GetWebsiteFakedPlaintext();
    //console.log(val)

    let confusion_matrix = await calculateConfusionMatrix(aol, endTime)
    console.log(confusion_matrix)

    let temporal_matrix = await calculateTemporalCorrectnessStats(aol, endTime);
    console.log(temporal_matrix)

    //await testDifferentValuesOfLogisticFunction(aol);
}


let aol = await startNetworkWithConfig(amount_of_pure_peers, amount_of_consistently_malicious_peers, amount_of_sometimes_malicious_peers, await get_requestable_urls(), request_website, max_time)

let simulationTimeWithBuffer = max_time + 3
const opt = {
    format: 'Running Simulation... [{bar}] {percentage}% | {value}/{total}',
    stopOnComplete: true,
}
const simulation_timer = new cliProgress.SingleBar(opt, cliProgress.Presets.shades_classic);
simulation_timer.start(simulationTimeWithBuffer, 0);
let updateProgress = async (progressBar, time) => {
    let newTime = getTime();
    progressBar.update(Math.floor(newTime));

    if (Math.floor(newTime) >= simulationTimeWithBuffer+1){
        simulation_timer.stop();
        await calculatePostStats(aol);
        return;
    }

    setTimeout(() => {
        updateProgress(progressBar, time)
    }, time)
}

await updateProgress(simulation_timer, 1000)

