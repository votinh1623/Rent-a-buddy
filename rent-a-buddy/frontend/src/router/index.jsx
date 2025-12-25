// src/router/index.js
import React, { useEffect } from 'react';
import { Navigate, useNavigate } from "react-router-dom";
import Login from "../components/Login/Login";
import Signup from "../components/SignUp/SignUp";
import PrivateRoute from "./PrivateRoute";
import Homepage from "../pages/HomePage/HomePage.jsx";
import SelectByPreference from "../components/SelectByPreference/SelectByPreference.jsx";
import SearchResultPage from "../pages/SearchResultPage/SearchResultPage.jsx";
import BuddyProfilePage from '../pages/BuddyProfilePage/BuddyProfilePage.jsx';
import BuddyHomePage from '../pages/BuddyHomePage/BuddyHomePage.jsx';
// import ProfilePage from '../pages/ProfilePage/ProfilePage.jsx';

// Component để redirect dựa trên role - ĐẶT Ở ĐÂU TRƯỚC KHI SỬ DỤNG
const RoleRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAndRedirect = () => {
      // Lấy user info từ localStorage hoặc cookies
      const userData = localStorage.getItem('user');
      console.log(userData)
      if (userData) {
        try {
          const user = JSON.parse(userData);
          
          // Redirect dựa trên role
          if (user.role === 'tour-guide') {
            navigate('/home/buddy-home');
          } else if (user.role === 'traveller') {
            navigate('/home/traveller-home');
          } else if (user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate('/home/homepage');
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          navigate('/home/homepage');
        }
      } else {
        // Nếu chưa login, về trang chủ public
        navigate('/home/homepage');
      }
    };

    checkUserAndRedirect();
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <div>Redirecting...</div>
    </div>
  );
};

export const route = [
  // Public routes
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  
  // Main layout với redirect logic
  {
    path: "/",
    children: [
      {
        path: "",
        children: [
          { 
            index: true, 
            element: <Navigate to="/redirect" replace /> 
          },
          { path: "redirect", element: <RoleRedirect /> },

          {
            path: "home",
            children: [
              // Public homepage
              { path: "homepage", element: <Homepage /> },
              
              // Role-based homepages
              { path: "traveller-home", element: <Homepage /> },
              { path: "buddy-home", element: <BuddyHomePage /> },
              
              // Feature routes
              { path: "select-preferences", element: <SelectByPreference /> },
              { path: "search-result", element: <SearchResultPage /> },
              { path: "buddy/:id", element: <BuddyProfilePage /> },
              // { path: "profile", element: <ProfilePage /> },
            ],
          },
        ],
      },
    ],
  },

  // Catch-all route
  { path: "*", element: <Navigate to="/redirect" replace /> },
];