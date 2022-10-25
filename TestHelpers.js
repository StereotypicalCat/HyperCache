import {
    calculate_approximate_timeline_of_url,
    calculate_trust_of_version,
    printTrustMatrix,
    printTrustOfEachPeer
} from "./TrustManager.js";
import {getAllCorrectWebsitesForUrl} from "./WebsiteManager.js";
import {getTime} from "./TimeManager.js";
import util from 'util';
import _ from "lodash";
import {minimum_confidence, updateValue} from "./SimulationParameters.js";

let getBestAndWorstTrustRatios = async (aol) => {
    console.log("Calculating different trust ratios")
    let websites = await aol.read()
    // for each url in the websites, print each hash and the trust of that hash

    let bestRatio = -Infinity;
    let worstRatio = Infinity;

    for (const [url, hashes] of websites){
        //console.log("Calculating new url")

        let badTrust = -1;
        let goodTrust = -1;

        for (const [hash, hashinfo] of hashes) {
            let trust = await calculate_trust_of_version(aol, url, hash)

            if (hash.includes("wrongHash")){
                badTrust = trust;
            }
            if (hash.includes("correctHash")){
                goodTrust = trust;
            }
        }

        let trustRatio = goodTrust / badTrust;

        if (trustRatio > bestRatio){
            bestRatio = trustRatio;
        }
        if (trustRatio < worstRatio){
            worstRatio = trustRatio;
        }

    }

    return {bestratio: bestRatio, worstratio: worstRatio};

}

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

/*        for (let slot = 0; slot < timeline.length; slot++){
            let noOfVersions = timeline[slot].versions.length;

/!*            console.log("======")
            console.log("correct version: " + correctVersion)
            console.log("no of versions: " + noOfVersions)
            console.log("timeline: " + util.inspect(timeline[slot].versions.map(obj => obj.hash), {showHidden: false, depth: null, colors: true}))
            console.log("======")*!/

            let containsCorrectVersion = timeline[slot].versions.map(obj => obj.hash).includes(correctVersion);


            if (containsCorrectVersion){
                confusionMatrix.correct_website_trusted++;
                let incorrectTrusted = Math.max(noOfVersions - 1, 0);
                confusionMatrix.wrong_website_trusted += incorrectTrusted;
            }else{
                //console.log("==============")
                //console.log("Website at slot " + slot + " doesnt trust real version, which is ", correctVersion);
                //console.log("Trusts these instead ", timeline[slot].versions.map(obj => obj.hash));
                confusionMatrix.correct_website_not_trusted++;
                confusionMatrix.wrong_website_trusted += noOfVersions;
            }
        }*/
    }

    return confusionMatrix;

}

export let calculateTemporalIncorrectness = async (aol, relaxed = false) => {
    // calculates the distance between the timelines of websites and the timeline on the aol
/*    let websites = await aol.read()
    let endTime = getTime();
    let correctSlots = 0;

    for (const [url, hashes] of websites){

        //console.log("==== " + url + " ====")
        let timeline = await calculate_approximate_timeline_of_url(aol, url, endTime, true)
        for (let slot = 0; slot < timeline.length; slot++){
            let correctVersion = getWebsiteFaked(url, false, slot)
            for (let i = 0; i < timeline[slot].versions.lengtht; i++){
                if(timeline[slot].versions[i].hash === correctVersion){
                    correctSlots++;
                }
            }

        }
    }

    let totalSlots = endTime * websites.length;

    console.log("Correct: ", correctSlots)
    console.log("Total: ", totalSlots)

    return correctSlots / totalSlots;*/

}

