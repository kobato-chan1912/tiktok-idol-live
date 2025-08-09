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


let isLive = false;

document.getElementById('toggleLive').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  if (!username) return alert('Nhập username TikTok');

  const btn = document.getElementById('toggleLive');
  btn.disabled = true;
  btn.innerText = 'Đang xử lý...';

  if (!isLive) {
    const res = await ipcRenderer.invoke('start-live', username);
    if (res.success) {
      isLive = true;
      btn.innerText = 'Dừng Live';
      btn.className = 'btn btn-danger';
      alert('Đã kết nối tới live!');
    } else {
      alert('Không thể kết nối: ' + res.error);
      btn.innerText = 'Bắt đầu Live';
    }
  } else {
    await ipcRenderer.invoke('stop-live');
    isLive = false;
    btn.innerText = 'Bắt đầu Live';
    btn.className = 'btn btn-primary';
    console.log('Ngắt kết nối.');
  }

  btn.disabled = false;
});


ipcRenderer.on('gift', (event, gift) => {
  console.log('Gift:', gift);
  let showVideoAmount = parseInt(document.getElementById('special_show').value.trim());
  let giftCount = parseInt(gift.count);
  gift.is_video = false;
  if (giftCount >= showVideoAmount) {
    gift.is_video = true;
  }
  overlayServer?.sendGift(gift); // nếu bạn có overlayServer
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
      loadEffectMap();

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
    // username: 'test_user',
    // avatar: 'https://jbagy.me/wp-content/uploads/2025/03/Hinh-anh-avatar-anime-nu-cute-2.jpg',
    name: giftName,
    count: 1,
    selfClick: true,
    is_video: false,

  };
  overlayServer.sendGift(giftData);
  // showEffect(effect, giftName);
}


function createEffectRow(giftName = '', selectedEffect = '', shortcut = '') {
  const row = document.createElement('div');
  row.className = 'effect-row';
  row.style.display = 'flex';
  row.style.gap = '10px';
  row.style.marginBottom = '6px';

  const input = document.createElement('input');
  input.placeholder = 'Tên loại quà';
  input.className = 'gift-name form-control';
  input.value = giftName;

  const shortcutInput = document.createElement('input');
  shortcutInput.placeholder = 'Phím tắt (nếu có)';
  shortcutInput.className = 'shortcut form-control';
  shortcutInput.value = shortcut;


  shortcutInput.addEventListener('keydown', (e) => {
    e.preventDefault();

    let keys = [];

    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    if (e.metaKey) keys.push('Meta'); // cho Mac

    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      keys.push(e.key.length === 1 ? e.key.toUpperCase() : e.key);
    }

    shortcutInput.value = keys.join('+');
  });



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
  row.appendChild(shortcutInput);
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
    const shortcut = row.querySelector('.shortcut').value;
    if (gift && effect && effect !== 'none') {
      const effectObj = effectsData.find(e => e.name === effect);
      if (effectObj) {
        map[gift] = {
          ...effectObj,
          shortcut: shortcut
        };
      }
    }

  });
  // get videos 
  const videos = [];
  const videoPaths = path.join(userDataPath, 'main-assets', 'videos');
  if (fs.existsSync(videoPaths)) {
    const videoFiles = fs.readdirSync(videoPaths).filter(f => f.toLowerCase().endsWith('.mp4'));
    videoFiles.forEach(file => {
      videos.push(file);
    });
  }
  map['videos'] = videos;
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
      if (gift !== 'open-video') {
        let row = createEffectRow(gift, effectObj.name, effectObj.shortcut || '');
        const effectsList = document.getElementById('effects-list');
        effectsList.appendChild(row);
      }

    });


    console.log('Effect map loaded from:', effectMapPath);
    let openVideoValue = savedMap["open-video"] || '10';
    document.getElementById('special_show').value = openVideoValue;
  } catch (err) {
    console.error('Failed to load effect map:', err);
  }
};

async function saveEffectMap(choseFile = false) {
  const effectMap = window.getEffectMap();
  effectMap["open-video"] = document.getElementById('special_show').value.trim();
  // loại trừ effectMap["videos"] khỏi việc lưu
  delete effectMap["videos"];
  if (choseFile) {
    const filePath = await ipcRenderer.invoke('dialog:saveFile', 'username');
    if (!filePath) return;
    fs.writeFileSync(filePath, JSON.stringify(effectMap, null, 2), 'utf-8');
    alert("Đã lưu hiệu ứng!");
    return;
  }
  fs.writeFileSync(effectMapPath, JSON.stringify(effectMap, null, 2), 'utf-8');
  alert("Đã lưu hiệu ứng!");
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
      if (gift !== 'open-video') {
        let row = createEffectRow(gift, effectObj.name, effectObj.shortcut || '');
        effectsList.appendChild(row);
      }

    });

    console.log('Effect map loaded from:', filePath);
    let openVideoValue = loadedMap["open-video"] || '10';
    document.getElementById('special_show').value = openVideoValue;
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

document.addEventListener('keydown', (e) => {

  // Kiểm tra nếu sự kiện diễn ra trong input hoặc textarea
  const isInputOrTextarea = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA';
  if (isInputOrTextarea) return;  // Nếu đang focus vào input/textarea, không xử lý phím tắt

  const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
  const ctrl = e.ctrlKey ? 'Ctrl' : '';
  const alt = e.altKey ? 'Alt' : '';
  const shift = e.shiftKey ? 'Shift' : '';
  const meta = e.metaKey ? 'Meta' : '';

  const parts = [ctrl, alt, shift, meta].filter(Boolean);
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
    parts.push(key);
  }

  const shortcut = parts.join('+');
  console.log('Key pressed:', shortcut);

  const rows = document.querySelectorAll('.effect-row');
  rows.forEach(row => {
    const rowShortcut = row.querySelector('.shortcut').value.trim();
    const effectName = row.querySelector('.effect-select').value;

    if (effectName !== 'none' && rowShortcut === shortcut) {
      showEffectByClicking(row);
    }
  });

});



const effectModal = document.getElementById('effectModal');

effectModal.addEventListener('show.bs.modal', () => {
  const container = document.getElementById('effectListContainer');
  container.innerHTML = ''; // clear trước khi render lại

  const rows = document.querySelectorAll('.effect-row');

  rows.forEach(row => {
    const giftName = row.querySelector('.gift-name')?.value.trim();
    const effectName = row.querySelector('.effect-select')?.value;
    const shortcut = row.querySelector('.shortcut')?.value.trim();

    if (effectName && effectName !== 'none') {
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline-dark m-1';
      btn.textContent = `${effectName}${shortcut ? ' (' + shortcut + ')' : ''}`;

      btn.onclick = () => {
        showEffectByClicking(row);
        const modal = bootstrap.Modal.getInstance(effectModal);
        // modal.hide(); // ẩn modal sau khi chọn hiệu ứng (tùy bạn)
      };

      container.appendChild(btn);
    }
  });

  if (container.innerHTML === '') {
    container.innerHTML = '<p class="text-muted">Không có hiệu ứng nào.</p>';
  }
});



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