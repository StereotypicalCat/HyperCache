import {convertPlaintextToHashTree} from "./TreeManager.js";
import {AppendOnlyLog} from "./SimulatedAppendOnlyLog.js";
import {Mutex} from "async-mutex";



export class PeerBehaviours {
    constructor(simulation_parameters, website_manager, timeManager) {
        this.timeManager = timeManager;
        this.website_manager = website_manager;
        this.simulation_parameters = simulation_parameters;
        this.shouldStopPeersMutex = new Mutex();
        this.shouldStopPeers = false;
        this.peerNumberMutex = new Mutex();
        this.nextPeerNum = -1;
    }


    // https://javascript.info/task/shuffle
    shuffle(array) {
        array.sort(() => Math.random() - 0.5);
    }

    /*function delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }*/

    doP2PProtocol = async (document, url, aol, peerNum) => {
        let hashTree = await convertPlaintextToHashTree(document);

        let wasSuccess = await aol.tryAddNewVersion(hashTree, peerNum, url)

        if (!wasSuccess){
            await aol.tryAddNewValidation(hashTree, peerNum, url)
        }
    }

    doP2PProtocolWithPlaintext = async (plaintext, url, aol, peerNum, time) => {

        let hashTree = {
            value: plaintext
        }

        let wasSuccess = await aol.tryAddNewVersion(hashTree, peerNum, url, time)
        if (!wasSuccess){
            await aol.tryAddNewValidation(hashTree, peerNum, url, time)
        }
    }


    startPeer = async (aol, urls, requester, documentChangeStrategy, doShuffles = true) => {
        const delayToWait = Math.max(Math.random() * this.simulation_parameters.max_peer_time_before_first_request * 1000, this.simulation_parameters.min_peer_time_before_first_request * 1000);

        const thisPeersUrls = [...urls]

        if (doShuffles){
            this.shuffle(thisPeersUrls)
        }

        let currentPeerNum = await this.getNewPeerNumber();

        await aol.peerJoinsSystem(currentPeerNum);

        let mainLoop = async () => {

            if (await this.shouldStopPeersCheck()){
                return;
            }

            await aol.peerJoinsSystem(currentPeerNum);

            // print the second mark when the peer starts
            //console.log("Pure Peer " + peerNum + " starting again");

            await documentChangeStrategy(currentPeerNum, aol, thisPeersUrls, requester)

            if (!(this.simulation_parameters.chance_a_peer_churns === 0) && Math.random() < this.simulation_parameters.chance_a_peer_churns){

                if (doShuffles){
                    this.shuffle(thisPeersUrls)
                }

                currentPeerNum = await this.getNewPeerNumber();
                //console.log("Peer " + peerNum + " has churned to " + currentPeerNum);
            }

            setTimeout(mainLoop, this.simulation_parameters.peer_timeout * 1000);
        }
        setTimeout(mainLoop, delayToWait)
    }

    purePeerStrategy = async (peerNum, aol, urls, requester, simulation_params) => {
        for (const url of urls){
            //console.log("Peer " + peerNum + " requesting " + url);
            //console.log("new url: " + url)
            let response = await requester(url);

            let timestamp = this.timeManager.getTime();
            await this.doP2PProtocolWithPlaintext(response, url, aol, peerNum, timestamp)
        }
    }

    consistentlyMaliciousGroupedPeerStrategy = async (peerNum, aol, urls, requester, simulation_params) => {
        for (const url of urls){
            //console.log("Peer " + peerNum + " requesting " + url);
            //console.log("new url: " + url)

            let response = url + "_grouped_malicious"

            let timestamp = this.timeManager.getTime();
            await this.doP2PProtocolWithPlaintext(response, url, aol, peerNum, timestamp)
        }
    }

