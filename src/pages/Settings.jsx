import React, { useState, useEffect } from "react";
import { validateLicense } from "../services/licenseService";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useAuth } from "../contexts/AuthProvider";
import showSuccessAlert from "../components/Alerts/SuccessAlert";
import showErrorAlert from "../components/Alerts/ErrorAlert";

const Settings = () => {
    const [licenseKey, setLicenseKey] = useState("");
    const [isValidating, setIsValidating] = useState(false);
    const [isLicenseValidated, setIsLicenseValidated] = useState(false);
    const { userDetails, refreshUserData } = useAuth();

    useEffect(() => {
        if (userDetails) {
            setIsLicenseValidated(userDetails.licenseValidated === true);
        }
    }, [userDetails]);

    const handleLicenseValidation = async (e) => {
        e.preventDefault();
        if (!licenseKey.trim()) {
            showErrorAlert("Please enter a license key");
            return;
        }

        setIsValidating(true);
        try {
            const result = await validateLicense(licenseKey);
            if (result.valid) {
                // Update user record
                const userDocRef = doc(db, "users", auth.currentUser.uid);
                await updateDoc(userDocRef, {
                    licenseValidated: true,
                    licenseKey: licenseKey,
                    licenseValidatedAt: new Date(),
                });

                setIsLicenseValidated(true);
                showSuccessAlert("License validated successfully");

                // Refresh user data in context
                refreshUserData();
            } else {
                showErrorAlert(result.message || "Invalid license key");
            }
        } catch (error) {
            console.error("Error validating license:", error);
            showErrorAlert("Error validating license. Please try again.");
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">
                    License Management
                </h2>
                <div className="bg-white rounded-lg shadow p-6">
                    {isLicenseValidated ? (
                        <div className="text-green-600 font-medium">
                            Your license is active and validated.
                        </div>
                    ) : (
                        <form onSubmit={handleLicenseValidation}>
                            <div className="mb-4">
                                <label
                                    htmlFor="licenseKey"
                                    className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                    License Key
                                </label>
                                <input
                                    type="text"
                                    id="licenseKey"
                                    value={licenseKey}
                                    onChange={(e) =>
                                        setLicenseKey(e.target.value)
                                    }
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    placeholder="Enter your license key"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isValidating}
                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                            >
                                {isValidating
                                    ? "Validating..."
                                    : "Validate License"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
