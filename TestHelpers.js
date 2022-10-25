import {
    calculate_approximate_timeline_of_url,
    calculate_trust_of_version,
    printTrustMatrix,
    printTrustOfEachPeer
} from "./TrustManager.js";
import {getAllCorrectWebsitesForUrl, getWebsiteFaked} from "./WebsiteManager.js";
import {getTime} from "./TimeManager.js";
import util from 'util';
import _ from "lodash";
import {minimum_confidence, updateValue} from "./SimulationParameters.js";
import cliProgress from "cli-progress";

let printUsefulStats = async (aol) => {
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
}

export let printWebsiteTimelines = async (aol, withConfidence = false) => {

    let websites = await aol.read()
    let endTime = getTime();
    for (const [url, hashes] of websites){

        console.log("==== " + url + " ====")
        let timeline = await calculate_approximate_timeline_of_url(aol, url, endTime, withConfidence)
        console.log(util.inspect(timeline, {showHidden: false, depth: null, colors: true}))
    }
}

export let calculateConfusionMatrix = async (aol, endTime) => {
    // Calculates the confusion matrix for the aol
    // This means calculating true-positives, false-positive, true-negative, false-negative.
    // This is done by comparing the aol to the correct list of websites.
    // Is slot independent

    // Get the websites from the aol
    let websites = await aol.read();

    // Create the confusion matrix
    let confusionMatrix = {
        correct_website_trusted: 0,
        correct_website_not_trusted: 0,
        wrong_website_trusted: 0,
        wrong_website_not_trusted: 0
    }

    for (const [url] of websites){

        let timeline = await calculate_approximate_timeline_of_url(aol, url, endTime, true, false)

        // Only unique trusted versions
        let trustedVersions = timeline.map((timelineObj) => {return timelineObj.versions}).flat().filter(version => version.confidence >= minimum_confidence).map(version => version.hash);
        trustedVersions = _.uniq(trustedVersions);
        //console.log("timeline", timeline)
        let allVersions = timeline.map((timelineObj) => {return timelineObj.versions}).flat().map(version => version.hash);
        allVersions = _.uniq(allVersions);
        let correctVersions = await getAllCorrectWebsitesForUrl(url);

        //console.log("trusted versions", trustedVersions)
        //console.log("correct versions", correctVersions)
        //console.log("All versions", allVersions)


        let correctWebsitesTrusted = trustedVersions.filter((version) => {return correctVersions.includes(version)}).length;
        let correctWebsitesNotTrusted = correctVersions.filter((version) => {return !trustedVersions.includes(version)}).length;
        let incorrectWebsitesTrusted = trustedVersions.filter((version) => {return !correctVersions.includes(version)}).length;
        let incorrectWebsitesNotTrusted = allVersions.length - correctWebsitesTrusted - correctWebsitesNotTrusted - incorrectWebsitesTrusted;



        confusionMatrix.correct_website_trusted += correctWebsitesTrusted;
        confusionMatrix.correct_website_not_trusted += correctWebsitesNotTrusted;
        confusionMatrix.wrong_website_trusted += incorrectWebsitesTrusted;
        confusionMatrix.wrong_website_not_trusted += incorrectWebsitesNotTrusted;
    }

    return confusionMatrix;

}

export let calculateTemporalCorrectnessStats = async (aol, endTime) => {
    // Get the websites from the aol
    let websites = await aol.read();

    // Create the confusion matrix
    let temporalCorrectnessMatrix = {
        url_correct_slot: 0,
        url_too_early: 0,
        url_too_late: 0,
        maximum_distance: 0,
        total_distance: 0,
        total_slots: 0
    }

    for (const [url] of websites){

        let timeline = await calculate_approximate_timeline_of_url(aol, url, endTime, true)

        // Make array with the correct version in each slot
        let correctVersions = []
        for (let slot = 0; slot < timeline.length; slot++){
            let correctVersion = await getWebsiteFaked(url, false, slot);
            correctVersions.push(correctVersion);
        }

        // Calculate the temporal correctness
        for (let slot = 0; slot < timeline.length; slot++){
            let versionsInSlot = timeline[slot].versions.map(obj => obj.hash);

            temporalCorrectnessMatrix.total_slots++;

            for (let version of versionsInSlot){
                if (version === correctVersions[slot]){
                    temporalCorrectnessMatrix.url_correct_slot++;
                }else{
                    let correctVersionIndex = correctVersions.indexOf(version);

                    if (correctVersionIndex === -1){
                        // This version not in timeline, ignore
                        continue;
                    }

                    if (correctVersionIndex-slot > 0){
                        temporalCorrectnessMatrix.url_too_early++;
                        temporalCorrectnessMatrix.total_distance += Math.abs(correctVersionIndex-slot);
                    }else if (correctVersionIndex-slot < 0){
                        temporalCorrectnessMatrix.url_too_late++;
                        temporalCorrectnessMatrix.total_distance += Math.abs(correctVersionIndex-slot);

                    }

                    temporalCorrectnessMatrix.maximum_distance = Math.max(temporalCorrectnessMatrix.maximum_distance, Math.abs(correctVersionIndex - slot))

                }
            }


        }
    }

    return temporalCorrectnessMatrix;

}

