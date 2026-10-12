const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { fork } = require("child_process");

let mainWindow;
let backendProcess;

// 🔒 Prevent multiple instances
if (app && typeof app.requestSingleInstanceLock === "function") {
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on("second-instance", () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
  }
}

// 🚀 START BACKEND (USING FORK)
function startBackend() {
  return new Promise((resolve, reject) => {

    const serverPath = app.isPackaged
      ? path.join(process.resourcesPath, "server", "server.js")
      : path.join(__dirname, "../server/server.js");

    console.log("🚀 Starting backend...");
    console.log("📄 Server path:", serverPath);

    backendProcess = fork(serverPath, [], {
      cwd: path.dirname(serverPath),
      env: { ...process.env },
      silent: true // capture logs
    });

    let isReady = false;

    // ✅ Listen for READY signal from server.js
    backendProcess.on("message", (msg) => {
      console.log("📨 Message from backend:", msg);

      if (msg === "READY" && !isReady) {
        console.log("✅ Backend ready");
        isReady = true;
        resolve();
      }
    });

    // 🧾 Logs
    backendProcess.stdout.on("data", (data) => {
      console.log("SERVER:", data.toString());
    });

    backendProcess.stderr.on("data", (data) => {
      console.log("❌ ERROR:", data.toString());
    });

    // ❌ Errors
    backendProcess.on("error", (err) => {
      console.log("❌ Fork error:", err);
      reject(err);
    });

    backendProcess.on("exit", (code) => {
      console.log("⚠️ Backend exited with code:", code);
    });

    // ⏳ Safety fallback (not primary)
    setTimeout(() => {
      if (!isReady) {
        console.log("⚠️ Backend did not send READY, continuing...");
        resolve();
      }
    }, 5000);
  });
}

// 🖥️ Create Window
function createWindow() {

  if (mainWindow) return;

  const preloadPath = path.join(__dirname, "preload.js");

  mainWindow = new BrowserWindow({
    title: "VyaparFlow POS & ERP - Universal Indian Retail ERP",
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 🖨️ Handle Silent Thermal Printing
  ipcMain.handle("silent-print", async (event, options) => {
    if (!mainWindow) return { success: false, message: "No active window" };

    return new Promise((resolve) => {
      mainWindow.webContents.print({
        silent: true,
        printBackground: true,
        ...options
      }, (success, failureReason) => {
        resolve({ success, failureReason });
      });
    });
  });

  const indexPath = app.isPackaged
    ? path.join(process.resourcesPath, "client", "build", "index.html")
    : path.join(__dirname, "../client/build/index.html");

  console.log("📂 Loading frontend:", indexPath);

  mainWindow.loadFile(indexPath);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// 🚀 App Ready
app.whenReady().then(async () => {
  try {
    await startBackend();   // ✅ wait properly
  } catch (err) {
    console.log("❌ Backend failed:", err);
  }

  createWindow(); // ✅ no timeout hack
});

// ❌ Proper Quit
app.on("window-all-closed", () => {

  if (backendProcess) {
    backendProcess.kill();
  }

  app.quit();
});