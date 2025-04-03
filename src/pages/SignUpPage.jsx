import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import loginBg from "../assets/login_bg.png";
import splashArt from "../assets/splash_art.png";
import logo from "../assets/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faCheckCircle, faIdCard, faUserTie, faUniversity } from "@fortawesome/free-solid-svg-icons";

const SignUpPage = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [position] = useState("HR Head");
  const [universityName, setUniversityName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();

  const validateForm = () => {
    // Check if passwords match
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return false;
    }

    // Check password strength (at least 8 characters for more security)
    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters");
      return false;
    }

    // Validate email format with a simple regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError("Please enter a valid email address");
      return false;
    }

    // Check if name is provided
    if (!fullName.trim()) {
      setValidationError("Please enter your full name");
      return false;
    }
    
    // Check university name
    if (!universityName.trim()) {
      setValidationError("Please enter your university name");
      return false;
    }

    // Clear any previous validation errors
    setValidationError("");
    return true;
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Validate form before submitting
    if (!validateForm()) return;
    
    // Just use the full name without the position
    const displayName = fullName;
    
    // Include additional user metadata in the registration process
    const userMetadata = {
      fullName,
      position,
      universityName
    };

    console.log("Submitting registration with metadata:", userMetadata);
    
    try {
      const result = await register(email, password, displayName, userMetadata);
      console.log("Registration result:", result);
      
      if (result.success) {
        // Set success message based on registration result
        setSuccessMessage(`Registration successful! Your account has been created as the HR Head for ${universityName}. Your university code is: ${result.universityCode}. Please save this code for employees to use when registering. Please proceed to login with your credentials.`);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setValidationError(error.message || "An error occurred during registration. Please try again.");
    }
  };

  // If success message is set, show success screen
  if (successMessage) {
    return (
      <div
        className="min-h-screen bg-cover bg-center flex items-center justify-center p-4"
        style={{ 
          backgroundImage: `url(${loginBg})`,
          backgroundColor: "rgba(240, 245, 255, 0.95)",
          backgroundBlendMode: "overlay" 
        }}
      >
        <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-t-4 border-blue-600 text-center animate-fadeIn">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Logo" className="w-48 h-auto" />
          </div>
          
          <div className="text-green-600 text-7xl flex justify-center mb-6">
            <FontAwesomeIcon icon={faCheckCircle} className="animate-scaleIn" />
          </div>
          
          <h2 className="text-2xl font-bold font-fredoka mb-4 text-gray-800">Registration Successful</h2>
          
          <p className="text-gray-700 mb-6 text-lg">{successMessage}</p>
          
          <Link
            to="/"
            className="inline-block w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-base px-5 py-3 text-center transition-all duration-200 transform hover:scale-105"
          >
            Proceed to Login
          </Link>
        </div>
      </div>
    );
  }

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
          <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl border border-black">
            {/* Logo */}
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Logo" className="w-48 h-auto" />
            </div>

            {/* Sign Up Text */}
            <h2 className="text-2xl font-bold font-fredoka text-center mb-2">
              HR Administrator Registration
            </h2>

            {/* Create Account Text */}
            <p className="text-center text-[#75808B] font-fredoka mb-6">
              Create your administrative account to manage university HR operations
            </p>

            {/* Loading Spinner */}
            {loading && (
              <div className="flex justify-center mt-4 mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
              </div>
            )}

            {/* Form */}
            {!loading && (
              <form className="space-y-4" onSubmit={handleSignUp}>
                {/* Error Messages */}
                {(error || validationError) && (
                  <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 border-l-4 border-red-500">
                    <p className="font-medium">
                      {validationError || error}
                    </p>
                  </div>
                )}

                {/* University Name - Full Width */}
                <div>
                  <label
                    htmlFor="universityName"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    University Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="universityName"
                      id="universityName"
                      value={universityName}
                      onChange={(e) => setUniversityName(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pl-10"
                      placeholder="State University of Technology"
                      required
                    />
                    <FontAwesomeIcon icon={faUniversity} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block mb-2 text-sm font-medium text-gray-900"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="fullName"
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pl-10"
                        placeholder="Jane Smith"
                        required
                      />
                      <FontAwesomeIcon icon={faUserTie} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  {/* Position Field (Immutable) */}
                  <div>
                    <label
                      htmlFor="position"
                      className="block mb-2 text-sm font-medium text-gray-900"
                    >
                      Position
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="position"
                        id="position"
                        value="HR Head"
                        className="bg-gray-100 border border-gray-300 text-gray-800 rounded-lg block w-full p-2.5 pl-10 cursor-not-allowed"
                        readOnly
                      />
                      <FontAwesomeIcon icon={faUserTie} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Email field - full width */}
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="jane.smith@university.edu"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block mb-2 text-sm font-medium text-gray-900"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        <FontAwesomeIcon
                          icon={showPassword ? faEyeSlash : faEye}
                          className="text-gray-400 hover:text-gray-600"
                        />
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block mb-2 text-sm font-medium text-gray-900"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        <FontAwesomeIcon
                          icon={showConfirmPassword ? faEyeSlash : faEye}
                          className="text-gray-400 hover:text-gray-600"
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-base px-5 py-3 text-center transition-all duration-200 transform hover:scale-105"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </button>
                </div>

                {/* Login Link */}
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link to="/" className="text-blue-600 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage; 