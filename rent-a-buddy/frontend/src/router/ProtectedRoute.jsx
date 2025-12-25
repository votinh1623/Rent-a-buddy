// router/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Lấy user từ localStorage
  const userData = localStorage.getItem('user');
  
  if (!userData) {
    // Nếu chưa login, redirect đến login page
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userData);
    
    // Kiểm tra role
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Nếu role không được phép, redirect về trang chủ phù hợp
      if (user.role === 'tour-guide') {
        return <Navigate to="/home/buddy-home" replace />;
      } else if (user.role === 'traveller') {
        return <Navigate to="/home/traveller-home" replace />;
      } else {
        return <Navigate to="/home/homepage" replace />;
      }
    }
    
    return children;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;