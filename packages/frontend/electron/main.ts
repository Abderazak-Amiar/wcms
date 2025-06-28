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
const pendingInvoices = new Set<string>();

function createWindow(): void {
  win = new BrowserWindow({
    show: false, // Hide initially to avoid flicker during resize
    minimizable: true,
    icon: path.join(
      process.env.VITE_PUBLIC as string,
      'icons',
      'water-consumption.png',
    ),
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist-electron', 'preload.mjs'),
      devTools: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.once('ready-to-show', () => {
    win?.maximize(); // ✅ Fill screen but keep taskbar visible
    win?.show();
  });

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  win.on('closed', () => {
    win = null;
  });
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

ipcMain.handle(
  'save-pdfs',
  async (_event, zipBuffer: Buffer, fileName: string) => {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Save Invoices',
      defaultPath: path.join(
        app.getPath('documents'),
        fileName || 'invoices.zip',
      ),
      filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
    });

    if (filePath) {
      fs.writeFileSync(filePath, zipBuffer);
      return true;
    }
    return false;
  },
);

/** ✅ Lifecycle Hooks */

// Stop API when app is closed
app.on('window-all-closed', () => {
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
  createWindow();
});
