require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`[Server] FinEdge API is running on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception] Shutting down:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection] Shutting down:', reason);
  server.close(() => {
    process.exit(1);
  });
});
