import React, { useState, useEffect, useRef } from "react";
import profileImage from "../assets/images/profile-1.jpeg";
import { useAuth } from "../contexts/AuthProvider";
import { getUserData, updateUserData } from "../services/userService";
import Swal from "sweetalert2";
import { FiEdit, FiSave, FiX } from "react-icons/fi";
import WarningAlert from "../components/Alerts/WarningAlert";

const Profile = () => {
    const { user } = useAuth();
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [profilePicture, setProfilePicture] = useState(profileImage);
    const fileInputRef = useRef(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const [profileData, setProfileData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        contactNumber: "",
        position: "",
        employeeId: "",
    });

    useEffect(() => {
        const fetchUserData = async () => {
            if (user?.uid) {
                const result = await getUserData(user.uid);
                if (result.success) {
                    const userData = result.data;

                    // Split displayName into firstName and lastName if available
                    let firstName = "";
                    let lastName = "";

                    if (userData.displayName) {
                        const nameParts = userData.displayName.split(" ");
                        firstName = nameParts[0] || "";
                        lastName = nameParts.slice(1).join(" ") || "";
                    }

                    setProfileData({
                        firstName: userData.firstName || firstName,
                        lastName: userData.lastName || lastName,
                        email: userData.email || user.email || "",
                        contactNumber: userData.contactNumber || "",
                        position: userData.position || "HR Personnel",
                        employeeId: userData.employeeId || "",
                    });

                    // Set profile picture if available
                    if (userData.profilePicture) {
                        setProfilePicture(userData.profilePicture);
                    }
                }
            }
        };

        fetchUserData();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData({
            ...profileData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Show confirmation dialog
        setShowConfirmation(true);
    };

    const confirmSave = async () => {
        setShowConfirmation(false);

        if (!user?.uid) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "You must be logged in to update your profile",
            });
            return;
        }

        setSaving(true);

        // Create full name from first and last name
        const displayName =
            `${profileData.firstName} ${profileData.lastName}`.trim();

        // Prepare data for Firestore update
        const updateData = {
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            displayName,
            contactNumber: profileData.contactNumber,
            position: profileData.position,
            employeeId: profileData.employeeId,
            profilePicture:
                profilePicture !== profileImage ? profilePicture : undefined,
            updatedAt: new Date().toISOString(),
        };

        const result = await updateUserData(user.uid, updateData);

        setSaving(false);
        setEditMode(false);

        if (result.success) {
            Swal.fire({
                icon: "success",
                title: "Success",
                text: "Profile updated successfully!",
            });
        } else {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: result.message || "Failed to update profile",
            });
        }
    };

    const cancelSave = () => {
        setShowConfirmation(false);
    };

    const handleProfilePictureClick = () => {
        if (editMode) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePicture(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleEditMode = () => {
        setEditMode(!editMode);
    };

    const cancelEdit = () => {
        setEditMode(false);
        // Reset profile picture if it was changed but not saved
        fetchUserData();
    };

    return (
        <div className="flex-1 p-6 bg-white shadow-md rounded-lg">
            {showConfirmation && (
                <WarningAlert
                    title="Confirm Changes"
                    message="Are you sure you want to save these changes to your profile?"
                    confirmLabel="Save Profile"
                    cancelLabel="Cancel"
                    onConfirm={confirmSave}
                    onCancel={cancelSave}
                />
            )}

            <div className="flex flex-col items-start">
                <div className="w-full flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        General Information
                    </h1>
                    {editMode && (
                        <div className="flex space-x-2">
                            <button
                                onClick={cancelEdit}
                                className="flex items-center text-red-600 bg-red-100 px-4 py-2 rounded-md hover:bg-red-200 transition"
                            >
                                <FiX className="mr-2" /> Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="flex items-center text-green-600 bg-green-100 px-4 py-2 rounded-md hover:bg-green-200 transition"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="mr-2 h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <FiSave className="mr-2" /> Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
                {/* Horizontal Divider */}
                <hr className="w-full border-t border-gray-300 mb-6" />

                <div className="w-full flex flex-col md:flex-row">
                    <div className="md:w-1/3 flex justify-center mb-6 md:mb-0">
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-60 h-60 rounded-lg overflow-hidden bg-gray-200 mb-4 border-2 ${
                                    editMode
                                        ? "border-blue-500 cursor-pointer"
                                        : "border-gray-300"
                                } relative group`}
                                onClick={handleProfilePictureClick}
                            >
                                <img
                                    src={profilePicture}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                                {editMode && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-sm font-medium px-2 py-1 rounded">
                                            Click to change photo
                                        </span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>
                            <div className="text-center mb-2">
                                <h3 className="text-lg font-semibold">
                                    {profileData.firstName}{" "}
                                    {profileData.lastName}
                                </h3>
                            </div>
                            <div className="w-36 flex justify-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="180"
                                    height="55"
                                    viewBox="0 0 180 55"
                                >
                                    <rect
                                        width="180"
                                        height="55"
                                        rx="10"
                                        fill="#e8eaf6"
                                    />
                                    <text
                                        x="90"
                                        y="36"
                                        textAnchor="middle"
                                        fill="#3949ab"
                                        fontFamily="Arial"
                                        fontSize="16"
                                        fontWeight="bold"
                                    >
                                        {profileData.position || "UNITECH HR"}
                                    </text>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="md:w-2/3">
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name
                                    </label>
                                    <div className="relative flex">
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={profileData.firstName}
                                            onChange={handleChange}
                                            className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${
                                                !editMode ? "bg-gray-100" : ""
                                            }`}
                                            required
                                            disabled={!editMode}
                                        />
                                        {!editMode && (
                                            <div
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                                onClick={toggleEditMode}
                                            >
                                                <FiEdit className="text-gray-500 hover:text-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name
                                    </label>
                                    <div className="relative flex">
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={profileData.lastName}
                                            onChange={handleChange}
                                            className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${
                                                !editMode ? "bg-gray-100" : ""
                                            }`}
                                            required
                                            disabled={!editMode}
                                        />
                                        {!editMode && (
                                            <div
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                                onClick={toggleEditMode}
                                            >
                                                <FiEdit className="text-gray-500 hover:text-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 bg-gray-100"
                                        required
                                        readOnly
                                    />
                                </div>

                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Number
                                    </label>
                                    <div className="relative flex">
                                        <input
                                            type="text"
                                            name="contactNumber"
                                            value={profileData.contactNumber}
                                            onChange={handleChange}
                                            className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${
                                                !editMode ? "bg-gray-100" : ""
                                            }`}
                                            required
                                            disabled={!editMode}
                                        />
                                        {!editMode && (
                                            <div
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                                onClick={toggleEditMode}
                                            >
                                                <FiEdit className="text-gray-500 hover:text-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Position
                                    </label>
                                    <div className="relative flex">
                                        <input
                                            type="text"
                                            name="position"
                                            value={profileData.position}
                                            onChange={handleChange}
                                            className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${
                                                !editMode ? "bg-gray-100" : ""
                                            }`}
                                            required
                                            disabled={!editMode}
                                        />
                                        {!editMode && (
                                            <div
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                                onClick={toggleEditMode}
                                            >
                                                <FiEdit className="text-gray-500 hover:text-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Employee ID
                                    </label>
                                    <div className="relative flex">
                                        <input
                                            type="text"
                                            name="employeeId"
                                            value={profileData.employeeId}
                                            onChange={handleChange}
                                            className={`w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${
                                                !editMode ? "bg-gray-100" : ""
                                            }`}
                                            required
                                            disabled={!editMode}
                                        />
                                        {!editMode && (
                                            <div
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                                onClick={toggleEditMode}
                                            >
                                                <FiEdit className="text-gray-500 hover:text-blue-500" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
