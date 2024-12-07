const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const expressApp = require("./dist/index"); // Compiled Express app
const server = expressApp.listen(3456, () => {
  console.log("Express API is running on http://localhost:3456. Call Nandan for any issue");
});

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "dist/public", "icon.ico"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  win.loadURL("http://localhost:3456");
}

app.whenReady().then(() => {
  createMainWindow();
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: 'nbarman7601',
    repo: 'sajhghor'
  });
  
  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on("update-available", () => {
    dialog.showMessageBox({
      type: "info",
      title: "Update Available",
      message: "A new version is available. Downloading now...",
    });
  });

  autoUpdater.on("update-not-available", () => {
    // dialog.showMessageBox({
    //   type: "info",
    //   title: "No Updates",
    //   message: "You are using the latest version of the application.",
    // });
  });

  autoUpdater.on("update-downloaded", () => {
    dialog
      .showMessageBox({
        type: "info",
        title: "Dreamlight-Update Ready",
        message: "A new version has been downloaded. Restart the application to apply the update.",
        buttons: ["Update Now", "Later"],
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.on("error", (error) => {
    dialog.showMessageBox({
      type: "error",
      title: "Update Error",
      message: `Error during update: ${error.message || error}`,
    });
    console.error("Error during update:", error);
  });
});

app.on("window-all-closed", () => {
  server.close(() => {
    console.log("Express server closed");
  });
  if (process.platform !== "darwin") {
    app.quit();
  }
});
