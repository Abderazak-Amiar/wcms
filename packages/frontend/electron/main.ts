import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import fs from 'fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '..');
// In your main process (e.g., main.ts)
import { dialog } from 'electron';
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
      preload: path.join(__dirname, 'preload.mjs'),
      devTools: false,
      nodeIntegration: true, // Ensure node integration for IPC
      contextIsolation: false,
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

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Handle silent printing
ipcMain.on('print-invoices', async (event, invoiceIds: string[]) => {
  if (!win) return;

  for (const invoiceId of invoiceIds) {
    win.webContents.send('load-invoice', invoiceId); // Ask renderer to load invoice

    // Wait for the invoice to load (adjust delay if needed)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    win.webContents.print(
      {
        silent: true, // No confirmation dialog
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
    const pdfData = await win.webContents.printToPDF({
      margins: { marginType: 'default' },
      printBackground: true,
      landscape: false,
      pageSize: 'A4',
    });

    fs.writeFileSync(pdfPath, pdfData);
    console.log(`Saved: ${pdfPath}`);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

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

  // Check if filePath is defined
  if (filePath) {
    fs.writeFileSync(filePath, Buffer.from(zipBlob));
    return true; // Indicate success
  }

  return false; // Indicate cancellation or failure
});
