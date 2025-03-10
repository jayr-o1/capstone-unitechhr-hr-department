import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsMobile(true);
        setIsOpen(false); // Close sidebar on mobile
      } else {
        setIsMobile(false);
        setIsOpen(true); // Open sidebar on larger screens
      }
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Hamburger Button (Mobile Only) */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md focus:outline-none"
        >
          ☰
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-lg transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="text-center text-3xl font-bold p-4 bg-gradient-to-r from-[#131674] to-[#8d46a5] text-transparent bg-clip-text">
          UNITECH HR
        </div>

        {/* Menu Items */}
        <ul className="mt-4 space-y-4">
          {[
            {
              name: "Dashboard",
              path: "/dashboard",
              icon: "path-to-dashboard-icon",
            },
            {
              name: "Recruitment",
              path: "/recruitment",
              icon: "path-to-recruitment-icon",
            },
            {
              name: "Onboarding",
              path: "/onboarding",
              icon: "path-to-onboarding-icon",
            },
            {
              name: "Employees",
              path: "/employees",
              icon: "path-to-employees-icon",
            },
            {
              name: "Clusters",
              path: "/clusters",
              icon: "path-to-clusters-icon",
            },
          ].map((item, index) => (
            <li key={index} className="mx-4 bg-gray-100 rounded-xl shadow-md">
              <Link
                to={item.path}
                className="flex flex-col items-center justify-center py-6"
              >
                <img src={item.icon} alt={item.name} className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium text-gray-900">
                  {item.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Sidebar;