    consistentlyMaliciousSoloPeerStrategy = async (peerNum, aol, urls, requester) => {
        for (const url of urls){
            //console.log("Peer " + peerNum + " requesting " + url);
            //console.log("new url: " + url)

            let response = `${url}_grouped_malicious_${peerNum}`

            let timestamp = this.timeManager.getTime();
            await this.doP2PProtocolWithPlaintext(response, url, aol, peerNum, timestamp)
        }
    }

// Might be malicious, but might also sometimes just get served a different url such as a regional different page but with the same url.
    sometimesMaliciousGroupedPeerStrategy = async (peerNum, aol, urls, requester) => {
        for (const url of urls){

            let doc;
            if (Math.random() <= this.simulation_parameters.chance_of_sometimes_being_malicious){
                doc = url + "_sometimes_malicious";
            }
            else{
                doc = await requester(url);
            }

            let timestamp = this.timeManager.getTime();
            await this.doP2PProtocolWithPlaintext(doc, url, aol, peerNum, timestamp)
        }
    }

    sometimesMaliciousSoloPeerStrategy = async (peerNum, aol, urls, requester) => {
        for (const url of urls){

            let doc;
            if (Math.random() <= this.simulation_parameters.chance_of_sometimes_being_malicious){
                doc = url + `_sometimes_malicious_${peerNum}`;
            }
            else{
                doc = await requester(url);
            }

            let timestamp = this.timeManager.getTime();
            await this.doP2PProtocolWithPlaintext(doc, url, aol, peerNum, timestamp)
        }
    }

    sometimesMaliciousSpecificSiteSoloPeerStrategy = async (peerNum, aol, urls, requester) => {
        let numberOfUrlsToPostMaliciously = Math.round(urls.length * this.simulation_parameters.amount_of_websites_to_post_bad_info_on);

        for (const url of urls){

            let doc;
            if (numberOfUrlsToPostMaliciously > 0){
                doc = url + `_sometimes_malicious_specific_site_${peerNum}`;
                numberOfUrlsToPostMaliciously--;
            }
            else{
                doc = await requester(url);
            }

            let timestamp = this.timeManager.getTime();
            await this.doP2PProtocolWithPlaintext(doc, url, aol, peerNum, timestamp)
        }
    }

    // DONT SHUFFLE THE URLS OR YOU WILL BE CURSED.
    sometimesMaliciousSpecificSiteGroupedPeerStrategy = async (peerNum, aol, urls, requester) => {
        let numberOfUrlsToPostMaliciously = Math.round(urls.length * this.simulation_parameters.amount_of_websites_to_post_bad_info_on);

        for (const url of urls){

            let doc;
            if (numberOfUrlsToPostMaliciously > 0){
                doc = url + `_sometimes_malicious_specific_site`;
                numberOfUrlsToPostMaliciously--;
            }
            else{
                doc = await requester(url);
            }

            let timestamp = this.timeManager.getTime();
            await this.doP2PProtocolWithPlaintext(doc, url, aol, peerNum, timestamp)
        }
    }

    pastFocusedOneVersionPeers = async (peerNum, aol, urls, requester) => {
        for (const url of urls){
            //console.log("Peer " + peerNum + " requesting " + url);
            //console.log("new url: " + url)
            // (url, withDelay = true, specificSlot = -1)
            // From https://bobbyhadz.com/blog/javascript-get-first-number-in-string
            const numIndex = url.search(/[0-9]/);
            const firstNum = Number(url[numIndex]);

            let response = `correctHash${firstNum}_version0`;

            let timestamp = this.timeManager.getTime();
            await this.doP2PProtocolWithPlaintext(response, url, aol, peerNum, timestamp)
        }
    }

    // Slightly more tricky
    pastFocusedLastVersionPeers = async (peerNum, aol, urls, requester) => {
        for (const url of urls){
            //console.log("Peer " + peerNum + " requesting " + url);
            //console.log("new url: " + url)
            // (url, withDelay = true, specificSlot = -1)
            // From https://bobbyhadz.com/blog/javascript-get-first-number-in-string
            let doc = await requester(url);

            const numIndex = doc.search(/[0-9]/);
            const firstNum = Number(doc[numIndex]);

            // From https://stackoverflow.com/questions/66793081/getting-second-digit-in-a-string-using-javascript-regex
            const versionNumber = doc.match(/\d+/g)?.[1];

            let response = `correctHash${firstNum}_version${Math.max(0, versionNumber - 1)}`;

            let timestamp = this.timeManager.getTime();
            await this.doP2PProtocolWithPlaintext(response, url, aol, peerNum, timestamp)
        }
    }

