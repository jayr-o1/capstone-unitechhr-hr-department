import React, { useState, useRef, useEffect } from "react";
import profileImage from "../../../assets/images/profile-1.jpeg";
import ProfileMenu from "./ProfileMenu";

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
            {isOpen && <ProfileMenu onClose={() => setIsOpen(false)} />}
        </div>
    );
};

export default ProfileDropdown;
