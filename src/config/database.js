const mongoose = require('mongoose');

class DatabaseConnection {
  constructor() {
    this._connected = false;
    this._connecting = false;
    this.maxRetries = 5;
    this.retryDelay = 5000;

    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
      this._connected = true;
      this._connecting = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      this._connected = false;
      this._connecting = false;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      this._connected = false;
      this._connecting = false;
    });

    process.on('SIGINT', this.cleanup.bind(this));
    process.on('SIGTERM', this.cleanup.bind(this));
  }

  async connectDB(retryCount = 0) {
    if (this._connecting) {
      console.log('⏳ Connection attempt already in progress');
      return;
    }

    if (this._connected) {
      console.log('✅ Already connected to MongoDB');
      return;
    }

    this._connecting = true;

    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        tls: true,  // Fix for TLS errors
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 30000,
      });
      console.log('✅ Successfully connected to MongoDB');
    } catch (error) {
      this._connecting = false;
      console.error(`❌ MongoDB connection attempt ${retryCount + 1} failed:`, error.message);

      if (retryCount < this.maxRetries) {
        console.log(`🔄 Retrying connection in ${this.retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.connectDB(retryCount + 1);
      } else {
        console.error('⛔ Max retry attempts reached. Exiting...');
        process.exit(1);
      }
    }
  }

  isConnected() {
    return this._connected && mongoose.connection.readyState === 1;
  }

  async cleanup() {
    if (this._connected) {
      try {
        await mongoose.connection.close();
        console.log('🔌 MongoDB connection closed');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during cleanup:', err);
        process.exit(1);
      }
    }
  }
}

const dbConnection = new DatabaseConnection();
module.exports = dbConnection;
