import dotenv from 'dotenv';
dotenv.config();
import moment from 'moment-timezone';
import { getFtpFiles } from './ftp';
import { notifySubscribers } from './telegram';

const TIMEZONE: string = process.env.TIMEZONE || 'Asia/Jakarta';
const REPORT_START_DATE: string = process.env.REPORT_START_DATE || '2024-10-20';

async function sendReport(hatId: string, ctx: any): Promise<void> {

    const dates = getDateRange(REPORT_START_DATE, moment().format('YYYY-MM-DD'));
    console.log('Dates:', dates);

    ctx.reply('Preparing CCTV report... ⏳');

    const files = await getFtpFiles();
    let message = '';
    for (const date of dates) {
        const dateFiles = files.filter(file => file.date === date);
        const formattedDate = moment(date).format('dddd, DD MMMM YYYY');
        message += `${formattedDate}: ${dateFiles.length} CCTV images found\n`;
    }

    ctx.reply(message);
}

function getDateRange(startDate: string | Date, endDate: string | Date): string[] {
    const start = moment(startDate);
    const end = moment(endDate);
    const dateArray: string[] = [];

    while (start.isBefore(end) || start.isSame(end)) {
        dateArray.push(start.format('YYYY-MM-DD'));
        start.add(1, 'day');
    }

    return dateArray;
}


export { sendReport };