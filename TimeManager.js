// Works similairly to slots in blockchain.

export class TimeManager {

    constructor(simIsDone = false) {
        if (simIsDone) {
            this.startTime = (new Date().getTime() / 1000) - 500;
        }
    }

    startTime = -1;

    getTime = () => {
        if (this.startTime === -1){
            this.startTime = new Date().getTime() / 1000;
        }

        return (new Date().getTime() / 1000) - this.startTime;
    }

}

