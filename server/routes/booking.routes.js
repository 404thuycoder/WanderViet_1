const express = require('express');
const { createBooking, getBookings, updateBooking } = require('../controllers/booking.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');

const router = express.Router();

router.route('/')
    .get(protect, getBookings)
    .post(protect, authorize('user'), createBooking);

router.route('/:id')
    .put(protect, authorize('business', 'admin'), (req, res, next) => {
        require('fs').appendFileSync('debug_route_new.log', `[${new Date().toISOString()}] NEW PUT /api/bookings/${req.params.id} Role: ${req.user.role}\n`);
        next();
    }, updateBooking);

module.exports = router;
