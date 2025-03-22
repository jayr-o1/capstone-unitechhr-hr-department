import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

const AccountLayout = () => {
  const location = useLocation();

  // Define a mapping of paths to page titles
  const pageTitles = {
    "/": "Login",
    "/signin": "Login",
    "/signup": "HR Administrator Registration",
    "/forgot-password": "Forgot Password",
    "/reset-password": "Reset Password"
  };

  // Get the current page title based on the path
  const getCurrentTitle = () => {
    return pageTitles[location.pathname] || "Unitech HR";
  };

  // Update browser tab title when route changes
  useEffect(() => {
    document.title = `Unitech HR | ${getCurrentTitle()}`;
  }, [location.pathname]);

  return (
    <div>
      <Outlet />
    </div>
  );
};

export default AccountLayout; 