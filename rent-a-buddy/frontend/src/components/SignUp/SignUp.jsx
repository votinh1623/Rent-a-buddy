// components/SignUp/SignUp.jsx
import React, { useState } from "react";
import Swal from "sweetalert2";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { Modal, Input, Button, Spin } from "antd";
import { sendOtp, verifyOtp } from "@/service/authService";
import "./Signup.scss";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    // Validate form
    if (!name || !email || !password || !confirmPassword) {
      toast.error("Please fill all fields!");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password does not match!");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }

    try {
      setLoading(true);
      const res = await sendOtp({ name, email, password });
      
      if (res.success) {
        toast.success(res.message || "OTP sent to your email!");
        setIsModalVisible(true);
        setOtpSent(true);
        
        // For development: show OTP in console
        if (res.otp) {
          console.log(`Development OTP: ${res.otp}`);
          toast.info(`Development OTP: ${res.otp}`);
        }
      } else {
        toast.error(res.message || "Error sending OTP!");
      }
    } catch (err) {
      console.error('Send OTP catch error:', err);
      toast.error(err.message || "Error sending OTP. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast.error("Please enter the OTP!");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyOtp({ ...formData, otp });

      if (res.success) {
        setIsModalVisible(false);
        Swal.fire({
          title: "Signup successful!",
          text: "You can now login.",
          icon: "success",
          confirmButtonText: "Login",
          confirmButtonColor: "#6c086c",
        }).then(() => navigate("/login"));
      } else {
        toast.error(res.message || "Invalid OTP!");
      }
    } catch (err) {
      console.error('Verify OTP catch error:', err);
      toast.error(err.message || "Failed to verify OTP!");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const res = await sendOtp(formData);
      if (res.success) {
        toast.success("OTP resent successfully!");
        if (res.otp) {
          console.log(`New OTP: ${res.otp}`);
          toast.info(`New OTP: ${res.otp}`);
        }
      }
    } catch (err) {
      toast.error("Failed to resend OTP!");
    }
  };

  return (
    <div className="signup-container">
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
      />
      <div className="signup-card">
        <h2>Create an account</h2>

        <form onSubmit={handleSendOtp}>
          <div className="form-group">
            <label>Your name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="At least 6 characters"
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label>Confirm password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Confirm your password"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? <Spin size="small" /> : "Sign Up"}
          </button>
        </form>

        <div className="extra-links">
          <p>
            Already has an account?{" "}
            <a href="/login" className="signin-link">
              Sign In
            </a>
          </p>
        </div>
      </div>

      <Modal
        title="Email verification"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        centered
        maskClosable={false}
      >
        <p>We have sent the OTP to your email, please check it!</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '-10px' }}>
          (Check console for OTP in development mode)
        </p>
        
        <Input
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          style={{ 
            marginBottom: "15px", 
            marginTop: "15px",
            textAlign: "center",
            fontSize: "18px",
            letterSpacing: "5px"
          }}
          maxLength={6}
        />
        
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <Button 
              type="text" 
              onClick={handleResendOtp}
              disabled={!otpSent}
            >
              Resend OTP
            </Button>
          </div>
          
          <div>
            <Button 
              onClick={() => setIsModalVisible(false)}
              style={{ marginRight: '10px' }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              loading={loading}
              onClick={handleVerifyOtp}
              style={{ 
                backgroundColor: "#6c086c", 
                borderColor: "#6c086c",
                minWidth: '80px'
              }}
            >
              Verify
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Signup;