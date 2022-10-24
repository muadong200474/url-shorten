const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const {publishToQueue} = require('./services/MQService');
// Model ORM
const {Sequelize, DataTypes} = require('sequelize');
//  hashids generate short unique ids from integers
const Hashids = require('hashids');
const hashids = new Hashids('Url shortener', 6);

const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());
app.options('*', cors());

console.log(process.env.DATABASE_HOST)

const sequelize = new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
  host: process.env.DATABASE_HOST,
  dialect: 'mysql'
});

sequelize.authenticate().then(() => {
  console.log('Connection established');
});

// Define model
const Url = sequelize.define('Url', {
  // model field
  realUrl: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'urls'
});

const APP_URL = process.env.REDIRECTION_APP_URL || 'localhost';
const PORT = process.env.APP_PORT || 3000;
const HOST = '0.0.0.0';

app.get('/', function (req, res) {
  res.json('Hello');
});

app.post('/', async function (req, res) {
  const realUrl = req.body.realUrl;
  const shortUrl = await createUrl(realUrl);
  return res.json(shortUrl);
});

app.delete('/:id', async function (req, res) {
  await deleteUrl(Number(req.params.id));
  return res.json('Deleted Successfully');
});

async function createUrl(realUrl) {
  const msgQueueUrl = await Url.build({realUrl: realUrl}).save();
  const hash = hashids.encode(msgQueueUrl.id);
  const shortUrl = `${APP_URL}/${hash}`;
  msgQueueUrl.setDataValue('shortUrlHash', hash);
  await publishToQueue(msgQueueUrl, 'urls.create');
  msgQueueUrl.setDataValue('shortUrl', shortUrl);
  return msgQueueUrl;
}

async function deleteUrl(urlId) {
  await Url.destroy({
    where: {
      id: urlId
    }
  });
  await publishToQueue(hashids.encode(urlId), 'urls.delete');
}

app.listen(PORT, HOST);