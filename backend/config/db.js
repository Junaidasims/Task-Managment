const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/taskmanager');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Warning: Database connection failed. Ensure MongoDB is running locally or provide a valid MONGODB_URI in backend/.env.');
  }
};

module.exports = connectDB;
