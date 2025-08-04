const { WebcastPushConnection, TikTokLiveConnection } = require('tiktok-live-connector');
const overlayServer = require('./overlayServer');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');
const { machineIdSync } = require('node-machine-id');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '.env');

dotenv.config({ path: envPath });

const DOMAIN = process.env.DOMAIN;


let tiktokLive;
let isLive = false;

document.getElementById('toggleLive').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();

  if (!username) {
    alert('Vui lòng nhập username TikTok!');
    return;
  }

  if (!isLive) {
    showLoading("Đang kết nối tới live...");
    // Start TikTok Live
    tiktokLive = new TikTokLiveConnection(username);

    tiktokLive.connect().then(state => {
      console.log(`Connected to ${username}`);
      document.getElementById('toggleLive').innerText = 'Dừng Live';
      document.getElementById('toggleLive').className = 'btn btn-danger';
      isLive = true;
      alert('Đã kết nối tới live!');
    }).catch(err => {
      console.error(err);
      alert('Không thể kết nối tới live.');
    }).finally(err => {
      hideLoading();
    }

    );



    tiktokLive.on('gift', data => {
      console.log('Received gift:', data);
      if (data.repeatEnd == 1) return;
      const giftData = {
        username: data.user.nickname || data.user.userId,
        avatar: data.user.profilePicture.urls[0],
        name: data.giftDetails.giftName,
        count: `${data.repeatCount}`
      };

      overlayServer.sendGift(giftData);
    });

  } else {
    await tiktokLive.disconnect();
    overlayServer.clearGift();
    // overlayServer.closeServer?.(); // Nếu muốn tắt hẳn server
    isLive = false;
    document.getElementById('toggleLive').innerText = 'Bắt đầu Live';
    document.getElementById('toggleLive').className = 'btn btn-primary';
    console.log('Ngắt kết nối.');
  }
});





let effectsData = [];
let userDataPath = '';

async function generateEffectsDataJson(userDataPath) {
  const assetsDir = path.join(userDataPath, 'main-assets', 'assets');

  if (!fs.existsSync(assetsDir)) {
    return;
  }

  const dataFile = path.join(assetsDir, 'data.json');

  const effects = [];

  const effectFolders = fs.readdirSync(assetsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory());

  for (const dirent of effectFolders) {
    const effectName = dirent.name;
    const effectPath = path.join(assetsDir, effectName);
    const files = fs.readdirSync(effectPath);

    const gifs = files.filter(f => f.toLowerCase().endsWith('.gif'));
    const sounds = files.filter(f => f.toLowerCase().endsWith('.mp3'));

    effects.push({
      name: effectName,
      gifs: gifs.join(', '),
      sounds: sounds.join(', ')
    });
  }

  fs.writeFileSync(dataFile, JSON.stringify(effects, null, 2), 'utf-8');
  console.log(`✅ Đã tạo file data.json tại: ${dataFile}`);
}


ipcRenderer.invoke('get-user-data-path').then(p => {
  userDataPath = p;
  showLoading("Loading assets...");
  generateEffectsDataJson(userDataPath).then(() => {
    const dataPath = path.join(userDataPath, 'main-assets', 'assets', 'data.json');

    try {
      effectsData = JSON.parse(fs.readFileSync(dataPath));
      populateEffectSelects();
      // loadEffectMap();

    } catch (e) {
      console.log('Cannot load effects data:', e);
    }
    finally {
      hideLoading();
    }
  });
});


function showEffectByClicking(row) {
  const giftName = row.querySelector('.gift-name').value.trim().toLowerCase();
  const giftData = {
    username: null,
    avatar: null, 
    name: giftName,
    count: 1,
    selfClick: true 
  };
  overlayServer.sendGift(giftData);
  showEffect(effect, giftName);
}


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
  delBtn.className = 'btn btn-danger';
  delBtn.textContent = 'Xóa';
  delBtn.onclick = () => row.remove();


  // Tạo nút hiệu ứng
  const effectBtn = document.createElement('button');
  effectBtn.className = 'btn btn-primary';
  effectBtn.textContent = 'Show';
  effectBtn.onclick = () => showEffectByClicking(row);


  row.appendChild(input);
  row.appendChild(select);
  row.appendChild(delBtn);
  row.appendChild(effectBtn);
  return row;
}

function populateEffectSelects() {
  const effectsList = document.getElementById('effects-list');
  const addEffectRow = document.getElementById('add-effect');



  addEffectRow.addEventListener('click', () => {
    effectsList.appendChild(createEffectRow());
  });

}

