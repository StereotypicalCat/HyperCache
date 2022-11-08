import {getTime} from "./TimeManager.js";
import util from 'util';
import _ from "lodash";
import cliProgress from "cli-progress";
import {TrustManager} from "./TrustManager.js";
import {Mutex} from "async-mutex";
import {Worker} from "worker_threads";

export class TestHelpers {

    waitforme(milisec) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve('')
            }, milisec);
        })
    }

    constructor(trust_parameters, aol, endTime, websiteManager, simulation_parameters) {
        this.trust_parameters = trust_parameters;
        this.simulation_paramerets = simulation_parameters;
        this.websiteManager = websiteManager;
        this.trust_manager = new TrustManager(trust_parameters, aol);
        this.aol = aol;
        this.endTime = endTime;

    }

    async setThreadData(trust_matrix, latest_version_length){
        if(trust_matrix !== null && latest_version_length !== null){
            await this.trust_manager.set_trust_matrix(trust_matrix, latest_version_length);
        }
        else{
            console.log("you fucked up bro, trust matrix or latest version length is null");
        }
    }

    printUsefulStats = async () => {
        //console.log(await aol.read());
        // print versions and validations from log
        //let {validations, versions} = await aol.read();
        //console.log("Printing Versions")
        //console.log(versions)
        //console.log("Printing Validations")
        //console.log(validations)
        // Printing Trust Matrix

        await this.aol.printLogHistory()

        console.log("Printing Trust Matrix")
        //await aol.print();
        await this.trust_manager.printTrustMatrix();
        // print trust of all users
        console.log("Printing Trust of all users")
        await this.trust_manager.printTrustOfEachPeer();

        console.log("trust of the different versions")

        let websites = await this.aol.read()
        // for each url in the websites, print each hash and the trust of that hash
        for (const [url, hashes] of websites) {
            console.log("==== " + url + " ====")
            for (const [hash] of hashes) {
                let trust = await this.trust_manager.calculate_trust_of_version(url, hash)
                console.log(" hash: " + hash + " trust: " + trust)
            }
        }
    }

    printWebsiteTimelines = async (aol, withConfidence = false) => {

        let websites = await aol.read()
        let endTime = getTime();
        for (const [url] of websites) {

            console.log("==== " + url + " ====")
            let timeline = await this.trust_manager.calculate_approximate_timeline_of_url(url, endTime, withConfidence)
            console.log(util.inspect(timeline, {showHidden: false, depth: null, colors: true}))
        }
    }

    calculateConfusionMatrix = async (trust_settings) => {
        // Calculates the confusion matrix for the aol
        // This means calculating true-positives, false-positive, true-negative, false-negative.
        // This is done by comparing the aol to the correct list of websites.
        // Is slot independent

        // Get the websites from the aol
        let websites = await this.aol.read();

        // Create the confusion matrix
        let confusionMatrix = {
            correct_website_trusted: 0,
            correct_website_not_trusted: 0,
            wrong_website_trusted: 0,
            wrong_website_not_trusted: 0
        }

        for (const [url] of websites) {

            let timeline = await this.trust_manager.calculate_approximate_timeline_of_url(url, this.endTime, true, false)

            // Only unique trusted versions
            let trustedVersions = timeline.map((timelineObj) => {
                return timelineObj.versions
            }).flat().filter(version => version.confidence >= this.trust_parameters.minimum_confidence).map(version => version.hash);
            trustedVersions = _.uniq(trustedVersions);
            //console.log("timeline", timeline)
            let allVersions = timeline.map((timelineObj) => {
                return timelineObj.versions
            }).flat().map(version => version.hash);

            let correctVersions = await this.websiteManager.getAllCorrectWebsitesForUrl(url);

            allVersions.push(correctVersions)

            allVersions = _.uniq(allVersions);

            //console.log("trusted versions", trustedVersions)
            //console.log("correct versions", correctVersions)
            //console.log("All versions", allVersions)


            let correctWebsitesTrusted = trustedVersions.filter((version) => {
                return correctVersions.includes(version)
            }).length;
            let correctWebsitesNotTrusted = correctVersions.filter((version) => {
                return !trustedVersions.includes(version)
            }).length;
            let incorrectWebsitesTrusted = trustedVersions.filter((version) => {
                return !correctVersions.includes(version)
            }).length;


            let incorrectWebsitesNotTrusted = allVersions.length - correctWebsitesTrusted - correctWebsitesNotTrusted - incorrectWebsitesTrusted;


            confusionMatrix.correct_website_trusted += correctWebsitesTrusted;
            confusionMatrix.correct_website_not_trusted += correctWebsitesNotTrusted;
            confusionMatrix.wrong_website_trusted += incorrectWebsitesTrusted;
            confusionMatrix.wrong_website_not_trusted += incorrectWebsitesNotTrusted;
        }

        return confusionMatrix;

    }

    calculateTemporalCorrectnessStats = async (trust_settings) => {
        // Get the websites from the aol
        let websites = await this.aol.read();

        // Create the confusion matrix
        let temporalCorrectnessMatrix = {
            url_correct_slot: 0,
            url_too_early: 0,
            url_too_late: 0,
            maximum_distance: 0,
            total_distance: 0,
            total_slots: 0
        }

        for (const [url] of websites) {

            let timeline = await this.trust_manager.calculate_approximate_timeline_of_url(url, this.endTime, true)

            // Make array with the correct version in each slot
            let correctVersions = []
            for (let slot = 0; slot < timeline.length; slot++) {
                let correctVersion = await this.websiteManager.getWebsiteFaked(url, false, slot);
                correctVersions.push(correctVersion);
            }

            // Calculate the temporal correctness
            for (let slot = 0; slot < timeline.length; slot++) {
                let versionsInSlot = timeline[slot].versions.map(obj => obj.hash);

                temporalCorrectnessMatrix.total_slots++;

                for (let version of versionsInSlot) {
                    if (version === correctVersions[slot]) {
                        temporalCorrectnessMatrix.url_correct_slot++;
                    } else {
                        let correctVersionIndex = correctVersions.indexOf(version);

                        if (correctVersionIndex === -1) {
                            // This version not in timeline, ignore
                            continue;
                        }

                        if (correctVersionIndex - slot > 0) {
                            temporalCorrectnessMatrix.url_too_early++;
                            temporalCorrectnessMatrix.total_distance += Math.abs(correctVersionIndex - slot);
                        } else if (correctVersionIndex - slot < 0) {
                            temporalCorrectnessMatrix.url_too_late++;
                            temporalCorrectnessMatrix.total_distance += Math.abs(correctVersionIndex - slot);

                        }

                        temporalCorrectnessMatrix.maximum_distance = Math.max(temporalCorrectnessMatrix.maximum_distance, Math.abs(correctVersionIndex - slot))

                    }
                }


            }
        }

        return temporalCorrectnessMatrix;

    }

    testDifferentValuesOfLogisticFunction = async (endTime) => {

        let output_data = []

        let unfinishedThreads = 0;
        const unfinishedThreadsMutex = new Mutex();
        const statisticsArrayMutex = new Mutex();

        let threadsRun = 0;

        const startTime = new Date() / 1000;
        console.log("Start time", startTime)

        /*    const minconfidence = testDiffernetValuesTimer.create(0.8, 0.4);
            const logistick = testDiffernetValuesTimer.create(7, 1);*/

        // This doesn't test different simulation parameters. Only different trust parameters.
        for (let min_confidence_to_test = 0.2; min_confidence_to_test <= 0.75; min_confidence_to_test += 0.15) {
            console.log("Did outer loop iteration")
            for (let logistic_k_to_test = 0; logistic_k_to_test <= 4; logistic_k_to_test += 1) {
                for (let logistic_x0_to_test = 0; logistic_x0_to_test <= 4; logistic_x0_to_test += 1) {
                    for (let trust_for_new_resources_to_test = 1; trust_for_new_resources_to_test <= 1; trust_for_new_resources_to_test += 1) {
                        for (let trust_for_validating_resource_to_test = 1; trust_for_validating_resource_to_test < 2; trust_for_validating_resource_to_test += 1) {
                            for (let populous_multiplier_to_test = 0.00; populous_multiplier_to_test <= 0.05; populous_multiplier_to_test += 0.05) {

                                let shouldCreateMoreThreads = false
                                while (!shouldCreateMoreThreads) {
                                    const release = await unfinishedThreadsMutex.acquire();
                                    try {
                                        if (unfinishedThreads < 14){
                                            //console.log("Creating new thread as " + threadsRun + " threads have been run and " + unfinishedThreads + " are unfinished")
                                            threadsRun++;
                                            if (threadsRun % 10 === 0){
                                                console.log("Throughput: " + threadsRun / ((new Date() / 1000) - startTime) + " threads per second")

                                            }
                                            unfinishedThreads++;
                                            shouldCreateMoreThreads = true;
                                        }



                                    }
                                    finally {
                                        release();
                                    }
                                    await this.waitforme(100);
                                }


                                let newThreadParamteres = _.cloneDeep(this.trust_parameters);
                                newThreadParamteres.minimum_confidence = min_confidence_to_test;
                                newThreadParamteres.logistic_k = logistic_k_to_test;
                                newThreadParamteres.logistic_x0 = logistic_x0_to_test;
                                newThreadParamteres.trust_for_new_resources = trust_for_new_resources_to_test;
                                newThreadParamteres.trust_for_validating_resource = trust_for_validating_resource_to_test;
                                newThreadParamteres.populous_multiplier = populous_multiplier_to_test;

                                // Cant deep dopy classes
                                let info = await this.aol.getDataForWorker();

                                const worker = new Worker('./TestHelpers_Worker.js', {
                                    workerData:
                                        {
                                            trust_parameters: newThreadParamteres,
                                            simulation_parameters: this.simulation_paramerets,
                                            websites: await this.websiteManager.GetWebsiteFakedPlaintext(),
                                            endTime: endTime,
                                            websitesAOL: info.websites,
                                            peersInSystem: info.peersInSystem
                                        }
                                })

                                worker.once("message", async result => {
                                    const release1 = await statisticsArrayMutex.acquire();
                                    const release2 = await unfinishedThreadsMutex.acquire();
                                    try {
                                        output_data.push(result);
                                        unfinishedThreads--;
                                    } finally {
                                        release1();
                                        release2();
                                    }
                                });

                            }
                        }
                    }
                }
            }
        }


        let allThreadsFinished = false;
        while (!allThreadsFinished) {
            const release = await unfinishedThreadsMutex.acquire();
            try {
                if (unfinishedThreads === 0) {
                    allThreadsFinished = true;
                }
            } finally {
                release();
            }
            await this.waitforme(1000);
        }


        console.log("== FINAL Throughput: " + threadsRun / ((new Date() / 1000) - startTime) + " threads per second ==")

        console.log("Done")
        return output_data;

    }

}