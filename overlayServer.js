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

    // console.log('Sending gift:', gift);

    const effectMap = window.getEffectMap();
    const vipCustomers = window.getVipCustomers();
    // console.log('VIP Customers:', vipCustomers);
    // tên username = gift.username, kiểm tra xem có phải khách vip
    let is_vip = vipCustomers.includes(gift.uniqueId);
    gift.is_vip = is_vip;

    const giftName = gift.name.toLowerCase();
    const effectSetting = effectMap[giftName];
    // lấy video ngẫu nhiên từ effectSetting["videos"]
    if (effectMap["videos"] && gift.is_video) {
      if (!is_vip) {
        const videos = effectMap["videos"];
        const videoFile = videos[Math.floor(Math.random() * videos.length)];
        gift.video = "http://localhost:4001/videos/" + videoFile;
      } else {
        const customVideos = effectMap["customVideos"];
        // console.log('Custom Videos:', customVideos);
        const customVideoFile = customVideos[Math.floor(Math.random() * customVideos.length)];
        gift.video = "http://localhost:4001/" + customVideoFile;
      }


    } else {
      gift.video = null; // Không có video
    }

    const noThanks = window.getNoThankGiftNames();
    let is_thank = true;
    if (noThanks.includes(gift.name) || gift.selfClick) {
      is_thank = false;
    }

    gift.effect_setting = effectSetting;

    // if (effectSetting) {
    //   const effect = pickRandomFromEffect(effectSetting);
    //   gift.gif = "http://localhost:4001" + effect.gif;
    //   gift.sound = "http://localhost:4001" + effect.sound;
    // }

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


