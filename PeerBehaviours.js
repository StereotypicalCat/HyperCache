import {convertPlaintextToHashTree} from "./TreeManager.js";
import {AppendOnlyLog} from "./SimulatedAppendOnlyLog.js";
import {getTime} from "./TimeManager.js";
import {Mutex} from "async-mutex";

/*
let testUrls = [
    'testUrl1',
    'testUrl2',
    'testUrl3',
    'testUrl4'
]

let websites = [
    '<!DOCTYPE html><html><body><p>This is a test <b>bold</b> text</p><p>Other text</p></body></html>',
    '<!DOCTYPE html><html><body><p>This is a test <i>italic</i> text</p><p>Other text</p></body></html>',
    '<!DOCTYPE html><html><body><p>What did alice say to me? asked bob</p></body></html>',
    '<!DOCTYPE html><html><body><p>Alice says you look really good in that outfit</p></body></html>'
]

let maliciouswebsites = [
    '<!DOCTYPE html><html><body><p>This is a test <b>italic</b> text</p><p>Other text</p></body></html>',
    '<!DOCTYPE html><html><body><p>This is a test <i>bold</i> text</p><p>Other text</p></body></html>',
    '<!DOCTYPE html><html><body><p>What did alice say to me? bob violently asked</p></body></html>',
    '<!DOCTYPE html><html><body><p>Alice says you look absolutely terrible</p></body></html>'
]
*/


export class PeerBehaviours {
    constructor(simulation_parameters, website_manager) {
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


    startPeer = async (peerNum, aol, urls, requester, documentChangeStrategy) => {
        const delayToWait = Math.max(Math.random() * this.simulation_parameters.max_peer_time_before_first_request * 1000, this.simulation_parameters.min_peer_time_before_first_request * 1000);

        const thisPeersUrls = [...urls]
        this.shuffle(thisPeersUrls)

        let currentPeerNum = peerNum;

        let mainLoop = async () => {

            if (await this.shouldStopPeersCheck()){
                return;
            }

            // print the second mark when the peer starts
            //console.log("Pure Peer " + peerNum + " starting again");

            await documentChangeStrategy(currentPeerNum, aol, thisPeersUrls, requester)

            if (!(this.simulation_parameters.chance_a_peer_churns === 0) && Math.random() < this.simulation_parameters.chance_a_peer_churns){
                this.shuffle(thisPeersUrls)
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

            let timestamp = getTime();
            await this.doP2PProtocolWithPlaintext(response, url, aol, peerNum, timestamp)
        }
    }

    consistentlyMaliciousPeerStrategy = async (peerNum, aol, urls, requester, simulation_params) => {
        for (const url of urls){
            //console.log("Peer " + peerNum + " requesting " + url);
            //console.log("new url: " + url)

            let response = url + "_malicious"

            let timestamp = getTime();
            await this.doP2PProtocolWithPlaintext(response, url, aol, peerNum, timestamp)
        }
    }

// Might be malicious, but might also sometimes just get served a different url such as a regional different page but with the same url.
    sometimesMaliciousPeerStrategy = async (peerNum, aol, urls, requester) => {
        for (const url of urls){

            let doc;
            if (Math.random() <= this.simulation_parameters.chance_of_sometimes_being_malicious){
                doc = url + "_malicious";
            }
            else{
                doc = await requester(url);
            }

            let timestamp = getTime();
            await this.doP2PProtocolWithPlaintext(doc, url, aol, peerNum, timestamp)
        }
    }

    startNetworkWithConfig = async () => {
        const aol = new AppendOnlyLog(this.simulation_parameters);

        for (let i = 0; i < this.simulation_parameters.amount_of_pure_peers; i++) {
            this.startPeer(i, aol, await this.website_manager.get_requestable_urls(), this.website_manager.request_website, this.purePeerStrategy, this.simulation_parameters)
        }
        for (let i = this.simulation_parameters.amount_of_pure_peers; i < this.simulation_parameters.amount_of_pure_peers + this.simulation_parameters.amount_of_consistently_malicious_peers; i++) {
            this.startPeer(i, aol, await this.website_manager.get_requestable_urls(), this.website_manager.request_website, this.consistentlyMaliciousPeerStrategy, this.simulation_parameters)
        }
        for (let i = this.simulation_parameters.amount_of_pure_peers + this.simulation_parameters.amount_of_consistently_malicious_peers; i < this.simulation_parameters.amount_of_pure_peers + this.simulation_parameters.amount_of_consistently_malicious_peers + this.simulation_parameters.amount_of_sometimes_malicious_peers; i++) {
            this.startPeer(i, aol, await this.website_manager.get_requestable_urls(), this.website_manager.request_website, this.sometimesMaliciousPeerStrategy, this.simulation_parameters)
        }

        await this.setPeerNumberStart(this.simulation_parameters.amount_of_pure_peers + this.simulation_parameters.amount_of_consistently_malicious_peers + this.simulation_parameters.amount_of_consistently_malicious_peers)
        setTimeout(() => {
            this.stopPeers();
        }, this.simulation_parameters.max_time * 1000)

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


    setPeerNumberStart = async (peerNum) => {
        const release = await this.peerNumberMutex.acquire();
        try {
            this.nextPeerNum = peerNum;
        }
        finally {
            release();
        }
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



