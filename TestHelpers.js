import {
    calculate_approximate_timeline_of_url,
    calculate_trust_of_version,
    calculate_trust_of_version_at_time,
    printTrustMatrix,
    printTrustOfEachPeer
} from "./TrustManager.js";
import {GetWebsiteFakedPlaintext} from "./WebsiteManager.js";
import {getTime} from "./TimeManager.js";

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
        console.log(timeline)
    }
}

let calculateConfusionMatrix = async (aol) => {
    // Calculates the confusion matrix for the aol
    // This means calculating true-positives, false-positive, true-negative, false-negative.
    // This is done by comparing the aol to the correct list of websites.

    // Start by getting the correct list of websites
    let correctWebsites = await GetWebsiteFakedPlaintext();

    // Get the websites from the aol
    let websites = await aol.read();

    // Create the confusion matrix
    let confusionMatrix = {
        truePositive: 0,
        falsePositive: 0,
        trueNegative: 0,
        falseNegative: 0
    }

    // The amount of trust a website has to have to be considered trusted in the aol
    const tempMinRatio = 2;

    // Loop through the websites in the aol
    for (const [url, hashes] of websites){
        // Check if the url is in the correct list of websites
        if (correctWebsites.has(url)){



            // Check if the url is trusted
            if (await calculate_trust_of_version(aol, url, hashes.get("correctHash")) > tempMinRatio){
                // The url is trusted, so it is a true positive
                confusionMatrix.truePositive++;
            } else {
                // The url is not trusted, so it is a false negative
                confusionMatrix.falseNegative++;
            }
        } else {
            // The url is not in the correct list of websites, so it is a false positive
            confusionMatrix.falsePositive++;
        }
    }


}

let calculateTemporalIncorrectness = async (aol) => {
    // calculates the distance between the timelines of websites and the timeline on the aol

}

export {getBestAndWorstTrustRatios, printUsefulStats}