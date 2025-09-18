// index.js (ES Module version)
import express from 'express';
import mongoConfig from './config/config.js';
import mongoose from 'mongoose';

const app = express();
const PORT = process.env.PORT || 5555;

mongoose.connect(mongoConfig.mongoUri)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware to parse JSON
app.use(express.json());

// Example route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Express.js 🚀 (using ES Modules)' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
