import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faTachometerAlt,
    faUser,
    faFileAlt,
    faChartLine,
    faSignOutAlt,
    faBars,
    faTimes,
    faBell,
    faChalkboardTeacher,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import EmployeePageLoader from "./EmployeePageLoader"; // Import our custom EmployeePageLoader

const EmployeeLayout = () => {
    const { user, userDetails, university, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Set a flag in sessionStorage to determine if this is an initial page load or refresh
    useEffect(() => {
        const isPageRefresh = !sessionStorage.getItem("employeeSessionStarted");

        if (isPageRefresh) {
            // This is either a first visit or a page refresh
            sessionStorage.setItem("isPageRefresh", "true");
            sessionStorage.setItem("employeeSessionStarted", "true");
        } else {
            // This is a navigation within the app
            sessionStorage.setItem("isPageRefresh", "false");
        }

        // Clear the refresh flag when the component unmounts
        return () => {
            sessionStorage.removeItem("isPageRefresh");
        };
    }, []);

    // Debug user authentication
    useEffect(() => {
        console.log("EmployeeLayout - User:", user);
        console.log("EmployeeLayout - UserDetails:", userDetails);
        console.log("EmployeeLayout - University:", university);

        // Redirect to login if not authenticated
        if (!user) {
            console.log("No authenticated user found, redirecting to login");
            toast.error("Please login to access employee dashboard");
            navigate("/", { replace: true });
        }
    }, [user, userDetails, university, navigate]);

    // Check if mobile on resize
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
            if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
            }
        };

        // Initial check
        checkIfMobile();

        // Add event listener
        window.addEventListener("resize", checkIfMobile);

        // Clean up
        return () => window.removeEventListener("resize", checkIfMobile);
    }, []);

    // Show loading spinner on route changes
    useEffect(() => {
        setIsLoading(true);

        // Reset isPageRefresh flag since this is navigation, not a page refresh
        if (location.pathname) {
            sessionStorage.setItem("isPageRefresh", "false");
        }

        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    const handleLogout = async () => {
        await logout();
        // Clean up session storage
        sessionStorage.removeItem("employeeSessionStarted");
        sessionStorage.removeItem("isPageRefresh");
        navigate("/");
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const navigation = [
        {
            name: "Dashboard",
            icon: faTachometerAlt,
            path: "/employee/dashboard",
        },
        { name: "Profile", icon: faUser, path: "/employee/profile" },
        {
            name: "Development Goals",
            icon: faChalkboardTeacher,
            path: "/employee/development-goals",
        },
    ];

    // Close sidebar when clicking a nav item on mobile
    const handleNavClick = () => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };

    // Get current page title
    const getCurrentPageTitle = () => {
        const currentRoute = navigation.find(
            (item) => item.path === location.pathname
        );
        return currentRoute?.name || "Employee Portal";
    };

    // Update document title when page changes
    useEffect(() => {
        const pageTitle = getCurrentPageTitle();
        document.title = `Unitech HR | ${pageTitle}`;
    }, [location.pathname]);

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Mobile Header with Toggle Button - Always visible on mobile */}
            <header className="bg-white border-b shadow-lg sticky top-0 z-50 md:hidden">
                <div className="flex items-center justify-between px-4 py-3">
                    <button
                        onClick={toggleSidebar}
                        className="p-2.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                        <FontAwesomeIcon
                            icon={isSidebarOpen ? faTimes : faBars}
                            className="w-5 h-5"
                        />
                    </button>

                    <h1 className="text-lg font-bold text-gray-800">
                        {getCurrentPageTitle()}
                    </h1>

                    <div className="flex items-center space-x-3">
                        <button className="p-2 rounded-full bg-gray-100 text-gray-600">
                            <FontAwesomeIcon
                                icon={faBell}
                                className="w-4 h-4"
                            />
                        </button>
                        <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center font-bold">
                            {user?.displayName?.charAt(0) ||
                                userDetails?.name?.charAt(0) ||
                                userDetails?.displayName?.charAt(0) ||
                                userDetails?.fullName?.charAt(0) ||
                                "U"}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area - Everything below header */}
            <div className="relative flex-1 flex md:flex-row flex-col overflow-hidden">
                {/* Mobile Sidebar Wrapper with correct padding */}
                <div className="md:relative">
                    {/* Sidebar */}
                    <aside
                        className={`fixed md:static z-40 transition-all duration-300 transform ${
                            isSidebarOpen
                                ? "translate-x-0"
                                : "-translate-x-full md:translate-x-0"
                        } bg-white w-64 border-r shadow-lg md:shadow-none flex flex-col 
              h-[calc(100vh-56px)] md:h-screen top-[56px] md:top-0 overflow-y-auto`}
                    >
                        {/* Logo - Only visible on desktop */}
                        <div className="hidden md:flex items-center justify-center py-5 border-b">
                            <div className="text-center text-3xl font-fredoka font-semibold p-2 bg-gradient-to-r from-[#131674] to-[#8d46a5] text-transparent bg-clip-text">
                                UNITECH HR
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="flex-1 overflow-y-auto py-4 px-3 md:mt-0 mt-4">
                            <ul className="space-y-3">
                                {navigation.map((item) => (
                                    <li
                                        key={item.name}
                                        className="bg-gray-100 rounded-xl shadow-md hover:bg-gray-200 transition-colors duration-200"
                                    >
                                        <Link
                                            to={item.path}
                                            className={`flex items-center py-3 px-4 ${
                                                location.pathname === item.path
                                                    ? "bg-gray-200 rounded-xl text-blue-600"
                                                    : "text-gray-600"
                                            }`}
                                            onClick={handleNavClick}
                                        >
                                            <div className="flex items-center justify-center w-8 h-8">
                                                <FontAwesomeIcon
                                                    icon={item.icon}
                                                    className="w-5 h-5"
                                                />
                                            </div>
                                            <span className="ml-3 text-sm font-medium">
                                                {item.name}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        {/* User Profile & Logout */}
                        <div className="mt-auto p-4 border-t">
                            <div className="flex items-center mb-4 bg-gray-100 p-3 rounded-xl shadow-sm">
                                <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                                    {user?.displayName?.charAt(0) ||
                                        userDetails?.name?.charAt(0) ||
                                        userDetails?.displayName?.charAt(0) ||
                                        userDetails?.fullName?.charAt(0) ||
                                        "U"}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-700 truncate max-w-[140px]">
                                        {userDetails?.name ||
                                            user?.displayName ||
                                            userDetails?.displayName ||
                                            userDetails?.fullName ||
                                            "Employee"}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate max-w-[140px]">
                                        {userDetails?.position ||
                                            userDetails?.role ||
                                            "Employee"}
                                    </p>
                                </div>
                            </div>
                            <div className="mx-1 bg-gray-100 rounded-xl shadow-md hover:bg-gray-200 transition-colors duration-200">
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center w-full px-4 py-3 text-red-600 rounded-xl"
                                >
                                    <div className="flex items-center justify-center w-8 h-8">
                                        <FontAwesomeIcon icon={faSignOutAlt} />
                                    </div>
                                    <span className="ml-2 text-sm font-medium">
                                        Sign Out
                                    </span>
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>

                {/* Main Content */}
                <main className="flex-1 flex flex-col overflow-hidden relative">
                    {/* Desktop Header - Hidden on mobile */}
                    <header className="hidden md:block bg-white border-b shadow-lg">
                        <div className="px-6 py-4 flex items-center justify-between">
                            <h1 className="text-xl font-bold text-gray-800">
                                {getCurrentPageTitle()}
                            </h1>
                            <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded-lg">
                                    {university?.name ||
                                        userDetails?.universityName ||
                                        "University"}
                                </span>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="flex-1 overflow-y-auto p-4">
                        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 relative">
                            {/* Employee Page Loader */}
                            <EmployeePageLoader
                                isLoading={isLoading}
                                contentOnly={true}
                                message={`Loading ${getCurrentPageTitle().toLowerCase()}...`}
                            />

                            {/* Outlet for page content */}
                            <div
                                className={
                                    isLoading
                                        ? "opacity-50 pointer-events-none"
                                        : ""
                                }
                            >
                                <Outlet />
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Overlay for mobile sidebar - Visible only when sidebar is open on mobile */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30"
                    onClick={toggleSidebar}
                />
            )}
        </div>
    );
};

export default EmployeeLayout;
