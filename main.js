const electron = require('electron');
const {app, BrowserWindow} = electron;

function createWindow () {

  win = new BrowserWindow({ width: 697, height: 535 });
  win.loadFile('index.html');
  if (process.platform !== 'darwin') {
    win.setFullScreen(true);
  }
  //win.webContents.openDevTools();
}

app.on('ready', createWindow)
