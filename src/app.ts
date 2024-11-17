import dotenv from 'dotenv';
dotenv.config();

import cron from 'node-cron';
import { checkHealth } from './utils/health';
import { sendReport } from './utils/report';
import { subscribe, unsubscribe } from './utils/telegram';
import bot from './libs/telegraf';

cron.schedule('*/15 * * * *', () => {
    console.log('Running health check...');
    checkHealth(true, null);
});

const commands = [
    { command: '/subscribe', description: 'Subscribe to receive notifications from the bot.' },
    { command: '/unsubscribe', description: 'Unsubscribe from notifications.' },
    { command: '/health', description: 'Check if the CCTV system is online.' },
    { command: '/report', description: 'Get a daily report of the number of files recorded.' },
    { command: '/help', description: 'View a list of available commands.' },
];

const generateCommandList = () => {
    return commands
        .map(cmd => `${cmd.command} - ${cmd.description}`)
        .join('\n');
};

bot.command('help', (ctx) => {
    const commandList = generateCommandList();
    ctx.reply(`Here are the available commands:\n\n${commandList}`);
});

bot.command('subscribe', async (ctx) => {
    const chatId = ctx.chat.id.toString();
    await subscribe(chatId, ctx);
});

bot.command('unsubscribe', async (ctx) => {
    const chatId = ctx.chat.id.toString();
    await unsubscribe(chatId, ctx);
});

bot.command('health', async (ctx) => {
    await checkHealth(false, ctx);
});

bot.command('report', async (ctx) => {
    await sendReport(ctx);
});

bot.launch();
