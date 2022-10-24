const amqp = require('amqplib')

// channel name for receiving message, must be the same with publish channel
const QUEUE = 'shortUrl';

const rabbitSettings = {
  protocol: 'amqp',
  hostname: process.env.RABBITMQ_HOST || 'localhost',
  port: process.env.RABBITMQ_PORT || 5672,
  username: 'guest',
  password: 'guest',
  virtualHost: '/'
}

async function connect() {
    // Try to connect to rabbitmq until successful
    let conn = null;
    do {
      try {
        conn = await amqp.connect(rabbitSettings);
      } catch (e) {}
    } while (conn === null);
    const channel = await conn.createChannel();
    channel.assertQueue(QUEUE, {
      durable: true
    });
    return channel;
}

module.exports.consumeQueue = async (callback) => {
    const channel = await connect();
    channel.consume(QUEUE, msg => {
      callback(msg);
    }, {
      noAck: true
    });
}