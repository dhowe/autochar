const {app, BrowserWindow} = require('electron');

function createWindow () {

  // add w:17 w:45 for electron chrome
  win = new BrowserWindow({ width: 697, height: 535 });
  //win.setFullScreen(process.platform !== 'darwin');
  win.webContents.openDevTools();
  win.loadFile('index.html');
}


app.on('ready', createWindow);
