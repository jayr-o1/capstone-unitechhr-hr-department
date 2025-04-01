import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthProvider";

import DashboardIcon from "../../assets/icons/SidebarIcons/DashboardIcon";
import RecruitmentIcon from "../../assets/icons/SidebarIcons/RecruitmentIcon";
import OnboardingIcon from "../../assets/icons/SidebarIcons/OnboardingIcon";
import EmployeesIcon from "../../assets/icons/SidebarIcons/EmployeesIcon";
import ClustersIcon from "../../assets/icons/SidebarIcons/ClustersIcon";
import HRManagementIcon from "../../assets/icons/SidebarIcons/HRManagementIcon";
import SignOutIcon from "../../assets/icons/HeaderIcons/SignOutIcon";

const Sidebar = ({ userRole }) => {
    const [isOpen, setIsOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth(); // Get current user and logout function

    // Check if user is an HR Head (department manager)
    const isHRHead = userRole === "hr_head" || userRole === "admin";

    // Toggle sidebar visibility
    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await logout();
            navigate("/signin"); // Redirect to login page
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <>
            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-lg transition-transform duration-300 z-50 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Sidebar Header */}
                <div className="text-center text-3xl font-fredoka font-semibold p-4 bg-gradient-to-r from-[#131674] to-[#8d46a5] text-transparent bg-clip-text">
                    UNITECH HR
                </div>

                {/* Menu Items */}
                <ul className="flex flex-col h-[calc(100vh-80px)] justify-between mt-4">
                    <div className="space-y-4">
                        {[
                            {
                                name: "Dashboard",
                                path: "/dashboard",
                                icon: (
                                    <DashboardIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                                ),
                            },
                            {
                                name: "Recruitment",
                                path: "/recruitment",
                                icon: (
                                    <RecruitmentIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                                ),
                            },
                            {
                                name: "Onboarding",
                                path: "/onboarding",
                                icon: (
                                    <OnboardingIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                                ),
                            },
                            {
                                name: "Employees",
                                path: "/employees",
                                icon: (
                                    <EmployeesIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                                ),
                            },
                            {
                                name: "Clusters",
                                path: "/clusters",
                                icon: (
                                    <ClustersIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                                ),
                            },
                            // Show HR Management for HR Heads, Sign Out for HR Personnel
                            ...(isHRHead
                                ? [
                                      {
                                          name: "HR Management",
                                          path: "/hr-management",
                                          icon: (
                                              <HRManagementIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                                          ),
                                      },
                                  ]
                                : [
                                      {
                                          name: "Sign Out",
                                          path: null,
                                          onClick: handleLogout,
                                          icon: (
                                              <SignOutIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 text-red-600" />
                                          ),
                                      },
                                  ]),
                        ].map((item, index) => (
                            <li
                                key={index}
                                className={`mx-4 bg-gray-100 rounded-xl shadow-md hover:bg-gray-200 transition-colors duration-200 ${
                                    location.pathname === item.path
                                        ? "bg-gray-200" // Active page styling
                                        : "bg-gray-100 hover:bg-gray-200"
                                }`}
                            >
                                {item.path ? (
                                    <Link
                                        to={item.path}
                                        className="flex flex-col items-center justify-center py-3 md:py-4 lg:py-6"
                                    >
                                        <div className="mb-2 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10">
                                            {item.icon}
                                        </div>
                                        <span className={`text-xs md:text-sm font-medium ${item.name === "Sign Out" ? "text-red-600" : "text-gray-900"}`}>
                                            {item.name}
                                        </span>
                                    </Link>
                                ) : (
                                    <button
                                        onClick={item.onClick}
                                        className="w-full flex flex-col items-center justify-center py-3 md:py-4 lg:py-6"
                                    >
                                        <div className="mb-2 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10">
                                            {item.icon}
                                        </div>
                                        <span className="text-xs md:text-sm font-medium text-red-600">
                                            {item.name}
                                        </span>
                                    </button>
                                )}
                            </li>
                        ))}
                    </div>
                </ul>
            </div>
        </>
    );
};

export default Sidebar;
