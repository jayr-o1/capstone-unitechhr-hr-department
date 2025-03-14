import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import DashboardIcon from "../../assets/icons/SidebarIcons/DashboardIcon";
import RecruitmentIcon from "../../assets/icons/SidebarIcons/RecruitmentIcon";
import OnboardingIcon from "../../assets/icons/SidebarIcons/OnboardingIcon";
import EmployeesIcon from "../../assets/icons/SidebarIcons/EmployeesIcon";
import ClustersIcon from "../../assets/icons/SidebarIcons/ClustersIcon";

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
                    className="fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
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
                        ].map((item, index) => (
                            <li
                                key={index}
                                className={`mx-4 bg-gray-100 rounded-xl shadow-md hover:bg-gray-200 transition-colors duration-200 ${
                                    location.pathname === item.path
                                        ? "bg-gray-200" // Active page styling
                                        : "bg-gray-100 hover:bg-gray-200"
                                }`}
                            >
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
                            </li>
                        ))}
                    </div>

                    {/* Optional: Add a footer or additional content here */}
                    <div className="p-4 text-center text-sm text-gray-400 border-t border-gray-700">
                        {" "}
                        © 2025 UNITECH HR
                    </div>
                </ul>
            </div>
        </>
    );
};

export default Sidebar;
