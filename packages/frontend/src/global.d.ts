// src/global.d.ts
interface Window {
  electron: {
    send: (channel: string, data: any) => void;
    on: (channel: string, func: (...args: any[]) => void) => void;
  };
}
