import {Mutex} from "async-mutex";
class AppendOnlyLog{

    // NumberOfPeers only used for simulation.
    constructor(simulation_parameters, timeManager){
        this.simulation_parameres = simulation_parameters;
        this.timeManager = timeManager;
        this.maxPeerNum = -1;
        this.websites = new Map();
        this.logHistory = [];
        this.lock = new Mutex();
    }

    async getDataForWorker(){
        const release = await this.lock.acquire();
        let returnData;
        try {
            returnData = {
                websites: this.websites,
                maxPeerNum: this.maxPeerNum,
            };
        }
        finally {
            release();
        }
        return returnData;
    }

    // Incomplete As LogHistory will be missing but what can ya do
    async updateAOL(websites, maxPeerNum){
        const release = await this.lock.acquire();

        try{
            this.websites = websites;
            this.maxPeerNum = maxPeerNum;
        }
        finally {
            release();
        }
    }

    async getNumberOfPeers(){
        const release = await this.lock.acquire();
        try {
            return this.maxPeerNum + 1;
        }
        finally {
            release();
        }
    }

    async getLogLength(){
        // If the simulation is ended, this can be sped up a whole lot as nothing should be adding to the log.
        if (this.timeManager.getTime() > this.simulation_parameres.max_time){
            return this.logHistory.length;
        }

        const release = await this.lock.acquire();
        try{
            return this.logHistory.length;
        }
        finally {
            release();
        }
    }

    async peerJoinsSystem(peerId){
        const release = await this.lock.acquire();

        try {
            if (peerId > this.maxPeerNum){
                this.maxPeerNum = peerId;
            }
        }
        finally {
            release();
        }
    }

    async tryAddNewVersion(tree, peerId, url, time){
        const release = await this.lock.acquire();

        if (this.timeManager.getTime() > this.simulation_parameres.max_time){
            release();
            return;
        }

        try{
            let toplevelhash = tree.value;

            // Check if the URL is new

            let firstVersionOfWebsite = !this.websites.has(url)
            if(firstVersionOfWebsite){
                this.websites.set(url, new Map())
            }

            // Append the version if it is new.


            let firstVersionOfValue = !this.websites.get(url).has(toplevelhash)

            if(firstVersionOfValue) {
                this.websites.get(url).set(toplevelhash, {
                    tree: tree,
                    peerId: peerId,
                    signature: null,
                    time: time,
                    validations: []
                })

                this.logHistory.push(peerId + " submitted version " + toplevelhash + " for url " + url + "at time " + time)

                return true
            } else{
                return false
            }
        } finally {
            release();
        }

    }

    async tryAddNewValidation(tree, peerId, url, time){
        const release = await this.lock.acquire();

        if (this.timeManager.getTime() > this.simulation_parameres.max_time){
            release();
            return;
        }

        const toplevelhash = tree.value;

        try{
            if(this.websites.get(url).get(toplevelhash) == undefined){
                console.log("Undefined stuff")
                console.log(url)
                console.log(toplevelhash)
                console.log(this.websites)
                console.log(this.websites.get(url))
            }

            this.websites.get(url).get(toplevelhash).validations.push({
                peerId: peerId,
                time: time,
                signature: null
            })
            this.logHistory.push(peerId + " validated version " + toplevelhash + " for url " + url + "at time " + time)

        } finally {
            release();
        }
    }

    async read(){
        const release = await this.lock.acquire();

        try{
            return this.websites;
        }
        finally {
            release();
        }
    }
    async readWithLogHistoryLength(){
        const release = await this.lock.acquire();

        try{
            return {websites: this.websites, logHistoryLength: this.logHistory.length};
        }
        finally {
            release();
        }
    }

    async printLogHistory(){
        const release = await this.lock.acquire();

        try{
            for (const logHistoryElement of this.logHistory) {
                console.log(logHistoryElement)
            }
        }
        finally {
            release();
        }
    }


    async print(){
        const release = await this.lock.acquire();

        console.log("Printing Log")

        // Contains each hash and the peers supporting that hash

        try{
            // Print each hash and the peers supporting that hash
            for (let [url, versions] of this.websites) {
                for (let [hash, versionInfo] of versions){
                    let supportingPeers = versionInfo.validations.map((validation) => validation.peerId)

                    console.log("url: " + url + " w/ hash: " + hash + " support =  " + supportingPeers.join(", "))
                }
            }

        } finally {
            release();
        }
    }

    async printAsAOL(){
        const release = await this.lock.acquire();

        try{
            console.log("Printing Log")
            for(let i = 0; i < this.logHistory.length; i++){
                console.log(this.logHistory[i])
            }
        }
        finally {
            release();
        }

    }

    async printAsConsoleLog(){
        const release = await this.lock.acquire();

        try{
            console.log(this)
        }
        finally {
            release();
        }

    }

}

export {AppendOnlyLog};