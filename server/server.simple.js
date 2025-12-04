import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import Plant from './models/plant.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected successfully!');
  } catch (error) { console.error('MongoDB Connection FAILED', error); }
};
connectDB();

const app = express();

import identifyRouter from './routes/identify.js';
import receiptsRouter from './routes/receipts.js';
import plantsRouter from './routes/plants.js';
import searchRouter from './routes/search.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';

app.use(cors());
app.use(express.json());

// Allow PDFs to be viewed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/v1/identify', identifyRouter);
app.use('/api/v1/receipts', receiptsRouter);
app.use('/api/v1/plants', plantsRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/user', userRouter);

// --- REMOVED TRANSLATION ROUTE TO PREVENT CRASH ---

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on port ${port}`));