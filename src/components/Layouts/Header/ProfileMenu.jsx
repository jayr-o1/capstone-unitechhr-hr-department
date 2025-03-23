import React from "react";
import { Link } from "react-router-dom";
import ProfileIcon from "../../../assets/icons/HeaderIcons/ProfileIcon";
import SignOutIcon from "../../../assets/icons/HeaderIcons/SignOutIcon";
import SubscriptionIcon from "../../../assets/icons/HeaderIcons/SubscriptionIcon";
import profileImage from "../../../assets/images/profile-1.jpeg";

const ProfileMenu = ({ onClose, onLogout, userEmail, userData }) => {
    const handleLogout = (e) => {
        e.preventDefault();
        onLogout();
        onClose();
    };

    // Get display name and position from userData but remove the position part from display name
    let displayName = userData?.displayName || userData?.fullName || "User";
    
    // Remove any text in parentheses (like "HR Head") from the display name
    displayName = displayName.replace(/\s*\([^)]*\)\s*/g, "").trim();
    
    const position = userData?.position || "HR Personnel";

    return (
        <ul className="absolute right-0 mt-2 min-w-max bg-white rounded-lg shadow-lg">
            <li className="border-b border-gray-400">
                <div className="flex items-center px-4 py-4">
                    <div className="flex-none">
                        <img
                            className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                            src={profileImage}
                            alt="Profile"
                        />
                    </div>
                    <div className="truncate ltr:pl-4 rtl:pr-4">
                        <h4 className="text-base font-medium whitespace-nowrap">
                            {displayName}
                            <span className="rounded bg-[#04B800] px-2 py-1 text-xs text-white ltr:ml-2 rtl:ml-2">
                                {position}
                            </span>
                        </h4>
                        <span
                            className="text-black/60 hover:text-primary dark:text-dark-light/60 dark:hover:text-[#0066FF] whitespace-nowrap"
                        >
                            {userEmail || "johndoe@gmail.com"}
                        </span>
                    </div>
                </div>
            </li>
            <li>
                <Link
                    to="/profile"
                    className="flex items-center px-4 py-3 hover:bg-gray-100"
                    onClick={onClose}
                >
                    <ProfileIcon />
                    <span className="ml-2">Profile</span>
                </Link>
            </li>
            <li>
                <Link
                    to="/subscription"
                    className="flex items-center px-4 py-3 hover:bg-gray-100"
                    onClick={onClose}
                >
                    <SubscriptionIcon />
                    <span className="ml-2">&nbsp;Subscription</span>
                </Link>
            </li>
            <li className="border-t border-gray-400">
                <a
                    href="#"
                    className="flex items-center px-4 py-4 text-red-600 hover:bg-gray-100"
                    onClick={handleLogout}
                >
                    <SignOutIcon className="text-red-600" />
                    <span className="ml-2">Sign Out</span>
                </a>
            </li>
        </ul>
    );
};

export default ProfileMenu;
