const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromise = require('fs').promises;
let mainWindow;


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 1000,
    webPreferences: {
      nodeIntegration: true, // Cho phép sử dụng require trong renderer process
      contextIsolation: false, // Cho phép sử dụng require trong renderer process
      enableRemoteModule: true, // Cho phép sử dụng remote trong renderer process

    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
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