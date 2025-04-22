import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import { MdMarkChatRead } from "react-icons/md";
import {
    fetchGeneralNotifications,
    fetchUserNotifications,
    markNotificationAsRead,
    markUserNotificationAsRead,
    markAllGeneralNotificationsAsRead,
    markAllUserNotificationsAsRead,
} from "../services/notificationService";
import { useAuth } from "../contexts/AuthContext";

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const { currentUser, checkUserRole } = useAuth();

    const loadNotifications = async () => {
        setLoading(true);
        try {
            // Check user role to determine if they should see general notifications
            const userRole = await checkUserRole(currentUser.uid);
            const isApplicant = userRole === "applicant";

            // Fetch both general and user-specific notifications based on role
            let generalNotifs = [];
            if (isApplicant) {
                // Only fetch general notifications for applicants
                generalNotifs = await fetchGeneralNotifications(5);
            }

            const userNotifs = currentUser
                ? await fetchUserNotifications(currentUser.uid, 5)
                : [];

            // Combine and sort notifications by timestamp
            const combined = [...generalNotifs, ...userNotifs]
                .sort((a, b) => {
                    return (
                        b.timestamp?.toDate?.() - a.timestamp?.toDate?.() || 0
                    );
                })
                .slice(0, 8); // Limit to 8 total notifications

            setNotifications(combined);

            // Calculate unread count
            setUnreadCount(combined.filter((notif) => !notif.read).length);
        } catch (error) {
            console.error("Error loading notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser) {
            loadNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [currentUser]);

    useEffect(() => {
        // Add event listener to close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read if not already
        if (!notification.read) {
            if (notification.isUserSpecific) {
                await markUserNotificationAsRead(notification.id);
            } else {
                await markNotificationAsRead(notification.id);
            }

            // Update local state
            setNotifications((prevNotifications) =>
                prevNotifications.map((notif) =>
                    notif.id === notification.id
                        ? { ...notif, read: true }
                        : notif
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Redirect or perform action based on notification type
        if (notification.link) {
            // Let the Link component handle navigation
            return;
        }

        // Close the dropdown after clicking
        setIsOpen(false);
    };

    const markAllAsRead = async () => {
        try {
            await markAllGeneralNotificationsAsRead(currentUser.uid);
            if (currentUser) {
                await markAllUserNotificationsAsRead(currentUser.uid);
            }

            // Update local state
            setNotifications((prevNotifications) =>
                prevNotifications.map((notif) => ({ ...notif, read: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
                onClick={toggleDropdown}
                aria-label="Notifications"
            >
                <FaBell className="h-6 w-6 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-700">
                            Notifications
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                title="Mark all as read"
                            >
                                <MdMarkChatRead className="mr-1" />
                                <span>Mark all as read</span>
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="px-4 py-3 text-center text-gray-500">
                                Loading notifications...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-3 text-center text-gray-500">
                                No notifications
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <Link
                                    key={notification.id}
                                    to={notification.link || "#"}
                                    className={`block px-4 py-3 border-b hover:bg-gray-50 ${
                                        !notification.read ? "bg-blue-50" : ""
                                    }`}
                                    onClick={() =>
                                        handleNotificationClick(notification)
                                    }
                                >
                                    <div className="flex items-start">
                                        <div
                                            className={`rounded-full p-2 mr-3 ${
                                                notification.isUserSpecific
                                                    ? "bg-purple-100"
                                                    : "bg-blue-100"
                                            }`}
                                        >
                                            <i
                                                className={
                                                    notification.icon ||
                                                    "fa fa-bell"
                                                }
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">
                                                {notification.title}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {notification.message}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                {notification.time}
                                            </div>
                                        </div>
                                        {!notification.read && (
                                            <span
                                                className="w-2 h-2 bg-blue-500 rounded-full"
                                                title="Unread"
                                            ></span>
                                        )}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>

                    <div className="px-4 py-2 bg-gray-50 border-t text-center">
                        <Link
                            to="/notifications"
                            className="text-sm text-blue-600 hover:text-blue-800"
                            onClick={() => setIsOpen(false)}
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
