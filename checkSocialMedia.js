const mongoose = require('mongoose');
const Post = require('./models/Post');
const Story = require('./models/Story');
require('dotenv').config();

async function cleanSocialMedia() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected');
    
    const posts = await Post.find({ $or: [{ image: "" }, { "media.url": "" }] });
    console.log(`Found ${posts.length} posts with empty media`);
    
    const stories = await Story.find({ "media.url": "" });
    console.log(`Found ${stories.length} stories with empty media`);

    // We shouldn't really "fix" these with random images, but maybe we should delete them if they are truly broken
    // For now, just logging.

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
cleanSocialMedia();
