import React from 'react';
import AllRoutes from './components/AllRoute';
import "@fontsource/poppins";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/700.css";
import { ToastContainer } from 'react-toastify';
function App() {
  return (
    <>
      <AllRoutes />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;