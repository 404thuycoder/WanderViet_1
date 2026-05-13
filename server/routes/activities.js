const express = require('express');
const router = express.Router();
const UserActivity = require('../models/UserActivity');
const { auth } = require('./auth');

// POST /api/activities/record — Ghi lại hoạt động mới
router.post('/record', auth, async (req, res) => {
    try {
        const { type, description, metadata } = req.body;
        
        if (!type || !description) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin hoạt động' });
        }

        const activity = new UserActivity({
            userId: req.user.id,
            type,
            description,
            metadata,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        await activity.save();
        res.json({ success: true, data: activity });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/activities/my — Lấy lịch sử hoạt động của người dùng hiện tại
router.get('/my', auth, async (req, res) => {
    try {
        const { limit = 20, skip = 0, type } = req.query;
        const query = { userId: req.user.id };
        if (type) query.type = type;

        const [activities, total] = await Promise.all([
            UserActivity.find(query)
                .sort({ timestamp: -1 })
                .limit(parseInt(limit))
                .skip(parseInt(skip)),
            UserActivity.countDocuments(query)
        ]);

        res.json({ success: true, data: activities, total });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
