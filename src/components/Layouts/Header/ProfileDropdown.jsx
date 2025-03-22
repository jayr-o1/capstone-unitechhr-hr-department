import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthProvider";
import ProfileMenu from "./ProfileMenu";
import profileImage from "../../../assets/images/profile-1.jpeg";
import { getUserData } from "../../../services/userService";

const ProfileDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { user, logout } = useAuth();
    const [userData, setUserData] = useState(null);

    // Fetch user data from Firestore when the component mounts or user changes
    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.uid) {
                const result = await getUserData(user.uid);
                if (result.success) {
                    setUserData(result.data);
                }
            }
        };

        fetchUserData();
    }, [user]);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleClickOutside = (e) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            // Redirect is handled by the protected route in App.jsx
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const closeDropdown = () => {
        setIsOpen(false);
    };

    // Extract name from displayName or use email as fallback
    const name = userData?.displayName || user?.displayName || user?.email || '';
    const position = userData?.position || 'HR Personnel';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                className="hover:text-primary p-1 cursor-pointer"
                onClick={toggleDropdown}
            >
                <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all duration-200">
                    <img
                        src={profileImage}
                        className="object-cover h-full w-full hover:scale-105 transition-transform duration-200"
                        alt="Profile"
                    />
                </div>
            </button>

            {isOpen && (
                <ProfileMenu 
                    onClose={closeDropdown} 
                    onLogout={handleLogout}
                    userEmail={user?.email}
                    userData={userData}
                />
            )}
        </div>
    );
};

export default ProfileDropdown;