export const testDifferentValuesOfLogisticFunction = async(aol) => {
    let aolDeepCopy = _.cloneDeep(aol);
    let endTime = getTime();

    let best_correct_website_trusted = {correct_website_trusted: 0};
    let best_correct_website_trusted_x0 = undefined;
    let best_correct_website_trusted_k = undefined;
    let best_correct_website_not_trusted = {correct_website_not_trusted: Infinity};
    let best_correct_website_not_trusted_x0 = undefined;
    let best_correct_website_not_trusted_k = undefined;
    let best_incorrect_website_trusted = {wrong_website_trusted: Infinity};
    let best_incorrect_website_trusted_x0 = undefined;
    let best_incorrect_website_trusted_k = undefined;

    let best_overall = {correct_website_trusted: 0, correct_website_not_trusted: Infinity, wrong_website_trusted: Infinity};
    let best_overall_x0 = undefined;
    let best_overall_k = undefined;

    for (let min_confidence_to_test = 0.4; min_confidence_to_test <= 0.8; min_confidence_to_test += 0.1){
        for (let logistic_k_to_test = 4; logistic_k_to_test < 6; logistic_k_to_test +=1){
            for(let logistic_x0_to_test = -20; logistic_x0_to_test < -5; logistic_x0_to_test += 2.5){
                //console.log("logistic_k: " + logistic_k_to_test + " logistic_x0: " + logistic_x0_to_test)
                updateValue('logistic_k', logistic_k_to_test);
                updateValue('logistic_x0', logistic_x0_to_test);
                updateValue('minimum_confidence', min_confidence_to_test);
                //aol = _.cloneDeep(jsonDeepCopy);
                let ratio = await calculateConfusionMatrix(aolDeepCopy, endTime)
                //console.log(ratio)

                if (ratio.correct_website_trusted > best_correct_website_trusted.correct_website_trusted){
                    best_correct_website_trusted = ratio;
                    best_correct_website_trusted_x0 = logistic_x0_to_test;
                    best_correct_website_trusted_k = logistic_k_to_test;
                }
                if (ratio.correct_website_not_trusted < best_correct_website_not_trusted.correct_website_not_trusted){
                    best_correct_website_not_trusted = ratio;
                    best_correct_website_not_trusted_x0 = logistic_x0_to_test;
                    best_correct_website_not_trusted_k = logistic_k_to_test;
                }
                if (ratio.wrong_website_trusted < best_incorrect_website_trusted.wrong_website_trusted){
                    best_incorrect_website_trusted = ratio;
                    best_incorrect_website_trusted_x0 = logistic_x0_to_test;
                    best_incorrect_website_trusted_k = logistic_k_to_test;
                }

                let fitness = ratio.correct_website_trusted - ratio.correct_website_not_trusted - ratio.wrong_website_trusted;
                let best_fitness = best_overall.correct_website_trusted - best_overall.correct_website_not_trusted - best_overall.wrong_website_trusted;
                if (fitness > best_fitness){
                    best_overall = ratio;
                    best_overall_x0 = logistic_x0_to_test;
                    best_overall_k = logistic_k_to_test;
                }

            }
        }
    }

    console.log("best_correct_website_trusted: " +
        util.inspect(best_correct_website_trusted, {showHidden: false, depth: null, colors: true}) +
        " logistic_k: " + best_correct_website_trusted_k +
        " logistic_x0: " + best_correct_website_trusted_x0)

    console.log("best_correct_website_not_trusted: " +
        util.inspect(best_correct_website_not_trusted, {showHidden: false, depth: null, colors: true})
        + " logistic_k: " + best_correct_website_not_trusted_k +
        " logistic_x0: " + best_correct_website_not_trusted_x0)

    console.log("best_incorrect_website_trusted: " + util.inspect(best_incorrect_website_trusted, {showHidden: false, depth: null, colors: true})
        + " logistic_k: " + best_incorrect_website_trusted_k +
        " logistic_x0: " + best_incorrect_website_trusted_x0)

    console.log("best_overall: " + util.inspect(best_overall, {showHidden: false, depth: null, colors: true})
        + " logistic_k: " + best_overall_k +
        " logistic_x0: " + best_overall_x0)
}

export {getBestAndWorstTrustRatios, printUsefulStats}