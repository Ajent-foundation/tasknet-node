import axios from "axios";
import path from "path";
import fs from "fs";
import { app } from "electron";

export const MOBILE_NODE_IMAGE_NAME = "rizq97/maaas-node-py:latest";
export const MOBILE_NODE_CONTAINER_NAME = "maaas-node-py-container";

export {
  runMobileDockerContainer,
  pullMobileDockerImage,
  killMobileDockerContainer,
  isDockerInstalled,
} from "../../docker";

export { killAdbServer, startAdbServer, restartAdbServer } from "../../adb";

const LOG_DIR = app.isPackaged
  ? path.join(app.getPath("userData"), "logs")
  : __dirname;
const MOBILE_LOG_FILE = path.join(LOG_DIR, "mobile-node.log");

export function logToFile(message: string): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
  fs.appendFileSync(MOBILE_LOG_FILE, `${message}\n`);
}

interface DeviceResponse {
  data?: {
    devices: string[];
  };
}

interface DevicesResult {
  devices?: string[];
  error?: string;
}

export async function getMobileNodeConnectedDevices(): Promise<DevicesResult> {
  console.log("Requesting devices...");
  try {
    const response = await axios.get<DeviceResponse>(
      "http://127.0.0.1:8000/devices"
    );
    console.log("Devices response:", response.data);
    return { devices: response.data?.data?.devices ?? [] };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error fetching devices:", errorMessage);
    return { error: errorMessage };
  }
}
