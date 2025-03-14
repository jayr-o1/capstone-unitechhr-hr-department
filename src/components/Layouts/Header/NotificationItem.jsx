import React from "react";
import profileImage from "../../../assets/images/profile-1.jpeg";
import NotificationCloseIcon from "../../../assets/icons/HeaderIcons/NotificationCloseIcon";

const NotificationItem = ({ notification, markAsRead, onDelete }) => {
    return (
        <div
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
                <p className="text-sm font-medium">{notification.message}</p>
                <p className="text-xs text-gray-500">{notification.time}</p>
            </div>
            <button
                type="button"
                className="text-gray-400 hover:text-red-500 cursor-pointer"
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                }}
            >
                <NotificationCloseIcon />
            </button>
        </div>
    );
};

export default NotificationItem;
