const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromise = require('fs').promises;
const { checkLicense } = require('./license');
const LICENSE_FILE = path.join(app.getPath('userData'), 'license.json');
const dotenv = require('dotenv');
const express = require('express');
const { TikTokLiveConnection, WebcastPushConnection } = require('tiktok-live-connector');

// __dirname sẽ là đường dẫn tới thư mục trong asar
const envPath = path.join(__dirname, '.env');

// Load thủ công từ đường dẫn cụ thể
dotenv.config({ path: envPath });

let mainWindow;
let tiktokLive = null;



function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 1000,
    webPreferences: {
      nodeIntegration: true, // Cho phép sử dụng require trong renderer process
      contextIsolation: false, // Cho phép sử dụng require trong renderer process
      enableRemoteModule: true, // Cho phép sử dụng remote trong renderer process
      devTools: true,
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  startStaticServerIfNeeded();
  createWindow();
});



app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});




app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});


ipcMain.handle('start-live', async (event, username) => {
  try {
    tiktokLive = new WebcastPushConnection(username);
    await tiktokLive.connect();

    tiktokLive.on('gift', data => {
      // console.log('Received gift:', data);
      if (data.giftType === 1 && !data.repeatEnd) return;

      const giftData = {
        username: data.nickname || data.uniqueId,
        avatar: data.profilePictureUrl,
        name: data.giftName,
        count: data.repeatCount * data.diamondCount,
        gift_count: data.repeatCount
      };

      mainWindow.webContents.send('gift', giftData);

    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('stop-live', async () => {
  try {
    if (tiktokLive) {
      await tiktokLive.disconnect();
      tiktokLive = null;
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});


// open file dialog json
ipcMain.handle('dialog:openFile', async (event) => {
  const result = await dialog.showOpenDialog({
    title: 'Open JSON File',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
    ],
    properties: ['openFile']
  });

  if (result.canceled) {
    return null; // Người dùng hủy chọn
  }
  return result.filePaths[0]; // Trả về đường dẫn file đã chọn
});

ipcMain.handle('dialog:saveFile', async (event, defaultName) => {
  const result = await dialog.showSaveDialog({
    title: 'Save File',
    defaultPath: path.join(app.getPath('documents'), defaultName || 'my-username.json'),
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
    ],
  });

  return result.filePath; // Return the selected file path or undefined if canceled
});

ipcMain.on('select-dirs', async (event, arg) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  console.log('directories selected', result.filePaths)
})


// Lắng nghe sự kiện chọn folder từ Renderer
ipcMain.handle('select-folder', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (!result.canceled) {
    return result.filePaths[0]; // Trả về đường dẫn folder đã chọn
  } else {
    return null; // Người dùng hủy chọn folder
  }
});


ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
  // return path.join("")
});


function startStaticServerIfNeeded() {
  const expressApp = express();
  const assetPath = path.join(app.getPath('userData'), 'main-assets');

  if (fs.existsSync(assetPath)) {
    expressApp.use(express.static(assetPath, {
      setHeaders: (res, filePath) => {
        // Một số trình duyệt cần header này để cho phép seek
        res.setHeader('Accept-Ranges', 'bytes');
      }
    }));


    expressApp.listen(4001, () => {
      console.log(`Localhost static server started at http://localhost:4001/`);
    });
  } else {
    console.log('main-assets folder not found, skipping server start.');
  }
}



ipcMain.on('save-license', (event, license) => {
  const data = { license };
  fs.writeFileSync(LICENSE_FILE, JSON.stringify(data));
});





let licenseCache = null;

ipcMain.handle('get-license-info', async () => {
  // Nếu cache chưa có, kiểm tra lại
  if (!licenseCache) {
    const { valid, licenseType, expiredDate } = await checkLicense();

    global.licenseType = licenseType;
    global.valid = valid;
    global.expiredDate = expiredDate;

    licenseCache = {
      licenseType,
      expiredDate
    };

    console.log('[Checked] License:', licenseType, expiredDate);
  }

  return {
    licenseType: global.licenseType || 'free',
    expiredDate: global.expiredDate || null
  };
});



