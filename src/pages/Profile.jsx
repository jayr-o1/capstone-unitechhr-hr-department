import React, { useState, useEffect, useRef } from "react";
import profileImage from "../assets/images/profile-1.jpeg";
import { useAuth } from "../contexts/AuthProvider";
import { getUserData, updateUserData } from "../services/userService";
import Swal from "sweetalert2";
import { FiEdit, FiSave, FiX } from "react-icons/fi";
import WarningAlert from "../components/Alerts/WarningAlert";

const Profile = () => {
    const { user, userDetails, university, refreshUserData } = useAuth();
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
        universityName: "",
    });

    useEffect(() => {
        if (userDetails) {
            // Split displayName into firstName and lastName if available
            let firstName = "";
            let lastName = "";

            if (userDetails.displayName) {
                const nameParts = userDetails.displayName.split(" ");
                firstName = nameParts[0] || "";
                lastName = nameParts.slice(1).join(" ") || "";
            }

            setProfileData({
                firstName: userDetails.firstName || firstName,
                lastName: userDetails.lastName || lastName,
                email: userDetails.email || user?.email || "",
                contactNumber: userDetails.contactNumber || "",
                position: userDetails.position || "HR Personnel",
                employeeId: userDetails.employeeId || "",
                universityName: userDetails.universityName || (university?.name || ""),
            });

            // Set profile picture if available
            if (userDetails.profilePicture) {
                setProfilePicture(userDetails.profilePicture);
            }
        } else {
            // Fallback to manual fetch if not available through context
            fetchUserData();
        }
    }, [user, userDetails, university]);

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
                    universityName: userData.universityName || "",
                });

                // Set profile picture if available
                if (userData.profilePicture) {
                    setProfilePicture(userData.profilePicture);
                }
            }
        }
    };

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
            // Refresh user data in the auth context
            await refreshUserData();
            
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
        if (userDetails) {
            // Revert to data from context
            const nameParts = userDetails.displayName?.split(" ") || ["", ""];
            setProfileData({
                firstName: userDetails.firstName || nameParts[0] || "",
                lastName: userDetails.lastName || nameParts.slice(1).join(" ") || "",
                email: userDetails.email || user?.email || "",
                contactNumber: userDetails.contactNumber || "",
                position: userDetails.position || "HR Personnel",
                employeeId: userDetails.employeeId || "",
                universityName: userDetails.universityName || (university?.name || ""),
            });
            setProfilePicture(userDetails.profilePicture || profileImage);
        } else {
            fetchUserData();
        }
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
                    {!editMode && (
                        <button
                            onClick={toggleEditMode}
                            className="flex items-center text-blue-600 bg-blue-100 px-4 py-2 rounded-md hover:bg-blue-200 transition"
                        >
                            <FiEdit className="mr-2" /> Edit Profile
                        </button>
                    )}
                </div>

                {/* University Information */}
                <div className="w-full mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h2 className="text-xl font-semibold text-blue-800 mb-2">University Information</h2>
                    <p className="text-lg font-medium text-blue-700">
                        {profileData.universityName || "Not assigned to a university"}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row w-full gap-6">
                    {/* Left Column - Profile Picture */}
                    <div className="md:w-1/3 flex flex-col items-center justify-start">
                        <div
                            className={`relative rounded-full w-48 h-48 overflow-hidden mb-4 border-4 ${
                                editMode
                                    ? "border-blue-400 cursor-pointer"
                                    : "border-gray-200"
                            }`}
                            onClick={handleProfilePictureClick}
                        >
                            <img
                                src={profilePicture}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                            {editMode && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        Change Picture
                                    </span>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                    </div>

                    {/* Right Column - Form Fields */}
                    <div className="md:w-2/3">
                        <form className="space-y-4 w-full">
                            {/* First Name and Last Name */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="firstName"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={profileData.firstName}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        disabled={!editMode}
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="lastName"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={profileData.lastName}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        disabled={!editMode}
                                    />
                                </div>
                            </div>

                            {/* Email and Contact Number */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={profileData.email}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        disabled={true} // Email is always disabled
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="contactNumber"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Contact Number
                                    </label>
                                    <input
                                        type="text"
                                        id="contactNumber"
                                        name="contactNumber"
                                        value={profileData.contactNumber}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        disabled={!editMode}
                                    />
                                </div>
                            </div>

                            {/* Position and Employee ID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="position"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Position
                                    </label>
                                    <input
                                        type="text"
                                        id="position"
                                        name="position"
                                        value={profileData.position}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        disabled={!editMode}
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="employeeId"
                                        className="block text-sm font-medium text-gray-700 mb-1"
                                    >
                                        Employee ID
                                    </label>
                                    <input
                                        type="text"
                                        id="employeeId"
                                        name="employeeId"
                                        value={profileData.employeeId}
                                        onChange={handleChange}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        disabled={!editMode}
                                    />
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
