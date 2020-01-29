import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
const log = require('electron-log');

const isProd = process.env.NODE_ENV !== 'development';

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (isProd) {
    global.__static = require('path')
        .join(__dirname, '/static')
        .replace(/\\/g, '\\\\');
}

let mainWindow;
const winURL =
    process.env.NODE_ENV === 'development'
        ? `http://localhost:9080`
        : `file://${__dirname}/index.html`;

function createWindow() {
    /**
     * Initial window options
     */
    mainWindow = new BrowserWindow({
        height: 450,
        maxWidth: 620,
        minWidth: 620,
        width: 620,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            webviewTag: true,
            devTools: isProd ? false : true,
        },
        transparent: true,
        frame: false,
        alwaysOnTop: isProd ? true : false,
        hasShadow: false,
    });

    mainWindow.webContents.session.webRequest.onHeadersReceived(
        (details, callback) => {
            callback({
                responseHeaders: Object.fromEntries(
                    Object.entries(details.responseHeaders).filter(
                        header => !/x-frame-options/i.test(header[0])
                    )
                ),
            });
        }
    );

    mainWindow.loadURL(winURL);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    createWindow();
    log.transports.file.level = 'debug';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();

});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

autoUpdater.on('download-progress', (event) => {
    mainWindow.webContents.send('download_progress', event);
})

autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
});

autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('checking_update');
});

autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
});

ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
});
