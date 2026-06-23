import 'dotenv/config';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
  JWT_EXPIRY: parseInt(process.env.JWT_EXPIRY || '28800', 10),

  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

  STORAGE_ROOT: process.env.STORAGE_ROOT || './uploads',
  STORAGE_MAX_UPLOAD_MB: parseInt(process.env.STORAGE_MAX_UPLOAD_MB || '25', 10),

  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gemini-2.5-flash',
  AI_EMBEDDING_MODEL: process.env.AI_EMBEDDING_MODEL || 'text-embedding-004',
  AI_MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS || '2048', 10),
  AI_TEMPERATURE: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
  AI_TIMEOUT_SECONDS: parseInt(process.env.AI_TIMEOUT_SECONDS || '30', 10),
  AI_MAX_RETRIES: parseInt(process.env.AI_MAX_RETRIES || '3', 10),
  AI_RATE_LIMIT_RPM: parseInt(process.env.AI_RATE_LIMIT_RPM || '60', 10),
  AI_COST_LIMIT_USD_PER_DAY: parseFloat(process.env.AI_COST_LIMIT_USD_PER_DAY || '10.0'),
  AI_ENABLED: process.env.AI_ENABLED !== 'false',

  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
};
