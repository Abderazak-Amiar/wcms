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

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC as string, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist-electron', 'preload.mjs'), // ✅ Ensures absolute path
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

// Handle silent printing
ipcMain.on('print-invoices', async (event, invoiceIds: string[]) => {
  if (!win) return;

  for (const invoiceId of invoiceIds) {
    win.webContents.send('load-invoice', invoiceId);

    await new Promise((resolve) => setTimeout(resolve, 2000));

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
        if (!success) {
          console.error(`Failed to print invoice ${invoiceId}`);
        }
      },
    );
  }
});

// Handle PDF saving
ipcMain.on('export-invoices-pdf', async (event, invoiceIds: string[]) => {
  if (!win) return;

  for (const invoiceId of invoiceIds) {
    win.webContents.send('load-invoice', invoiceId);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const pdfPath = path.join(
      app.getPath('documents'),
      `invoice_${invoiceId}.pdf`,
    );

    try {
      const pdfData = await win.webContents.printToPDF({
        margins: { marginType: 'default' },
        printBackground: true,
        landscape: false,
        pageSize: 'A4',
      });

      fs.writeFileSync(pdfPath, pdfData);
      console.log(`Saved: ${pdfPath}`);
    } catch (error) {
      console.error(`Failed to save PDF for invoice ${invoiceId}:`, error);
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
console.log('Preload script path:', path.join(app.getAppPath(), 'dist-electron', 'preload.mjs'));

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

ipcMain.handle('save-pdfs', async (event, zipBlob) => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Save Invoices',
    defaultPath: path.join(__dirname, 'invoices.zip'),
    filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
  });

  if (filePath) {
    fs.writeFileSync(filePath, Buffer.from(zipBlob));
    return true;
  }

  return false;
});