    newVersionSpammerPeers = async (peerNum, aol, urls, requester) => {
        for (const url of urls){

            let response = `${url}_new_version_spammer_${peerNum}_version${this.timeManager.getTime()}`;

            let timestamp = this.timeManager.getTime();
            await this.doP2PProtocolWithPlaintext(response, url, aol, peerNum, timestamp)
        }
    }





    waitforme(milisec) {
        return new Promise(resolve => {
            setTimeout(() => { resolve('') }, milisec);
        })
    }

    startNetworkWithConfig = async () => {
        const aol = new AppendOnlyLog(this.simulation_parameters, this.timeManager);


        for (let i = 0; i < this.simulation_parameters.amount_of_pure_peers; i++) {
            this.startPeer(aol, await this.website_manager.get_requestable_urls(), this.website_manager.request_website, this.purePeerStrategy)
       }
        for (let i = 0; i < this.simulation_parameters.amount_of_grouped_consistently_malicious_peers; i++) {
            this.startPeer(aol, await this.website_manager.get_requestable_urls(), this.website_manager.request_website, this.consistentlyMaliciousGroupedPeerStrategy)
        }
        for (let i = 0; i < this.simulation_parameters.amount_of_solo_consistently_malicious_peers; i++) {
            this.startPeer(aol, await this.website_manager.get_requestable_urls(), this.website_manager.request_website, this.consistentlyMaliciousSoloPeerStrategy)
        }
        for (let i = 0; i < this.simulation_parameters.amount_of_grouped_sometimes_malicious_peers; i++) {
            this.startPeer(aol, await this.website_manager.get_requestable_urls(), this.website_manager.request_website, this.sometimesMaliciousGroupedPeerStrategy)
        }
        for (let i = 0; i < this.simulation_parameters.amount_of_solo_sometimes_malicious_peers; i++) {
            this.startPeer(aol, await this.website_manager.get_requestable_urls(), this.website_manager.request_website, this.sometimesMaliciousSoloPeerStrategy)
        }
        for (let i = 0; i < this.simulation_parameters.amount_of_grouped_sometimes_malicious_specific_site_peers; i++) {
            this.startPeer(aol, await this.website_manager.get_requestable_urls(), this.website_manager.request_website, this.sometimesMaliciousSpecificSiteGroupedPeerStrategy, false)
        }
        for (let i = 0; i < this.simulation_parameters.amount_of_solo_sometimes_malicious_specific_site_peers; i++) {
            this.startPeer(aol, await this.website_manager.get_requestable_urls(), this.website_manager.request_website, this.sometimesMaliciousSpecificSiteSoloPeerStrategy)
        }
        for (let i = 0; i < this.simulation_parameters.amount_of_past_focused_one_version_peers; i++) {
            this.startPeer(aol, await this.website_manager.get_requestable_urls(), this.website_manager.request_website, this.pastFocusedOneVersionPeers)
        }
        for (let i = 0; i < this.simulation_parameters.amount_of_past_focused_last_version_peers; i++) {
            this.startPeer(aol, await this.website_manager.get_requestable_urls(), this.website_manager.request_website, this.pastFocusedLastVersionPeers)
        }
        for (let i = 0; i < this.simulation_parameters.amount_of_new_version_spammer_peers; i++) {
            this.startPeer(aol, await this.website_manager.get_requestable_urls(), this.website_manager.request_website, this.newVersionSpammerPeers)
        }


        // Below is dumv and should just be done based on timemanager in the stopPeers function. Too bad!
        await this.waitforme((this.simulation_parameters.max_time) * 1000)

        await this.stopPeers();

        // Wait for all peers to successfully stop.
        await this.waitforme(5 * 1000)


        return aol;
    }

    stopPeers = async () => {
        const release = await this.shouldStopPeersMutex.acquire();
        this.shouldStopPeers = true;
        release();
    }
    shouldStopPeersCheck = async () => {
        const release = await this.shouldStopPeersMutex.acquire();
        let toReturn = this.shouldStopPeers;
        release();
        return toReturn;
    }

    getNewPeerNumber = async () => {
        const release = await this.peerNumberMutex.acquire();

        let returnVal;

        try {
            this.nextPeerNum++;
            returnVal = this.nextPeerNum;
        }
        finally {
            release();
        }

        return returnVal;
    }
}



