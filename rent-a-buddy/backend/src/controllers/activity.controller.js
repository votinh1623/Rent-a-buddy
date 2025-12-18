// backend/src/controllers/activity.controller.js
import Activity from '../models/activity.model.js';
import User from '../models/user.model.js';

// Tạo activity mới (admin only)
export const createActivity = async (req, res) => {
  try {
    const { name, description, category, icon, color } = req.body;
    
    const activity = new Activity({
      name,
      description,
      category,
      icon,
      color
    });
    
    await activity.save();
    
    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating activity',
      error: error.message
    });
  }
};

// Lấy tất cả activities
export const getAllActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ isActive: true });
    
    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
};

// Lấy activities theo category
export const getActivitiesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const activities = await Activity.find({ 
      category,
      isActive: true 
    });
    
    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activities by category',
      error: error.message
    });
  }
};
export const getActivitiesByIds = async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({
        success: false,
        message: 'Activity IDs are required'
      });
    }

    const activityIds = ids.split(',').map(id => {
      try {
        return mongoose.Types.ObjectId.createFromHexString(id.trim());
      } catch {
        return null;
      }
    }).filter(id => id !== null);

    if (activityIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        count: 0
      });
    }

    const activities = await Activity.find({
      _id: { $in: activityIds },
      isActive: true
    }).select('name category icon color description');

    res.status(200).json({
      success: true,
      data: activities,
      count: activities.length
    });
  } catch (error) {
    console.error('Get activities by IDs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activities',
      error: error.message
    });
  }
};
// Lấy popular activities
export const getPopularActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ 
      isPopular: true,
      isActive: true 
    }).limit(10);
    
    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching popular activities',
      error: error.message
    });
  }
};

// Thêm activity cho tour-guide
export const addActivityToGuide = async (req, res) => {
  try {
    const { activityId } = req.body;
    const user = req.user;

    // Kiểm tra activity có tồn tại không
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Kiểm tra activity đã có chưa
    if (user.relatedActivities.includes(activityId)) {
      return res.status(400).json({
        success: false,
        message: 'Activity already added to your profile'
      });
    }

    // Thêm activity
    user.relatedActivities.push(activityId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Activity added to your profile successfully',
      data: {
        userId: user._id,
        relatedActivities: user.relatedActivities
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding activity to your profile',
      error: error.message
    });
  }
};

// Xóa activity khỏi guide hiện tại
export const removeActivityFromGuide = async (req, res) => {
  try {
    const { activityId } = req.body;
    const user = req.user;

    // Kiểm tra activity có trong danh sách không
    if (!user.relatedActivities.includes(activityId)) {
      return res.status(400).json({
        success: false,
        message: 'Activity not found in your profile'
      });
    }

    // Xóa activity
    user.relatedActivities = user.relatedActivities.filter(
      id => id.toString() !== activityId.toString()
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Activity removed from your profile successfully',
      data: {
        userId: user._id,
        relatedActivities: user.relatedActivities
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing activity from your profile',
      error: error.message
    });
  }
};
export const getMyActivities = async (req, res) => {
  try {
    // req.user đã được populate từ middleware auth
    const user = req.user;
    
    // Populate activities để lấy thông tin đầy đủ
    await user.populate('relatedActivities');
    
    res.status(200).json({
      success: true,
      data: user.relatedActivities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your activities',
      error: error.message
    });
  }
};


// Lấy guides theo activity
export const getGuidesByActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    
    const guides = await User.find({
      role: 'tour-guide',
      relatedActivities: activityId,
      isActive: true
    }).select('-password');
    
    res.status(200).json({
      success: true,
      data: guides
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching guides by activity',
      error: error.message
    });
  }
};

// Lấy activities của một guide
export const getGuideActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).populate('relatedActivities');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.role !== 'tour-guide') {
      return res.status(400).json({
        success: false,
        message: 'User is not a tour guide'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user.relatedActivities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching guide activities',
      error: error.message
    });
  }
};
// Thêm vào activity.controller.js
export const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const activity = await Activity.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating activity',
      error: error.message
    });
  }
};

export const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    
    const activity = await Activity.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Soft delete - chỉ set isActive = false thay vì xóa hoàn toàn
    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully',
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting activity',
      error: error.message
    });
  }
};