import React, { useState, useEffect, useCallback, memo } from "react";
import NotificationDropdown from "./Header/NotificationDropdown";
import ProfileDropdown from "./Header/ProfileDropdown";
import fetchNotifications from "../../data/notifications"; // Import correctly
import { ChevronRight, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Create a memoized breadcrumb item component to prevent unnecessary re-renders
const BreadcrumbItem = memo(({ item, index, onBreadcrumbClick }) => {
    return (
        <React.Fragment>
            <ChevronRight size={16} className="text-gray-400" />
            <span 
                className={`
                    ${item.path ? 
                        "text-blue-600 hover:text-blue-800 hover:underline cursor-pointer" : 
                        "text-gray-800 font-medium"}
                    transition-colors
                `}
                onClick={() => item.path && onBreadcrumbClick(item.path)}
            >
                {item.title}
            </span>
        </React.Fragment>
    );
});

// Make the entire Header component memoized for performance
const Header = memo(({ title, breadcrumb = [], onBreadcrumbClick, userRole, userPermissions }) => {
    const [notificationsState, setNotificationsState] = useState([]);
    const navigate = useNavigate();
    const isHRPersonnel = userRole === "hr_personnel";
    
    // HR Heads and admins always get notifications, HR personnel need the specific permission
    const hasNotificationPermission = 
        userRole === "hr_head" || 
        userRole === "admin" || 
        (isHRPersonnel && userPermissions?.notifications);
    
    // Debug logging
    useEffect(() => {
        console.log("Header userRole:", userRole);
        console.log("Header userPermissions:", userPermissions);
        console.log("Has notification permission:", hasNotificationPermission);
    }, [userRole, userPermissions, hasNotificationPermission]);

    useEffect(() => {
        const loadNotifications = async () => {
            // Only load notifications if user has permission
            if (!hasNotificationPermission) return;
            
            try {
                const data = await fetchNotifications(); // Ensure this is working
                console.log("Fetched notifications:", data); // Debugging step
                setNotificationsState(data);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };
        loadNotifications();
    }, [hasNotificationPermission]);

    const markAsRead = useCallback((id) => {
        setNotificationsState((prevNotifications) =>
            prevNotifications.map((notification) =>
                notification.id === id
                    ? { ...notification, read: true }
                    : notification
            )
        );
    }, []);

    const goHome = useCallback(() => navigate("/dashboard"), [navigate]);

    return (
        <header className="sticky top-0 bg-white shadow-sm px-4 py-2 flex items-center justify-between z-40 h-16 md:pr-4 border-b border-gray-200">
            <div className="flex-1 font-fredoka font-normal overflow-x-auto whitespace-nowrap no-scrollbar">
                {breadcrumb.length > 0 ? (
                    <div className="flex items-center space-x-1">
                        <Home 
                            size={16} 
                            className="text-gray-500 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={goHome}
                        />
                        {breadcrumb.map((item, index) => (
                            <BreadcrumbItem 
                                key={`${index}-${item.title}`}
                                item={item}
                                index={index}
                                onBreadcrumbClick={onBreadcrumbClick}
                            />
                        ))}
                    </div>
                ) : (
                    <h1 className="text-xl text-gray-800 font-medium">{title}</h1>
                )}
            </div>

            <div className="flex items-center space-x-6">
                {hasNotificationPermission && (
                    <NotificationDropdown
                        notifications={notificationsState}
                        markAsRead={markAsRead}
                        setNotifications={setNotificationsState}
                    />
                )}
                {/* Only show profile dropdown for HR Heads and users with profile access */}
                {(!isHRPersonnel || userRole === "hr_head" || userRole === "admin") && (
                    <ProfileDropdown />
                )}
            </div>
        </header>
    );
});

export default Header;