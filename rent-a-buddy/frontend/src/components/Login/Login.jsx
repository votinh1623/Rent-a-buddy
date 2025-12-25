import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { login } from "@/service/authService";
import Swal from "sweetalert2";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import "./Login.scss";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login({
        email: formData.email,
        password: formData.password,
      });

      console.log("Login response:", res); // Debug log

      // Xử lý cả 2 cấu trúc response:
      // 1. Cấu trúc cũ: res._id tồn tại
      // 2. Cấu trúc mới: res.success = true và có res.data.user
      
      let userData = null;
      let accessToken = null;

      // Cấu trúc mới
      if (res && res.success && res.data && res.data.user) {
        userData = res.data.user;
        accessToken = res.data.token;
      }
      // Cấu trúc cũ
      else if (res && res._id) {
        userData = {
          _id: res._id,
          name: res.name || formData.email.split('@')[0],
          email: res.email || formData.email,
          role: res.role || 'traveller',
          pfp: res.pfp || '',
          isVerified: res.isVerified || false
        };
        accessToken = res.token || '';
      }
      // Lỗi từ server
      else if (res && res.message === "Your account has been banned") {
        Swal.fire({
          title: "Banned account",
          text: "Your account has been banned.",
          icon: "warning",
          confirmButtonText: "Understood",
        });
        return;
      }
      // Lỗi khác
      else {
        Swal.fire({
          title: "Log In failed",
          text: res?.message || "Wrong email or password",
          icon: "error",
        });
        return;
      }

      // Lưu user data vào localStorage
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        
        console.log("User saved to localStorage:", userData); // Debug
      }

      Swal.fire({
        title: "Log In successfully!",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      // Redirect về trang redirect để xử lý role
      setTimeout(() => {
        navigate("/redirect");
      }, 1000);

    } catch (err) {
      console.error("Login error:", err);
      Swal.fire({
        title: "Login failed",
        text: err.message || "Wrong email or password",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p className="login-subtitle">
          Log In to explore the available buddies for the best travel experience
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <span
                className="toggle-password"
                onClick={() => !loading && setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeTwoTone twoToneColor="#3535d3ff" />
                ) : (
                  <EyeInvisibleOutlined style={{ color: "#467c87ff" }} />
                )}
              </span>
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="signup-link">
          <span>Doesn't have an account? </span>
          <NavLink to="/signup">Sign Up now</NavLink>
        </div>
      </div>
    </div>
  );
};

export default Login;