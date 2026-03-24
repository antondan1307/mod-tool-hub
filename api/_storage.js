// Shared storage helper
// Production: Upstash Redis (setup env vars UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN)
// Local dev: File system fallback

const fs = require('fs');
const path = require('path');

let redis = null;

// Thử kết nối Upstash Redis
try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const { Redis } = require('@upstash/redis');
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN
        });
    }
} catch (e) {
    console.warn('Upstash Redis not available:', e.message);
}

const DATA_DIR = path.join(process.cwd(), 'data');

async function getData(key) {
    // Thử Redis
    if (redis) {
        try {
            const data = await redis.get('modtoolhub:' + key);
            if (data) return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) {
            console.warn('Redis read failed:', e.message);
        }
    }

    // Fallback: file system
    try {
        const filePath = path.join(DATA_DIR, key + '.json');
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

async function setData(key, data) {
    // Thử Redis
    if (redis) {
        try {
            await redis.set('modtoolhub:' + key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.warn('Redis write failed:', e.message);
        }
    }

    // Fallback: file system (chỉ hoạt động local dev)
    try {
        const filePath = path.join(DATA_DIR, key + '.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.warn('File write failed:', e.message);
        return false;
    }
}

module.exports = { getData, setData };
