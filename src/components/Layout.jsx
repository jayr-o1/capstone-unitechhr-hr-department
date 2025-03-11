import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Layouts/Header";
import Sidebar from "./Layouts/Sidebar";
import PageLoader from "./PageLoader"; // Import the loader component

const Layout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  // Show loader when the route changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500); // Hide after 500ms
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <PageLoader isLoading={isLoading} />

      {/* Layout Wrapper - Sidebar + Main Content */}
      <div className="flex h-screen">
        {/* Sidebar (Fixed Width) */}
        <Sidebar />

        {/* Main Content Wrapper (Shifted Right) */}
        <div className="flex-1 flex flex-col ml-64">
          {" "}
          {/* Add ml-64 to shift content */}
          {/* Header (Full Width) */}
          <Header />
          {/* Page Content */}
          <main className="flex-1 p-4">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default Layout;
