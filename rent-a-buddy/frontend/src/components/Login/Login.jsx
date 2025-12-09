import React, { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { login } from "@/service/authService";
import Swal from "sweetalert2";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import "./Login.scss";
// import GuestChatWidget from "../../GuestChatWidget/GuestChatWidget";

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

      if (res._id) {
        Swal.fire({
          title: "Log In successfully!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        navigate("/home/homepage");
      } else if (res.message === "Your account has been banned") {
        Swal.fire({
          title: "Banned account",
          text: "Your account has been banned.",
          icon: "warning",
          confirmButtonText: "Understood",
        });
      } else {
        Swal.fire({
          title: "Log In failed",
          text: res.message || "Wrong email or password",
          icon: "error",
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Error connecting to the server!",
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
        <p className="login-subtitle">Log In to explore the available buddies for the best travel experience</p>

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
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
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
      {/* <GuestChatWidget /> */}
    </div>
  );
};

export default Login;