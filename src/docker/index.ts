import fs from "fs";
import { exec, spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import { v4 as uuidv4 } from "uuid";

import { restartAdbServer } from "../adb";
import {
  MOBILE_NODE_IMAGE_NAME,
  MOBILE_NODE_CONTAINER_NAME,
  logToFile
} from "../services/mobile";

const execPromise = promisify(exec);

interface ExecResult {
  stdout: string;
  stderr: string;
}

// Update the Docker check code:
export const dockerPath = findDockerExecutable();

function findDockerExecutable(): string | null {
    // First check if we have a manually set path
    if (process.env.DOCKER_PATH && fs.existsSync(process.env.DOCKER_PATH)) {
        return process.env.DOCKER_PATH;
    }
    
    const dockerPaths =
        process.platform === "darwin"
            ? [
                '/usr/local/bin/docker',
                '/opt/homebrew/bin/docker',
                '/usr/bin/docker',
                '/Applications/Docker.app/Contents/Resources/bin/docker',
                '~/Library/Group Containers/group.com.docker/docker'
                ]
            : process.platform === "linux"
            ? [
                '/usr/bin/docker',
                '/usr/local/bin/docker',
                '/opt/bin/docker',
                '/snap/bin/docker',
                '/var/lib/snapd/snap/bin/docker',
                '~/.docker/cli-plugins/docker'
            ]
            : [    
                'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe',
                'C:\\Program Files (x86)\\Docker\\Docker\\resources\\bin\\docker.exe',
                '%ProgramFiles%\\Docker\\Docker\\resources\\bin\\docker.exe',
                '%ProgramW6432%\\Docker\\Docker\\resources\\bin\\docker.exe'
                ];

    for (const dockerPath of dockerPaths) {
        if (fs.existsSync(dockerPath)) {
            setDockerPath(dockerPath);
            return dockerPath;
        }
    }
    return null;
}

async function streamMobileDockerImageLogs(): Promise<void> {
  try {
    const logProcess: ChildProcess = spawn(dockerPath || "docker", [
      "logs",
      "-f",
      MOBILE_NODE_CONTAINER_NAME,
    ]);

    let logBuffer: string = "";
    let delayTimeout: NodeJS.Timeout | null = null;
    const MAX_LOG_BUFFER_SIZE: number = 10000;

    const processLogs = (): void => {
      if (logBuffer.trim()) {
        logToFile(logBuffer);
        logBuffer = "";
      }
      delayTimeout = null;
    };

    logProcess.stdout?.on("data", (data: Buffer) => {
      logBuffer += data.toString();
      if (logBuffer.length > MAX_LOG_BUFFER_SIZE) {
        processLogs();
      } else if (!delayTimeout) {
        delayTimeout = setTimeout(processLogs, 100);
      }
    });

    logProcess.stderr?.on("data", (data: Buffer) => {
      logBuffer += data.toString();
      if (logBuffer.length > MAX_LOG_BUFFER_SIZE) {
        processLogs();
      } else if (!delayTimeout) {
        delayTimeout = setTimeout(processLogs, 100);
      }
    });

    logProcess.on("error", (error: Error) => {
      logToFile(`Error in Docker logs process: ${error.message}`);
    });

    logProcess.on("close", (code: number) => {
      if (delayTimeout) {
        clearTimeout(delayTimeout);
      }
      processLogs();
      logToFile(`Docker logs process ended with code ${code}`);
    });
  } catch (error) {
    logToFile(`Error streaming Docker logs: ${(error as Error).message}`);
  }
}

export async function runMobileDockerContainer(apiKey: string): Promise<boolean> {
  logToFile("Attempting to run maaas node image");
  restartAdbServer();

  const nodeUUID: string = uuidv4();

  const command = `${dockerPath || "docker"} run -d --rm \
    --name ${MOBILE_NODE_CONTAINER_NAME} \
    --env "ANDROID_ADB_SERVER_ADDRESS=host.docker.internal" \
    --add-host=host.docker.internal:host-gateway \
    --privileged \
    -v /dev/bus/usb:/dev/bus/usb \
    -v $HOME/.android:/root/.android \
    -e 'MAAAS_ORCHESTRATOR_WS=wss://maaas-orchestrator-py-3399-6c964513-rs32r5j2.onporter.run/' \
    -e 'MAAAS_NODE_DATABASE_URL=sqlite:///./test.db' \
    -e 'MAAAS_APPIUM_SERVER_URL=http://127.0.0.1' \
    -e 'MAAAS_STREAMING_URL=http://host.docker.internal:9004' \
    -e 'MAAAS_ADB_SERVER_URL=host.docker.internal' \
    -e 'MAAAS_NODE_API_KEY=${apiKey}' \
    -e 'MAAAS_NODE_UUID=desktop-${nodeUUID}' \
    -p 8000:8000 \
    -p 9005-9205:9005-9205 \
    -p 5554-5598:5554-5598 \
    --publish-all \
    ${MOBILE_NODE_IMAGE_NAME}`;

  try {
    const { stdout, stderr }: ExecResult = await execPromise(command);

    if (stderr) {
      logToFile(`Warning: ${stderr}`);
    }

    if (stdout) {
      logToFile(`Container started successfully: ${stdout}`);
      streamMobileDockerImageLogs();
    }

    return true;
  } catch (error) {
    logToFile(`Error: ${(error as Error).message}`);
    return false;
  }
}

export async function pullMobileDockerImage(): Promise<void> {
  logToFile("Pulling maaas node image");

  const command = `${dockerPath || "docker"} pull ${MOBILE_NODE_IMAGE_NAME}`;
  const [cmd, ...args] = command.split(' ');

  return new Promise((resolve, reject) => {
    const process = spawn(cmd, args);

    process.stdout.on('data', (data) => {
      logToFile(data.toString());
    });

    process.stderr.on('data', (data) => {
      logToFile(data.toString());
    });

    process.on('close', (code) => {
      if (code === 0) {
        logToFile("Docker image pulled successfully");
        resolve();
      } else {
        const error = `Docker pull failed with code ${code}`;
        logToFile(error);
        reject(new Error(error));
      }
    });
  });
}

export async function killMobileDockerContainer(): Promise<void> {
  try {
    const { stdout, stderr }: ExecResult = await execPromise(
      `${dockerPath || "docker"} stop ${MOBILE_NODE_CONTAINER_NAME}`
    );
    if (stderr) {
      logToFile(`Warning while stopping container: ${stderr}`);
    }
    if (stdout) {
      logToFile(`Container stopped: ${stdout}`);
    }

    const { stdout: rmStdout, stderr: rmStderr }: ExecResult =
      await execPromise(`${dockerPath || "docker"} rm ${MOBILE_NODE_CONTAINER_NAME}`);
    if (rmStderr) {
      logToFile(`Warning while removing container: ${rmStderr}`);
    }
    if (rmStdout) {
      logToFile(`Container removed: ${rmStdout}`);
    }
  } catch (error) {
    if (!(error as Error).message.includes("No such container")) {
      logToFile(`Error: ${(error as Error).message}`);
    }
  }
}

export async function checkDocker(): Promise<boolean> {
    // First check if Docker exists
    if (!dockerPath) {
        return false;
    }

    // Then check if Docker daemon is running
    return new Promise((resolve) => {
        exec(`"${dockerPath}" info`, (error) => {
            resolve(!error);
        });
    });
}

export async function getDockerContainersCountByImageName(imageName: string): Promise<number> {
  const { stdout, stderr }: ExecResult = await execPromise(
    `${dockerPath || "docker"} ps -a --format "{{.Image}}" | grep "${imageName}" | wc -l`
  );
  return parseInt(stdout.trim());
}

export async function setDockerPath(path: string): Promise<boolean> {
    if (!fs.existsSync(path)) {
        logToFile(`Docker executable not found at path: ${path}`);
        return false;
    }

    try {
        // Test if the provided path is valid by running docker --version
        const { stderr }: ExecResult = await execPromise(`"${path}" --version`);
        if (stderr) {
            logToFile(`Warning testing Docker path: ${stderr}`);
        }
        
        // If we get here, the path is valid
        process.env.DOCKER_PATH = path;
        logToFile(`Docker path set successfully to: ${path}`);
        return true;
    } catch (error) {
        logToFile(`Invalid Docker path: ${(error as Error).message}`);
        return false;
    }
}