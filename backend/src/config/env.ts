import 'dotenv/config';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
  JWT_EXPIRY: parseInt(process.env.JWT_EXPIRY || '28800', 10),
};
