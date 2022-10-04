const hypercore = require('hypercore')
const { toPromises } = require('hypercore-promisifier')

start()

async function start () {

    let peerNum = process.env.peerNumber

    console.log("Hello I am peer " + peerNum)

    // Step 1: Create our initial Hypercore.
    console.log('Step 1: Create the initial Hypercore\n')

    // Create our first Hypercore, saving blocks to the 'main' directory.
    // We'll wrap it in a Promises interface, to make the walkthrough more readable.
    const core = toPromises(new hypercore('./main', {
        valueEncoding: 'utf-8' // The blocks will be UTF-8 strings.
    }))

    // Append two new blocks to the core.
    await core.append(['hello', 'world'])

    // After the append, we can see that the length has updated.
    console.log('Length of the first core:', core.length) // Will be 2.

    // And we can read out the blocks.
    console.log('First block:', await core.get(0)) // 'hello'
    console.log('Second block:', await core.get(1)) // 'world'

    // Step 2: Create a read-only clone (this would typically be done by another peer)
    console.log('\nStep 2: Create a read-only clone\n')

    // Create a clone of the first Hypercore by creating a new core with the first's public key.
    // This would typically be done by a different peer.
    // This clone is not writable, since it doesn't have access to the first core's private key.
    const clone = toPromises(new hypercore('./clone', core.key, {
        valueEncoding: 'utf-8',
        sparse: true, // When replicating, don't eagerly download all blocks.
    }))

    // A Hypercore can be replicated over any Node.js stream.
    // The replication stream is E2E encrypted with the NOISE protocol.
    // We'll use live replication, meaning the streams will continue replicating indefinitely.
    const firstStream = core.replicate(true, { live: true })
    const cloneStream = clone.replicate(false, { live: true })

    // Pipe the stream together to begin replicating.
    firstStream.pipe(cloneStream).pipe(firstStream)

    // Now we can read blocks from the clone.
    // Note that these blocks will be downloaded lazily, when each one requested.
    console.log('First clone block:', await clone.get(0)) // 'hello'
    console.log('Second clone block:', await clone.get(1)) // 'world'

    for (let i = 0; i < 100; i++) {
        await core.append(`New Block ${i}`)
    }
    await clone.update()
    console.log(`Last Block (${clone.length - 1}):`, await clone.get(clone.length - 1))
}



/*
* const hypercore = require('hypercore')
const { toPromises } = require('hypercore-promisifier')

//     let peerNum = process.env.peerNumber

const core1 = start(69, null)
const core2 = start(420, core1)

async function start (peerNum, prevCorePromise) {

    console.log("Hello I am peer " + peerNum)


    if (prevCorePromise === null){
        // Step 1: Create our initial Hypercore.
        console.log('Step 1: Create the initial Hypercore\n')

        const core = toPromises(new hypercore('./main', {
            valueEncoding: 'utf-8' // The blocks will be UTF-8 strings.
        }))

        // Append two new blocks to the core.
        await core.append(['Hello, I am peer ' + peerNum])

        // After the append, we can see that the length has updated.
        console.log('Length of the first core:', core.length) // Will be 2.

        await core.update()

        return core
    }

    // Step 2: Create a read-only clone (this would typically be done by another peer)
    console.log('\nStep 2: Create a read-only clone\n')

    // Create a clone of the first Hypercore by creating a new core with the first's public key.
    // This would typically be done by a different peer.
    // This clone is not writable, since it doesn't have access to the first core's private key.
    const clone = toPromises(new hypercore('./clone', prevCorePromise.key, {
        valueEncoding: 'utf-8',
        sparse: true, // When replicating, don't eagerly download all blocks.
    }))

    // A Hypercore can be replicated over any Node.js stream.
    // The replication stream is E2E encrypted with the NOISE protocol.
    // We'll use live replication, meaning the streams will continue replicating indefinitely.

    console.log('waiting for prevCorePromise')
    await prevCorePromise;
    console.log('prevCorePromise resolved')
    prevCorePromise.then(async (prevCore) => {
        const firstStream = prevCore.replicate(true, { live: true })
        const cloneStream = clone.replicate(false, { live: true })

        // Pipe the stream together to begin replicating.
        firstStream.pipe(cloneStream).pipe(firstStream)

        // Now we can read blocks from the clone.
        // Note that these blocks will be downloaded lazily, when each one requested.
        console.log('First clone block:', await clone.get(0)) //

        await clone.update()

        await clone.append(['Hello, I am peer ' + peerNum])

        await clone.update()

        //console.log(`Last Block (${clone.length - 1}):`, await clone.get(clone.length - 1))

        for (let i = 0; i <= clone.length; i++){
            console.log(`Block ${i}:`, await clone.get(i))
        }

    })

}
*
*
* */