const mongoose = require('mongoose');
require('dotenv').config();

const Post = require('../models/Post');
const User = require('../models/User');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const postsWithUnderscore = await Post.find({ 'media.url': /placeholder_image/ });
        console.log(`Found ${postsWithUnderscore.length} posts with underscore placeholder`);
        
        for (const post of postsWithUnderscore) {
            console.log(`Post ID: ${post._id}, Author: ${post.userName}`);
            post.media.forEach(m => {
                if (m.url.includes('placeholder_image')) {
                    console.log(`  - Original URL: ${m.url}`);
                }
            });
        }

        const usersWithUnderscore = await User.find({ $or: [{ avatar: /placeholder_image/ }, { cover: /placeholder_image/ }] });
        console.log(`Found ${usersWithUnderscore.length} users with underscore placeholder`);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

check();
