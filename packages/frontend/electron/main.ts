import { ChildProcess, spawn } from 'child_process';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null;
let apiProcess: ChildProcess | null = null;
const pendingInvoices = new Set<string>();

// function startAPI(): void {
//   const appRoot = process.env.APP_ROOT ?? __dirname; // Ensure APP_ROOT is always defined
//   const apiPath = path.join(appRoot, 'packages/api/index.js');

//   console.log('Starting API from path:', apiPath);

//   apiProcess = spawn('node', [apiPath], {
//     stdio: ['pipe', 'pipe', 'pipe'], // capture stdout, stderr, stdin
//     shell: true,
//   });

//   // Ensure apiProcess is not null before trying to access stdout
//   if (apiProcess) {
//     // Handle stdout from the API process
//     apiProcess.stdout?.on('data', (data) => {
//       console.log('API stdout:', data.toString());
//     });

//     // Handle stderr from the API process
//     apiProcess.stderr?.on('data', (data) => {
//       console.error('API stderr:', data.toString());
//     });
//   }

//   apiProcess.on('error', (err) => {
//     console.error('❌ API startup error:', err);
//   });

//   apiProcess.on('exit', (code) => {
//     console.log(`ℹ️ API process exited with code ${code}`);
//     apiProcess = null;
//   });
// }
function startAPI(): void {
  // Set the appRoot to point to the current directory (frontend)
  const appRoot = process.env.APP_ROOT ?? path.join(__dirname, '..'); // frontend root directory

  // Correct path to the API index.js file inside 'packages/api'
  const apiPath = path.join(appRoot, '..', 'api', 'index.js'); // going up one level to access packages/api

  console.log('App Root:', appRoot);
  console.log('Starting API from path:', apiPath);

  apiProcess = spawn('node', [apiPath], {
    stdio: ['pipe', 'pipe', 'pipe'], // capture stdout, stderr, stdin
    shell: true,
  });

  if (apiProcess) {
    apiProcess.stdout?.on('data', (data) => {
      console.log('API stdout:', data.toString());
    });

    apiProcess.stderr?.on('data', (data) => {
      console.error('API stderr:', data.toString());
    });
  }

  apiProcess.on('error', (err) => {
    console.error('❌ API startup error:', err);
  });

  apiProcess.on('exit', (code) => {
    console.log(`ℹ️ API process exited with code ${code}`);
    apiProcess = null;
  });
}

/** ✅ Stop API Function */
function stopAPI(): void {
  if (apiProcess) {
    apiProcess.kill();
    apiProcess = null;
  }
}

/** ✅ Create Electron Window */
function createWindow(): void {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC as string, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist-electron', 'preload.mjs'),
      devTools: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
    transparent: true,
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

/** ✅ Print Invoices */
ipcMain.on('print-invoices', async (_event, invoiceIds: string[]) => {
  if (!win) return;

  if (
    !Array.isArray(invoiceIds) ||
    invoiceIds.some((id) => typeof id !== 'string')
  ) {
    console.error('❌ Invalid invoice IDs received:', invoiceIds);
    return;
  }

  for (const invoiceId of invoiceIds) {
    pendingInvoices.add(invoiceId);
    win.webContents.send('load-invoice', invoiceId);
  }
});

/** ✅ Renderer confirms invoice is ready */
ipcMain.on('invoice-ready', (_event, invoiceId) => {
  if (!win || !pendingInvoices.has(invoiceId)) return;

  console.log(`🖨️ Printing invoice: ${invoiceId}`);
  win.webContents.print(
    {
      silent: true,
      printBackground: true,
      color: false,
      copies: 1,
      landscape: false,
      margins: { marginType: 'default' },
    },
    (success) => {
      if (success) {
        console.log(`✅ Printed invoice ${invoiceId} successfully.`);
      } else {
        console.error(`❌ Failed to print invoice ${invoiceId}.`);
      }
      pendingInvoices.delete(invoiceId);
    },
  );
});

/** ✅ Save PDF invoices */
ipcMain.handle('save-pdfs', async (_event, zipBuffer: Buffer) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Save Invoices',
    defaultPath: path.join(app.getPath('documents'), 'invoices.zip'),
    filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
  });

  if (filePath) {
    fs.writeFileSync(filePath, zipBuffer);
    return true;
  }
  return false;
});

/** ✅ Lifecycle Hooks */

// Stop API when app is closed
app.on('window-all-closed', () => {
  stopAPI();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Recreate window on MacOS when clicking app icon
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// ✅ Start API when Electron starts
app.whenReady().then(() => {
  startAPI();
  createWindow();
});
