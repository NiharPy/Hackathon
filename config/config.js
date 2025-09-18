// config/mongoConfig.js
import dotenv from 'dotenv';
dotenv.config();

const mongoConfig = {
  env: process.env.NODE_ENV || 'development',

  // MongoDB
  mongoUri: process.env.MONGODB_URI,
};

if (!mongoConfig.mongoUri) {
  console.error('❌ MONGODB_URI is missing in the .env file');
  process.exit(1);
}

export default mongoConfig;
