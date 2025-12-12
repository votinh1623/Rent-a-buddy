// backend/src/scripts/seedDestinations.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Destination from '../models/destination.model.js';
import Activity from '../models/activity.model.js';

dotenv.config();

const destinationsData = [
  {
    name: "My Khe Beach",
    description: "Famous for its white sand and clear blue water, perfect for swimming and water sports",
    city: "Da Nang",
    country: "Vietnam",
    coverImg: "https://res.cloudinary.com/drmswobax/image/upload/v1765500450/mykhe-16783491546921642441300_mqrfxb.jpg",
    latitude: 16.0584,
    longitude: 108.2388,
    address: "My Khe Beach, Da Nang",
    isPopular: true
  },
  {
    name: "Marble Mountains",
    description: "Cluster of five marble and limestone hills with caves, tunnels, and Buddhist sanctuaries",
    city: "Da Nang",
    country: "Vietnam",
    coverImg: "https://res.cloudinary.com/drmswobax/image/upload/v1765500574/marble-moutains-3_1701683633_cpiyil.jpg",
    latitude: 16.0017,
    longitude: 108.2643,
    address: "Hoa Hai, Ngu Hanh Son, Da Nang",
    isPopular: true
  },
  {
    name: "Dragon Bridge",
    description: "Iconic bridge shaped like a dragon that breathes fire and water on weekends",
    city: "Da Nang",
    country: "Vietnam",
    coverImg: "https://res.cloudinary.com/drmswobax/image/upload/v1765500625/140630220413-dragon-bridge-fire-breathing_ck6qkf.jpg",
    latitude: 16.0619,
    longitude: 108.2261,
    address: "Dragon Bridge, Da Nang",
    isPopular: true
  },
  {
    name: "Ba Na Hills",
    description: "Hill station and resort with French village, Golden Bridge, and cable car",
    city: "Da Nang",
    country: "Vietnam",
    coverImg: "https://res.cloudinary.com/drmswobax/image/upload/v1765500672/ba-na-hills-amusement-park_un1xci.webp",
    latitude: 15.9986,
    longitude: 107.9947,
    address: "Hoa Ninh, Hoa Vang, Da Nang",
    isPopular: true
  },
  {
    name: "Han Market",
    description: "Traditional market selling local products, food, and souvenirs",
    city: "Da Nang",
    country: "Vietnam",
    coverImg: "https://res.cloudinary.com/drmswobax/image/upload/v1765500769/ee1c714a-cho-han-da-nang-1_hemigq.jpg",
    latitude: 16.0719,
    longitude: 108.2224,
    address: "119 Tran Phu, Hai Chau, Da Nang",
    isPopular: false
  }
];

const seedDestinations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Get some activity IDs to associate
    const activities = await Activity.find().limit(3);
    const activityIds = activities.map(a => a._id);
    
    // Clear existing destinations
    await Destination.deleteMany({});
    
    // Add activities to each destination
    const destinationsWithActivities = destinationsData.map(dest => ({
      ...dest,
      activities: activityIds
    }));
    
    await Destination.insertMany(destinationsWithActivities);
    
    console.log(`✅ Seeded ${destinationsData.length} destinations`);
    
  } catch (error) {
    console.error('❌ Error seeding destinations:', error);
  } finally {
    await mongoose.disconnect();
  }
};

seedDestinations();