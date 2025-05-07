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

const Sidebar = ({ userRole, userPermissions }) => {
    const [isOpen, setIsOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth(); // Get current user and logout function

    // Check if user is an HR Head (department manager)
    const isHRHead = userRole === "hr_head" || userRole === "admin";

    // Check if a user has permission to access a specific route
    const hasPermission = (path) => {
        // HR Heads have access to everything
        if (isHRHead) return true;

        // HR Personnel need specific permissions
        if (userRole === "hr_personnel") {
            // Dashboard is accessible to everyone
            if (path === "/dashboard") return true;

            // Check specific module permissions
            if (path === "/recruitment" && userPermissions?.recruitment)
                return true;
            if (path === "/onboarding" && userPermissions?.onboarding)
                return true;
            if (path === "/employees" && userPermissions?.employees)
                return true;
            if (path === "/clusters" && userPermissions?.clusters) return true;
            if (path === "/training-needs" && userPermissions?.clusters)
                return true;

            // Any other path is restricted
            return false;
        }

        // Default allow for non-HR roles (shouldn't happen but just in case)
        return true;
    };

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

    // Create menu items array
    const menuItems = [
        {
            name: "HR Dashboard",
            path: "/dashboard",
            icon: (
                <DashboardIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
            ),
        },
        {
            name: "Job Recruitment",
            path: "/recruitment",
            icon: (
                <RecruitmentIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
            ),
        },
        {
            name: "Applicant Onboarding",
            path: "/onboarding",
            icon: (
                <OnboardingIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
            ),
        },
        {
            name: "Employee Profiling",
            path: "/employees",
            icon: (
                <EmployeesIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
            ),
        },
        {
            name: "Training Needs",
            path: "/training-needs",
            icon: (
                <ClustersIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
            ),
        },
    ];

    // Add HR Management option only for HR Heads
    if (isHRHead) {
        menuItems.push({
            name: "HR Management",
            path: "/hr-management",
            icon: (
                <HRManagementIcon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10" />
            ),
        });
    }

    return (
        <>
            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-lg transition-transform duration-300 z-50 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                } flex flex-col`}
            >
                {/* Sidebar Header */}
                <div className="text-center text-3xl font-fredoka font-semibold p-4 bg-gradient-to-r from-[#131674] to-[#8d46a5] text-transparent bg-clip-text">
                    UNITECH HR
                </div>

                {/* Main Menu Items */}
                <div className="flex-grow overflow-y-auto pt-4">
                    <ul className="space-y-4">
                        {menuItems.map((item, index) => {
                            const itemHasPermission = hasPermission(item.path);
                            return (
                                <li
                                    key={index}
                                    className={`mx-4 ${
                                        itemHasPermission
                                            ? "bg-gray-100 rounded-xl shadow-md hover:bg-gray-200 transition-colors duration-200"
                                            : "bg-gray-100 rounded-xl shadow-md opacity-50 cursor-not-allowed"
                                    } ${
                                        location.pathname === item.path &&
                                        itemHasPermission
                                            ? "bg-gray-200" // Active page styling
                                            : "bg-gray-100"
                                    }`}
                                >
                                    {itemHasPermission ? (
                                        <Link
                                            to={item.path}
                                            className="flex flex-col items-center justify-center py-3 md:py-4 lg:py-6"
                                        >
                                            <div className="mb-2 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10">
                                                {item.icon}
                                            </div>
                                            <span className="text-xs md:text-sm font-medium text-gray-900">
                                                {item.name}
                                            </span>
                                        </Link>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-3 md:py-4 lg:py-6">
                                            <div className="mb-2 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-gray-400">
                                                {item.icon}
                                            </div>
                                            <span className="text-xs md:text-sm font-medium text-gray-400">
                                                {item.name}
                                            </span>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Sign Out Button for HR Personnel - at bottom with horizontal line */}
                {!isHRHead && (
                    <div className="mt-auto mb-4">
                        <hr className="border-t border-gray-300 mx-4 mb-4" />
                        <div className="mx-4 bg-gray-100 rounded-xl shadow-md hover:bg-gray-200 transition-colors duration-200 cursor-pointer">
                            <button
                                onClick={handleLogout}
                                className="w-full flex flex-col items-center justify-center py-3 md:py-4 lg:py-6 cursor-pointer"
                            >
                                <div className="mb-2 flex items-center justify-center w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10">
                                    {/* Custom logout icon in red */}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-full h-full text-red-600"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                                        />
                                    </svg>
                                </div>
                                <span className="text-xs md:text-sm font-medium text-red-600">
                                    Sign Out
                                </span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Sidebar;
