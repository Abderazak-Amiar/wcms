import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  send: (channel: string, data?: unknown) => ipcRenderer.send(channel, data),
  on: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
  off: (channel: string, callback: (...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, callback);
  },

  // ✅ Structured cloning for invoice IDs
  printInvoices: (invoiceIds: string[]) => {
    if (
      !Array.isArray(invoiceIds) ||
      invoiceIds.some((id) => typeof id !== 'string')
    ) {
      console.error('Invalid invoiceIds:', invoiceIds);
      return;
    }
    ipcRenderer.send('print-invoices', invoiceIds);
  },

  // ✅ Properly handle Blob to Buffer conversion
  savePDFs: async (zipBlob: Blob, fileName: string) => {
    const arrayBuffer = await zipBlob.arrayBuffer(); // Convert Blob to ArrayBuffer
    return ipcRenderer.invoke('save-pdfs', Buffer.from(arrayBuffer), fileName); // Pass filename
  },
});
