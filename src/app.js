import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

import { loadAmazonBiome } from './index.js';
import { allWildfires } from './state.js';
import { initialDateRouter } from './routes/initialDateRoutes.js';
import { wildfiresRouter } from './routes/wildfiresRoutes.js';

const app = express();
// app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://fastidious-pony-5e48f3.netlify.app:*',
    ],
  },
});
export { io };

app.use('/initial_date/', initialDateRouter);
app.use('/wildfires/', wildfiresRouter);

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.emit('initial state', allWildfires.length);
});

const APP_PORT = process.env.PORT || 3333;

server.listen(APP_PORT, () => {
  console.log(`Server online on port ${APP_PORT}`);
  console.log('Loading Amazon Biome');
  loadAmazonBiome();
});
