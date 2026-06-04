const express = require('express');
const router = express.Router();

// Simple in-memory cache to reduce external lookups: { key: { ts, data } }
const cache = new Map();
const TTL = 1000 * 60 * 60 * 12; // 12 hours

// Helper: fetch with timeout
async function fetchWithTimeout(url, opts = {}, timeout = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

router.get('/', async (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim();
    const key = ip || 'anon';

    const cached = cache.get(key);
    if (cached && (Date.now() - cached.ts) < TTL) {
      return res.json({ success: true, source: 'cache', ...cached.data });
    }

    // Providers to try in order (server-side avoids CORS)
    const providers = [
      // ip-api.com (no key, fast)
      async () => {
        const p = ip ? `http://ip-api.com/json/${ip}?fields=status,message,lat,lon` : 'http://ip-api.com/json/?fields=status,message,lat,lon';
        const r = await fetchWithTimeout(p, {}, 2500);
        if (!r || !r.ok) return null;
        const j = await r.json();
        if (j && j.status === 'success' && j.lat != null && j.lon != null) return { lat: j.lat, lon: j.lon, provider: 'ip-api' };
        return null;
      },
      // ipwho.is
      async () => {
        const p = ip ? `https://ipwho.is/${ip}` : 'https://ipwho.is/';
        const r = await fetchWithTimeout(p, {}, 2500);
        if (!r || !r.ok) return null;
        const j = await r.json();
        if (j && j.latitude != null && j.longitude != null) return { lat: j.latitude, lon: j.longitude, provider: 'ipwho' };
        return null;
      },
      // ipapi.co
      async () => {
        const p = ip ? `https://ipapi.co/${ip}/json/` : 'https://ipapi.co/json/';
        const r = await fetchWithTimeout(p, {}, 3000);
        if (!r || !r.ok) return null;
        const j = await r.json();
        if (j && j.latitude != null && j.longitude != null) return { lat: j.latitude, lon: j.longitude, provider: 'ipapi' };
        return null;
      }
    ];

    let result = null;
    for (const tryProv of providers) {
      try {
        result = await tryProv();
        if (result) break;
      } catch (e) {
        // continue
      }
    }

    if (result) {
      cache.set(key, { ts: Date.now(), data: result });
      return res.json({ success: true, ...result });
    }

    return res.json({ success: false, message: 'No geo data' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
