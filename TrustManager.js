import {getTemporalScaleFactor} from "./TemporalCorrectnessFunctions.js";


export class TrustManager {
    constructor(TrustSettings, aol) {
        this.latestTrustMatrix = null;
        this.latestVersionLength = null;
        this.aol = aol;
        this.TrustSettings = TrustSettings;
    }


    // Needs to be rewritten and refactored to work with key-like ids instead of numbers
// For the simulation tests, this is fine
    async get_unique_peers() {

        //return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        // return list with numers 0 to 5

        const numberOfPeers = await this.aol.getNumberOfPeers();

        //console.log("Total number of peers: ", numberOfPeers)

        return numberOfPeers;
    }

    async calculate_user_trust_of_user(aol, peerIdSource, peerIdTarget) {

        if (peerIdSource === peerIdTarget) {
            return Infinity;
        }

        let websites = await aol.read();


        let trust = 0;

        // loop through all websites
        for (let [url, versions] of websites) {
            for (let [hash, versionInfo] of versions) {

                // if the source peer placed the version
                if (versionInfo.peerId === peerIdSource) {
                    // if the target peer validated the version
                    for (let i = 0; i < versionInfo.validations.length; i++) {
                        if (versionInfo.validations[i].peerId === peerIdTarget) {
                            trust += this.TrustSettings.trust_for_validating_resource;
                        }
                    }
                }

                // if the source peer validated the version
                if (versionInfo.peerId === peerIdTarget) {
                    for (let i = 0; i < versionInfo.validations.length; i++) {
                        if (versionInfo.validations[i].peerId === peerIdSource) {
                            trust += this.TrustSettings.trust_for_new_resource;
                        }
                    }

                }

            }
        }

        //console.log("Peer " + peerIdSource + " has trust " + trust + " for peer " + peerIdTarget);

        return trust;
    }

    async calculate_full_trust_of_user(peerId) {
        let trustMatrix = await this.calculate_trust_matrix(this.aol);

        let userTrust = 0;

        for (let i = 0; i < trustMatrix.length; i++) {
            if (i === peerId) {
                continue;
            }
            if (isNaN(trustMatrix[i][peerId])) {
                console.log("ful trust of user: NaN while calculating trust of " + peerId + " from " + i)
                await this.get_unique_peers();



                //console.table(trustMatrix)
            }

            userTrust += trustMatrix[i][peerId];
        }
        return userTrust;
    }

    async calculate_trust_of_version(url, hash) {
        let websites = await this.aol.read();

        let websiteExistsInAOL = websites.has(url) && websites.get(url).has(hash);
        if (!websiteExistsInAOL) {
            console.log("couldn't find either url or hash")
            return 0;
        }

        let trust = await this.calculate_full_trust_of_user(websites.get(url).get(hash).peerId);

        // Bonus works to restrict karma whoring
        let bonus = 1;
        // the trust of the version is the sum of the trust of the peers that validated it plus the peer who placed it there
        for (let i = 0; i < websites.get(url).get(hash).validations.length; i++) {
            let user_trust = await this.calculate_full_trust_of_user(websites.get(url).get(hash).validations[i].peerId);
            trust += user_trust;
            bonus += this.TrustSettings.popolous_multiplier;
        }

        trust *= bonus;

        return trust;

    }

    async calculate_trust_of_version_at_time(url, hash, slot) {
        let websites = await this.aol.read();

        let websiteExistsInAOL = websites.has(url) && websites.get(url).has(hash);
        if (!websiteExistsInAOL) {
            console.log("couldn't find either url or hash")
            return 0;
        }

        let trust = await this.calculate_full_trust_of_user(websites.get(url).get(hash).peerId);
        let timeSinceInitialSubmission = websites.get(url).get(hash).time - slot;

        let initialUserScaleValue = getTemporalScaleFactor(timeSinceInitialSubmission, this.TrustSettings)
        trust *= initialUserScaleValue;


        // Bonus works to restrict karma whoring
        let bonus = 1;
        // the trust of the version is the sum of the trust of the peers that validated it plus the peer who placed it there
        for (let i = 0; i < websites.get(url).get(hash).validations.length; i++) {
            let user_trust = await this.calculate_full_trust_of_user(websites.get(url).get(hash).validations[i].peerId);

            // Scale the trust accumulated with the time since the validation
            let timeSinceValidation = websites.get(url).get(hash).validations[i].time - slot
            //console.log(websites.get(url).get(hash).validations[i].time)
            //console.log(slot)
            //console.log(timeSinceValidation)
            let scaleValue = getTemporalScaleFactor(timeSinceValidation, this.TrustSettings)
            //console.log("Scale value: ", scaleValue, "Time since validation:", timeSinceValidation)

            trust += user_trust * scaleValue;
            bonus += this.TrustSettings.popolous_multiplier * scaleValue;
        }

        trust *= bonus;

        return trust;

    }

