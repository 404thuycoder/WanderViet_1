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
if (process.env.GROQ_API_KEY_2) process.env.GROQ_API_KEY_2 = process.env.GROQ_API_KEY_2.trim();
if (process.env.GROQ_API_KEY_3) process.env.GROQ_API_KEY_3 = process.env.GROQ_API_KEY_3.trim();
if (process.env.GROQ_API_KEY_4) process.env.GROQ_API_KEY_4 = process.env.GROQ_API_KEY_4.trim();
if (process.env.GROQ_API_KEY_5) process.env.GROQ_API_KEY_5 = process.env.GROQ_API_KEY_5.trim();
if (process.env.GROQ_API_KEY_PLANNER) process.env.GROQ_API_KEY_PLANNER = process.env.GROQ_API_KEY_PLANNER.trim();
if (process.env.GROQ_API_KEY_PLANNER_2) process.env.GROQ_API_KEY_PLANNER_2 = process.env.GROQ_API_KEY_PLANNER_2.trim();
if (process.env.GROQ_API_KEY_PLANNER_3) process.env.GROQ_API_KEY_PLANNER_3 = process.env.GROQ_API_KEY_PLANNER_3.trim();
if (process.env.GROQ_API_KEY_NAVIGATION) process.env.GROQ_API_KEY_NAVIGATION = process.env.GROQ_API_KEY_NAVIGATION.trim();
if (process.env.GROQ_API_KEY_VISION) process.env.GROQ_API_KEY_VISION = process.env.GROQ_API_KEY_VISION.trim();
if (process.env.GROQ_API_KEY_VISION_2) process.env.GROQ_API_KEY_VISION_2 = process.env.GROQ_API_KEY_VISION_2.trim();
if (process.env.GROQ_API_KEY_VISION_3) process.env.GROQ_API_KEY_VISION_3 = process.env.GROQ_API_KEY_VISION_3.trim();
if (process.env.JWT_SECRET) process.env.JWT_SECRET = process.env.JWT_SECRET.trim();
if (process.env.MONGODB_URI) process.env.MONGODB_URI = process.env.MONGODB_URI.trim();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const app = express();
app.set('trust proxy', true);

app.use(compression());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Ensure uploads directory exists
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
const serverUploadsDir = path.join(__dirname, 'server', 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

console.log(`[SERVER] Static uploads serving from: ${uploadsDir}`);
app.use('/uploads', express.static(uploadsDir));
app.use('/uploads', express.static(serverUploadsDir)); // Fallback to server/uploads if needed

// Performance & Caching Policy + UTF-8 Enforcement
app.use((req, res, next) => {
    const ext = path.extname(req.path).toLowerCase();
    const isStaticAsset = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2', '.ttf'].includes(ext);
    
    if (isStaticAsset) {
        if (['.js', '.css'].includes(ext)) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else {
            res.setHeader('Cache-Control', 'public, max-age=86400');
        }
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

// Fallback weather proxy routes (ensure /api/public/weather/* works on localhost 3000)
app.get('/api/public/weather/open-meteo', async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
        return res.status(400).json({ error: 'lat and lng parameters required' });
    }
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.warn('[Weather/Open-Meteo Fallback Mode - Offline or DNS Error]', err.message);
        // Return pleasant default weather to avoid 500 error logs on client
        res.json({
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            current: {
                temperature_2m: 26.0,
                weathercode: 0 // Clear sky
            },
            isFallback: true
        });
    }
});

app.get('/api/public/weather/wttr', async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ error: 'q parameter required' });
    }
    try {
        const url = `https://wttr.in/${encodeURIComponent(q)}?format=j1&lang=vi`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.warn('[Weather/wttr.in Fallback Mode - Offline or DNS Error]', err.message);
        // Return pleasant default weather to avoid 500 error logs on client
        res.json({
            current_condition: [
                {
                    temp_C: "26",
                    weatherCode: "113",
                    weatherDesc: [{ value: "Trời quang đãng" }]
                }
            ],
            nearest_area: [
                {
                    region: [{ value: q || "Việt Nam" }]
                }
            ],
            isFallback: true
        });
    }
});

