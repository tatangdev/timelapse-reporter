import { Telegraf } from 'telegraf';

const TELEGRAM_BOT_TOKEN: string = process.env.TELEGRAM_BOT_TOKEN || '';
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

export default bot;