window.getNoThankGiftNames = () => {
  return document.getElementById('ignored-gifts').value
    .split('\n').map(x => x.trim()).filter(Boolean);
};

const effectMapPath = path.join(userDataPath, 'effect-map.json');
// const effectMapPath = path.join('', 'effect-map.json');

window.getEffectMap = () => {
  const map = {};
  const rows = document.querySelectorAll('.effect-row');
  rows.forEach(row => {
    const gift = row.querySelector('.gift-name').value.trim().toLowerCase();
    const effect = row.querySelector('.effect-select').value;
    if (gift && effect && effect !== 'none') {
      map[gift] = effectsData.find(e => e.name === effect);
    }
  });
  return map;
};

function loadEffectMap() {
  if (!fs.existsSync(effectMapPath)) {
    console.warn('Effect map file does not exist.');
    return;
  }

  try {
    const raw = fs.readFileSync(effectMapPath, 'utf-8');
    const savedMap = JSON.parse(raw);

    Object.entries(savedMap).forEach(([gift, effectObj]) => {
      let row = createEffectRow(gift, effectObj.name);
      const effectsList = document.getElementById('effects-list');
      effectsList.appendChild(row);
    });


    console.log('Effect map loaded from:', effectMapPath);
  } catch (err) {
    console.error('Failed to load effect map:', err);
  }
};

async function saveEffectMap() {
  const effectMap = window.getEffectMap();
  const filePath = await ipcRenderer.invoke('dialog:saveFile', 'my-username.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(effectMap, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save effect map:', err);
  }
};

async function loadEffectMapFromFile() {
  const filePath = await ipcRenderer.invoke('dialog:openFile', 'json');
  if (!filePath) return;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const loadedMap = JSON.parse(raw);

    const effectsList = document.getElementById('effects-list');
    effectsList.innerHTML = ''; // Clear existing rows

    Object.entries(loadedMap).forEach(([gift, effectObj]) => {
      let row = createEffectRow(gift, effectObj.name);
      effectsList.appendChild(row);
    });

    console.log('Effect map loaded from:', filePath);
  } catch (err) {
    console.error('Failed to load effect map from file:', err);
  }
}



function showLoading(text) {
  const overlay = document.getElementById('overlay');
  const loadingText = document.getElementById('loading-text');
  overlay.style.display = 'flex';
  loadingText.innerText = text;
}


function hideLoading() {
  const overlay = document.getElementById('overlay');
  overlay.style.display = 'none';
}


async function downloadAssets() {
  try {
    showLoading("Đang tải assets...");
    const basePath = path.join(userDataPath, 'main-assets');

    // Xoá thư mục nếu đã tồn tại
    if (fs.existsSync(basePath)) {
      fs.rmSync(basePath, { recursive: true, force: true });
    }
    fs.mkdirSync(basePath, { recursive: true });

    const assetsURL = `${process.env.ASSETS_URL}?ver=${Date.now()}`;
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
    hideLoading();
  } catch (error) {
    console.log('Lỗi trong quá trình tải hoặc giải nén:', error);
  }
}



// xử lý license
function getMachineId() {
  try {
    return machineIdSync();
  } catch {
    return null;
  }
}



async function checkEnterLicense(license) {
  const machine_id = getMachineId();
  const app_name = "tiktok_live";

  try {
    const res = await axios.post(`${DOMAIN}/api/license-key/verify`, {
      license,
      machine_id,
      app_name
    });

    return res.data;
  } catch (err) {
    console.error('Lỗi khi gọi API:', err.message);
    return { valid: false, license_type: 'free' };
  }
}


document.getElementById('submit-license').addEventListener('click', async () => {
  const license = document.getElementById('license-input').value.trim();

  if (!license) {
    alert("Vui lòng nhập license!");
    return;
  }

  const result = await checkEnterLicense(license);

  if (result.valid) {
    ipcRenderer.send('save-license', license);
    alert('License hợp lệ! Vui lòng khởi động lại ứng dụng.');
  } else {
    alert('License không hợp lệ.');
  }
});
let licenseTypeGlobal = 'free';



async function getLicenseInfoFromMain() {
  const { licenseType, expiredDate } = await ipcRenderer.invoke('get-license-info');
  console.log('License Type:', licenseType);
  console.log('Expired Date:', expiredDate);

  if (licenseType === 'free') {
    document.getElementById('main').remove();
    alert("Vui lòng nhập license để sử dụng ứng dụng.");

  } else {
    licenseTypeGlobal = 'vip'
    document.getElementById('license-form').remove();


  }


}

getLicenseInfoFromMain()