    async calculate_approximate_timeline_of_url(url, endOfTimelineSlot, respectMinimumConfidence = true) {
        let websites = await this.aol.read()

        let calculatedTimeline = []
        for (let time = 0; time < endOfTimelineSlot; time++) {

            let hashes = await websites.get(url)

            let mostTrustedVersionScore = -1;
            let mostTrustedVersionHash = "";
            let totalTrustOfAllVersions = 0;
            let totalVersions = 0;

            let trust_of_version_at_time_cache = new Map();

            for (const [hash] of hashes) {
                let trust = await this.calculate_trust_of_version_at_time(url, hash, time)
                trust_of_version_at_time_cache.set(hash, trust)
                //console.log(" hash: " + hash + " trust: " + trust)
                totalTrustOfAllVersions += trust;
                totalVersions += 1;
                if (trust > mostTrustedVersionScore) {
                    mostTrustedVersionScore = trust;
                    mostTrustedVersionHash = hash;
                }
            }

            ///console.log("Most trusted version at time " + time + " is " + mostTrustedVersionHash + " with score " + mostTrustedVersionScore)

            // run through all versions again and calculate their confidence
            let trustedVersions = []
            for (const [hash] of hashes) {
                let trust = trust_of_version_at_time_cache.get(hash)
                let confidence;
                if (totalTrustOfAllVersions === 0) {
                    confidence = 0;
                }
                else{
                    confidence = trust / totalTrustOfAllVersions;
                }

                //console.log(" hash: " + hash + " trust: " + trust)
                if (respectMinimumConfidence) {
                    if (trust / totalTrustOfAllVersions > this.TrustSettings.minimum_confidence) {
                        trustedVersions.push({hash: hash, confidence: confidence})
                    }
                } else {
                    trustedVersions.push({hash: hash, confidence: confidence})
                }

            }
            calculatedTimeline.push({timeStart: time, versions: trustedVersions, totalVersions: totalVersions})


        }

        return calculatedTimeline;
        //console.log(calculatedTimeline)


    }

    async calculate_trust_matrix() {
        let logHistoryLength = await this.aol.getLogLength();

        if (this.latestTrustMatrix !== undefined && this.latestVersionLength === logHistoryLength) {
            return this.latestTrustMatrix;
        }

        this.latestVersionLength = logHistoryLength;

        let uniquePeers = await this.get_unique_peers(this.aol);

        // Create 2d array of trust values between peers
        let trustMatrix = [];
        for (let i = 0; i < uniquePeers; i++) {
            trustMatrix.push([]);
            for (let j = 0; j < uniquePeers; j++) {
                let test = await this.calculate_user_trust_of_user(this.aol, i, j);
                if (isNaN(test)) {
                    console.log("NaN While calculating trust of " + i + " and " + j)
                }
                trustMatrix[i].push(test);
            }
        }

        this.latestTrustMatrix = trustMatrix;
        return trustMatrix;
    }

    async printTrustMatrix(aol) {
        let trustMatrix = await this.calculate_trust_matrix(aol);

        console.table(trustMatrix)
    }

    async printTrustOfEachPeer() {
        let uniquePeers = await this.get_unique_peers(this.aol);

        for (let i = 0; i < uniquePeers.length; i++) {
            console.log("Peer " + uniquePeers[i] + " has trust " + await this.calculate_full_trust_of_user(uniquePeers[i]));
        }
    }
}




