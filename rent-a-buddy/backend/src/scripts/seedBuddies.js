// backend/scripts/seedBuddies.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import Destination from '../models/destination.model.js';
import Activity from '../models/activity.model.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const seedBuddies = async () => {
  try {
    await connectDB();
    
    // Clear existing tour-guides (optional)
    // await User.deleteMany({ role: 'tour-guide' });
    // console.log('🗑️  Cleared existing tour-guides');
    
    // Get all destinations
    const destinations = await Destination.find({ isActive: true }).select('_id');
    const destinationIds = destinations.map(d => d._id);
    
    // Get all activities
    const activities = await Activity.find({ isActive: true }).select('_id');
    const activityIds = activities.map(a => a._id);
    
    if (destinationIds.length === 0) {
      console.log('❌ No destinations found. Please seed destinations first.');
      process.exit(1);
    }
    
    if (activityIds.length === 0) {
      console.log('❌ No activities found. Please seed activities first.');
      process.exit(1);
    }
    
    console.log(`📌 Found ${destinationIds.length} destinations and ${activityIds.length} activities`);
    
    // Sample data for buddies
    const buddyData = [
  {
    name: "Anh Vu",
    email: "anh.architecture@example.com",
    password: "password123",
    bio: "Architectural historian passionate about colonial and modern Vietnamese architecture. Expert in hidden architectural gems of Hanoi.",
    hourlyRate: 28,
    yearsOfExperience: 6,
    languages: ["Vietnamese", "English", "French"],
    specialties: ["Architecture Tours", "Heritage Buildings", "Urban Exploration"],
    phoneNumber: "+84 123 555 777",
    isVerified: true,
    transportation: ["Walking", "Bicycle"],
    certifications: [
      {
        name: "Architectural Guide Certification",
        issuingOrganization: "Vietnam Heritage Association",
        year: 2019
      }
    ]
  },
  {
    name: "Bao Nguyen",
    email: "bao.motorbike@example.com",
    password: "password123",
    bio: "Former motorbike racer offering thrilling but safe tours through Ha Giang loop and coastal roads. Safety-first approach.",
    hourlyRate: 33,
    yearsOfExperience: 8,
    languages: ["Vietnamese", "English"],
    specialties: ["Motorbike Adventures", "Ha Giang Loop", "Coastal Rides"],
    phoneNumber: "+84 988 456 123",
    isVerified: true,
    transportation: ["Motorbike"],
    certifications: [
      {
        name: "Advanced Riding Instructor",
        issuingOrganization: "Vietnam Motorbike Association",
        year: 2020
      }
    ]
  },
  {
    name: "Chi Le",
    email: "chi.market@example.com",
    password: "password123",
    bio: "Local market expert who knows every vendor in Ben Thanh Market. Teaches the art of Vietnamese bargaining and market navigation.",
    hourlyRate: 22,
    yearsOfExperience: 4,
    languages: ["Vietnamese", "English", "Cantonese"],
    specialties: ["Market Tours", "Shopping Guides", "Culinary Shopping"],
    phoneNumber: "+84 912 345 678",
    isVerified: true,
    transportation: ["Walking", "Motorbike"],
    certifications: [
      {
        name: "Market Tourism Specialist",
        issuingOrganization: "Vietnam Commerce Department",
        year: 2020
      }
    ]
  },
  {
    name: "Duc Tran",
    email: "duc.river@example.com",
    password: "password123",
    bio: "Mekong Delta native offering authentic river life experiences, floating market tours, and homestay arrangements with local families.",
    hourlyRate: 25,
    yearsOfExperience: 7,
    languages: ["Vietnamese", "English", "Khmer"],
    specialties: ["River Tours", "Floating Markets", "Homestay Experiences"],
    phoneNumber: "+84 933 444 555",
    isVerified: true,
    transportation: ["Walking"],
    certifications: [
      {
        name: "River Guide Certification",
        issuingOrganization: "Mekong Tourism Board",
        year: 2018
      }
    ]
  },
  {
    name: "Elena Rossi",
    email: "elena.art@example.com",
    password: "password123",
    bio: "Art historian and gallery curator specializing in contemporary Vietnamese art scenes and traditional craft villages around Hoi An.",
    hourlyRate: 30,
    yearsOfExperience: 5,
    languages: ["Italian", "English", "Vietnamese"],
    specialties: ["Art Tours", "Gallery Visits", "Craft Villages"],
    phoneNumber: "+84 944 555 666",
    isVerified: true,
    transportation: ["Car", "Walking"],
    certifications: [
      {
        name: "Art History Guide",
        issuingOrganization: "Vietnam Arts Council",
        year: 2021
      }
    ]
  },
  {
    name: "Fang Li",
    email: "fang.temple@example.com",
    password: "password123",
    bio: "Buddhist scholar offering spiritual tours of pagodas and temples. Explains Buddhist philosophy and meditation practices.",
    hourlyRate: 26,
    yearsOfExperience: 9,
    languages: ["Chinese", "English", "Vietnamese"],
    specialties: ["Temple Tours", "Spiritual Journeys", "Meditation Guidance"],
    phoneNumber: "+84 955 666 777",
    isVerified: true,
    transportation: ["Walking", "Car"],
    certifications: [
      {
        name: "Religious Tourism Guide",
        issuingOrganization: "Vietnam Buddhist Association",
        year: 2017
      }
    ]
  },
  {
    name: "Giang Hoang",
    email: "giang.coffee@example.com",
    password: "password123",
    bio: "Coffee connoisseur and former barista champion offering specialty coffee tours through Vietnam's best coffee regions.",
    hourlyRate: 24,
    yearsOfExperience: 3,
    languages: ["Vietnamese", "English"],
    specialties: ["Coffee Tours", "Farm Visits", "Brewing Workshops"],
    phoneNumber: "+84 966 777 888",
    isVerified: true,
    transportation: ["Car", "Motorbike"],
    certifications: [
      {
        name: "Specialty Coffee Guide",
        issuingOrganization: "Vietnam Coffee Association",
        year: 2022
      }
    ]
  },
  {
    name: "Hiroshi Yamamoto",
    email: "hiroshi.photography@example.com",
    password: "password123",
    bio: "Award-winning travel photographer offering photography workshops combined with tours to Vietnam's most photogenic locations.",
    hourlyRate: 38,
    yearsOfExperience: 12,
    languages: ["Japanese", "English", "Vietnamese"],
    specialties: ["Photography Workshops", "Landscape Photography", "Travel Photography"],
    phoneNumber: "+84 977 888 999",
    isVerified: true,
    transportation: ["Car", "Walking"],
    certifications: [
      {
        name: "Professional Travel Photographer",
        issuingOrganization: "National Geographic Society",
        year: 2016
      }
    ]
  },
  {
    name: "Isabella Martinez",
    email: "isabella.festival@example.com",
    password: "password123",
    bio: "Cultural events specialist with insider access to local festivals, traditional ceremonies, and cultural celebrations.",
    hourlyRate: 29,
    yearsOfExperience: 4,
    languages: ["Spanish", "English", "Vietnamese"],
    specialties: ["Festival Tours", "Cultural Events", "Traditional Ceremonies"],
    phoneNumber: "+84 988 999 000",
    isVerified: true,
    transportation: ["Car", "Public Transport"],
    certifications: [
      {
        name: "Cultural Events Coordinator",
        issuingOrganization: "Vietnam Ministry of Culture",
        year: 2020
      }
    ]
  },
  {
    name: "James Wilson",
    email: "james.warhistory@example.com",
    password: "password123",
    bio: "Military historian specializing in Vietnam War history. Offers respectful and educational tours of historical sites and museums.",
    hourlyRate: 27,
    yearsOfExperience: 8,
    languages: ["English", "Vietnamese"],
    specialties: ["Historical Tours", "War History", "Museum Tours"],
    phoneNumber: "+84 999 000 111",
    isVerified: true,
    transportation: ["Car", "Walking"],
    certifications: [
      {
        name: "Historical Guide",
        issuingOrganization: "Vietnam Historical Society",
        year: 2019
      }
    ]
  }
];
    
    const buddies = [];
    
    for (let i = 0; i < buddyData.length; i++) {
      const buddy = buddyData[i];
      
      // Generate random destinations (1-3 per buddy)
      const numDestinations = Math.floor(Math.random() * 3) + 1;
      const randomDestinations = getRandomItems(destinationIds, numDestinations);
      
      // Generate random activities (2-5 per buddy)
      const numActivities = Math.floor(Math.random() * 4) + 2;
      const randomActivities = getRandomItems(activityIds, numActivities);
      
      // Hash password
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(buddy.password, salt);
      
      // Generate random rating
      const averageRating = parseFloat((Math.random() * 2 + 3).toFixed(1)); // 3.0 - 5.0
      const ratingCount = Math.floor(Math.random() * 50) + 5;
      
      // Generate rating breakdown
      const breakdown = {};
      let remainingCount = ratingCount;
      for (let star = 5; star >= 1; star--) {
        if (star === 1) {
          breakdown[star] = remainingCount;
        } else {
          const max = Math.floor(remainingCount * 0.7);
          const count = Math.floor(Math.random() * max);
          breakdown[star] = count;
          remainingCount -= count;
        }
      }
      
      const newBuddy = new User({
        ...buddy,
        password: hashedPassword,
        role: 'tour-guide',
        relatedDestination: randomDestinations,
        relatedActivities: randomActivities,
        rating: {
          average: averageRating,
          count: ratingCount,
          breakdown: breakdown
        },
        completedBookings: Math.floor(Math.random() * 100) + 10,
        totalBookings: Math.floor(Math.random() * 120) + 15,
        cancellationRate: parseFloat((Math.random() * 10).toFixed(1)),
        pfp: `https://res.cloudinary.com/drmswobax/image/upload/v1766108912/MV5BYzY2NDJlZjctOGI4MC00MTMzLWEwNzktYmJkYWUzODkyZjM3XkEyXkFqcGc._V1_QL75_UY281_CR64_0_190_281__rv1i6e.jpg`,
        address: getRandomAddress(),
        gender: getRandomGender(),
        isAvailableNow: Math.random() > 0.3,
        lastOnline: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last 7 days
        availability: generateRandomAvailability()
      });
      
      buddies.push(newBuddy);
    }
    
    // Insert all buddies
    const insertedBuddies = await User.insertMany(buddies);
    console.log(`✅ Successfully seeded ${insertedBuddies.length} tour guides`);
    
    // Display summary
    console.log('\n📊 Buddy Summary:');
    insertedBuddies.forEach((buddy, index) => {
      console.log(`${index + 1}. ${buddy.name}`);
      console.log(`   Email: ${buddy.email}`);
      console.log(`   Rate: $${buddy.hourlyRate}/hour`);
      console.log(`   Rating: ${buddy.rating.average} ⭐ (${buddy.rating.count} reviews)`);
      console.log(`   Destinations: ${buddy.relatedDestination.length}`);
      console.log(`   Activities: ${buddy.relatedActivities.length}`);
      console.log(`   Verified: ${buddy.isVerified ? '✅' : '❌'}`);
      console.log(`   Available: ${buddy.isAvailableNow ? '✅' : '❌'}`);
      console.log('---');
    });
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error seeding buddies:', error);
    process.exit(1);
  }
};

