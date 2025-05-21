const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'overlay.html'));
});

let ioInstance = null;

io.on('connection', (socket) => {
  console.log('Overlay connected');
  ioInstance = socket;

  socket.on('disconnect', () => {
    ioInstance = null;
    console.log('Overlay disconnected');
  });
});

server.listen(3000, () => {
  console.log('Overlay server running at http://localhost:3000');
});

// export để renderer gọi được
module.exports = {
  sendGift: (gift) => {
    if (ioInstance) ioInstance.emit('show-gift', gift);
  },
  clearGift: () => {
    if (ioInstance) ioInstance.emit('clear');
  },
  closeServer: () => {
    server.close();
  }
};
