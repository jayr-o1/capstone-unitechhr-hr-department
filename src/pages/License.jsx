import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { FiKey, FiCheck, FiX, FiRefreshCw } from "react-icons/fi";
import Swal from "sweetalert2";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const License = () => {
    const { user, userDetails, refreshUserData } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [licenseKey, setLicenseKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [licenseInfo, setLicenseInfo] = useState({
        status: "Inactive",
        validUntil: null,
        type: "None",
        features: []
    });
    
    const isHRHead = userDetails?.role === "hr_head" || userDetails?.role === "admin";

    useEffect(() => {
        // Set license info if available in userDetails
        if (userDetails) {
            setLicenseInfo({
                status: userDetails.licenseValidated ? "Active" : "Inactive",
                validUntil: userDetails.licenseExpiry || null,
                type: userDetails.licenseType || "Development",
                features: userDetails.licenseFeatures || [
                    "Recruitment",
                    "Onboarding",
                    "Employee Management",
                    "Development Clusters"
                ]
            });
        }
    }, [userDetails]);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setLicenseKey("");
    };

    const handleLicenseKeyChange = (e) => {
        setLicenseKey(e.target.value);
    };

    const validateLicense = async () => {
        if (!licenseKey.trim()) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Please enter a license key",
            });
            return;
        }

        setLoading(true);

        try {
            // Hardcoded valid license keys for demo
            const validKeys = [
                "UNITECH-HR-DEV1-2023",
                "UNITECH-HR-PREM-2023",
                "UNITECH-HR-ENTE-2023"
            ];

            let licenseType = "Development";
            let isValid = false;

            // Validate the license key
            if (validKeys.includes(licenseKey)) {
                isValid = true;
                // Determine license type based on key
                if (licenseKey.includes("PREM")) {
                    licenseType = "Premium";
                } else if (licenseKey.includes("ENTE")) {
                    licenseType = "Enterprise";
                }
            }

            if (!isValid) {
                Swal.fire({
                    icon: "error",
                    title: "Invalid License",
                    text: "The license key you entered is not valid.",
                });
                setLoading(false);
                return;
            }

            // Calculate expiry date (1 year from now for demo)
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);

            // Update license information in the database
            if (user && userDetails) {
                const userRef = doc(db, "universities", userDetails.universityId, "hr_head", user.uid);
                
                // First check if document exists
                const userDoc = await getDoc(userRef);
                
                if (userDoc.exists()) {
                    // Update the HR Head document
                    await updateDoc(userRef, {
                        licenseKey: licenseKey,
                        licenseValidated: true,
                        licenseType: licenseType,
                        licenseExpiry: expiryDate.toISOString(),
                        licenseActivatedAt: new Date().toISOString()
                    });
                    
                    // Also update the mapping for faster lookups
                    const authMappingRef = doc(db, "authMappings", user.uid);
                    await updateDoc(authMappingRef, {
                        licenseValidated: true,
                        licenseType: licenseType,
                        licenseKey: licenseKey
                    });
                    
                    // Update local state
                    setLicenseInfo({
                        status: "Active",
                        validUntil: expiryDate.toISOString(),
                        type: licenseType,
                        features: [
                            "Recruitment",
                            "Onboarding",
                            "Employee Management",
                            "Development Clusters"
                        ]
                    });
                    
                    // Refresh user data in context
                    await refreshUserData();
                    
                    Swal.fire({
                        icon: "success",
                        title: "License Activated",
                        text: `Your ${licenseType} license has been successfully activated.`,
                    });
                    
                    handleCloseModal();
                } else {
                    throw new Error("User document not found");
                }
            }
        } catch (error) {
            console.error("Error validating license:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "There was an error validating your license. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    return (
        <div className="flex-1 p-6 bg-white shadow-md rounded-lg">
            <div className="flex flex-col items-start">
                <div className="w-full flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        License Management
                    </h1>
                    {isHRHead && (
                        <button
                            onClick={handleOpenModal}
                            className="flex items-center text-blue-600 bg-blue-100 px-4 py-2 rounded-md hover:bg-blue-200 transition"
                        >
                            <FiKey className="mr-2" /> {licenseInfo.status === "Active" ? "Update License" : "Activate License"}
                        </button>
                    )}
                </div>

                {/* License Status Card */}
                <div className={`w-full mb-6 p-6 rounded-lg border ${
                    licenseInfo.status === "Active" 
                        ? "bg-green-50 border-green-200" 
                        : "bg-amber-50 border-amber-200"
                }`}>
                    <div className="flex items-center mb-4">
                        <div className={`rounded-full p-3 mr-4 ${
                            licenseInfo.status === "Active" 
                                ? "bg-green-100 text-green-600" 
                                : "bg-amber-100 text-amber-600"
                        }`}>
                            <FiKey className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold">
                                {licenseInfo.status === "Active" ? "Active License" : "License Not Activated"}
                            </h2>
                            <p className={`text-sm ${
                                licenseInfo.status === "Active" 
                                    ? "text-green-600" 
                                    : "text-amber-600"
                            }`}>
                                {licenseInfo.status === "Active" 
                                    ? `Valid until ${formatDate(licenseInfo.validUntil)}` 
                                    : "Your license needs to be activated"}
                            </p>
                        </div>
                    </div>
                    
                    {licenseInfo.status !== "Active" && isHRHead && (
                        <div className="mt-4 p-4 bg-white rounded-md border border-amber-200">
                            <p className="text-amber-700 text-sm">
                                <strong>Important:</strong> You need to validate your license to add or modify data. Click the "Activate License" button above to enter a valid license key.
                            </p>
                        </div>
                    )}
                </div>

                {/* License Details */}
                <div className="w-full">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">License Details</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-700 mb-2">License Type</h3>
                            <p className="text-gray-900 font-semibold">{licenseInfo.type}</p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-700 mb-2">Status</h3>
                            <div className="flex items-center">
                                {licenseInfo.status === "Active" ? (
                                    <>
                                        <span className="h-3 w-3 bg-green-500 rounded-full mr-2"></span>
                                        <span className="text-green-600 font-semibold">Active</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="h-3 w-3 bg-amber-500 rounded-full mr-2"></span>
                                        <span className="text-amber-600 font-semibold">Inactive</span>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-700 mb-2">Expiration Date</h3>
                            <p className="text-gray-900 font-semibold">
                                {licenseInfo.validUntil ? formatDate(licenseInfo.validUntil) : "N/A"}
                            </p>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h3 className="text-lg font-medium text-gray-700 mb-2">Available Features</h3>
                            <ul className="list-disc list-inside text-gray-900">
                                {licenseInfo.features.map((feature, index) => (
                                    <li key={index} className="font-medium">{feature}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* License Activation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {licenseInfo.status === "Active" ? "Update License" : "Activate License"}
                            </h2>
                            <button 
                                onClick={handleCloseModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <FiX className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <p className="text-gray-600 mb-4">
                            Enter your license key below to {licenseInfo.status === "Active" ? "update" : "activate"} your license.
                        </p>
                        
                        <div className="mb-4">
                            <label 
                                htmlFor="licenseKey" 
                                className="block text-sm font-medium text-gray-700 mb-1"
                            >
                                License Key
                            </label>
                            <input
                                type="text"
                                id="licenseKey"
                                value={licenseKey}
                                onChange={handleLicenseKeyChange}
                                placeholder="UNITECH-HR-XXXX-XXXX"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                For testing, use: UNITECH-HR-DEV1-2023
                            </p>
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={handleCloseModal}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={validateLicense}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <FiRefreshCw className="animate-spin mr-2" />
                                        Validating...
                                    </>
                                ) : (
                                    <>
                                        <FiCheck className="mr-2" />
                                        {licenseInfo.status === "Active" ? "Update License" : "Activate License"}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default License; 