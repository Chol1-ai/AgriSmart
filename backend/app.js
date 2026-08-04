const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDatabase = require('./config/database');
const { FRONTEND_URL, NODE_ENV } = require('./config/environment');
const routes = require('./routes');

const app = express();

const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'https://localhost:3000',
  'https://127.0.0.1:3000'
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.onrender.com') || origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app')) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/html/index.html'));
});

app.use('/api', routes);
app.use(require('./middleware/errorHandler'));

if (NODE_ENV !== 'test') {
  connectDatabase();
}

module.exports = app;
