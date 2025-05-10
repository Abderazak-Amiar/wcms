export {};

declare global {
  interface Window {
    electron: {
      savePDFs: (zipBlob: Blob) => void;
    };
  }
}
