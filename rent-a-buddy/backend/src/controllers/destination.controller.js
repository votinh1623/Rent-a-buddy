// backend/src/controllers/destination.controller.js
import Destination from '../models/destination.model.js';
import Activity from '../models/activity.model.js';
import User from '../models/user.model.js';

// Create destination (Admin only)
export const createDestination = async (req, res) => {
  try {
    const {
      name,
      description,
      city,
      country,
      coverImg,
      activities,
      latitude,
      longitude,
      address,
      isPopular
    } = req.body;

    // Validate required fields
    if (!name || !description || !city || !coverImg) {
      return res.status(400).json({
        success: false,
        message: 'Name, description, city, and coverImg are required'
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    const destination = new Destination({
      name,
      description,
      city,
      country: country || 'Vietnam',
      coverImg,
      activities: activities || [],
      location: {
        latitude,
        longitude
      },
      address: address || '',
      isPopular: isPopular || false
    });

    await destination.save();

    res.status(201).json({
      success: true,
      message: 'Destination created successfully',
      data: destination
    });
  } catch (error) {
    console.error('Create destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating destination',
      error: error.message
    });
  }
};

// Get all destinations (with pagination & filters)
export const getAllDestinations = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 15,
      city,
      country,
      isPopular,
      activityId,
      search
    } = req.query;

    const query = { isActive: true };

    // Apply filters
    if (city) query.city = { $regex: city, $options: 'i' };
    if (country) query.country = { $regex: country, $options: 'i' };
    if (isPopular !== undefined) query.isPopular = isPopular === 'true';
    if (activityId) query.activities = activityId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const destinations = await Destination.find(query)
      .populate('activities', 'name category icon color')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Destination.countDocuments(query);

    res.status(200).json({
      success: true,
      data: destinations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all destinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching destinations',
      error: error.message
    });
  }
};

// Get destination by ID
// Get destinations by IDs
export const getDestinationsByIds = async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({
        success: false,
        message: 'Destination IDs are required'
      });
    }

    const destinationIds = ids.split(',').map(id => {
      try {
        return mongoose.Types.ObjectId.createFromHexString(id.trim());
      } catch {
        return null;
      }
    }).filter(id => id !== null);

    if (destinationIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        count: 0
      });
    }

    const destinations = await Destination.find({
      _id: { $in: destinationIds },
      isActive: true
    }).select('name city country coverImg description activities');

    res.status(200).json({
      success: true,
      data: destinations,
      count: destinations.length
    });
  } catch (error) {
    console.error('Get destinations by IDs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching destinations',
      error: error.message
    });
  }
};

// Get popular destinations
// export const getPopularDestinations = async (req, res) => {
//   try {
//     const { limit = 6 } = req.query;

//     const destinations = await Destination.find({
//       isPopular: true,
//       isActive: true
//     })
//       .populate('activities', 'name category icon')
//       .limit(parseInt(limit))
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       data: destinations
//     });
//   } catch (error) {
//     console.error('Get popular destinations error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching popular destinations',
//       error: error.message
//     });
//   }
// };

// Update destination (Admin only)
export const updateDestination = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If updating location
    if (updateData.latitude || updateData.longitude) {
      updateData.location = {
        latitude: updateData.latitude,
        longitude: updateData.longitude
      };
      delete updateData.latitude;
      delete updateData.longitude;
    }

    const destination = await Destination.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('activities', 'name category icon');

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Destination updated successfully',
      data: destination
    });
  } catch (error) {
    console.error('Update destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating destination',
      error: error.message
    });
  }
};
// Add destination to guide's related destinations
export const addDestinationToGuide = async (req, res) => {
  try {
    const { destinationId } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Validate input
    if (!destinationId) {
      return res.status(400).json({
        success: false,
        message: 'Destination ID is required'
      });
    }

    // Check if destination exists and is active
    const destination = await Destination.findById(destinationId);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    if (!destination.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Destination is not active'
      });
    }

    // Find the user/guide
    const guide = await User.findById(userId);
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is a tour guide
    // Allow both guide and admin to add destinations
    if (guide.role !== 'tour-guide' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only tour guides can add destinations to their profile'
      });
    }

    // Check if destination already added to guide
    if (guide.relatedDestination.includes(destinationId)) {
      return res.status(400).json({
        success: false,
        message: 'Destination already added to your profile'
      });
    }

    // Check limit for destinations per guide (optional)
    const MAX_DESTINATIONS_PER_GUIDE = 10; // You can adjust this number
    if (guide.relatedDestination.length >= MAX_DESTINATIONS_PER_GUIDE) {
      return res.status(400).json({
        success: false,
        message: `You can only add up to ${MAX_DESTINATIONS_PER_GUIDE} destinations to your profile`
      });
    }

    // Add destination to guide's related destinations
    guide.relatedDestination.push(destinationId);
    await guide.save();

    // Populate the destination details for response
    const updatedGuide = await User.findById(userId)
      .populate('relatedDestination', 'name city country coverImg')
      .select('-password -verificationDocuments');

    res.status(200).json({
      success: true,
      message: 'Destination added to your profile successfully',
      data: {
        guide: updatedGuide,
        addedDestination: {
          _id: destination._id,
          name: destination.name,
          city: destination.city,
          country: destination.country
        }
      }
    });
  } catch (error) {
    console.error('Add destination to guide error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid destination ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error adding destination to guide',
      error: error.message
    });
  }
};

