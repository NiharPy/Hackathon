// index.js (ES Module version)
import express from 'express';
import mongoConfig from './config/config.js';
import mongoose from 'mongoose';
import SuperAdminRoutes from './routes/SuperAdminRoutes.js';
import AdminRoutes from './routes/AdminRoutes.js';
import SimulatorRoutes from './routes/SimulatorRoutes.js';
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5555;

app.use(
    cors({
      origin: "http://localhost:3000", // 🔥 frontend origin
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
    })
  );

mongoose.connect(mongoConfig.mongoUri)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Example route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Express.js 🚀 (using ES Modules)' });
});


app.use('/api/SA', SuperAdminRoutes);
app.use('/api/A', AdminRoutes);
app.use('/api/S', SimulatorRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
