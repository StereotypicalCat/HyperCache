//add this script in myWorker.js file
import {parentPort, workerData} from "worker_threads";
import {TestHelpers} from "./TestHelpers.js";
import {WebsiteManager} from "./WebsiteManager.js";
import {AppendOnlyLog} from "./SimulatedAppendOnlyLog.js";
import {defaultSimulationParameters, defaultTrustParameters} from "./SimulationParameters.js";
import {PeerBehaviours} from "./PeerBehaviours.js";
import {TimeManager} from "./TimeManager.js";

let result = await RunSimulationAndCalculateStats(workerData)
parentPort.postMessage(result);

async function RunSimulationAndCalculateStats(workerData) {

    let timeManager = new TimeManager();
    let WebsiteManagerSimulator = new WebsiteManager(workerData.simulation_parameters, timeManager);
    let PeerBehaviorSimulator = new PeerBehaviours(workerData.simulation_parameters, WebsiteManagerSimulator, timeManager);
    console.log("Starting Simulation");
    let aol = await PeerBehaviorSimulator.startNetworkWithConfig();

    console.log("Generating Data");

    let testHelper = new TestHelpers(defaultTrustParameters, aol, WebsiteManagerSimulator, workerData.simulation_parameters);
    let scores = await testHelper.testDifferentValuesOfLogisticFunction();
    let withSimParams = scores.map((score) => {
        return {
            ...score,
            ...workerData.simulation_parameters
        }
    })

    return withSimParams;

}
