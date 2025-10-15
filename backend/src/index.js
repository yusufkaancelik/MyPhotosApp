import express from 'express';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { photoRouter } from './routes/photos.js';
import { driveRouter } from './routes/drives.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001; // Changed to port 3001 to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json());

// SSL sertifikası yapılandırması
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, '../.cert/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../.cert/cert.pem'))
};

// Routes
app.use('/api/photos', photoRouter);
app.use('/api/drives', driveRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// HTTPS sunucusu başlatma
const server = https.createServer(sslOptions, app);

// Listen on all network interfaces
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Secure server is running on port ${PORT}`);
  console.log(`Access your app from your phone at https://<your-computer-ip>:${PORT}`);
});