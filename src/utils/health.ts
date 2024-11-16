import moment from 'moment-timezone';
import { getFtpFiles } from './ftp';
import { notifySubscribers } from './telegram';

const TIMEZONE: string = process.env.TIMEZONE || 'Asia/Jakarta';

async function checkHealth(isSystemCheck: boolean, chatId: string, ctx: any): Promise<void> {
    const currentTime = moment().tz(TIMEZONE);
    const currentHour = currentTime.hour();

    if (isSystemCheck && (currentHour < 7 || currentHour >= 18)) return;
    if (!isSystemCheck) ctx.reply('Checking CCTV health... ⏳');
    const ftpFiles = await getFtpFiles();
    if (isSystemCheck) {
        handleLastHourCheck(ftpFiles, currentTime);
    } else {
        handleTodayCheck(ftpFiles, currentTime, ctx);
    }
}

function handleTodayCheck(files: any[], currentTime: moment.Moment, ctx: any): void {
    const todayDate = currentTime;
    const todayFiles = files.filter(file => file.date === todayDate.format('YYYY-MM-DD'));

    if (todayFiles.length === 0) {
        console.log(`No CCTV images found for today (${todayDate.format('dddd, DD MMMM YYYY')}) ❌`);
        ctx.reply(`No CCTV images found for today (${todayDate.format('dddd, DD MMMM YYYY')}) ❌`);
    } else {
        console.log(`${todayFiles.length} CCTV images found for today (${todayDate.format('dddd, DD MMMM YYYY')}) ✅`);
        ctx.reply(`${todayFiles.length} CCTV images found for today (${todayDate.format('dddd, DD MMMM YYYY')}) ✅`);
    }
}

function handleLastHourCheck(files: any[], currentTime: moment.Moment): void {
    const oneHourAgo = currentTime.clone().subtract(1, 'hour').unix();
    const lastHourFiles = files.filter(file => file.unixTimestamp >= oneHourAgo && file.unixTimestamp < currentTime.unix());

    if (lastHourFiles.length === 0) {
        console.log('No CCTV images found for the last hour ❌');
        notifySubscribers('No CCTV images found for the last hour ❌');
    } else {
        console.log('CCTV images found for the last hour ✅');
    }
}

export { checkHealth };
