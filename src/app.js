import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

import { loadAmazonBiome } from './index.js';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: 'http://localhost:3000' } });

io.on('connection', (socket) => {
  console.log('a user connected');
});

var counter = 0;

setInterval(() => {
  io.emit('message', counter++);
}, 2000);

server.listen(3333, () => {
  console.log('Server online on port 3333');
  console.log('Loading Amazon Biome');
  loadAmazonBiome();
});