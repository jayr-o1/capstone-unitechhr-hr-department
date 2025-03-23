import React, { useState, useRef, useEffect } from "react";
import NotificationIcon from "../../../assets/icons/HeaderIcons/NotificationIcon";
import NotificationList from "./NotificationList";

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
                className="p-3 rounded-full bg-gray-100 focus:outline-none cursor-pointer hover:bg-gray-200"
                onClick={toggleDropdown}
            >
                <div className="h-6 w-6">
                    <NotificationIcon />
                </div>
                {notifications.some((n) => !n.read) && (
                    <span className="absolute left-7 top-0 right-0 flex h-4 w-4">
                        <span className="absolute inset-0 h-full w-full animate-ping rounded-full bg-green-500/50 opacity-75"></span>
                        <span className="relative m-1 top-0 right-0 h-2 w-2 rounded-full bg-green-500"></span>
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
                    <NotificationList
                        notifications={notifications}
                        markAsRead={markAsRead}
                        setNotifications={setNotifications}
                    />
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

export default NotificationDropdown;
