import dotenv from 'dotenv';
dotenv.config();

import moment from 'moment-timezone';
import { connectFTP, client } from '../libs/ftp';
import fs from 'fs';
import path from 'path';

const TIMEZONE: string = process.env.TIMEZONE || 'Asia/Jakarta';
const FTP_INDEX_FOLDER: string = process.env.FTP_INDEX_FOLDER || 'TDI';
const downloadFolder: string = path.join(__dirname, '../../images');
const allFilesFolder: string = path.join(downloadFolder, 'all');

// Convert function to TypeScript with type annotations
async function downloadFtpFiles(folderPath: string = FTP_INDEX_FOLDER): Promise<void> {
    try {
        await connectFTP();
        await client.cd(folderPath);
        const list = await client.list();

        if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder, { recursive: true });
        if (!fs.existsSync(allFilesFolder)) fs.mkdirSync(allFilesFolder, { recursive: true });

        for (const file of list) {
            if (file.isFile && isImageFile(file.name)) {
                const { folder, file: fileName } = getFileName(file.name);
                const dateFolder = path.join(downloadFolder, folder);
                const localFilePath = path.join(dateFolder, fileName);
                const localAllFilePath = path.join(allFilesFolder, fileName);

                // Download all files to the "all" folder
                if (!fs.existsSync(localAllFilePath)) {
                    await client.downloadTo(localAllFilePath, file.name);
                    console.log(`Downloaded: ${file.name}`);
                } else {
                    console.log(`File exists: ${file.name}`);
                }

                // Download files to date folder
                if (!fs.existsSync(localFilePath)) {
                    if (!fs.existsSync(dateFolder)) fs.mkdirSync(dateFolder, { recursive: true });
                    await client.downloadTo(localFilePath, file.name);
                    console.log(`Downloaded: ${file.name}`);
                } else {
                    console.log(`File exists: ${file.name}`);
                }
            } else if (file.isDirectory) {
                const newRemotePath = path.posix.join(folderPath, file.name);
                await downloadFtpFiles(newRemotePath);
            }
        }
    } catch (err) {
        console.error("FTP Error:", err);
    } finally {
        client.close();
    }
}

function isImageFile(fileName: string): boolean {
    return ['.jpg', '.jpeg', '.png'].includes(path.extname(fileName).toLowerCase());
}

function getFileName(input: string): { folder: string; file: string } {
    const fileBase = input.replace('.jpg', '');
    const datePartMatch = fileBase.match(/\d{8}/);
    const timestampPartMatch = fileBase.match(/\d{9}(?=_TIMING)/);

    if (!datePartMatch || !timestampPartMatch) {
        throw new Error(`Invalid file name format: ${input}`);
    }

    const datePart = datePartMatch[0];
    const timestampPart = timestampPartMatch[0];
    const folder = `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`;
    const hours = timestampPart.slice(0, 2);
    const minutes = timestampPart.slice(2, 4);
    const seconds = timestampPart.slice(4, 6);

    const unixTimestamp = moment.tz(`${datePart} ${hours}:${minutes}:${seconds}`, 'YYYYMMDD HH:mm:ss', TIMEZONE).unix();
    const file = `${unixTimestamp}_${folder} ${hours}:${minutes}.jpg`;

    return { folder, file };
}

// Execute the function
downloadFtpFiles();
