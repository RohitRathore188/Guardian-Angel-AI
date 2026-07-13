import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import reportRoutes from './routes/report.js';
import chatRoutes from './routes/chat.js';
import casesRoutes from './routes/cases.js';

if (fs.existsSync('.env')) {
  dotenv.config();
} else if (fs.existsSync('../.env')) {
  dotenv.config({ path: '../.env' });
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for image uploads

// Routes
app.use('/api/report', reportRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/cases', casesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Guardian Angel API is running' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
