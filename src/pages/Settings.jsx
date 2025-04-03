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

  const handleValidateLicense = async (e) => {
    e.preventDefault();
    
    if (!licenseKey.trim()) {
      showErrorAlert("Please enter a license key");
      return;
    }
    
    setIsValidating(true);
    
    try {
      const result = await validateLicense(licenseKey);
      
      if (result.success) {
        // Get the universityId from userDetails
        const universityId = userDetails?.universityId;
        
        if (!universityId) {
          showErrorAlert("Could not determine your university. Please contact support.");
          setIsValidating(false);
          return;
        }
        
        // Update the HR Head document to mark license as validated
        const hrHeadDocRef = doc(db, "universities", universityId, "hr_head", auth.currentUser.uid);
        await updateDoc(hrHeadDocRef, {
          licenseValidated: true,
          licenseKey: licenseKey
        });
        
        // Also update in Auth Mappings for consistency
        const authMappingRef = doc(db, "authMappings", auth.currentUser.uid);
        await updateDoc(authMappingRef, {
          licenseValidated: true
        });
        
        // Refresh user data in context
        await refreshUserData();
        
        setIsLicenseValidated(true);
        showSuccessAlert("License key validated successfully!");
      } else {
        showErrorAlert(result.message || "Invalid license key");
      }
    } catch (error) {
      console.error("Error validating license:", error);
      showErrorAlert("An error occurred while validating the license");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-blue-600 text-white">
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">License Management</h2>
            <p className="text-gray-600 mb-4">
              Validate your license key to unlock all features of the HR management system.
            </p>
            
            {isLicenseValidated ? (
              <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Your license is active and validated</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-700 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Your license is not validated yet</p>
                    <p className="text-xs mt-1">You need a valid license to use all features of the system</p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleValidateLicense} className="mt-4">
              <div className="flex items-end space-x-4">
                <div className="flex-grow">
                  <label htmlFor="licenseKey" className="block text-sm font-medium text-gray-700 mb-1">
                    License Key
                  </label>
                  <input
                    type="text"
                    id="licenseKey"
                    name="licenseKey"
                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Enter your license key"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    disabled={isLicenseValidated || isValidating}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter the license key provided to your university.
                  </p>
                </div>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isLicenseValidated
                      ? "bg-green-100 text-green-800 cursor-not-allowed"
                      : isValidating
                      ? "bg-blue-100 text-blue-800 cursor-wait"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                  disabled={isLicenseValidated || isValidating}
                >
                  {isLicenseValidated
                    ? "Validated"
                    : isValidating
                    ? "Validating..."
                    : "Validate License"}
                </button>
              </div>
            </form>

            <div className="mt-6 border-t pt-4">
              <h3 className="text-md font-medium text-gray-900 mb-2">Development License</h3>
              <p className="text-sm text-gray-600 mb-2">
                For development and testing purposes, you can use the development license key:
              </p>
              <pre className="bg-gray-100 p-3 rounded text-sm font-mono">UNITECH-HR-DEV-2023</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 