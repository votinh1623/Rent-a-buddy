// backend/src/scripts/updateDestinationsCoordinates.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Destination from '../models/destination.model.js';

dotenv.config();

const updateDestinationsCoordinates = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('Updating destinations with coordinates...');
    
    // Danh sách các địa điểm cần cập nhật tọa độ
    const destinationsToUpdate = [
        {
            "_id": "693b9c6ed8ce98c7d7f2a264",
            "name": "My Khe Beach",
            "location": {
                "latitude": 16.0594,
                "longitude": 108.2408
            }
        },
        {
            "_id": "693b9c6ed8ce98c7d7f2a265",
            "name": "Marble Mountains",
            "location": {
                "latitude": 16.0019,
                "longitude": 108.2692
            }
        },
        {
            "_id": "693b9c6ed8ce98c7d7f2a266",
            "name": "Dragon Bridge",
            "location": {
                "latitude": 16.0619,
                "longitude": 108.2295
            }
        },
        {
            "_id": "693b9c6ed8ce98c7d7f2a267",
            "name": "Ba Na Hills",
            "location": {
                "latitude": 15.9956,
                "longitude": 107.9953
            }
        },
        {
            "_id": "693b9c6ed8ce98c7d7f2a268",
            "name": "Han Market",
            "location": {
                "latitude": 16.0700,
                "longitude": 108.2210
            }
        },
        {
            "_id": "693b9c6ed8ce98c7d7f2a269",
            "name": "Museum of Cham Sculpture",
            "location": {
                "latitude": 16.0622,
                "longitude": 108.2250
            }
        },
        {
            "_id": "693b9c6ed8ce98c7d7f2a26a",
            "name": "Linh Ung Pagoda (Lady Buddha)",
            "location": {
                "latitude": 16.1156,
                "longitude": 108.2867
            }
        },
        {
            "_id": "693b9c6ed8ce98c7d7f2a26b",
            "name": "Son Tra Peninsula (Monkey Mountain)",
            "location": {
                "latitude": 16.1118,
                "longitude": 108.2557
            }
        },
        {
            "_id": "693b9c6ed8ce98c7d7f2a26d",
            "name": "Nui Than Tai Hot Springs",
            "location": {
                "latitude": 15.9500,
                "longitude": 108.1500
            }
        },
        {
            "_id": "693b9c6ed8ce98c7d7f2a26e",
            "name": "Cham Islands",
            "location": {
                "latitude": 15.9522,
                "longitude": 108.5317
            }
        },
        {
            "_id": "693b9c6ed8ce98c7d7f2a26f",
            "name": "Love Lock Bridge",
            "location": {
                "latitude": 16.0692,
                "longitude": 108.2281
            }
        },
        {
            "_id": "693b9c6ed8ce98c7d7f2a270",
            "name": "Asia Park (Sun World Danang Wonders)",
            "location": {
                "latitude": 16.0684,
                "longitude": 108.2301
            }
        }
    ];

    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const destData of destinationsToUpdate) {
        try {
            const destination = await Destination.findById(destData._id);
            
            if (!destination) {
                console.log(`❌ Destination not found: ${destData.name} (${destData._id})`);
                skippedCount++;
                continue;
            }
            
            // Kiểm tra nếu đã có location
            if (destination.location && 
                destination.location.latitude && 
                destination.location.longitude) {
                console.log(`⚠️ Destination already has coordinates: ${destination.name}`);
                skippedCount++;
                continue;
            }
            
            // Cập nhật location
            destination.location = destData.location;
            await destination.save();
            
            updatedCount++;
            console.log(`✅ Updated coordinates for: ${destination.name}`);
            
        } catch (error) {
            console.error(`Error updating ${destData.name}:`, error.message);
        }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} destinations`);
    console.log(`⚠️ Skipped (already have coordinates): ${skippedCount} destinations`);
    console.log(`📋 Total processed: ${updatedCount + skippedCount} destinations`);
    
    // Hiển thị thông tin mẫu sau khi update
    const sampleDestination = await Destination.findOne();
    console.log('\n📝 Sample destination after update:');
    console.log(`Name: ${sampleDestination.name}`);
    console.log(`Location: ${JSON.stringify(sampleDestination.location)}`);
    
  } catch (error) {
    console.error('Error updating destinations:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Chạy script
updateDestinationsCoordinates();