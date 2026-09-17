const mongoose = require('mongoose');

const { MONGO_URI } = require('./env');

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });

    console.log(`MongoDB connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('error', (error) => {
  console.error('MongoDB runtime error:', error.message);
});

module.exports = connectDB;
