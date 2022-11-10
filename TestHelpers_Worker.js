//add this script in myWorker.js file
import {parentPort, workerData} from "worker_threads";
import {TestHelpers} from "./TestHelpers.js";
import {WebsiteManager} from "./WebsiteManager.js";
import {AppendOnlyLog} from "./SimulatedAppendOnlyLog.js";
import {TimeManager} from "./TimeManager.js";

let result = await calculateConfusionAndTemporalStats(workerData)
parentPort.postMessage(result);

async function calculateConfusionAndTemporalStats(workerData) {
    const website_manager = new WebsiteManager(workerData.simulation_parameters);
    await website_manager.SetWebsiteFakedPlaintext(workerData.websites);

    const new_time_manager = new TimeManager(true);
    const appendOnlyLog = new AppendOnlyLog(workerData.simulation_parameters, new_time_manager);
    await appendOnlyLog.updateAOL(workerData.websitesAOL, workerData.maxPeerNum);

    let testHelper = new TestHelpers(workerData.trust_parameters, appendOnlyLog, website_manager, workerData.simulation_parameters);

    let confusion_matrix = await testHelper.calculateConfusionMatrix(workerData.simulation_parameters.max_time)
    let temporal_matrix = await testHelper.calculateTemporalCorrectnessStats(workerData.simulation_parameters.max_time);

    let confusion_matrix_total_versions = confusion_matrix.correct_website_trusted + confusion_matrix.correct_website_not_trusted + confusion_matrix.wrong_website_trusted + confusion_matrix.wrong_website_not_trusted;
    let confusion_matrix_correct_guesses = confusion_matrix.correct_website_trusted + confusion_matrix.wrong_website_not_trusted;
    let confusion_matrix_score = confusion_matrix_correct_guesses / confusion_matrix_total_versions;

    let temporal_correctness_score = temporal_matrix.url_correct_slot / temporal_matrix.total_slots;

    return {
        confusion_score: confusion_matrix_score,
        temporal_score: temporal_correctness_score,
        min_confidence: workerData.trust_parameters.minimum_confidence,
        logistic_k: workerData.trust_parameters.logistic_k,
        logistic_x0: workerData.trust_parameters.logistic_x0,
        trust_for_new_resources: workerData.trust_parameters.trust_for_new_resources,
        trust_for_validating_resource: workerData.trust_parameters.trust_for_validating_resource,
        populous_multiplier: workerData.trust_parameters.populous_multiplier,
        ...confusion_matrix,
        ...temporal_matrix
    };

}
