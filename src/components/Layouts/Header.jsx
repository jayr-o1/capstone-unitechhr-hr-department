import React, { useState, useEffect, useRef } from "react";
import CalendarIcon from "../../assets/icons/HeaderIcons/CalendarIcon";
import NotificationIcon from "../../assets/icons/HeaderIcons/NotificationIcon";
import ProfileIcon from "../../assets/icons/HeaderIcons/ProfileIcon";
import SignOutIcon from "../../assets/icons/HeaderIcons/SignOutIcon";
import SubscriptionIcon from "../../assets/icons/HeaderIcons/SubscriptionIcon";
import NotificationAlertIcon from "../../assets/icons/HeaderIcons/NotificationAlertIcon";
import NotificationCloseIcon from "../../assets/icons/HeaderIcons/NotificationCloseIcon";
import profileImage from "../../assets/images/profile-1.jpeg";

// Notification Dropdown Component
const NotificationDropdown = ({
    notifications,
    markAsRead,
    setNotifications,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const toggleDropdown = () => setIsOpen(!isOpen);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                className="p-2 rounded-full bg-gray-100 focus:outline-none cursor-pointer"
                onClick={toggleDropdown}
            >
                <NotificationIcon />
                {notifications.some((n) => !n.read) && (
                    <span className="absolute left-5 top-0 right-0 flex h-3.5 w-3.5">
                        <span className="absolute inset-0 h-full w-full animate-ping rounded-full bg-green-500/50 opacity-75"></span>
                        <span className="relative m-1 top-0 right-0 h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg divide-y">
                    <div className="px-4 py-2 font-semibold text-lg flex items-center">
                        <span>Notification</span>
                        {notifications.some((n) => !n.read) && (
                            <span className="ml-2 bg-[#76B5FE] text-white text-sm px-2 py-1 rounded-full ml-auto pl-4 pr-4">
                                {notifications.filter((n) => !n.read).length}{" "}
                                New
                            </span>
                        )}
                    </div>
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className="flex items-center px-4 py-3 hover:bg-gray-100"
                                onClick={() => markAsRead(notification.id)}
                            >
                                <div className="relative h-12 w-12 cursor-pointer">
                                    <img
                                        src={profileImage}
                                        alt="Profile"
                                        className="h-12 w-12 rounded-full object-cover"
                                    />
                                    {!notification.read && (
                                        <span className="absolute left-8.5 right-0 bottom-0 top-10 flex h-4 w-4">
                                            <span className="relative h-2 w-2 rounded-full bg-green-500"></span>
                                        </span>
                                    )}
                                </div>
                                <div className="ml-3 flex-1 cursor-pointer">
                                    <p className="text-sm font-medium">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {notification.time}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className="text-gray-400 hover:text-red-500 cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setNotifications(
                                            notifications.filter(
                                                (n) => n.id !== notification.id
                                            )
                                        );
                                    }}
                                >
                                    <NotificationCloseIcon />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="!grid min-h-[200px] place-content-center text-lg hover:!bg-transparent">
                            <div className="mx-auto mb-4 rounded-full text-[#76B5FE] ring-4 ring-[#76B5FE]/30">
                                <NotificationAlertIcon />
                            </div>
                            No notification available.
                        </div>
                    )}
                    {notifications.length > 0 && (
                        <div className="p-3">
                            <button
                                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 cursor-pointer"
                                onClick={() =>
                                    setNotifications(
                                        notifications.map((n) => ({
                                            ...n,
                                            read: true,
                                        }))
                                    )
                                }
                            >
                                Mark All as Read
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Profile Dropdown Component
const ProfileDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const profileDropdownRef = useRef(null);

    const toggleProfileDropdown = () => setIsOpen(!isOpen);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                profileDropdownRef.current &&
                !profileDropdownRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={profileDropdownRef}>
            <button
                className="group relative flex items-center justify-center"
                onClick={toggleProfileDropdown}
            >
                <span>
                    <img
                        className="flex h-10 w-10 rounded-full object-cover opacity-70 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                        src={profileImage}
                        alt="Profile"
                    />
                </span>
            </button>
            {isOpen && (
                <ul className="absolute right-0 mt-2 min-w-max bg-white rounded-lg shadow-lg">
                    <li className="border-b border-gray-400">
                        <div className="flex items-center px-4 py-4">
                            <div className="flex-none">
                                <img
                                    className="h-10 w-10 rounded-md object-cover"
                                    src={profileImage}
                                    alt="Profile"
                                />
                            </div>
                            <div className="truncate ltr:pl-4 rtl:pr-4">
                                <h4 className="text-base whitespace-nowrap">
                                    Jay-r Olores
                                    <span className="rounded bg-[#04B800] px-2 py-1 text-xs text-white ltr:ml-2 rtl:ml-2">
                                        Admin
                                    </span>
                                </h4>
                                <a
                                    className="text-black/60 hover:text-primary dark:text-dark-light/60 dark:hover:text-[#0066FF] whitespace-nowrap"
                                    href="javascript:;"
                                >
                                    jayrmalazarte.olores@gmail.com
                                </a>
                            </div>
                        </div>
                    </li>
                    <li>
                        <a
                            href="users-profile.html"
                            className="flex items-center px-4 py-3 hover:bg-gray-100"
                            onClick={toggleProfileDropdown}
                        >
                            <ProfileIcon />
                            <span className="ml-2">Profile</span>
                        </a>
                    </li>
                    <li>
                        <a
                            href="subscription.html"
                            className="flex items-center px-4 py-3 hover:bg-gray-100"
                            onClick={toggleProfileDropdown}
                        >
                            <SubscriptionIcon />
                            <span className="ml-2">&nbsp;Subscription</span>
                        </a>
                    </li>
                    <li className="border-t border-gray-400">
                        <a
                            href="auth-boxed-signin.html"
                            className="flex items-center px-4 py-4 text-red-600 hover:bg-gray-100"
                            onClick={toggleProfileDropdown}
                        >
                            <SignOutIcon className="text-red-600" />
                            <span className="ml-2">Sign Out</span>
                        </a>
                    </li>
                </ul>
            )}
        </div>
    );
};

// Main Header Component
const Header = ({ title }) => {
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            profile: "user1.jpg",
            message: "You have a new message",
            time: "2 mins ago",
            read: false,
        },
        {
            id: 2,
            profile: "user2.jpg",
            message: "The quick brown fox jumps over the lazy dog",
            time: "10 mins ago",
            read: false,
        },
    ]);

    const markAsRead = (id) => {
        setNotifications(
            notifications.map((notification) =>
                notification.id === id
                    ? { ...notification, read: true }
                    : notification
            )
        );
    };

    return (
        <header className="sticky top-0 bg-white shadow-sm px-4 py-2 flex items-center justify-between z-40 h-16 md:pr-4">
            {/* Empty div to push notification and profile to the right */}
            <div className="flex-1 font-fredoka font-light">
                <h1 className="text-2xl text-gray-700">{title}</h1>
            </div>

            {/* Notification and Profile */}
            <div className="flex items-center space-x-4">
                <NotificationDropdown
                    notifications={notifications}
                    markAsRead={markAsRead}
                    setNotifications={setNotifications}
                />
                <ProfileDropdown />
            </div>
        </header>
    );
};

export default Header;
