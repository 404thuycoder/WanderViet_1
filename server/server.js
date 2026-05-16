const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/error.middleware');

// Load env vars from root directory
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Serve static uploads
const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Route files
const auth = require('./routes/auth').router;
const services = require('./routes/business');
const bookings = require('./routes/bookings');
const reviews = require('./routes/feedback');
const messages = require('./routes/chat');
const preferences = require('./routes/planner');
const dashboard = require('./routes/admin');
const social = require('./routes/social');
const places = require('./routes/places');
const publicRoutes = require('./routes/public');
const activities = require('./routes/activities');
const notifications = require('./routes/notifications');
const payments = require('./routes/payments');
const placeReviews = require('./routes/placeReviews');
const files = require('./routes/files');

// Mount routers
app.use('/api/auth', auth);
app.use('/api/services', services);
app.use('/api/bookings', bookings);
app.use('/api/reviews', reviews);
app.use('/api/messages', messages);
app.use('/api/preferences', preferences);
app.use('/api/dashboard', dashboard);
app.use('/api/social', social);
app.use('/api/places', places);
app.use('/api/public', publicRoutes);
app.use('/api/activities', activities);
app.use('/api/notifications', notifications);
app.use('/api/payments', payments);
app.use('/api/place-reviews', placeReviews);
app.use('/api/files', files);

// Root endpoint
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error Middleware (must be after routers)
app.use(errorHandler);

const PORT = process.env.API_PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
