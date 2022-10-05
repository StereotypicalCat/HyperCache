import {Mutex} from "async-mutex";

class AppendOnlyLog{
    constructor(){
        this.log = [];
        this.lock = new Mutex();
    }

    async append(value, peerId){
        const release = await this.lock.acquire();
        try{
            this.log.push({
                tree: value,
                peerId: peerId
            });
        } finally {
            release();
        }
    }

    async appendIfNotExists(value, peerId){
        const release = await this.lock.acquire();
        try{

            let didFind = false;
            let foundIndex = -1;

            for (let i = 0; i < this.log.length; i++) {
                if(this.log[i].tree.value === value.value){
                    didFind = true
                    foundIndex = i;
                }
            }

            if (didFind){
                return {wasSuccess: false, index: foundIndex}
            } else{
                this.log.push({
                    tree: value,
                    peerId: peerId
                });
                return {wasSuccess: true, index: this.log.length - 1}
            }


        } finally {
            release();
        }
    }

    async read(){
        const release = await this.lock.acquire();
        try{
            return this.log;
        } finally {
            release();
        }
    }
}

export {AppendOnlyLog};