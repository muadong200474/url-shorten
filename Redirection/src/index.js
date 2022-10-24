const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const {consumeQueue} = require('./services/MQService');
const {createClient} = require('redis');

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const APP_URL = process.env.APP_URL;
const PORT = process.env.APP_PORT;
const HOST = '0.0.0.0';

// Connection to Redis
const client = createClient({
    socket: {
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST
    }
});
client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();

// Callback that is going to accept messages from queue
async function manageMessage(msg) {
    const type = msg.properties.type;
    const parsedMessage = JSON.parse(msg.content);
    // If the type of message is 'urls.create', store it in Redis.
    if (type === 'urls.create') {
        await client.hSet(parsedMessage.shortUrlHash, {
            id: parsedMessage.id,
            realUrl: parsedMessage.realUrl
        })
    }
    // Otherwise delete it from Redis
    if (type === 'urls.delete') {
        await client.del(parsedMessage);
    }
}
// Pass all messages from queue to our function that is responsible for storing and deleting it from Redis
consumeQueue(manageMessage);

app.get('/', (req, res) => {
    return res.json('Hello');
});

app.get('/:hash', async (req, res) => {
    const hash = req.params.hash
    const keyHash = await client.hGetAll(hash) // Get object from Redis whose key is hash variable
    if (Object.keys(keyHash).length === 0) // hGetAll() returns empty object instead of null so we have to check if we've got empty object
        return res.status(404).json(`URL does not exist: ${APP_URL}${hash}`);

    return res.status(301).redirect(keyHash.realUrl);
});

app.listen(PORT, HOST);