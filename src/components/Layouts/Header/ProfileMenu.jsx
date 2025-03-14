import React from "react";
import ProfileIcon from "../../../assets/icons/HeaderIcons/ProfileIcon";
import SignOutIcon from "../../../assets/icons/HeaderIcons/SignOutIcon";
import SubscriptionIcon from "../../../assets/icons/HeaderIcons/SubscriptionIcon";
import profileImage from "../../../assets/images/profile-1.jpeg";

const ProfileMenu = ({ onClose }) => {
    return (
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
                    onClick={onClose}
                >
                    <ProfileIcon />
                    <span className="ml-2">Profile</span>
                </a>
            </li>
            <li>
                <a
                    href="subscription.html"
                    className="flex items-center px-4 py-3 hover:bg-gray-100"
                    onClick={onClose}
                >
                    <SubscriptionIcon />
                    <span className="ml-2">&nbsp;Subscription</span>
                </a>
            </li>
            <li className="border-t border-gray-400">
                <a
                    href="auth-boxed-signin.html"
                    className="flex items-center px-4 py-4 text-red-600 hover:bg-gray-100"
                    onClick={onClose}
                >
                    <SignOutIcon className="text-red-600" />
                    <span className="ml-2">Sign Out</span>
                </a>
            </li>
        </ul>
    );
};

export default ProfileMenu;
