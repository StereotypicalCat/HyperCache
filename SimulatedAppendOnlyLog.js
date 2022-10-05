import {Mutex} from "async-mutex";

const messageType = {
    APPEND: 0,
    VALIDATE: 1
}

class AppendOnlyLog{
    constructor(){
        this.versions = [];
        this.validations = [];
        this.lock = new Mutex();
    }

    async tryAddNewVersion(value, peerId){
        const release = await this.lock.acquire();
        try{
            let didFind = false;
            let foundIndex = -1;

            for (let i = 0; i < this.versions.length; i++) {
                if(this.versions[i].tree.value === value.value){
                    didFind = true
                    foundIndex = i;
                }
            }
            if (didFind){
                return {wasSuccess: false, index: foundIndex}
            } else{
                this.versions.push({
                    tree: value,
                    peerId: peerId
                });
                return {wasSuccess: true, index: this.versions.length - 1}
            }
        } finally {
            release();
        }

    }

    async tryAddNewValidation(index, peerId){
        const release = await this.lock.acquire();
        try{
            this.validations.push({
                index: index,
                peerId: peerId
            })
        } finally {
            release();
        }
    }

    async read(){
        const release = await this.lock.acquire();

        try{
            let validations = this.validations;
            let versions = this.versions;
            return {validations: validations, versions: versions}
        }
        finally {
            release();
        }


    }


    async print(){
        const release = await this.lock.acquire();

        console.log("Printing Log")

        // Contains each hash and the peers supporting that hash
        let map = new Map();

        try{
            // Add versions
            for (let i = 0; i < this.versions.length; i++) {
                let elem = this.versions[i];
                map.set(elem.tree.value, [elem.peerId]);
            }
            // Append peerIDs of validtors to each version

            for (let i = 0; i < this.validations.length; i++) {
                let elem = this.validations[i];
                let peerIDs = map.get(this.versions[elem.index].tree.value);
                peerIDs.push(elem.peerId);
                map.set(this.versions[elem.index].tree.value, peerIDs);
            }


            // Print each hash and the peers supporting that hash
            for (let [key, value] of map) {
                console.log(key + " = " + value);
            }

        } finally {
            release();
        }
    }
}

export {AppendOnlyLog, messageType};