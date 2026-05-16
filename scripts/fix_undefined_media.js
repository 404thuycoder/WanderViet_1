require('dotenv').config();
const mongoose = require('mongoose');
const Post = require('../server/models/Post');
const Story = require('../server/models/Story');

mongoose.connect(process.env.MONGODB_URI.trim())
  .then(() => {
    console.log('✅ MongoDB connected');
    fixUndefinedMedia();
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

async function fixUndefinedMedia() {
  try {
    console.log('🔧 Fixing undefined media URLs in posts...');
    
    // Fix posts - check all posts, not just those with exact match
    const posts = await Post.find({});
    
    console.log(`📊 Checking ${posts.length} posts for undefined media URLs`);
    
    let fixedPosts = 0;
    for (const post of posts) {
      const originalMedia = post.media || [];
      const validMedia = originalMedia.filter(m => 
        m.url && 
        m.url !== 'undefined' && 
        m.url !== '' && 
        m.url !== null &&
        !m.url.includes('undefined')
      );
      
      if (validMedia.length !== originalMedia.length) {
        post.media = validMedia;
        await post.save();
        console.log(`✅ Fixed post ${post._id}: ${originalMedia.length} -> ${validMedia.length} media items`);
        fixedPosts++;
      }
    }
    
    // Fix stories
    const stories = await Story.find({});
    
    console.log(`📊 Checking ${stories.length} stories for undefined media URLs`);
    
    let fixedStories = 0;
    for (const story of stories) {
      const originalMedia = story.media || [];
      const validMedia = originalMedia.filter(m => 
        m.url && 
        m.url !== 'undefined' && 
        m.url !== '' && 
        m.url !== null &&
        !m.url.includes('undefined')
      );
      
      if (validMedia.length !== originalMedia.length) {
        story.media = validMedia;
        await story.save();
        console.log(`✅ Fixed story ${story._id}: ${originalMedia.length} -> ${validMedia.length} media items`);
        fixedStories++;
      }
    }
    
    console.log(`✅ Fixed ${fixedPosts} posts and ${fixedStories} stories with undefined media URLs!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing undefined media:', error);
    process.exit(1);
  }
}
