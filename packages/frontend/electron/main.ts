import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

let win: BrowserWindow | null;
const pendingInvoices = new Set<string>();

function createWindow() {
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

// ✅ Print invoices (Refactored)
ipcMain.on('print-invoices', async (_event, invoiceIds: string[]) => {
  if (!win) return;

  // Validate invoice IDs
  if (
    !Array.isArray(invoiceIds) ||
    invoiceIds.some((id) => typeof id !== 'string')
  ) {
    console.error('Invalid invoice IDs received:', invoiceIds);
    return;
  }

  for (const invoiceId of invoiceIds) {
    pendingInvoices.add(invoiceId);
    win.webContents.send('load-invoice', invoiceId);
  }
});

// ✅ Renderer confirms when an invoice is ready
ipcMain.on('invoice-ready', (_event, invoiceId) => {
  if (!win || !pendingInvoices.has(invoiceId)) return;

  console.log(`Printing invoice: ${invoiceId}`);
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
        console.log(`Printed invoice ${invoiceId} successfully.`);
      } else {
        console.error(`Failed to print invoice ${invoiceId}.`);
      }
      pendingInvoices.delete(invoiceId);
    },
  );
});

// ✅ Save PDF invoices (Fixed Buffer issue)
ipcMain.handle('save-pdfs', async (_event, zipBuffer: Buffer) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Save Invoices',
    defaultPath: path.join(app.getPath('documents'), 'invoices.zip'),
    filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
  });

  if (filePath) {
    fs.writeFileSync(filePath, zipBuffer); // ✅ Write Buffer correctly
    return true;
  }

  return false;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
