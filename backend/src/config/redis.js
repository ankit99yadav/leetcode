const { createClient } = require('redis');

const REDIS_ENABLED = (process.env.REDIS_ENABLED || 'true').toLowerCase() !== 'false';

function createStubClient() {
    return {
        isOpen: false,
        on: () => {},
        connect: async () => {},
        disconnect: async () => {},
        exists: async () => 0,
        set: async () => 'OK',
        expireAt: async () => 1,
    };
}

let redisClient;
if (!REDIS_ENABLED) {
    redisClient = createStubClient();
} else {
    redisClient = createClient({
        username: process.env.REDIS_USERNAME || 'default',
        password: process.env.REDIS_PASS,
        socket: {
            host: process.env.REDIS_HOST || 'redis-19934.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
            port: Number(process.env.REDIS_PORT || 19934),
            tls: (process.env.REDIS_USE_TLS || 'true').toLowerCase() !== 'false'
        }
    });

    redisClient.on('error', (err) => {
        console.error('Redis connection error:', err.message);
    });
}

module.exports = redisClient;