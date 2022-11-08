import _ from "lodash";
import {getTime} from "./TimeManager.js";
import util from "util";
import cliProgress from "cli-progress";
import {defaultSimulationParameters, defaultTrustParameters} from "./SimulationParameters.js";
// create a new progress bar instance and use shades_classic theme
// Think about attack vector where adversary sends wrong log to new user (is this out of scope / countered by braha protocol)
import {PeerBehaviours} from "./PeerBehaviours.js";
import {WebsiteManager} from "./WebsiteManager.js";
import {TestHelpers} from "./TestHelpers.js";
import ObjectsToCsv from "objects-to-csv";

let WebsiteManagerSimulator = new WebsiteManager(defaultSimulationParameters);
let PeerBehaviorSimulator = new PeerBehaviours(defaultSimulationParameters, WebsiteManagerSimulator);
let aol = await PeerBehaviorSimulator.startNetworkWithConfig()

let calculatePostStats = async (aol) => {
    console.log("calculating post stats...")

    let endTime = getTime();
    let testHelper = new TestHelpers(defaultTrustParameters, aol, endTime, WebsiteManagerSimulator, defaultSimulationParameters);


    //await printUsefulStats(aol);

    //await testHelper.printWebsiteTimelines(aol, true);
    //let val = await GetWebsiteFakedPlaintext();
    //console.log(val)

    //let confusion_matrix = await calculateConfusionMatrix(aol, endTime)
    //console.log(confusion_matrix)

    //let temporal_matrix = await calculateTemporalCorrectnessStats(aol, endTime);
    //console.log(temporal_matrix)

    let scoreBoard = await testHelper.testDifferentValuesOfLogisticFunction(endTime);

    let withTrustSettings = scoreBoard.map((score) => {
        return {
            ...score,
            ...defaultSimulationParameters
        }
    })

    const csv = new ObjectsToCsv(withTrustSettings);

    // Save to file:
    const options = {append: true};
    await csv.toDisk('./test.csv', options);

    // Return the CSV file as string:

}



let simulationTimeWithBuffer = defaultSimulationParameters.max_time + 3
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

