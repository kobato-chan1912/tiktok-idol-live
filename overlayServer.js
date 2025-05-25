const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const { ipcRenderer } = require('electron');

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'overlay.html'));
});



const clients = new Set();

io.on('connection', (socket) => {
  console.log('Overlay connected');
  clients.add(socket);

  socket.on('disconnect', () => {
    clients.delete(socket);
    console.log('Overlay disconnected');
  });
});


server.listen(4000, async () => {
  console.log('Overlay server running at http://localhost:4000');
  const userDataPath = await ipcRenderer.invoke('get-user-data-path');
  console.log('User data path:', userDataPath);
});


module.exports = {
  sendGift: (gift) => {
    const effectMap = window.getEffectMap();
    const effectSetting = effectMap[gift.name];
    const noThanks = window.getNoThankGiftNames();
    let is_thank = true;
    if (noThanks.includes(gift.name)) {
      is_thank = false;
    }


    if (effectSetting) {
      const effect = pickRandomFromEffect(effectSetting);
      gift.gif = "http://localhost:4001" + effect.gif;
      gift.sound = "http://localhost:4001" + effect.sound;

    }
    gift.is_thank = is_thank;
    gift.main_effect = effectSetting ? true : false;
    for (const client of clients) {
      client.emit('show-gift', gift);
    }

  },
  clearGift: () => {
    for (const client of clients) {
      client.emit('clear');
    }

  },
  closeServer: () => {
    server.close();
  }
};



// xử lý effect  
function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

let basePath = null;

async function initBasePath() {
  const userDataPath = await ipcRenderer.invoke('get-user-data-path');
  basePath = path.join(userDataPath, 'main-assets', 'assets');
  console.log('Base path set:', basePath);
}

initBasePath();


function pickRandomFromEffect(effect) {
  const effectName = effect.name;

  const gifFiles = effect.gifs.split(',').map(s => s.trim());
  const gifFile = randomItem(gifFiles);
  const gif = "/assets/" + effectName + "/" + gifFile;

  const soundFiles = effect.sounds.split(',').map(s => s.trim());
  const soundFile = randomItem(soundFiles);
  const sound = "/assets/" + effectName + "/" + soundFile;

  return { gif, sound };
}
