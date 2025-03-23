import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import loginBg from "../assets/login_bg.png";
import splashArt from "../assets/splash_art.png";
import logo from "../assets/logo.png";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(true);
  const { resetPasswordHandler, loading, error } = useAuth();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsFormVisible(false);
    setMessage("");

    const result = await resetPasswordHandler(email);
    
    if (result.success) {
      setMessage("A password reset link has been sent to your email.");
    } else {
      setIsFormVisible(true);
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

            {/* Forgot Password Text */}
            <h2 className="text-2xl font-bold font-fredoka text-center mb-4">
              Forgot Password
            </h2>

            {/* Reset Password Text */}
            {isFormVisible && (
              <p className="text-center text-[#75808B] font-fredoka text-gray-600 mb-6">
                Enter your email to receive a password reset link.
              </p>
            )}

            {/* Form */}
            {isFormVisible && (
              <form className="space-y-4 md:space-y-6" onSubmit={handleResetPassword}>
                {/* Email Input */}
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

                {/* Reset Password Button */}
                <button
                  type="submit"
                  className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            )}

            {/* Spinner */}
            {loading && (
              <div className="flex justify-center mt-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
              </div>
            )}

            {/* Success Message */}
            {!loading && message && (
              <p className="text-sm text-center text-green-600 mt-4">{message}</p>
            )}

            {/* Error Message */}
            {!loading && error && (
              <p className="text-sm text-center text-red-600 mt-4">{error}</p>
            )}

            {/* Link to Login */}
            <p className="text-sm font-light text-gray-500 text-center mt-4">
              Remembered your password?{" "}
              <Link to="/" className="font-medium text-blue-600 hover:underline">
                Go back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 