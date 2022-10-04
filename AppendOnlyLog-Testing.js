import {AppendOnlyLog} from "./SimulatedAppendOnlyLog.js";

const aol = new AppendOnlyLog();

let asyncTest = async (peerNum, aol) => {
    aol.append("Hello from peer " + peerNum);

    // Wait for a random amount of time
    for (let i = 0; i < 10; i++){
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        aol.append("Hello again from peer " + peerNum);
    }
}

for (let i = 0; i < 10; i++){
    asyncTest(i, aol);
}

// Wait 10 seconds, then the read log
setTimeout(async () => {
    console.log(await aol.read());
}, 10000);