const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromise = require('fs').promises;
const { checkLicense } = require('./license');
const LICENSE_FILE = path.join(app.getPath('userData'), 'license.json');
const dotenv = require('dotenv');
const express = require('express');


// __dirname sẽ là đường dẫn tới thư mục trong asar
const envPath = path.join(__dirname, '.env');

// Load thủ công từ đường dẫn cụ thể
dotenv.config({ path: envPath });

let mainWindow;


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 1000,
    webPreferences: {
      nodeIntegration: true, // Cho phép sử dụng require trong renderer process
      contextIsolation: false, // Cho phép sử dụng require trong renderer process
      enableRemoteModule: true, // Cho phép sử dụng remote trong renderer process
      devTools: false,
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

ipcMain.handle('dialog:saveFile', async (event, defaultName) => {
  const result = await dialog.showSaveDialog({
    title: 'Save File',
    defaultPath: path.join(app.getPath('documents'), defaultName || 'test.xlsx'),
    filters: [
      { name: 'Excel Files', extensions: ['xlsx'] },
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
    expressApp.use(express.static(assetPath));

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