app.use('/api/chat', require('./server/routes/chat'));
app.use('/api/places', require('./server/routes/places'));
app.use('/api/auth', require('./server/routes/auth').router);
app.use('/api/admin', require('./server/routes/admin'));
app.use('/api/business', require('./server/routes/business'));
app.use('/api/services', require('./server/routes/business'));
app.use('/api/feedback', require('./server/routes/feedback'));
app.use('/api/planner', require('./server/routes/planner'));
app.use('/api/place-info', require('./server/routes/placeInfo'));
app.use('/api/directions', require('./server/routes/directions'));
app.use('/api/navi', require('./server/routes/ai-navigation'));
app.use('/api/notifications', require('./server/routes/notifications'));
app.use('/api/activities', require('./server/routes/activities'));
app.use('/api/knowledge', require('./server/routes/knowledge'));
app.use('/api/social', require('./server/routes/social'));
app.use('/api/bookings', require('./server/routes/bookings'));
app.use('/api/payments', require('./server/routes/payments'));
app.use('/api/place-reviews', require('./server/routes/placeReviews'));
app.use('/api/files', require('./server/routes/files'));
app.use('/api/vouchers', require('./server/routes/vouchers'));

// FAIL-SAFE: Direct registration of place-photo proxy
app.get('/api/public/place-photo', async (req, res) => {
  try {
    const { name, address } = req.query;
    if (!name) return res.status(400).send('Name required');
    const cleanAddress = (address || '').replace(/Vị trí trên bản đồ|Vị trí chính xác trên bản đồ/g, '').trim();
    const searchQuery = encodeURIComponent(`${name} ${cleanAddress}`);
    const searchUrl = `https://www.google.com/maps/search/${searchQuery}`;
    const response = await fetch(searchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36', 'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7' }
    });
    const html = await response.text();
    const ogImageMatch = html.match(/<meta content="(https:\/\/lh5\.googleusercontent\.com\/p\/[^"]+)"/);
    if (ogImageMatch) return res.redirect(ogImageMatch[1]);
    const scriptPhotoMatch = html.match(/https:\/\/lh5\.googleusercontent\.com\/p\/[^"= ]+/);
    if (scriptPhotoMatch) return res.redirect(scriptPhotoMatch[0]);
    res.redirect(`https://loremflickr.com/400/300/${encodeURIComponent(name)},vietnam`);
  } catch (err) {
    res.redirect('https://loremflickr.com/400/300/landscape,vietnam');
  }
});

// Static User Web
app.use('/assets', express.static(path.join(__dirname, 'apps/user-web/assets')));
app.use(express.static(path.join(__dirname, 'apps/user-web'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
    }
}));

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
        pApp.use('/assets', express.static(path.join(__dirname, 'apps/user-web/assets')));
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
    .then(async () => {
        console.log('👤 Web Người Dùng:   http://localhost:3000');
        console.log('🛡️ Web Quản Trị:     http://localhost:3001');
        console.log('💼 Web Doanh Nghiệp: http://localhost:3002');
        console.log('✅ MongoDB connected');
        
        // Auto-seed default vouchers if DB has 0 vouchers
        try {
            const { seedDefaultVouchers } = require('./server/utils/voucherSeeder');
            await seedDefaultVouchers(false);
        } catch (seedErr) {
            console.error('[Auto-Seed] Lỗi nạp vouchers tự động:', seedErr.message);
        }

        // Auto-fix broken database image references
        try {
            const { runDbRepair } = require('./server/utils/dbRepair');
            runDbRepair().catch(err => console.error('[DB Repair Error]', err.message));
        } catch (repairErr) {
            console.error('[DB Repair Setup Error]', repairErr.message);
        }
        
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
