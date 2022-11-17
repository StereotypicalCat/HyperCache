//add this script in myWorker.js file
import {parentPort, workerData} from "worker_threads";
import {TestHelpers} from "./TestHelpers.js";
import {WebsiteManager} from "./WebsiteManager.js";
import {AppendOnlyLog} from "./SimulatedAppendOnlyLog.js";
import {defaultSimulationParameters, defaultTrustParameters} from "./SimulationParameters.js";
import {PeerBehaviours} from "./PeerBehaviours.js";
import {TimeManager} from "./TimeManager.js";

class SimulationWorker {

    aol = null;
    WebsiteManagerSimulator = null;
    workerData;

    constructor(workerData) {
        this.workerData = workerData;
    }

    async calculateStats() {
        let testHelper = new TestHelpers(defaultTrustParameters, this.aol, this.WebsiteManagerSimulator, this.workerData.simulation_parameters);
        let scores = await testHelper.testDifferentValuesOfLogisticFunction();

        return scores;
    }

    async runSimulation() {

        let timeManager = new TimeManager();
        let WebsiteManagerSimulator = new WebsiteManager(workerData.simulation_parameters, timeManager);
        let PeerBehaviorSimulator = new PeerBehaviours(workerData.simulation_parameters, WebsiteManagerSimulator, timeManager);
        console.log("Starting simulation")

        let aol = await PeerBehaviorSimulator.startNetworkWithConfig();
        this.aol = aol;
        this.WebsiteManagerSimulator = WebsiteManagerSimulator;
        return;
    }
}

const simulation_worker = new SimulationWorker(workerData);
await simulation_worker.runSimulation();
parentPort.postMessage("Sim-Done");
parentPort.on('message', async (msg) => {
    let result = await simulation_worker.calculateStats()
    parentPort.postMessage(result);

})










