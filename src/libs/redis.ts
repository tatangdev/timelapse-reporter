import Redis from 'ioredis';

const REDIS_URL: string = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    reconnectOnError: (err) => {
        if (err.message.includes('getaddrinfo ENOTFOUND')) {
            console.error('Reconnecting due to DNS error:', err);
            return true;
        }
        return false;
    },
});

redisClient.on('error', (err) => {
    console.error('[ioredis] Connection Error:', err);
});

export default redisClient;

// import { createClient } from 'redis';

// const REDIS_URL: string = process.env.REDIS_URL || 'redis://localhost:6379';
// const redisClient = createClient({ url: REDIS_URL });

// redisClient.on('error', (err) => console.error('Redis Error:', err));
// redisClient.connect();
