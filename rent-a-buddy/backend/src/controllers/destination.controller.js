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
export const getDestinationById = async (req, res) => {
  try {
    const { id } = req.params;

    const destination = await Destination.findById(id)
      .populate('activities', 'name description category icon color');

    if (!destination || !destination.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    res.status(200).json({
      success: true,
      data: destination
    });
  } catch (error) {
    console.error('Get destination by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching destination',
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