// backend/src/scripts/updateUserModel.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

const updateUserModel = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Tạo collection mới với schema mới
    // Mongoose sẽ tự động xử lý nếu field chưa tồn tại
    
    console.log('Checking user model for relatedActivities field...');
    
    // Tìm tất cả tour-guide và khởi tạo relatedActivities nếu chưa có
    const tourGuides = await User.find({ role: 'tour-guide' });
    
    let updatedCount = 0;
    for (const guide of tourGuides) {
      // Kiểm tra nếu guide chưa có relatedActivities
      if (!guide.relatedActivities || !Array.isArray(guide.relatedActivities)) {
        guide.relatedActivities = [];
        await guide.save();
        updatedCount++;
        console.log(`Updated guide: ${guide.name} (${guide.email})`);
      }
    }
    
    console.log(`✅ Update completed. Updated ${updatedCount} tour-guides`);
    
    // Kiểm tra schema
    const sampleUser = await User.findOne();
    console.log('Sample user schema fields:', Object.keys(sampleUser._doc));
    
  } catch (error) {
    console.error('Error updating user model:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Chạy script
updateUserModel();