// Remove destination from guide's related destinations
export const removeDestinationFromGuide = async (req, res) => {
  try {
    const { destinationId } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Validate input
    if (!destinationId) {
      return res.status(400).json({
        success: false,
        message: 'Destination ID is required'
      });
    }

    // Find the user/guide
    const guide = await User.findById(userId);
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (guide.role !== 'tour-guide' && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only tour guides can manage their destinations'
      });
    }

    // Check if destination exists in guide's list
    const destinationIndex = guide.relatedDestination.indexOf(destinationId);
    if (destinationIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Destination not found in your profile'
      });
    }

    // Remove destination from guide's list
    guide.relatedDestination.splice(destinationIndex, 1);
    await guide.save();

    // Populate the remaining destinations for response
    const updatedGuide = await User.findById(userId)
      .populate('relatedDestination', 'name city country coverImg')
      .select('-password -verificationDocuments');

    res.status(200).json({
      success: true,
      message: 'Destination removed from your profile successfully',
      data: updatedGuide
    });
  } catch (error) {
    console.error('Remove destination from guide error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid destination ID format'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error removing destination from guide',
      error: error.message
    });
  }
};

// Get all guides for a specific destination (already exists in your code as getGuidesForDestination)
// This function returns guides who have activities matching destination activities

// Get guides who specifically added this destination to their profile
export const getGuidesByDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;
    const {
      page = 1,
      limit = 10,
      verifiedOnly = false,
      minRating = 0,
      sortBy = 'rating'
    } = req.query;

    // Check if destination exists
    const destination = await Destination.findById(destinationId);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    // Build query for guides who have this destination in their relatedDestination
    const query = {
      role: 'tour-guide',
      isActive: true,
      relatedDestination: destinationId
    };

    // Additional filters
    if (verifiedOnly === 'true' || verifiedOnly === true) {
      query.isVerified = true;
    }

    if (minRating) {
      query['rating.average'] = { $gte: parseFloat(minRating) };
    }

    const skip = (page - 1) * limit;

    // Sort options
    const sortOptions = {};
    if (sortBy === 'rating') {
      sortOptions['rating.average'] = -1;
    } else if (sortBy === 'price') {
      sortOptions.hourlyRate = 1;
    } else if (sortBy === 'experience') {
      sortOptions.yearsOfExperience = -1;
    } else {
      sortOptions.createdAt = -1;
    }

    // Get guides
    const guides = await User.find(query)
      .populate('relatedActivities', 'name category icon')
      .populate('relatedDestination', 'name city')
      .select('-password -verificationDocuments -email -phoneNumber')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    // Format response
    const formattedGuides = guides.map(guide => ({
      ...guide,
      rating: {
        average: guide.rating?.average || 0,
        count: guide.rating?.count || 0,
        stars: '★'.repeat(Math.floor(guide.rating?.average || 0)) + 
               '☆'.repeat(5 - Math.floor(guide.rating?.average || 0))
      }
    }));

    res.status(200).json({
      success: true,
      data: formattedGuides,
      destination: {
        _id: destination._id,
        name: destination.name,
        city: destination.city,
        country: destination.country
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get guides by destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching guides for destination',
      error: error.message
    });
  }
};

// Bulk add destinations to guide (for admin or guide setup)
export const bulkAddDestinationsToGuide = async (req, res) => {
  try {
    const { destinationIds, guideId } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    // Validate input
    if (!destinationIds || !Array.isArray(destinationIds)) {
      return res.status(400).json({
        success: false,
        message: 'Destination IDs array is required'
      });
    }

    if (!guideId && userRole !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Guide ID is required for non-admin users'
      });
    }

    // Determine which guide to update
    const targetGuideId = userRole === 'admin' ? guideId : userId;
    
    // Check if guide exists and is a tour-guide
    const guide = await User.findById(targetGuideId);
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: 'Guide not found'
      });
    }

    if (guide.role !== 'tour-guide') {
      return res.status(400).json({
        success: false,
        message: 'User is not a tour guide'
      });
    }

    // Check if destinations exist and are active
    const destinations = await Destination.find({
      _id: { $in: destinationIds },
      isActive: true
    });

    if (destinations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid active destinations found'
      });
    }

    // Get existing destination IDs to avoid duplicates
    const existingDestinationIds = guide.relatedDestination.map(id => id.toString());
    const validDestinationIds = destinations.map(dest => dest._id.toString());
    
    // Filter out already added destinations
    const newDestinationIds = validDestinationIds.filter(
      id => !existingDestinationIds.includes(id)
    );

    if (newDestinationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All destinations are already added to this guide'
      });
    }

    // Check limit
    const MAX_DESTINATIONS_PER_GUIDE = 10;
    if (guide.relatedDestination.length + newDestinationIds.length > MAX_DESTINATIONS_PER_GUIDE) {
      return res.status(400).json({
        success: false,
        message: `Adding these destinations would exceed the limit of ${MAX_DESTINATIONS_PER_GUIDE} destinations`
      });
    }

    // Add new destinations
    guide.relatedDestination.push(...newDestinationIds);
    await guide.save();

    // Populate for response
    const updatedGuide = await User.findById(targetGuideId)
      .populate('relatedDestination', 'name city country coverImg')
      .select('-password -verificationDocuments');

    res.status(200).json({
      success: true,
      message: `Successfully added ${newDestinationIds.length} destination(s) to guide profile`,
      data: {
        guide: updatedGuide,
        addedCount: newDestinationIds.length,
        totalDestinations: updatedGuide.relatedDestination.length
      }
    });
  } catch (error) {
    console.error('Bulk add destinations to guide error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding destinations to guide',
      error: error.message
    });
  }
};
// Delete destination (Soft delete - Admin only)
export const deleteDestination = async (req, res) => {
  try {
    const { id } = req.params;

    const destination = await Destination.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Destination deleted successfully',
      data: destination
    });
  } catch (error) {
    console.error('Delete destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting destination',
      error: error.message
    });
  }
};

