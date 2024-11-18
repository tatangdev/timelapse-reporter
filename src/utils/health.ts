import moment from 'moment-timezone';
import { FileDetails, getFtpFiles } from './ftp';
import { notifySubscribers } from './telegram';
import redisClient from '../libs/redis';
import { Context } from 'telegraf';

const TIMEZONE: string = process.env.TIMEZONE || 'Asia/Jakarta';
const NOTIFY_COUNT_KEY = 'no_images_notify_count';
const NOTIFY_DATE_KEY = 'no_images_notify_date';

async function checkHealth(isSystemCheck: boolean, ctx: Context | null): Promise<void> {
    const currentTime = moment().tz(TIMEZONE);
    const currentHour = currentTime.hour();

    if (isSystemCheck && (currentHour < 7 || currentHour >= 18)) return;
    if (!isSystemCheck && ctx) ctx.reply('Checking CCTV health... ⏳');
    const ftpFiles = await getFtpFiles();
    if (isSystemCheck) {
        await handleLastHourCheck(ftpFiles, currentTime);
    } else {
        if (ctx) await handleTodayCheck(ftpFiles, currentTime, ctx);
    }
}

async function handleTodayCheck(files: FileDetails[], currentTime: moment.Moment, ctx: Context): Promise<void> {
    const todayDate = currentTime.format('YYYY-MM-DD');
    const todayFiles = files.filter(file => file.date === todayDate);

    if (todayFiles.length === 0) {
        console.log(`No CCTV images found for today (${todayDate}) ❌`);
        ctx.reply(`No CCTV images found for today (${currentTime.format('dddd, DD MMMM YYYY')}) ❌`);
        await redisClient.set(NOTIFY_DATE_KEY, todayDate);
    } else {
        console.log(`${todayFiles.length} CCTV images found for today (${todayDate}) ✅`);
        ctx.reply(`${todayFiles.length} CCTV images found for today (${currentTime.format('dddd, DD MMMM YYYY')}) ✅`);
    }
}

async function handleLastHourCheck(files: FileDetails[], currentTime: moment.Moment): Promise<void> {
    const oneHourAgo = currentTime.clone().subtract(1, 'hour').unix();
    const lastHourFiles = files.filter(file => file.unixTimestamp >= oneHourAgo && file.unixTimestamp < currentTime.unix());

    const todayDate = currentTime.format('YYYY-MM-DD');
    const savedDate = await redisClient.get(NOTIFY_DATE_KEY);
    const notifyCount = parseInt(await redisClient.get(NOTIFY_COUNT_KEY) || '0', 10);

    if (savedDate !== todayDate) {
        await redisClient.set(NOTIFY_DATE_KEY, todayDate);
        await redisClient.set(NOTIFY_COUNT_KEY, '0');
    }

    if (lastHourFiles.length === 0) {
        if (notifyCount < 3) {
            console.log('No CCTV images found for the last hour ❌');
            notifySubscribers('No CCTV images found for the last hour ❌');
            await redisClient.incr(NOTIFY_COUNT_KEY);
        } else {
            console.log('No CCTV images found for the last hour, but notification limit reached. ❌');
        }
    } else {
        console.log('CCTV images found for the last hour ✅');
        await redisClient.set(NOTIFY_COUNT_KEY, '0');
    }
}

export { checkHealth };