// Helper functions
function getRandomAddress() {
  const streets = ['Bach Dang', 'Tran Hung Dao', 'Nguyen Van Linh', 'Le Duan', 'Hoang Dieu'];
  const wards = ['Hai Chau', 'Thanh Khe', 'Son Tra', 'Ngu Hanh Son', 'Cam Le'];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const ward = wards[Math.floor(Math.random() * wards.length)];
  const number = Math.floor(Math.random() * 200) + 1;
  return `${number} ${street}, ${ward}, Da Nang`;
}

function getRandomGender() {
  const genders = ['Male', 'Female', 'Other'];
  return genders[Math.floor(Math.random() * genders.length)];
}

function generateRandomAvailability() {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const availability = new Map();
  
  days.forEach(day => {
    if (Math.random() > 0.2) { // 80% chance of being available
      const slots = [];
      const numSlots = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numSlots; i++) {
        const startHour = Math.floor(Math.random() * 6) + 9; // 9 AM - 3 PM
        const endHour = startHour + Math.floor(Math.random() * 4) + 2; // 2-6 hour duration
        slots.push(`${startHour.toString().padStart(2, '0')}:00-${endHour.toString().padStart(2, '0')}:00`);
      }
      
      availability.set(day, slots);
    }
  });
  
  return availability;
}

// Run the script
seedBuddies();