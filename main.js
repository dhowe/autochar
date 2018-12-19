const {app, BrowserWindow} = require('electron');

function createWindow () {

  // add w:17 w:45 for electron chrome
  win = new BrowserWindow({ width: 697, height: 535 });
  win.loadFile('index.html');
  if (process.platform !== 'darwin') {
    win.setFullScreen(true);
  }
  //win.webContents.openDevTools();
}

app.on('ready', createWindow);
