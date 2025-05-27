// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Mongoose 6 no longer needs these options, but good to be aware they existed:
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true, // Not needed
      // useFindAndModify: false, // Not needed
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;