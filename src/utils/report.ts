import moment from 'moment-timezone';
import { getFtpFiles } from './ftp';

const REPORT_START_DATE: string = process.env.REPORT_START_DATE || '2024-10-26';

async function sendReport(hatId: string, ctx: any): Promise<void> {
    ctx.reply('Preparing CCTV report... ⏳');
    const dates = getDateRange(REPORT_START_DATE, moment().format('YYYY-MM-DD'));
    const files = await getFtpFiles();
    let message = `*Monthly CCTV Images Report*\n\n`;

    const groupedReports: Record<string, { withData: number; withoutData: number; totalImages: number; details: string }> = {};

    for (const date of dates) {
        const dateFiles = files.filter(file => file.date === date);
        const formattedDate = moment(date).format('dddd, DD MMMM');
        const month = moment(date).format('MMMM YYYY');
        const imagesFound = dateFiles.length;

        if (!groupedReports[month]) {
            groupedReports[month] = { withData: 0, withoutData: 0, totalImages: 0, details: '' };
        }

        groupedReports[month].details += `- *${formattedDate}*: ${imagesFound} images ${imagesFound > 0 ? '✅' : '❌'}\n`;
        groupedReports[month].totalImages += imagesFound;
        if (imagesFound > 0) {
            groupedReports[month].withData++;
        } else {
            groupedReports[month].withoutData++;
        }
    }

    for (const [month, report] of Object.entries(groupedReports)) {
        message += `*${month}*\n`;
        message += report.details;
        message += `\n*Summary for ${month}*:\n`;
        message += `- Days with data: *${report.withData}*\n`;
        message += `- Days without data: *${report.withoutData}*\n`;
        message += `- Total images found: *${report.totalImages}*\n\n`;
    }

    // Overall summary
    const totalDays = dates.length;
    const totalWithData = Object.values(groupedReports).reduce((sum, report) => sum + report.withData, 0);
    const totalWithoutData = Object.values(groupedReports).reduce((sum, report) => sum + report.withoutData, 0);
    const totalImages = Object.values(groupedReports).reduce((sum, report) => sum + report.totalImages, 0);

    message += `*Overall Summary*\n`;
    message += `- Total days analyzed: *${totalDays}*\n`;
    message += `- Days with data: *${totalWithData}* (${((totalWithData / totalDays) * 100).toFixed(1)}%)\n`;
    message += `- Days without data: *${totalWithoutData}* (${((totalWithoutData / totalDays) * 100).toFixed(1)}%)\n`;
    message += `- Total images found: *${totalImages}*\n\n`;

    ctx.reply(message, { parse_mode: 'Markdown' });
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
