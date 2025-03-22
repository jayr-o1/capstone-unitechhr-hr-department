import React, { useState } from "react";
import profileImage from "../assets/images/profile-1.jpeg";

const Profile = () => {
    const [profileData, setProfileData] = useState({
        firstName: "Jay-r",
        lastName: "Olores",
        email: "jayrmalazarte.olores@gmail.com",
        contactNumber: "09934029019"
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData({
            ...profileData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Save profile data (will be implemented later)
        alert("Profile updated successfully!");
    };

    return (
        <div className="flex-1 p-6 bg-white shadow-md rounded-lg">
            <div className="flex flex-col items-start">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">General Information</h1>
                
                <div className="w-full flex flex-col md:flex-row">
                    <div className="md:w-1/3 flex justify-center mb-6 md:mb-0">
                        <div className="flex flex-col items-center">
                            <div className="w-36 h-36 rounded-full overflow-hidden bg-gray-200 mb-4">
                                <img
                                    src={profileImage}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="w-36 flex justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="180" height="55" viewBox="0 0 180 55">
                                    <rect width="180" height="55" rx="10" fill="#e8eaf6"/>
                                    <text x="90" y="36" textAnchor="middle" fill="#3949ab" fontFamily="Arial" fontSize="16" fontWeight="bold">UNITECH HR</text>
                                </svg>
                            </div>
                        </div>
                    </div>
                    
                    <div className="md:w-2/3">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={profileData.firstName}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={profileData.lastName}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profileData.email}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                                <input
                                    type="text"
                                    name="contactNumber"
                                    value={profileData.contactNumber}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                                    required
                                />
                            </div>
                            
                            <div className="flex justify-start">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    SAVE
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile; 