// Add activity to destination (Admin only)
export const addActivityToDestination = async (req, res) => {
  try {
    const { destinationId, activityId } = req.body;

    // Check if destination exists
    const destination = await Destination.findById(destinationId);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    // Check if activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check if activity already added
    if (destination.activities.includes(activityId)) {
      return res.status(400).json({
        success: false,
        message: 'Activity already added to this destination'
      });
    }

    // Add activity
    destination.activities.push(activityId);
    await destination.save();

    // Populate activities for response
    await destination.populate('activities', 'name category icon color');

    res.status(200).json({
      success: true,
      message: 'Activity added to destination successfully',
      data: destination
    });
  } catch (error) {
    console.error('Add activity to destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding activity to destination',
      error: error.message
    });
  }
};

// Remove activity from destination (Admin only)
export const removeActivityFromDestination = async (req, res) => {
  try {
    const { destinationId, activityId } = req.body;

    const destination = await Destination.findById(destinationId);
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    // Check if activity exists in destination
    if (!destination.activities.includes(activityId)) {
      return res.status(400).json({
        success: false,
        message: 'Activity not found in this destination'
      });
    }

    // Remove activity
    destination.activities = destination.activities.filter(
      id => id.toString() !== activityId.toString()
    );
    await destination.save();

    res.status(200).json({
      success: true,
      message: 'Activity removed from destination successfully',
      data: destination
    });
  } catch (error) {
    console.error('Remove activity from destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing activity from destination',
      error: error.message
    });
  }
};

// // Get nearby destinations by coordinates
// export const getNearbyDestinations = async (req, res) => {
//   try {
//     const { latitude, longitude, maxDistance = 5000 } = req.query; // maxDistance in meters

//     if (!latitude || !longitude) {
//       return res.status(400).json({
//         success: false,
//         message: 'Latitude and longitude are required'
//       });
//     }

//     const destinations = await Destination.find({
//       isActive: true,
//       location: {
//         $near: {
//           $geometry: {
//             type: 'Point',
//             coordinates: [parseFloat(longitude), parseFloat(latitude)]
//           },
//           $maxDistance: parseInt(maxDistance)
//         }
//       }
//     }).limit(10);

//     res.status(200).json({
//       success: true,
//       data: destinations
//     });
//   } catch (error) {
//     console.error('Get nearby destinations error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching nearby destinations',
//       error: error.message
//     });
//   }
// };

// Get guides for a destination (guides who have activities matching destination activities)
export const getGuidesForDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;

    const destination = await Destination.findById(destinationId)
      .populate('activities', '_id');
    
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    // Get activity IDs from destination
    const activityIds = destination.activities.map(activity => activity._id);

    if (activityIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No activities found for this destination'
      });
    }

    // Find guides who have any of these activities
    const guides = await User.find({
      role: 'tour-guide',
      relatedActivities: { $in: activityIds },
      isActive: true
    }).select('-password');

    // Populate guide activities for better response
    const populatedGuides = await Promise.all(
      guides.map(async (guide) => {
        await guide.populate('relatedActivities', 'name category icon');
        return guide;
      })
    );

    res.status(200).json({
      success: true,
      data: populatedGuides,
      count: populatedGuides.length
    });
  } catch (error) {
    console.error('Get guides for destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching guides for destination',
      error: error.message
    });
  }
};
export const getActivitiesByDestination = async (req, res) => {
  try {
    const { destinationId } = req.params;
    
    const destination = await Destination.findById(destinationId)
      .populate('activities', '_id name icon color category description isPopular');
    
    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: destination.activities || [],
      destination: {
        _id: destination._id,
        name: destination.name,
        city: destination.city
      }
    });
  } catch (error) {
    console.error('Get activities by destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities by destination',
      error: error.message
    });
  }
};