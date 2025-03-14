import React, { useState, useEffect, useCallback } from "react";
import NotificationDropdown from "./Header/NotificationDropdown";
import ProfileDropdown from "./Header/ProfileDropdown";
import fetchNotifications from "../../data/notifications"; // Import correctly

const Header = ({ title }) => {
    const [notificationsState, setNotificationsState] = useState([]);

    useEffect(() => {
        const loadNotifications = async () => {
            try {
                const data = await fetchNotifications(); // Ensure this is working
                console.log("Fetched notifications:", data); // Debugging step
                setNotificationsState(data);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };
        loadNotifications();
    }, []);

    const markAsRead = useCallback((id) => {
        setNotificationsState((prevNotifications) =>
            prevNotifications.map((notification) =>
                notification.id === id
                    ? { ...notification, read: true }
                    : notification
            )
        );
    }, []);

    return (
        <header className="sticky top-0 bg-white shadow-sm px-4 py-2 flex items-center justify-between z-40 h-16 md:pr-4">
            <div className="flex-1 font-fredoka font-light">
                <h1 className="text-2xl text-gray-700">{title}</h1>
            </div>

            <div className="flex items-center space-x-4">
                <NotificationDropdown
                    notifications={notificationsState}
                    markAsRead={markAsRead}
                    setNotifications={setNotificationsState}
                />
                <ProfileDropdown />
            </div>
        </header>
    );
};

export default Header;
