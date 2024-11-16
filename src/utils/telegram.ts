import bot from '../libs/telegraf';
import redisClient from '../libs/redis';

async function subscribe(chatId: string, ctx: any) {
    try {
        await redisClient.sAdd('subscribers', chatId);
        ctx.reply('You have successfully subscribed to CCTV updates! ✅');
    } catch (error) {
        console.error('Error subscribing user:', error);
        ctx.reply('Failed to subscribe. Please try again later. ❌');
    }
}

async function unsubscribe(chatId: string, ctx: any) {
    try {
        const removed = await redisClient.sRem('subscribers', chatId);
        if (removed) {
            ctx.reply('You have successfully unsubscribed from CCTV updates. ✅');
        } else {
            ctx.reply('You are not subscribed to CCTV updates. ❌');
        }
    } catch (error) {
        console.error('Error unsubscribing user:', error);
        ctx.reply('Failed to unsubscribe. Please try again later. ❌');
    }
}

async function notifySubscribers(message: string): Promise<void> {
    try {
        const subscribers = await redisClient.sMembers('subscribers');
        for (const chatId of subscribers) {
            await bot.telegram.sendMessage(chatId, message);
        }
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
}

export { subscribe, unsubscribe, notifySubscribers };