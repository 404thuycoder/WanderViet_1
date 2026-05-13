require('dotenv').config();
// Server starting...
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const http = require('http');
const { initBroadcastWorker } = require('./server/utils/broadcastWorker');
const { initSocket } = require('./server/utils/socketManager');

// Clean up environment variables
if (process.env.GROQ_API_KEY) process.env.GROQ_API_KEY = process.env.GROQ_API_KEY.trim();
if (process.env.GROQ_API_KEY_PLANNER) process.env.GROQ_API_KEY_PLANNER = process.env.GROQ_API_KEY_PLANNER.trim();
if (process.env.GROQ_API_KEY_NAVIGATION) process.env.GROQ_API_KEY_NAVIGATION = process.env.GROQ_API_KEY_NAVIGATION.trim();
if (process.env.JWT_SECRET) process.env.JWT_SECRET = process.env.JWT_SECRET.trim();
if (process.env.MONGODB_URI) process.env.MONGODB_URI = process.env.MONGODB_URI.trim();

const PORT = 3000;
const app = express();
app.set('trust proxy', true);

app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Performance & Caching Policy + UTF-8 Enforcement
app.use((req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    const isStaticAsset = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2', '.ttf'].includes(ext);
    
    if (isStaticAsset) {
        res.setHeader('Cache-Control', 'public, max-age=86400');
        if (['.js', '.css', '.svg', '.json'].includes(ext)) {
            if (ext === '.js') res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
            else if (ext === '.css') res.setHeader('Content-Type', 'text/css; charset=utf-8');
            else if (ext === '.json') res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
    } else {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        if (ext === '.html' || req.path === '/' || !ext) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
    }
    next();
});

// Force UTF-8 for all JSON API responses
app.use('/api', (req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.path.includes('login')) {
    // console.log(`[API DEBUG] ${req.method} ${req.path}`, req.body);
  }
  next();
});

// API Routes
app.use('/api/public', require('./server/routes/public'));
app.use('/api/chat', require('./server/routes/chat'));
app.use('/api/places', require('./server/routes/places'));
app.use('/api/auth', require('./server/routes/auth').router);
app.use('/api/admin', require('./server/routes/admin'));
app.use('/api/business', require('./server/routes/business'));
app.use('/api/feedback', require('./server/routes/feedback'));
app.use('/api/planner', require('./server/routes/planner'));
app.use('/api/directions', require('./server/routes/directions'));
app.use('/api/navi', require('./server/routes/ai-navigation'));
app.use('/api/notifications', require('./server/routes/notifications'));
app.use('/api/activities', require('./server/routes/activities'));
app.use('/api/knowledge', require('./server/routes/knowledge'));
app.use('/api/social', require('./server/routes/social'));
app.use('/api/bookings', require('./server/routes/bookings'));
app.use('/api/payments', require('./server/routes/payments'));

// Static User Web
app.use('/assets', express.static(path.join(__dirname, 'apps/user-web/assets')));
app.use(express.static(path.join(__dirname, 'apps/user-web')));

app.use((req, res) => {
    const isApi = req.path.startsWith('/api/');
    const isUpload = req.path.startsWith('/uploads/');
    const isAsset = req.path.startsWith('/assets/');
    const hasExt = path.extname(req.path) !== '';
    if (isApi || isUpload || isAsset || hasExt) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    res.sendFile(path.join(__dirname, 'apps/user-web/index.html'));
});

// Proxy logic for portals
function makeProxy(targetPort) {
    return (req, res) => {
        const chunks = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => {
            const body = Buffer.concat(chunks);
            const pr = http.request({
                hostname: '127.0.0.1', port: targetPort, path: req.url, method: req.method,
                headers: { ...req.headers, host: `127.0.0.1:${targetPort}`, 'content-length': body.length }
            }, upstream => {
                res.writeHead(upstream.statusCode, upstream.headers);
                upstream.pipe(res, { end: true });
            });
            pr.on('error', () => { if (!res.headersSent) res.status(502).json({ success: false }); });
            pr.end(body);
        });
    };
}

const startPortals = () => {
    const proxy = makeProxy(PORT);
    [{ p: 3001, d: 'apps/admin-web' }, { p: 3002, d: 'apps/business-web' }].forEach(config => {
        const pApp = express();
        pApp.use(cors({ origin: true, credentials: true }));
        pApp.use((req, res, next) => {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            const ext = path.extname(req.path).toLowerCase();
            if (['.html', '.js', '.css', '.json'].includes(ext) || req.path === '/' || !ext) {
                if (ext === '.js') res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
                else if (ext === '.css') res.setHeader('Content-Type', 'text/css; charset=utf-8');
                else if (ext === '.html' || req.path === '/' || !ext) res.setHeader('Content-Type', 'text/html; charset=utf-8');
                else if (ext === '.json') res.setHeader('Content-Type', 'application/json; charset=utf-8');
            }
            next();
        });
        pApp.use('/api/', (req, res) => { req.url = '/api/' + req.url.replace(/^\//, ''); proxy(req, res); });
        pApp.use('/uploads/', (req, res) => { req.url = '/uploads/' + req.url.replace(/^\//, ''); proxy(req, res); });
        pApp.use(express.static(path.join(__dirname, config.d)));
        pApp.use((req, res) => res.sendFile(path.join(__dirname, config.d, 'index.html')));
        pApp.listen(config.p).on('error', () => {});
    });
};

// Database & Start
const dbOptions = {
    serverSelectionTimeoutMS: 10000, // Increase to 10s
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    heartbeatFrequencyMS: 10000,
    retryWrites: true,
    w: 'majority'
};

mongoose.connect(process.env.MONGODB_URI.trim(), dbOptions)
    .then(() => {
        console.log('👤 Web Người Dùng:   http://localhost:3000');
        console.log('🛡️ Web Quản Trị:     http://localhost:3001');
        console.log('💼 Web Doanh Nghiệp: http://localhost:3002');
        console.log('✅ MongoDB connected');
        
        const server = http.createServer(app);
        initSocket(server);
        
        server.listen(PORT, '0.0.0.0', () => {
            startPortals();
            initBroadcastWorker();
        }).on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\n❌ Cổng ${PORT} đang bị chiếm dụng!`);
                process.exit(1);
            }
        });
    })
    .catch((err) => {
        if (err.message.includes('getaddrinfo') || err.message.includes('ENOTFOUND')) {
             console.error('❌ Main DB: Connection issue (check internet).');
        } else {
             console.error('❌ Main DB Error:', err.message);
        }
    });
