import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import loginBg from "../assets/login_bg.png";
import splashArt from "../assets/splash_art.png";
import logo from "../assets/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate("/dashboard");
    }
  };

  return (
    <div
      className="h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 h-full">
        {/* Left Column */}
        <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
          <img
            src={splashArt}
            alt="Splash Art"
            className="w-full max-w-md h-auto object-contain transform -translate-y-12 translate-x-10"
          />
          <p className="text-2xl font-semibold text-[#75808B] font-fredoka -translate-y-12 translate-x-10">
            A Smart HRIS Solution for Optimized University HR Management
          </p>
        </div>

        {/* Right Column */}
        <div className="flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-black">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Logo" className="w-48 h-auto" />
            </div>

            {/* Sign In Text */}
            <h2 className="text-2xl font-bold font-fredoka text-center mb-4">
              Sign In
            </h2>

            {/* Welcome Back Text */}
            <p className="text-center text-[#75808B] font-fredoka text-gray-600 mb-6">
              Welcome back! Please sign in to continue.
            </p>

            {/* Loading Spinner */}
            {loading && (
              <div className="flex justify-center mt-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
              </div>
            )}

            {/* Form */}
            {!loading && (
              <form className="space-y-4 md:space-y-6" onSubmit={handleLogin}>
                {/* Error Message */}
                {error && (
                  <p className="text-red-500 text-center mb-4">{error}</p>
                )}

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Your email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="name@company.com"
                    required
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <label
                    htmlFor="password"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                  />
                  {/* Eye Icon */}
                  <FontAwesomeIcon
                    icon={showPassword ? faEyeSlash : faEye}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-1/2 right-3 transform translate-y-1/3 cursor-pointer text-gray-600"
                  />
                </div>

                {/* Remember Me and Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="remember"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="remember" className="text-gray-500">
                        Remember me
                      </label>
                    </div>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Sign in Button */}
                <button
                  type="submit"
                  className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                >
                  Sign in
                </button>

                {/* Sign Up Link */}
                <p className="text-sm font-light text-gray-500">
                  Don't have an account yet?{" "}
                  <Link
                    to="/signup"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 