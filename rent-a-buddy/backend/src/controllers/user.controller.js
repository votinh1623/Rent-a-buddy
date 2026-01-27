// backend/src/controllers/user.controller.js
import User from '../models/user.model.js';
import cloudinary from "../lib/cloudinary.js";
import fs from "fs";



export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      pfp: user.pfp,
      address: user.address,
      gender: user.gender,
      lastOnline: user.lastOnline,
      createdAt: user.createdAt,
      followers: user.followers,
      following: user.following,
    });
  } catch (error) {
    console.log("Error in getProfile controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, address, gender } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    user.name = name || user.name;
    user.address = address || user.address;
    user.gender = gender || user.gender;

    const file = req.file;
    if (file) {
      try {
        const uploadRes = await cloudinary.uploader.upload(file.path, {
          folder: "toonkidz/avatars",
          width: 150, height: 150, crop: "fill", gravity: "face"
        });
        user.pfp = uploadRes.secure_url;
        fs.unlinkSync(file.path);
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ success: false, error: "Error uploading avatar" });
      }
    }

    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: "Vui lòng nhập đủ thông tin" });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: "Mật khẩu hiện tại không đúng" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const followUser = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const targetUserId = req.params.id;

    if (currentUserId.toString() === targetUserId) {
      return res.status(400).json({ success: false, error: "Bạn không thể tự theo dõi chính mình" });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const isFollowing = currentUser.following.includes(targetUserId);
    let message = "";

    if (isFollowing) {
      await currentUser.updateOne({ $pull: { following: targetUserId } });
      await targetUser.updateOne({ $pull: { followers: currentUserId } });
      message = "Đã bỏ theo dõi";
    } else {
      await currentUser.updateOne({ $addToSet: { following: targetUserId } });
      await targetUser.updateOne({ $addToSet: { followers: currentUserId } });
      message = "Theo dõi thành công";
    }

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";
    const role = req.query.role || "";

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

export const updateUserById = async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    user.isActive = isActive;

    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.json({ success: true, user: updatedUser });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: "Email đã tồn tại" });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await user.deleteOne();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.isActive = false;
    await user.save();

    res.json({ success: true, message: 'Tài khoản đã bị vô hiệu hóa thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to deactivate user' });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    if (!isActive) {
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const query = {
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to search users' });
  }
};