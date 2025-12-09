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
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      toast.error("Password does not match!");
      return;
    }

    try {
      setLoading(true);
      const res = await sendOtp({ name, email, password });
      if (res.success) {
        toast.success("Sent OTP to your email!");
        setIsModalVisible(true);
      } else if (res.message === "User already exists") {
        toast.error("Email is already in used!");
      } else {
        toast.error(res.message || "Error sending OTP, please try again!");
      }
    } catch (err) {
      toast.error("Error sending OTP!");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast.error("Please ennter the OTP!");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyOtp({ ...formData, otp });

      if (res.success) {
        setIsModalVisible(false);
        Swal.fire({
          title: "Signup successfully!",
          text: "You can now login.",
          icon: "success",
          confirmButtonText: "Login",
        }).then(() => navigate("/login"));
      } else {
        toast.error(res.message || "Incorrect OTP or expired!");
      }
    } catch (err) {
      toast.error("Failed to verify OTP!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <ToastContainer position="top-right" autoClose={2000} />
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
      >
        <p>We have sent the OTP to your email, please check it!</p>
        <Input
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          style={{ marginBottom: "15px", textAlign: "center" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
          <Button
            type="primary"
            loading={loading}
            onClick={handleVerifyOtp}
            style={{ backgroundColor: "#6c086c", borderColor: "#6c086c" }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Signup;