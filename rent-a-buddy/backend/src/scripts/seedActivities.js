// backend/src/scripts/seedActivities.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Activity from '../models/activity.model.js';

dotenv.config();

const activitiesData = [
  {
    name: "Street Food Tour",
    description: "Explore local street food markets and try authentic dishes from street vendors",
    category: "food",
    icon: "🍜",
    color: "#f59e0b",
    isPopular: true
  },
  {
    name: "Historical Landmarks",
    description: "Visit ancient temples, pagodas, and historical sites with cultural significance",
    category: "history",
    icon: "🏛️",
    color: "#10b981",
    isPopular: true
  },
  {
    name: "Beach Adventure",
    description: "Enjoy water sports, sunbathing, and beach activities at beautiful coastal areas",
    category: "nature",
    icon: "🏖️",
    color: "#3b82f6",
    isPopular: true
  },
  {
    name: "Nightlife Exploration",
    description: "Experience local bars, clubs, night markets, and vibrant night scenes",
    category: "nightlife",
    icon: "🌃",
    color: "#8b5cf6",
    isPopular: true
  },
  {
    name: "Photography Tour",
    description: "Capture stunning photos of cityscapes, landscapes, and cultural moments",
    category: "photography",
    icon: "📸",
    color: "#ef4444",
    isPopular: true
  },
  {
    name: "Mountain Hiking",
    description: "Challenging hikes through mountains with breathtaking natural views",
    category: "adventure",
    icon: "⛰️",
    color: "#059669",
    isPopular: false
  },
  {
    name: "Local Market Shopping",
    description: "Shop for souvenirs, handicrafts, and local products in traditional markets",
    category: "shopping",
    icon: "🛍️",
    color: "#f97316",
    isPopular: true
  },
  {
    name: "Cooking Class",
    description: "Learn to cook traditional local dishes with hands-on cooking lessons",
    category: "food",
    icon: "👨‍🍳",
    color: "#dc2626",
    isPopular: false
  },
  {
    name: "Cycling Tour",
    description: "Explore the city or countryside on bicycle through scenic routes",
    category: "sports",
    icon: "🚴‍♂️",
    color: "#06b6d4",
    isPopular: false
  },
  {
    name: "Cultural Performances",
    description: "Watch traditional dance, music, and theater performances",
    category: "culture",
    icon: "🎭",
    color: "#8b5cf6",
    isPopular: true
  },
  {
    name: "Coffee Culture",
    description: "Explore local coffee shops and learn about coffee brewing techniques",
    category: "food",
    icon: "☕",
    color: "#92400e",
    isPopular: false
  },
  {
    name: "Temple Meditation",
    description: "Practice meditation and mindfulness in serene temple environments",
    category: "wellness",
    icon: "🧘‍♂️",
    color: "#10b981",
    isPopular: false
  },
  {
    name: "River Cruise",
    description: "Enjoy scenic boat rides along rivers with beautiful waterfront views",
    category: "nature",
    icon: "🚤",
    color: "#3b82f6",
    isPopular: true
  },
  {
    name: "Art Gallery Tour",
    description: "Visit contemporary and traditional art galleries and museums",
    category: "culture",
    icon: "🖼️",
    color: "#8b5cf6",
    isPopular: false
  },
  {
    name: "Street Art Discovery",
    description: "Discover vibrant street art and murals in urban neighborhoods",
    category: "culture",
    icon: "🎨",
    color: "#ec4899",
    isPopular: true
  }
];

const seedActivities = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Xóa tất cả activities hiện có (nếu muốn reset)
    await Activity.deleteMany({});
    console.log('Cleared existing activities');

    // Thêm từng activity một (đảm bảo mỗi activity chỉ có 1)
    let createdCount = 0;
    for (const activityData of activitiesData) {
      // Kiểm tra xem activity đã tồn tại chưa
      const existingActivity = await Activity.findOne({ 
        name: activityData.name,
        category: activityData.category 
      });
      
      if (!existingActivity) {
        const activity = new Activity(activityData);
        await activity.save();
        createdCount++;
        console.log(`Created activity: ${activity.name} (${activity.category})`);
      } else {
        console.log(`Activity already exists: ${activityData.name}`);
      }
    }

    console.log(`✅ Seeding completed. Created ${createdCount} activities`);

    // Hiển thị thống kê
    const totalActivities = await Activity.countDocuments();
    const popularCount = await Activity.countDocuments({ isPopular: true });
    
    console.log('\n📊 Activity Statistics:');
    console.log(`Total activities: ${totalActivities}`);
    console.log(`Popular activities: ${popularCount}`);
    
    // Hiển thị theo category
    const activitiesByCategory = await Activity.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📈 Activities by category:');
    activitiesByCategory.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count} activities`);
    });

  } catch (error) {
    console.error('Error seeding activities:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Chạy script
seedActivities();