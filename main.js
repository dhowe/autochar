const {app, BrowserWindow} = require('electron');

function createWindow () {

  // add w:17 w:45 for electron chrome
  //win = new BrowserWindow({ width: 697, height: 535 });
  win = new BrowserWindow({ width: 1024, height: 768 });
  win.setFullScreen(process.platform !== 'darwin');
  //win.webContents.openDevTools();
  win.loadFile('sizing.html');
}


app.on('ready', createWindow);
