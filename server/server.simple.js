import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Plant from './models/plant.js';

dotenv.config();
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
    } else {
      console.log('Database already contains data.');
    }
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
};

connectDB();

const app = express();

// Import routes
import identifyRouter from './routes/identify.js';
import receiptsRouter from './routes/receipts.js';
import plantsRouter from './routes/plants.js';
import searchRouter from './routes/search.js';
import authRouter from './routes/auth.js';

// Middleware
app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount routers
app.use('/api/v1/identify', identifyRouter);
app.use('/api/v1/receipts', receiptsRouter);
app.use('/api/v1/plants', plantsRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/auth', authRouter);

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});