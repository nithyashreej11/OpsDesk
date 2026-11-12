const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const allowedOrigin = process.env.CLIENT_URL;
if (!allowedOrigin) {
  console.error('CLIENT_URL is not set');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/', (req, res) => {
  res.send('OpsDesk API is running');
});

app.get('/health', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', db: dbUp ? 'connected' : 'disconnected' });
});

app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);

module.exports = app;