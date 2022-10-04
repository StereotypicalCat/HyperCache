const Hyperswarm = require('hyperswarm')


let test = async (peerId) => {
    const swarm = new Hyperswarm()
    swarm.on('connection', (conn, info) => {
        console.log("Connected to peer: " + info.peer.toString('hex'))
        conn.on('data', data => console.log('peer with id ' + peerId + ' got message:', data.toString()))
        // swarm1 will receive server connections
        console.log(info)

        conn.write('Hello from ' + peerId)
        conn.end()
    })
    const topic = Buffer.alloc(32).fill('hyper cache') // A topic must be 32 bytes
    const discovery = swarm.join(topic)
    console.log("flushing the swarm")
    await discovery.flushed() // Waits for the topic to be fully announced on the DHT
    console.log("ready")
// After this point, both client and server should have connections
}

test(1)
test(42069)


/*
const Hyperswarm = require('hyperswarm')
const swarm1 = new Hyperswarm()
const swarm2 = new Hyperswarm()

let test = async (peerId) => {
    swarm1.on('connection', (conn, info) => {
        // swarm1 will receive server connections
        conn.write('this is a server connection')
        conn.end()
    })
    swarm2.on('connection', (conn, info) => {
        conn.on('data', data => console.log('client got message:', data.toString()))
    })

    const topic = Buffer.alloc(32).fill('hello world') // A topic must be 32 bytes
    const discovery = swarm1.join(topic, { server: true, client: false })
    await discovery.flushed() // Waits for the topic to be fully announced on the DHT

    swarm2.join(topic, { server: false, client: true })
    await swarm2.flush() // Waits for the swarm to connect to pending peers.

// After this point, both client and server should have connections
}

test(1)
test(42069)*/
