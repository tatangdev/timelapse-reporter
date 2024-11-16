import { Client } from 'basic-ftp';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();
client.ftp.verbose = true;

async function connectFTP(): Promise<void> {
    try {
        await client.access({
            host: process.env.FTP_HOST || '',
            user: process.env.FTP_USER || '',
            password: process.env.FTP_PASSWORD || '',
            secure: true,
            port: 21,
            secureOptions: {
                rejectUnauthorized: false,
            },
        });
        console.log('Connected to FTP server');
    } catch (error) {
        console.error('Failed to connect to FTP server:', error);
        throw error;
    }
}

export { client, connectFTP };
