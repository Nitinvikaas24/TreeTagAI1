import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. REMOVED: import connectDB ... (Not needed for DynamoDB)

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. REMOVED: connectDB(); (DynamoDB connects automatically via the client)

const app = express();

// Import Routes
import authRoutes from "./routes/auth.js"; 
import identifyRouter from './routes/identify.js';
import receiptsRouter from './routes/receipts.js';
import plantsRouter from './routes/plants.js'; // Ensure this file exists
import searchRouter from './routes/search.js';  // Ensure this file exists
import userRouter from './routes/user.js';      // Ensure this file exists

app.use(cors());
app.use(express.json());

// Allow PDFs to be viewed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount Routes
// Note: You had authRoutes imported twice. I cleaned it up to use just one.
app.use("/api/auth", authRoutes); 
app.use('/api/v1/identify', identifyRouter);
app.use('/api/v1/receipts', receiptsRouter);
app.use('/api/v1/plants', plantsRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/user', userRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server running on port ${port}`));