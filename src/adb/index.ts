import { exec } from "child_process";
import path from "path";
import fs from "fs";
import { app, BrowserWindow } from "electron";

import { logToFile } from "../services/mobile";

type CallbackFunction = (error: Error | null, stdout?: string) => void;

function getAdbPath(): string | null {
  try {
    const isPackaged = app.isPackaged;
    const adbBasePath = isPackaged
      ? path.join(process.resourcesPath, "adb")
      : path.join(__dirname, "../../adb");

    return process.platform === "win32"
      ? path.join(
          adbBasePath,
          `platform-tools-latest-${process.platform}/platform-tools/adb.exe`
        )
      : path.join(
          adbBasePath,
          `platform-tools-latest-${process.platform}/platform-tools/adb`
        );
  } catch (error) {
    const errorMessage = `Error determining ADB path: ${
      (error as Error).message
    }`;
    console.error(errorMessage);
    logToFile(errorMessage);
    return null;
  }
}

export function killAdbServer(callback?: CallbackFunction): void {
  const adbPath = getAdbPath();

  if (!adbPath || !fs.existsSync(adbPath)) {
    const errorMessage = `ADB path does not exist: ${adbPath}`;
    console.error(errorMessage);
    logToFile(errorMessage);
    if (callback) callback(new Error(errorMessage));
    return;
  }

  const adbKillCommand = `"${adbPath}" kill-server`;

  exec(adbKillCommand, (error, stdout, stderr) => {
    if (error) {
      const errorMessage = `Error killing ADB server: ${error.message}`;
      console.error(errorMessage);
      logToFile(errorMessage);
      if (callback) callback(new Error(errorMessage));
      return;
    }
    if (stderr) {
      const stderrMessage = `Stderr from killing ADB server: ${stderr}`;
      console.error(stderrMessage);
      logToFile(stderrMessage);
      if (callback) callback(new Error(stderrMessage));
      return;
    }
    console.log(`Stdout from killing ADB server: ${stdout}`);
    logToFile(`ADB server killed successfully`);
    if (callback) callback(null, stdout);
  });
}

export function startAdbServer(callback?: CallbackFunction): void {
  const adbPath = getAdbPath();

  if (!adbPath || !fs.existsSync(adbPath)) {
    const errorMessage = `ADB path does not exist: ${adbPath}`;
    console.error(errorMessage);
    logToFile(errorMessage);
    if (callback) callback(new Error(errorMessage));
    return;
  }

  const adbStartCommand =
    process.platform === "win32"
      ? `start /B "${adbPath}" -a nodaemon server start > NUL 2>&1`
      : `"${adbPath}" -a nodaemon server start &> /dev/null &`;

  exec(adbStartCommand, (error, stdout, stderr) => {
    if (error) {
      const errorMessage = `Error starting ADB server: ${error.message}`;
      console.error(errorMessage);
      logToFile(errorMessage);
      if (callback) callback(new Error(errorMessage));
      return;
    }
    if (stderr) {
      const stderrMessage = `Stderr from starting ADB server: ${stderr}`;
      console.error(stderrMessage);
      logToFile(stderrMessage);
      if (callback) callback(new Error(stderrMessage));
      return;
    }
    console.log(`Stdout from starting ADB server: ${stdout}`);
    logToFile(`ADB server started successfully`);
    if (callback) callback(null, stdout);
  });
}

export function restartAdbServer(): void {
  killAdbServer((killError) => {
    if (killError) {
      console.error("Failed to kill ADB server.");
    }

    startAdbServer((startError) => {
      if (startError) {
        console.error("Failed to start ADB server after killing it.");
      }
    });
  });
}
