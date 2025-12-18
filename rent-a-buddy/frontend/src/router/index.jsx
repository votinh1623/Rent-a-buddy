// src/router/route.js

import { Navigate } from "react-router-dom";
import Login from "../components/Login/Login";
import Signup from "../components/SignUp/SignUp";
import PrivateRoute from "./PrivateRoute";
import AdminRoute from "./AdminRoute.jsx";
import Homepage from "../pages/HomePage/HomePage.jsx";
import SelectByPreference from "../components/SelectByPreference/SelectByPreference.jsx";
import SearchResultPage from "../pages/SearchResultPage/SearchResultPage.jsx";
import BuddyProfilePage from '../pages/BuddyProfilePage/BuddyProfilePage.jsx';
// import BrowseBuddiesPage from "../pages/BrowseBuddiesPage";
// import BuddyDetailPage from "../pages/BuddyDetailPage";

export const route = [
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },

  {
    path: "/",
    // element: <PrivateRoute />,
    children: [
      {
        path: "",
        // element: <LayoutDefault />,
        children: [
          { index: true, element: <Navigate to="home/homepage" replace /> },

          {
            path: "home",
            children: [
              { index: true, element: <Navigate to="homepage" replace /> },
              { path: "homepage", element: <Homepage /> },
              
              // Thêm routes cho chức năng tìm buddy
              { path: "select-preferences", element: <SelectByPreference /> },
              { path: "search-result", element: <SearchResultPage /> },
              { path: "buddy/:id", element: <BuddyProfilePage /> },
              // { path: "browse-buddies", element: <BrowseBuddiesPage /> },
              // { path: "buddy-detail/:id", element: <BuddyDetailPage /> },
            ],
          },
        ],
      },

      {
        path: "admin",
        // element: <AdminRoute />,
        children: [
          {
            // element: <AdminLayout />,
            children: [
              //   { index: true, element: <Navigate to="dashboard" replace /> },
            ],
          },
        ],
      },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
];