const electron = require('electron');
const {app, BrowserWindow} = electron;

function createWindow () {

  win = new BrowserWindow({ width: 800, height: 600 })
  win.loadFile('index.html')
  win.webContents.openDevTools();
}

app.on('ready', createWindow)
