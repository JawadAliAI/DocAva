import { exec } from "child_process";
import { promises as fs } from "fs";
import path from "path";

const execCommand = ({ command }) => {
  return new Promise((resolve, reject) => {
    // Add local bin to PATH for Linux/Render
    const env = { ...process.env };
    if (process.platform !== 'win32') {
      const localBin = path.resolve(process.cwd(), "bin");
      env.PATH = `${localBin}:${env.PATH}`;
    }

    exec(command, { env }, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

const readJsonTranscript = async ({ fileName }) => {
  const data = await fs.readFile(fileName, "utf8");
  return JSON.parse(data);
};

const audioFileToBase64 = async ({ fileName }) => {
  const data = await fs.readFile(fileName);
  return data.toString("base64");
};

export { execCommand, readJsonTranscript, audioFileToBase64 };
