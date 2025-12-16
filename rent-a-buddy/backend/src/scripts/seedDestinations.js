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
    isPopular: true,
    activities: [
      "6937e6ad422fda32465714dd", // Beach Adventure
      "6937e6ae422fda32465714e3", // Photography Tour
      "6937e6af422fda32465714ef", // Cycling Tour
      "6937e6ae422fda32465714e0", // Nightlife Exploration
      "6937e6af422fda32465714f5", // Coffee Culture
      "6937e6b0422fda32465714fb"  // River Cruise (tour ven biển - du thuyền)
    ],
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
    isPopular: true,
    activities: [
      "6937e6ad422fda32465714da", // Historical Landmarks
      "6937e6af422fda32465714f8", // Temple Meditation
      "6937e6ae422fda32465714e6", // Mountain Hiking
      "6937e6ae422fda32465714e3", // Photography Tour
      "6937e6b0422fda3246571501", // Street Art Discovery (sơn khắc, tượng)
      "6937e6b0422fda32465714fe"  // Art Gallery Tour (làng đá mỹ nghệ Non Nước)
    ],
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
    isPopular: true,
    activities: [
      "6937e6ae422fda32465714e0", // Nightlife Exploration
      "6937e6ae422fda32465714e3", // Photography Tour
      "6937e6b0422fda32465714fb", // River Cruise (du thuyền xem rồng phun lửa)
      "6937e6ad422fda32465714d7", // Street Food Tour (khu vực cầu Rồng rất nhiều food tour)
      "6937e6af422fda32465714f5"  // Coffee Culture (cafe view cầu Rồng)
    ],
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
    isPopular: true,
    name: "Ba Na Hills",
    activities: [
      "6937e6ae422fda32465714e6", // Mountain Hiking (đường trekking quanh khu vực rừng)
      "6937e6ae422fda32465714e3", // Photography Tour
      "6937e6ad422fda32465714da", // Historical Landmarks (chùa Linh Ứng 2 trên đỉnh Bà Nà)
      "6937e6af422fda32465714f2", // Cultural Performances (show Châu Âu tại quảng trường)
      "6937e6ae422fda32465714e9", // Local Market Shopping
      "6937e6b0422fda32465714fe", // Art Gallery Tour (khu trưng bày trong French Village)
    ],

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
    isPopular: false,
    name: "Han Market",
    activities: [
      "6937e6ae422fda32465714e9", // Local Market Shopping
      "6937e6ad422fda32465714d7", // Street Food Tour
      "6937e6af422fda32465714f5", // Coffee Culture
      "6937e6b0422fda3246571501", // Street Art Discovery
      "6937e6ae422fda32465714e0", // Nightlife Exploration (khu trung tâm thành phố)
      "6937e6b0422fda32465714fb"  // River Cruise (chợ Hàn ngay bờ sông Hàn)
    ],

  },
  {
    name: "Museum of Cham Sculpture",
    description: "The world's largest collection of Cham artifacts, showcasing ancient sculptures and carvings.",
    city: "Da Nang",
    country: "Vietnam",
    coverImg: "https://res.cloudinary.com/drmswobax/image/upload/v1765506823/Chi_C3_AAm-Ng_C6_B0_E1_BB_A1ng-B_E1_BA_A3o-V_E1_BA_ADt-Qu_E1_BB_91c-Gia-1_rghyeb.png",
    latitude: 16.0719,
    longitude: 108.2224,
    address: "02 2 Thang 9 Street, Da Nang",
    isPopular: false,
    activities: [
      "6937e6ad422fda32465714da", // Historical Landmarks
      "6937e6af422fda32465714f2", // Cultural Performances
      "6937e6b0422fda32465714fe", // Art Gallery Tour
      "6937e6b0422fda3246571501", // Street Art Discovery
      "6937e6ae422fda32465714e3"  // Photography Tour
    ],
  },
  {
    name: "Linh Ung Pagoda (Lady Buddha)",
    description: "A spiritual pagoda featuring Vietnam’s tallest Lady Buddha statue with panoramic views over Da Nang.",
    city: "Da Nang",
    country: "Vietnam",
    coverImg: "https://res.cloudinary.com/drmswobax/image/upload/v1765507637/Linh-Ung-Pagoda-4_nkfzwx.jpg",
    latitude: 16.1191,
    longitude: 108.2835,
    address: "Bai But, Son Tra Peninsula, Da Nang",
    isPopular: true,
    activities: [
      "6937e6ad422fda32465714da", // Historical Landmarks
      "6937e6af422fda32465714f8", // Temple Meditation
      "6937e6ae422fda32465714e3", // Photography Tour
      "6937e6b0422fda3246571501", // Street Art Discovery (các khu tượng/chạm khắc)
      "6937e6ae422fda32465714e6"  // Mountain Hiking (dốc quanh chùa)
    ],


  },
  {
    name: "Son Tra Peninsula (Monkey Mountain)",
    description: "A lush protected rainforest home to rare wildlife, scenic viewpoints, and coastal hiking trails.",
    city: "Da Nang",
    country: "Vietnam",
    coverImg: "https://res.cloudinary.com/drmswobax/image/upload/v1765507721/Son-Tra-Mountain-01_1673941657_dtvbuo.jpg",
    latitude: 16.1200,
    longitude: 108.3000,
    address: "Son Tra Peninsula, Da Nang",
    isPopular: true,
    activities: [
      "6937e6ae422fda32465714e6", // Mountain Hiking
      "6937e6ad422fda32465714dd", // Beach Adventure
      "6937e6ae422fda32465714e3", // Photography Tour
      "6937e6af422fda32465714ef", // Cycling Tour
      "6937e6b0422fda32465714fb"  // River Cruise (các tour xuất phát từ sông Hàn ra Sơn Trà)
    ],
  },
  {
    name: "Hoi An Ancient Town",
    description: "A UNESCO World Heritage town famous for lantern-lit streets, traditional houses, and vibrant culture.",
    city: "Da Nang",
    country: "Vietnam",
    coverImg: "https://res.cloudinary.com/drmswobax/image/upload/v1765507777/11125-Qu_E1_BA_A3ng_20Nam-huybank_40gmail.com-hoi_20an_20ve_20dem_20_ofkkvx.jpg",
    latitude: 15.8801,
    longitude: 108.3380,
    address: "Hoi An Ancient Town, Quang Nam Province",
    isPopular: true,
    activities: [
      "6937e6ad422fda32465714d7", // Street Food Tour
      "6937e6ae422fda32465714ec", // Cooking Class
      "6937e6af422fda32465714f5", // Coffee Culture
      "6937e6ad422fda32465714da", // Historical Landmarks
      "6937e6ae422fda32465714e9", // Local Market Shopping
      "6937e6af422fda32465714f2", // Cultural Performances
      "6937e6ae422fda32465714e3", // Photography Tour
      "6937e6ae422fda32465714e0", // Nightlife Exploration
      "6937e6b0422fda32465714fb"  // River Cruise (đèn lồng sông Hoài)
    ],

  },
  {
    name: "Nui Than Tai Hot Springs",
    description: "A natural hot spring resort offering mineral pools, mud baths, and wellness experiences.",
    city: "Da Nang",
    country: "Vietnam",
    coverImg: "https://res.cloudinary.com/drmswobax/image/upload/v1765507808/nui-than-tai_z49edl.jpg",
    latitude: 15.9889,
    longitude: 107.9884,
    address: "National Highway 14G, Hoa Phu, Da Nang",
    isPopular: true,
    activities: [
      "6937e6af422fda32465714f8", // Temple Meditation (kết hợp spa thiền)
      "6937e6ad422fda32465714dd", // Beach/Nature Adventure
      "6937e6ae422fda32465714e3", // Photography Tour
      "6937e6ae422fda32465714e6", // Mountain Hiking (khu vực núi xung quanh)
      "6937e6b0422fda32465714fb"  // River Cruise (tour kết hợp Bà Nà / suối khoáng)
    ],

  },
  {
    name: "Cham Islands",
    description: "A pristine marine reserve featuring coral reefs, white sandy beaches, and snorkeling activities.",
    city: "Da Nang",
    country: "Vietnam",
    coverImg: "https://res.cloudinary.com/drmswobax/image/upload/v1765507878/caption_qxzekv.jpg",
    latitude: 15.9470,
    longitude: 108.4870,
    address: "Cham Islands, Quang Nam Province",
    isPopular: true,
    activities: [
      "6937e6ad422fda32465714dd", // Beach Adventure
      "6937e6ae422fda32465714e6", // Mountain Hiking
      "6937e6ae422fda32465714e3", // Photography Tour
      "6937e6ad422fda32465714d7", // Street Food Tour (hải sản địa phương)
      "6937e6af422fda32465714ef", // Cycling Tour
      "6937e6ae422fda32465714e9", // Local Market Shopping
      "6937e6b0422fda32465714fb"  // River/Ocean Cruise (cano tour)
    ],

  },
{
    name: "Love Lock Bridge",
    description: "A romantic bridge over the Han River adorned with thousands of love locks from couples worldwide, offering stunning city views",
    city: "Da Nang",
    country: "Vietnam",
    coverImg: "https://res.cloudinary.com/drmswobax/image/upload/v1765514258/love-bridge-da-nang_txjz94.png",
    latitude: 16.0714,
    longitude: 108.2238,
    address: "Tran Hung Dao Street, Son Tra, Da Nang",
    isPopular: true,
    activities: [
      "6937e6ae422fda32465714e3", // Photography Tour
      "6937e6ae422fda32465714e0", // Nightlife Exploration
      "6937e6b0422fda32465714fb", // River Cruise
      "6937e6af422fda32465714f5", // Coffee Culture (café view cầu Tình Yêu)
      "6937e6b0422fda3246571501", // Street Art Discovery (nghệ thuật ánh sáng trên cầu)
      "6937e6ad422fda32465714d7"  // Street Food Tour (khu ăn vặt quanh cầu)
    ]
  },
  {
    name: "Asia Park (Sun World Danang Wonders)",
    description: "A modern amusement park featuring the iconic Sun Wheel, thrilling rides, cultural zones, and entertainment shows",
    city: "Da Nang",
    country: "Vietnam",
    coverImg: "https://res.cloudinary.com/drmswobax/image/upload/v1765514323/scjd7xbufij2grfywbjt_bagnyi.jpg",
    latitude: 16.0603,
    longitude: 108.2247,
    address: "01 Phan Dang Luu, Hai Chau, Da Nang",
    isPopular: true,
    activities: [
      "6937e6af422fda32465714f2", // Cultural Performances (show văn hóa các nước châu Á)
      "6937e6ae422fda32465714e3", // Photography Tour (vòng quay Mặt Trời iconic)
      "6937e6ae422fda32465714e0", // Nightlife Exploration
      "6937e6ad422fda32465714d7", // Street Food Tour (khu ẩm thực châu Á)
      "6937e6b0422fda3246571501", // Street Art Discovery (các khu vực trang trí)
      "6937e6ae422fda32465714e9"  // Local Market Shopping (quầy lưu niệm các nước)
    ]
  }
];

const seedDestinations = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('Starting destination seeding...');
    
    // Xóa destinations cũ
    const deleteResult = await Destination.deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} existing destinations`);
    
    // Kiểm tra các activity IDs có tồn tại không
    const allActivityIds = [
      ...new Set(destinationsData.flatMap(dest => dest.activities || []))
    ];
    
    if (allActivityIds.length > 0) {
      const existingActivities = await Activity.find({
        _id: { $in: allActivityIds }
      }).select('_id');
      
      const existingActivityIds = existingActivities.map(a => a._id.toString());
      const missingActivityIds = allActivityIds.filter(id => !existingActivityIds.includes(id));
      
      if (missingActivityIds.length > 0) {
        console.warn('⚠️ Warning: Some activity IDs do not exist:', missingActivityIds);
      }
    }
    
    // Thêm destinations mới
    const result = await Destination.insertMany(destinationsData);
    console.log(`✅ Successfully seeded ${result.length} destinations`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error seeding destinations:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

seedDestinations();