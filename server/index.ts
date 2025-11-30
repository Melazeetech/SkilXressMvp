/**
 * SkilXpress Backend Server
 * 
 * This is the main Express server that handles video moderation
 * and other backend operations.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import moderationRoutes from './routes/moderation';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.VITE_APP_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes
app.use('/api/moderation', moderationRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║   SkilXpress Backend Server Running      ║
║   Port: ${PORT}                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}             ║
╚═══════════════════════════════════════════╝

Available endpoints:
- GET  /health
- POST /api/moderation/upload
- POST /api/moderation/moderate
- GET  /api/moderation/status/:videoId
- POST /api/moderation/remoderate/:videoId
  `);
});

export default app;
