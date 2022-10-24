const amqp = require("amqplib");

// channel name for sending message
const QUEUE = "shortUrl";

const rabbitSettings = {
  protocol: 'amqp',
  hostname: process.env.RABBITMQ_HOST || 'localhost',
  port: process.env.RABBIT_PORT || 5672,
  username: 'guest',
  password: 'guest',
  virtualHost: '/'
};

async function connect() {
  const conn = await amqp.connect(rabbitSettings);
  const channel = await conn.createChannel();
  await channel.assertQueue(QUEUE);
  return channel;
}

module.exports.publishToQueue = async (data, type) => {
  const channel = await connect();
  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(data)), {type: type});
}