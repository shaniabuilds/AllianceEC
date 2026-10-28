

const dotenv = require('dotenv');

// Handle Uncaught Synchronous Exceptions
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION 💥] Shutting down server...');
  console.error(err.name, err.message);
  process.exit(1);
});

dotenv.config();

// EduVerse Server Entry Point
const app = require('./app');
const connectDB = require('./config/db');

// Connect Database
connectDB();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`[Server Core] Running in ${process.env.NODE_ENV} mode on http://localhost:${PORT}`);
});

// Handle Unhandled Asynchronous Rejections
process.on('unhandledRejection', (err) => {
  console.error('[UNHANDLED REJECTION 💥] Gracefully closing server...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
