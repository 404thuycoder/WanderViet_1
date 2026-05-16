const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function cleanupReviews() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const PlaceReview = require('./models/PlaceReview');
    
    // Find reviews that have images starting with /uploads/review_
    const reviews = await PlaceReview.find({ 
      images: { $regex: /^\/uploads\/review_/ } 
    });

    console.log(`Found ${reviews.length} reviews with potentially broken /uploads/ links.`);

    let fixedCount = 0;
    for (const review of reviews) {
      // For now, since we confirmed the files are NOT in GridFS and NOT in /uploads/,
      // we should remove these broken links to stop the 404s.
      // In a real scenario, we might try to find the files, but here they seem lost.
      
      const originalImages = review.images;
      const filteredImages = review.images.filter(img => !img.startsWith('/uploads/review_'));
      
      if (originalImages.length !== filteredImages.length) {
        review.images = filteredImages;
        await PlaceReview.collection.updateOne(
          { _id: review._id },
          { $set: { images: filteredImages } }
        );
        fixedCount++;
      }
    }

    console.log(`Cleaned up ${fixedCount} reviews.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanupReviews();
