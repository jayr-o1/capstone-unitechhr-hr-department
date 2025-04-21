import React, { useState, useEffect } from "react";
import {
    fetchGeneralNotifications,
    fetchUserNotifications,
    markNotificationAsRead,
    markUserNotificationAsRead,
    markAllGeneralNotificationsAsRead,
    markAllUserNotificationsAsRead,
    deleteNotification,
    deleteUserNotification,
    checkUserRole,
} from "../services/notificationService";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { MdMarkChatRead, MdDelete, MdFilterList } from "react-icons/md";

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // 'all', 'unread', 'general', 'personal'
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const { currentUser } = useAuth();

    useEffect(() => {
        loadNotifications();
    }, [currentUser, filter]);

    const loadNotifications = async () => {
        if (!currentUser) return;

        setLoading(true);
        try {
            // Check user role to determine what notifications to show
            const userRole = await checkUserRole(currentUser.uid);
            const isApplicant = userRole === "applicant";

            let generalNotifs = [];
            let userNotifs = [];

            // Apply filters - only allow applicants to see general notifications
            if (
                isApplicant &&
                (filter === "all" ||
                    filter === "general" ||
                    filter === "unread")
            ) {
                generalNotifs = await fetchGeneralNotifications(50);
                if (filter === "unread") {
                    generalNotifs = generalNotifs.filter(
                        (notif) => !notif.read
                    );
                }
            }

            if (
                filter === "all" ||
                filter === "personal" ||
                filter === "unread"
            ) {
                userNotifs = await fetchUserNotifications(currentUser.uid, 50);
                if (filter === "unread") {
                    userNotifs = userNotifs.filter((notif) => !notif.read);
                }
            }

            // Combine and sort
            const combined = [...generalNotifs, ...userNotifs].sort((a, b) => {
                return b.timestamp?.toDate?.() - a.timestamp?.toDate?.() || 0;
            });

            setNotifications(combined);
        } catch (error) {
            console.error("Error loading notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.read) {
            try {
                if (notification.isUserSpecific) {
                    await markUserNotificationAsRead(notification.id);
                } else {
                    await markNotificationAsRead(notification.id);
                }

                // Update the notification in the local state
                setNotifications((prevNotifications) =>
                    prevNotifications.map((notif) =>
                        notif.id === notification.id
                            ? { ...notif, read: true }
                            : notif
                    )
                );
            } catch (error) {
                console.error("Error marking notification as read:", error);
            }
        }
    };

    const handleDeleteNotification = async (notification, e) => {
        e.stopPropagation(); // Prevent triggering the parent click

        try {
            if (notification.isUserSpecific) {
                await deleteUserNotification(notification.id);
            } else {
                await deleteNotification(notification.id);
            }

            // Remove the notification from the local state
            setNotifications((prevNotifications) =>
                prevNotifications.filter(
                    (notif) => notif.id !== notification.id
                )
            );
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            // Only pass user ID for role verification
            await markAllGeneralNotificationsAsRead(currentUser.uid);
            if (currentUser) {
                await markAllUserNotificationsAsRead(currentUser.uid);
            }

            // Update local state
            setNotifications((prevNotifications) =>
                prevNotifications.map((notif) => ({ ...notif, read: true }))
            );
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return "";
        const date = timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);
        return format(date, "MMM d, yyyy h:mm a");
    };

    const hasUnreadNotifications = notifications.some((notif) => !notif.read);

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    Notifications
                </h1>

                <div className="flex space-x-4">
                    <div className="relative">
                        <button
                            className="flex items-center px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700"
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                        >
                            <MdFilterList className="mr-2" />
                            <span>
                                {filter === "all"
                                    ? "All Notifications"
                                    : filter === "unread"
                                    ? "Unread"
                                    : filter === "general"
                                    ? "General"
                                    : "Personal"}
                            </span>
                        </button>

                        {showFilterMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-50">
                                <div className="py-1">
                                    <button
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                        onClick={() => {
                                            setFilter("all");
                                            setShowFilterMenu(false);
                                        }}
                                    >
                                        All Notifications
                                    </button>
                                    <button
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                        onClick={() => {
                                            setFilter("unread");
                                            setShowFilterMenu(false);
                                        }}
                                    >
                                        Unread
                                    </button>
                                    <button
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                        onClick={() => {
                                            setFilter("general");
                                            setShowFilterMenu(false);
                                        }}
                                    >
                                        General
                                    </button>
                                    <button
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                        onClick={() => {
                                            setFilter("personal");
                                            setShowFilterMenu(false);
                                        }}
                                    >
                                        Personal
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {hasUnreadNotifications && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-100 text-sm font-medium"
                        >
                            <MdMarkChatRead className="mr-2" />
                            <span>Mark all as read</span>
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-blue-600 motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                    <p className="mt-2 text-gray-600">
                        Loading notifications...
                    </p>
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-10">
                    <div className="text-gray-400 mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-16 w-16 mx-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                            />
                        </svg>
                    </div>
                    <p className="text-xl font-medium text-gray-600">
                        No notifications found
                    </p>
                    <p className="text-gray-500 mt-1">You're all caught up!</p>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`flex items-start p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                                !notification.read ? "bg-blue-50" : ""
                            }`}
                            onClick={() =>
                                handleNotificationClick(notification)
                            }
                        >
                            <div
                                className={`rounded-full p-3 mr-4 ${
                                    notification.isUserSpecific
                                        ? "bg-purple-100"
                                        : "bg-blue-100"
                                }`}
                            >
                                <i
                                    className={
                                        notification.icon || "fa fa-bell"
                                    }
                                />
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium text-gray-900">
                                            {notification.title}
                                        </h3>
                                        <p className="text-gray-600 mt-1">
                                            {notification.message}
                                        </p>
                                    </div>

                                    <button
                                        onClick={(e) =>
                                            handleDeleteNotification(
                                                notification,
                                                e
                                            )
                                        }
                                        className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                                        title="Delete notification"
                                    >
                                        <MdDelete size={20} />
                                    </button>
                                </div>

                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-gray-500">
                                        {formatTimestamp(
                                            notification.timestamp
                                        )}
                                    </span>
                                    {notification.isUserSpecific && (
                                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                            Personal
                                        </span>
                                    )}
                                </div>
                            </div>

                            {!notification.read && (
                                <div className="ml-2 mt-1">
                                    <span
                                        className="w-3 h-3 bg-blue-500 rounded-full block"
                                        title="Unread"
                                    ></span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;
