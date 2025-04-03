import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Header from "./Header";
import SystemAdminSidebar from "./SystemAdminSidebar";
import { useAuth } from "../../contexts/AuthProvider";
import PageLoader from "../PageLoader";

const SystemAdminLayout = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const { user, userDetails, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug logging
  useEffect(() => {
    console.log("SystemAdminLayout mounted with:", {
      user: user ? "exists" : "null",
      userRole: userDetails?.role,
      authLoading,
      pathname: location.pathname
    });
  }, [user, userDetails, authLoading, location]);

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 1024);
    };

    // Set initial state based on screen width
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up event listener
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Set page title based on current route
  useEffect(() => {
    const path = location.pathname;
    const pathParts = path.split("/").filter(part => part);
    const lastPathPart = pathParts[pathParts.length - 1];

    // Convert path to title case (e.g., "universities" -> "Universities")
    const formatTitle = (path) => {
      if (!path) return "Dashboard";
      return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");
    };

    document.title = `System Admin | ${formatTitle(lastPathPart) || "Dashboard"}`;
    
    // Wait a short time to simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location]);

  // Make sure only system_admin can access this layout
  useEffect(() => {
    // Don't check role until auth is loaded
    if (authLoading) {
      console.log("Auth is still loading, delaying role check");
      return;
    }
    
    if (userDetails) {
      console.log("SystemAdminLayout: checking user role", {
        currentRole: userDetails.role,
        isSystemAdmin: userDetails.role === "system_admin"
      });
      
      if (userDetails.role !== "system_admin") {
        console.log("Not a system admin, redirecting to root");
        navigate("/");
      } else {
        console.log("System admin role confirmed");
      }
    } else if (user && !userDetails) {
      console.log("User exists but userDetails is missing, waiting...");
      // Give it a bit more time for userDetails to load
      const timer = setTimeout(() => {
        if (!userDetails) {
          console.log("UserDetails still missing, redirecting to login");
          navigate("/");
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    } else if (!user && !authLoading) {
      console.log("No user found after auth loaded, redirecting to login");
      navigate("/system-admin/login");
    }
  }, [userDetails, user, authLoading, navigate]);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Show loader while auth is still loading or layout is initializing
  if (authLoading || loading) {
    return <PageLoader />;
  }

  // Extra validation check before rendering layout
  if (!user || (userDetails && userDetails.role !== "system_admin")) {
    console.log("Unauthorized access attempt to SystemAdminLayout, redirecting...");
    navigate("/");
    return <PageLoader />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <SystemAdminSidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header 
          title="System Administration" 
          breadcrumb={[
            { title: "Home", path: "/system-admin" },
            { title: location.pathname.split("/").pop()?.replace(/-/g, " ")?.charAt(0).toUpperCase() + location.pathname.split("/").pop()?.replace(/-/g, " ")?.slice(1) || "Dashboard" }
          ]}
          onBreadcrumbClick={(path) => navigate(path)}
          userRole="system_admin"
          userPermissions={{}}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SystemAdminLayout; 