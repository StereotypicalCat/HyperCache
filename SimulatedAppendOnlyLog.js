import {Mutex} from "async-mutex";

class AppendOnlyLog{
    constructor(){
        this.log = [];
        this.lock = new Mutex();
    }

    async append(value){
        const release = await this.lock.acquire();
        try{
            this.log.push(value);
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