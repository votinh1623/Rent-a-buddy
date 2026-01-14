// backend/src/scripts/seedTravellers.js
import mongoose from 'mongoose';
import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample data for travellers
const sampleTravellers = [
  {
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    password: "password123",
    pfp: "https://res.cloudinary.com/drmswobax/image/upload/v1768360063/8703abf0-2180-11ef-9628-ff2abcc9602e_fc60sl.jpg",
    gender: "Male",
    address: "123 Main St, New York, USA"
  },
  {
    name: "Maria Garcia",
    email: "maria.garcia@example.com",
    password: "password123",
    pfp: "https://res.cloudinary.com/drmswobax/image/upload/v1768359997/Son_Tung_M-TP_1__282017_29_jfzjk0.png",
    gender: "Female",
    address: "456 Oak Ave, Los Angeles, USA"
  },
  {
    name: "David Smith",
    email: "david.smith@example.com",
    password: "password123",
    pfp: "https://res.cloudinary.com/drmswobax/image/upload/v1768359836/ab67616d00001e022b3cabafe560905931e6ae28_wlfrij.jpg",
    gender: "Male",
    address: "789 Pine Rd, Chicago, USA"
  },
  {
    name: "Sarah Wilson",
    email: "sarah.wilson@example.com",
    password: "password123",
    pfp: "https://res.cloudinary.com/drmswobax/image/upload/v1768359836/ab67616d00001e022b3cabafe560905931e6ae28_wlfrij.jpg",
    gender: "Female",
    address: "321 Elm St, Miami, USA"
  },
  {
    name: "James Brown",
    email: "james.brown@example.com",
    password: "password123",
    pfp: "https://res.cloudinary.com/drmswobax/image/upload/v1768359997/Son_Tung_M-TP_1__282017_29_jfzjk0.png",
    gender: "Male",
    address: "654 Maple Dr, Seattle, USA"
  },
  {
    name: "Emma Davis",
    email: "emma.davis@example.com",
    password: "password123",
    pfp: "https://res.cloudinary.com/drmswobax/image/upload/v1768359836/ab67616d00001e022b3cabafe560905931e6ae28_wlfrij.jpg",
    gender: "Female",
    address: "987 Birch Ln, Boston, USA"
  },
  {
    name: "Michael Taylor",
    email: "michael.taylor@example.com",
    password: "password123",
    pfp: "https://res.cloudinary.com/drmswobax/image/upload/v1768359997/Son_Tung_M-TP_1__282017_29_jfzjk0.png",
    gender: "Male",
    address: "147 Cedar Ave, San Francisco, USA"
  },
  {
    name: "Sophia Martinez",
    email: "sophia.martinez@example.com",
    password: "password123",
    pfp: "https://res.cloudinary.com/drmswobax/image/upload/v1768360063/8703abf0-2180-11ef-9628-ff2abcc9602e_fc60sl.jpg",
    gender: "Female",
    address: "258 Spruce St, Austin, USA"
  },
  {
    name: "Robert Miller",
    email: "robert.miller@example.com",
    password: "password123",
    pfp: "https://res.cloudinary.com/drmswobax/image/upload/v1768360158/elon_musk_royal_society_sjw6ew.jpg",
    gender: "Male",
    address: "369 Walnut Rd, Denver, USA"
  },
  {
    name: "Olivia Anderson",
    email: "olivia.anderson@example.com",
    password: "password123",
    pfp: "https://res.cloudinary.com/drmswobax/image/upload/v1768360158/elon_musk_royal_society_sjw6ew.jpg",
    gender: "Female",
    address: "741 Willow Way, Phoenix, USA"
  }
];

// Additional travellers with Vietnamese names
const vietnameseTravellers = [
  {
    name: "Nguyen Van A",
    email: "nguyenvana@example.com",
    password: "password123",
    pfp: "https://res.cloudinary.com/drmswobax/image/upload/v1768360063/8703abf0-2180-11ef-9628-ff2abcc9602e_fc60sl.jpg",
    gender: "Male",
    address: "12 Le Loi, District 1, Ho Chi Minh City"
  },
  {
    name: "Tran Thi B",
    email: "tranthib@example.com",
    password: "password123",
    pfp: "https://res.cloudinary.com/drmswobax/image/upload/v1768360158/elon_musk_royal_society_sjw6ew.jpg",
    gender: "Female",
    address: "34 Tran Hung Dao, Hanoi"
  },
  {
    name: "Le Minh C",
    email: "leminhc@example.com",
    password: "password123",
    pfp: "https://res.cloudinary.com/drmswobax/image/upload/v1768360063/8703abf0-2180-11ef-9628-ff2abcc9602e_fc60sl.jpg",
    gender: "Male",
    address: "56 Bach Dang, Da Nang"
  }
];

// Combine all travellers
const allTravellers = [...sampleTravellers, ...vietnameseTravellers];

// Hash password function
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

// Seed function
const seedTravellers = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/rentabuddy';
    
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Check if travellers already exist
    const existingCount = await User.countDocuments({ role: 'traveller' });
    console.log(`📊 Existing travellers in database: ${existingCount}`);
    
    if (existingCount >= allTravellers.length) {
      console.log('✅ Travellers already seeded. Skipping...');
      mongoose.connection.close();
      return;
    }
    
    console.log('🚀 Starting traveller seeding...');
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const travellerData of allTravellers) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: travellerData.email });
      
      if (existingUser) {
        console.log(`⏩ Skipping ${travellerData.email} - already exists`);
        skippedCount++;
        continue;
      }
      
      // Hash password
      const hashedPassword = await hashPassword(travellerData.password);
      
      // Create traveller with role and other defaults
      const traveller = new User({
        ...travellerData,
        password: hashedPassword,
        role: 'traveller',
        isActive: true,
        lastOnline: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random last online within 7 days
      });
      
      await traveller.save();
      createdCount++;
      console.log(`✅ Created traveller: ${traveller.name} (${traveller.email})`);
    }
    
    console.log('\n🎉 Seeding completed!');
    console.log(`📈 Created: ${createdCount} travellers`);
    console.log(`⏩ Skipped: ${skippedCount} (already existed)`);
    console.log(`📊 Total travellers in database: ${existingCount + createdCount}`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    
  } catch (error) {
    console.error('❌ Error seeding travellers:', error);
    process.exit(1);
  }
};

// Run the seed function if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTravellers();
}

seedTravellers();