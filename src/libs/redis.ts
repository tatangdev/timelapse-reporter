import Redis from 'ioredis';

const REDIS_URL: string = process.env.REDIS_URL || 'redis://localhost:6379';
const redisClient = new Redis(REDIS_URL);
// import { createClient } from 'redis';

// const REDIS_URL: string = process.env.REDIS_URL || 'redis://localhost:6379';
// const redisClient = createClient({ url: REDIS_URL });

// redisClient.on('error', (err) => console.error('Redis Error:', err));
// redisClient.connect();

export default redisClient;
