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

console.log("--- Loading Gemma Key:", process.env.GEMMA_API_KEY);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected successfully!');
    await seedDatabase();
  } catch (error) {
    console.error('MongoDB Connection FAILED', error);
  }
};

const seedDatabase = async () => {
  try {
    const plantCount = await Plant.countDocuments();
    if (plantCount === 0) {
      console.log('No plants found. Seeding database...');
      const mango = new Plant({
        scientific_name: 'Mangifera indica',
        common_names: ['Mango', 'Aam'],
        price_default: 350,
        stock: 25
      });
      await mango.save();
      console.log('Database seeded with Mango plant.');
    }
  } catch (error) {
    console.log('Database already initialized');
  }
};

connectDB();

const app = express();

// --- IMPORT ROUTES ---
import identifyRouter from './routes/identify.js';
import receiptsRouter from './routes/receipts.js';
import plantsRouter from './routes/plants.js';
import searchRouter from './routes/search.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import translationsRouter from './routes/translations.js'; // <--- NEW IMPORT

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- SERVE STATIC PDFS ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- MOUNT ROUTERS ---
app.get('/api/v1/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/identify', identifyRouter);
app.use('/api/v1/receipts', receiptsRouter);
app.use('/api/v1/plants', plantsRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/auth', authRouter);

// User Dashboard Route
app.use('/api/user', userRouter);

// --- NEW: Translation Route (Fixes Language Selector) ---
app.use('/api/translations', translationsRouter); 

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});