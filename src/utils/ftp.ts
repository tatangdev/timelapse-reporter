import moment from 'moment-timezone';
import path from 'path';
import { connectFTP, client } from '../libs/ftp';

const TIMEZONE: string = process.env.TIMEZONE || 'Asia/Jakarta';
const FTP_INDEX_FOLDER: string = process.env.FTP_INDEX_FOLDER || 'TDI';

interface FileDetails {
    date: string;
    fileName: string;
    unixTimestamp: number;
}

async function getFtpFiles(folderPath: string = FTP_INDEX_FOLDER): Promise<FileDetails[]> {
    let files: FileDetails[] = [];
    try {
        await connectFTP();
        await client.cd(folderPath);
        const list = await client.list();

        for (const file of list) {
            if (file.isFile && isImageFile(file.name)) {
                const { date, fileName, unixTimestamp } = getFileName(file.name);
                files.push({ date, fileName, unixTimestamp });
            } else if (file.isDirectory) {
                const newRemotePath = path.posix.join(folderPath, file.name);
                const subFiles = await getFtpFiles(newRemotePath);
                files = files.concat(subFiles);
            }
        }
    } catch (err) {
        console.error("FTP Error:", err);
    } finally {
        await client.close();
    }

    return files;
}

interface FileNameDetails {
    date: string;
    fileName: string;
    unixTimestamp: number;
}

function getFileName(input: string): FileNameDetails {
    const fileBase = input.replace('.jpg', '');
    const datePart = fileBase.match(/\d{8}/)?.[0] || '';
    const timestampPart = fileBase.match(/\d{9}(?=_TIMING)/)?.[0] || '';
    const date = `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`;
    const hours = timestampPart.slice(0, 2), minutes = timestampPart.slice(2, 4), seconds = timestampPart.slice(4, 6);
    const unixTimestamp = moment.tz(`${datePart} ${hours}:${minutes}:${seconds}`, 'YYYYMMDD HH:mm:ss', TIMEZONE).unix();
    const fileName = `${unixTimestamp}_${date} ${hours}:${minutes}.jpg`;

    return { date, fileName, unixTimestamp };
}

function isImageFile(fileName: string): boolean {
    return ['.jpg', '.jpeg', '.png'].includes(path.extname(fileName).toLowerCase());
}

export { getFtpFiles, getFileName, isImageFile, FileDetails };