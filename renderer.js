const { WebcastPushConnection, TikTokLiveConnection } = require('tiktok-live-connector');
const overlayServer = require('./overlayServer');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

let tiktokLive;
let isLive = false;

document.getElementById('toggleLive').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();

  if (!username) {
    alert('Vui lòng nhập username TikTok!');
    return;
  }

  if (!isLive) {
    // Start TikTok Live
    tiktokLive = new WebcastPushConnection(username, {
      clientParams: {
        "app_language": "vi-VN",
        "device_platform": "web"
      },

      wsClientParams: {
        "app_language": "vi-VN",
      },

    });

    tiktokLive.connect().then(state => {
      console.log(`Connected to ${username}`);
      document.getElementById('toggleLive').innerText = 'Dừng Live';
      isLive = true;
    }).catch(err => {
      console.error(err);
      alert('Không thể kết nối tới live.');
    });

    tiktokLive.on('chat', data => {
      // Không hiển thị comment
      // console.log({
      //   avatar: data.uniqueId,
      //   username: data.nickname || data.uniqueId,
      //   content: data.comment
      // });
    });

    tiktokLive.on('gift', data => {
      if (data.giftType === 1 && !data.repeatEnd) return;
      console.log('Received gift:', data);
      const giftData = {
        username: data.nickname || data.uniqueId,
        name: data.giftName,
        count: `${data.diamondCount} Diamonds`
      };
      // console.log('Received gift:', giftData);
      overlayServer.sendGift(giftData);
    });

  } else {
    await tiktokLive.disconnect();
    overlayServer.clearGift();
    // overlayServer.closeServer?.(); // Nếu muốn tắt hẳn server
    isLive = false;
    document.getElementById('toggleLive').innerText = 'Bắt đầu Live';
    console.log('Ngắt kết nối.');
  }
});





let effectsData = [];
let userDataPath = '';

ipcRenderer.invoke('get-user-data-path').then(p => {
  userDataPath = p;
  const dataPath = path.join(userDataPath, 'main-assets', 'assets', 'data.json');

  try {
    effectsData = JSON.parse(fs.readFileSync(dataPath));
    populateEffectSelects();
  } catch (e) {
    console.log('Cannot load effects data:', e);
  }
});

function populateEffectSelects() {
  const effectsList = document.getElementById('effects-list');
  const addEffectRow = document.getElementById('add-effect');

  function createEffectRow(giftName = '', selectedEffect = '') {
    const row = document.createElement('div');
    row.className = 'effect-row';
    row.style.display = 'flex';
    row.style.gap = '10px';
    row.style.marginBottom = '6px';

    const input = document.createElement('input');
    input.placeholder = 'Tên loại quà';
    input.className = 'gift-name form-control';
    input.value = giftName;

    const select = document.createElement('select');
    select.className = 'effect-select form-select';

    effectsData.forEach(eff => {
      const opt = document.createElement('option');

      opt.value = eff.name;
      opt.textContent = eff.name;
      if (eff.name === selectedEffect) opt.selected = true;
      select.appendChild(opt);
    });

    const delBtn = document.createElement('button');
    delBtn.textContent = '❌';
    delBtn.onclick = () => row.remove();

    row.appendChild(input);
    row.appendChild(select);
    row.appendChild(delBtn);
    return row;
  }

  addEffectRow.addEventListener('click', () => {
    effectsList.appendChild(createEffectRow());
  });
}

window.getNoThankGiftNames = () => {
  return document.getElementById('ignored-gifts').value
    .split('\n').map(x => x.trim()).filter(Boolean);
};

window.getEffectMap = () => {
  const map = {};
  const rows = document.querySelectorAll('.effect-row');
  rows.forEach(row => {
    const gift = row.querySelector('.gift-name').value.trim();
    const effect = row.querySelector('.effect-select').value;
    if (gift && effect && effect !== 'none') {
      map[gift] = effectsData.find(e => e.name === effect);
    }
  });
  return map;
};


async function downloadAssets() {
  try {
    const basePath = path.join(userDataPath, 'main-assets');

    // Xoá thư mục nếu đã tồn tại
    if (fs.existsSync(basePath)) {
      fs.rmSync(basePath, { recursive: true, force: true });
    }
    fs.mkdirSync(basePath, { recursive: true });

    const assetsURL = "https://otp.streaming-go.shop/assets.zip";
    const zipPath = path.join(userDataPath, 'assets.zip');

    // Tải file ZIP với axios và lưu vào ổ cứng
    const rsp = await axios({
      method: 'GET',
      url: assetsURL,
      responseType: 'arraybuffer', // Important for binary data
    });

    // Write the binary data to file
    fs.writeFileSync(zipPath, Buffer.from(rsp.data));


    // Giải nén file ZIP
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(basePath, true);




    alert("Tải xong assets, vui lòng khởi động lại ứng dụng.");
  } catch (error) {
    console.log('Lỗi trong quá trình tải hoặc giải nén:', error);
  }
}
