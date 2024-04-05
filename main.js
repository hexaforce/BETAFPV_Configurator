const { app, webContents, BrowserWindow, Menu } = require('electron')

var mainWindow = null

app.allowRendererProcessReuse = false

const { initialize, enable } = require('@electron/remote/main')
initialize()
app.whenReady().then(() => {
  for (const wc of webContents.getAllWebContents()) {
    enable(wc)
  }
})

const reloader = require('electron-reloader')
if (process.env.Reloader === 'true') {
  reloader(module, {
    watchRenderer : true,
    ignore        : ['**/*.json', '**/*.bin'],
  })
}

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    minWidth       : 1024,
    minHeight      : 550,
    width          : 1500,
    height         : 1000,
    webPreferences : {
      nodeIntegration    : true,
      contextIsolation   : false,
      enableRemoteModule : true,
    },
  })

  if (process.env.DevTools === 'true') {
    mainWindow.webContents.openDevTools({
      mode : 'bottom',
    })
  }

  const html = process.env.LiteRadio === 'true' ? 'indexLiteRadio.html' : 'index.html'
  mainWindow.loadURL(`file://${__dirname}/${html}`)

  //disable app menu, IF YOU NEED MENU TO DEBUG,UNCOMMENT FOLLOW LINE
  Menu.setApplicationMenu(null)

  mainWindow.on('closed', () => {
    mainWindow = null
    app.quit()
  })
})
