import { Socket } from 'socket.io-client';
import { BrowserWindow, Tray } from 'electron';

export interface ServiceConfig {
  pid?: number;
  isRunning: boolean;
}

export interface ServicesConfig {
  publicKey: string;
  privateKey: string;
}

export interface StoreData {
  clientInfo: any;
}

export interface GlobalState {
  mainWindow: BrowserWindow | null;
  socket: Socket | null;
  tray: Tray | null;
}

declare global {
  namespace Electron {
    interface App {
      isQuitting?: boolean;
    }
  }
}