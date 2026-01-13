// backend/src/middleware/guideAuth.middleware.js
export const guideAuth = (req, res, next) => {
  // auth middleware đã set req.user
  if (req.user.role !== 'tour-guide') {
    return res.status(403).json({ 
      success: false,
      message: 'Access denied. Tour guide privileges required.' 
    });
  }
  next();
};