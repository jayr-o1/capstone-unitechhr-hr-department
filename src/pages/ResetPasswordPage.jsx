import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";
import loginBg from "../assets/login_bg.png";
import logo from "../assets/logo.png";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode"); // Extract reset code
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verify the reset code when the component loads
    const verifyCode = async () => {
      try {
        await verifyPasswordResetCode(auth, oobCode);
        setVerified(true); // If the code is valid
      } catch (err) {
        setError("Invalid or expired reset link.");
      }
    };

    if (oobCode) verifyCode();
  }, [oobCode]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    setMessage("");
    setError("");

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setMessage("Your password has been reset successfully!");
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="h-screen flex justify-center items-center bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-black">
        <div className="flex justify-center mb-4">
          <img src={logo} alt="Logo" className="w-48 h-auto" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-center">Reset Your Password</h1>
        
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        {message && (
          <div className="text-center mb-4">
            <p className="text-green-600">{message}</p>
            <Link to="/" className="text-blue-600 hover:underline mt-4 inline-block">
              Return to login
            </Link>
          </div>
        )}
        
        {verified && !message && (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
                required
              />
            </div>
            
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none"
              disabled={loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
        
        {loading && (
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage; 