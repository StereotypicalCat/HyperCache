// Works similairly to slots in blockchain.

let startTime = -1;

export let getTime = () => {
    if (startTime === -1){
        startTime = new Date().getTime() / 1000;
    }

    return (new Date().getTime() / 1000) - startTime;
}