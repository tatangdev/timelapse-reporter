import dotenv from 'dotenv';
dotenv.config();
import cron from 'node-cron';
import { checkHealth } from './utils/health';
import { sendReport } from './utils/report';
import { subscribe, unsubscribe } from './utils/telegram';

// Schedule the function to run every 15 minutes
cron.schedule('*/15 * * * *', () => {
    console.log('Running health check...');
    checkHealth(true, '', null);
});

// Run the function immediately on startup
checkHealth(true, '', null);

/* Bot */
import bot from './libs/telegraf';

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

// Handle /subscribe command
bot.command('subscribe', async (ctx) => {
    const chatId = ctx.chat.id.toString();
    await subscribe(chatId, ctx);
});

// Handle /unsubscribe command
bot.command('unsubscribe', async (ctx) => {
    const chatId = ctx.chat.id.toString();
    await unsubscribe(chatId, ctx);
});

bot.command('health', async (ctx) => {
    const chatId = ctx.chat.id.toString();
    await checkHealth(false, chatId, ctx);
});

bot.command('report', async (ctx) => {
    const chatId = ctx.chat.id.toString();
    await sendReport(chatId, ctx);
});

bot.launch();
