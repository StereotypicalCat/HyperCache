import {calculate_trust_of_version, printTrustMatrix, printTrustOfEachPeer} from "./TrustManager.js";


let getBestAndWorstTrustRatios = async (aol) => {
    console.log("Calculating different trust ratios")
    let websites = await aol.read()
    // for each url in the websites, print each hash and the trust of that hash

    let bestRatio = -Infinity;
    let worstRatio = Infinity;

    for (const [url, hashes] of websites){
        console.log("Calculating new url")

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

export {getBestAndWorstTrustRatios, printUsefulStats}