// import
import express from 'express';
import mongoose from 'mongoose';
import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
  appId: '1147529',
  key: '0967fedf1d4dfe775754',
  secret: '8ce93e7bbf4f0e58a94f',
  cluster: 'ap1',
  useTLS: true,
});

// middleware
app.use(express.json());
app.use(cors());

// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Headers', '*');
//   next();
// });

// DB config
const connection_url =
  'mongodb+srv://denski23:78ulol90@contactkeeper.4feae.mongodb.net/chatappdb?retryWrites=true&w=majority';

mongoose.connect(connection_url, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
});

const db = mongoose.connection;

db.once('open', () => {
  console.log('DB is connected');

  const msgCollection = db.collection('messagecontents');
  const changeStream = msgCollection.watch();

  changeStream.on('change', (change) => {
    console.log('there is a change', change);

    if (change.operationType === 'insert') {
      const messageDetails = change.fullDocument;

      pusher.trigger('messages', 'inserted', {
        name: messageDetails.name,
        message: messageDetails.message,
      });
    } else {
      console.log('Error triggering Pusher');
    }
  });
});

// API routes
app.get('/', (req, res) => res.status(200).send('Hello World'));

app.get('/messages/sync', (req, res) => {
  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post('/messages/new', (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

// listener
app.listen(port, () =>
  console.log(`Listening on localhost:${port} in development mode`)
);
