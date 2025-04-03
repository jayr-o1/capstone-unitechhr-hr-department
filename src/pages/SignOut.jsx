import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import PageLoader from '../components/PageLoader';

const SignOut = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      console.log("Signing out user...");
      try {
        await logout();
        console.log("Logout successful, redirecting to login page");
        // Clear any session data from localStorage
        localStorage.removeItem('unitech_system_admin');
        localStorage.removeItem('unitech_employee');
        // Redirect to login page
        navigate('/', { replace: true });
      } catch (error) {
        console.error("Error during logout:", error);
        // Even if there's an error, try to redirect to login
        navigate('/', { replace: true });
      }
    };

    performLogout();
  }, [logout, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <PageLoader message="Signing out..." />
      <p className="mt-4 text-gray-600">You will be redirected to the login page shortly.</p>
    </div>
  );
};

export default SignOut; 