export const testDifferentValuesOfLogisticFunction = async(aol, endTime) => {

    let confusionMatrixConfigStats = [];
    let confusionMatrixNoWrongTrustedStats = [];
    let temporalCorrectnessConfigStats = [];
    let bestTotalConfigStats = [];


    /*    const minconfidence = testDiffernetValuesTimer.create(0.8, 0.4);
        const logistick = testDiffernetValuesTimer.create(7, 1);*/

    // This doesn't test different simulation parameters. Only different trust parameters.
    for (let min_confidence_to_test = 0.30; min_confidence_to_test <= 0.9; min_confidence_to_test += 0.075) {
        updateValue('minimum_confidence', min_confidence_to_test);
        console.log("Outer loop progress: " + min_confidence_to_test + "/0.9")
        for (let logistic_k_to_test = 0.1; logistic_k_to_test < 7; logistic_k_to_test += 0.5) {
            updateValue('logistic_k', logistic_k_to_test);
            for (let logistic_x0_to_test = -10; logistic_x0_to_test <= 2.5; logistic_x0_to_test += 10) {
                updateValue('logistic_x0', logistic_x0_to_test);
                for (let trust_for_new_resources_to_test = 1; trust_for_new_resources_to_test < 10; trust_for_new_resources_to_test += 1) {
                    updateValue('trust_for_new_resource', trust_for_new_resources_to_test);
                    for (let trust_for_validating_resource_to_test = 1; trust_for_validating_resource_to_test < 10; trust_for_validating_resource_to_test += 1) {
                        updateValue('trust_for_validating_resource', trust_for_validating_resource_to_test);
                        for (let populous_multiplier_to_test = 0; populous_multiplier_to_test < 0.5; populous_multiplier_to_test += 0.05) {
                            updateValue('popolous_multiplier', populous_multiplier_to_test);

                            let calculatedConfusionMatrix = await calculateConfusionMatrix(aol, endTime);
                            let calculatedTemporalCorrectnessMatrix = await calculateTemporalCorrectnessStats(aol, endTime);

                            let confusion_matrix_total_versions = calculatedConfusionMatrix.correct_website_trusted + calculatedConfusionMatrix.correct_website_not_trusted + calculatedConfusionMatrix.wrong_website_trusted + calculatedConfusionMatrix.wrong_website_not_trusted;
                            let confusion_matrix_correct_guesses = calculatedConfusionMatrix.correct_website_trusted + calculatedConfusionMatrix.wrong_website_not_trusted;
                            let confusion_matrix_score = confusion_matrix_correct_guesses / confusion_matrix_total_versions;
                            confusionMatrixConfigStats.push({
                                score: confusion_matrix_score,
                                min_confidence: min_confidence_to_test,
                                logistic_k: logistic_k_to_test,
                                logistic_x0: logistic_x0_to_test,
                                trust_for_new_resources: trust_for_new_resources_to_test,
                                trust_for_validating_resource: trust_for_validating_resource_to_test,
                                populous_multiplier: populous_multiplier_to_test,
                                ...calculatedConfusionMatrix
                            })

                            let temporal_correctness_score = calculatedTemporalCorrectnessMatrix.url_correct_slot / calculatedTemporalCorrectnessMatrix.total_slots;
                            temporalCorrectnessConfigStats.push({
                                score: temporal_correctness_score,
                                min_confidence: min_confidence_to_test,
                                logistic_k: logistic_k_to_test,
                                logistic_x0: logistic_x0_to_test,
                                trust_for_new_resources: trust_for_new_resources_to_test,
                                trust_for_validating_resource: trust_for_validating_resource_to_test,
                                populous_multiplier: populous_multiplier_to_test,
                                ...calculatedTemporalCorrectnessMatrix
                            });

                            if (calculateConfusionMatrix.wrong_website_trusted === 0){
                                confusionMatrixNoWrongTrustedStats.push({
                                    score: confusion_matrix_score,
                                    min_confidence: min_confidence_to_test,
                                    logistic_k: logistic_k_to_test,
                                    logistic_x0: logistic_x0_to_test,
                                    trust_for_new_resources: trust_for_new_resources_to_test,
                                    trust_for_validating_resource: trust_for_validating_resource_to_test,
                                    populous_multiplier: populous_multiplier_to_test,
                                    ...calculatedConfusionMatrix
                                })
                            }

                            let total_score = (confusion_matrix_score + temporal_correctness_score)/2;
                            bestTotalConfigStats.push({
                                score: total_score,
                                min_confidence: min_confidence_to_test,
                                logistic_k: logistic_k_to_test,
                                logistic_x0: logistic_x0_to_test,
                                trust_for_new_resources: trust_for_new_resources_to_test,
                                trust_for_validating_resource: trust_for_validating_resource_to_test,
                                populous_multiplier: populous_multiplier_to_test,
                                ...calculatedConfusionMatrix,
                            });

                        }
                    }
                }
            }
        }
    }

    console.log("Sorting Results")

    confusionMatrixConfigStats.sort((a, b) => b.score - a.score);
    temporalCorrectnessConfigStats.sort((a, b) => b.score - a.score);
    bestTotalConfigStats.sort((a, b) => b.score - a.score);
    confusionMatrixNoWrongTrustedStats.sort((a, b) => b.score - a.score);

    console.log("Done")
    return {
confusionMatrixConfigStats,
temporalCorrectnessConfigStats,
bestTotalConfigStats,
confusionMatrixNoWrongTrustedStats
    }

}

export {printUsefulStats}