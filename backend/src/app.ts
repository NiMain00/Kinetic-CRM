import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error.middleware';
import healthRoutes from './api/v1/health.routes';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

app.use('/api/v1/health', healthRoutes);

app.use(errorHandler);
export default app;
