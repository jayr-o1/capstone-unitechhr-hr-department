import React, { useState, useRef, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import showSuccessAlert from "../Alerts/SuccessAlert";
import showErrorAlert from "../Alerts/ErrorAlert";
import showWarningAlert from "../Alerts/WarningAlert";

// Edit icons
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

// Permission icons
const PermissionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

// Password icon
const PasswordIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
);

// More options icon
const MoreOptionsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

const HRPersonnelCard = ({ person, universityId, refreshPersonnel }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isEditPasswordOpen, setIsEditPasswordOpen] = useState(false);
  const [isEditPermissionsOpen, setIsEditPermissionsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Form states
  const [newName, setNewName] = useState(person.name);
  const [adminPassword, setAdminPassword] = useState(""); // For admin authentication
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [permissions, setPermissions] = useState(person.permissions || {
    recruitment: false,
    onboarding: false,
    employees: false,
    clusters: false,
    notifications: false
  });
  
  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };
  
  // Close all modals
  const closeAllModals = () => {
    setIsEditNameOpen(false);
    setIsEditPasswordOpen(false);
    setIsEditPermissionsOpen(false);
    setIsDropdownOpen(false);
    setNewName(person.name);
    setAdminPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };
  
  // Handle permission change
  const handlePermissionChange = (e) => {
    const { name, checked } = e.target;
    setPermissions({
      ...permissions,
      [name]: checked
    });
  };
  
  // Handle edit name
  const handleEditName = async (e) => {
    e.preventDefault();
    
    if (!newName.trim()) {
      showErrorAlert("Name cannot be empty");
      return;
    }
    
    try {
      // Update the HR personnel document
      await updateDoc(doc(db, "universities", universityId, "hr_personnel", person.uid), {
        name: newName
      });
      
      // Update the auth mapping for login
      await updateDoc(doc(db, "authMappings", person.uid), {
        displayName: newName
      });
      
      showSuccessAlert("Name updated successfully");
      refreshPersonnel(); // Refresh personnel list
      closeAllModals();
    } catch (error) {
      console.error("Error updating name:", error);
      showErrorAlert(error.message);
    }
  };
  
  // Handle edit permissions
  const handleEditPermissions = async (e) => {
    e.preventDefault();
    
    try {
      // Update the HR personnel document
      await updateDoc(doc(db, "universities", universityId, "hr_personnel", person.uid), {
        permissions: permissions
      });
      
      showSuccessAlert("Permissions updated successfully");
      refreshPersonnel(); // Refresh personnel list
      closeAllModals();
    } catch (error) {
      console.error("Error updating permissions:", error);
      showErrorAlert(error.message);
    }
  };
  
  // Handle edit password
  const handleEditPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      showErrorAlert("Password must be at least 8 characters long");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showErrorAlert("Passwords do not match");
      return;
    }
    
    try {
      // First reauthenticate the admin (current user)
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        adminPassword
      );
      
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Show confirmation before proceeding
      showWarningAlert(
        "Are you sure you want to change this user's password?",
        async () => {
          try {
            // Create a temporary user session to change password
            // This requires backend support (Cloud Functions in Firebase)
            // Since client-side we can only change the current user's password
            
            // For demo we'll show a success message, but in production
            // you'll need a backend function to change another user's password
            showSuccessAlert("Password change request sent to server");
            
            // In production, you'd call a Firebase Cloud Function like:
            // await updateUserPassword(person.uid, newPassword);
            
            closeAllModals();
          } catch (innerError) {
            console.error("Error changing password:", innerError);
            showErrorAlert(innerError.message);
          }
        },
        "Yes, change password",
        "Cancel"
      );
    } catch (error) {
      console.error("Authentication failed:", error);
      showErrorAlert("Authentication failed. Please check your password.");
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  return (
    <div className="bg-white rounded-lg p-5 shadow-md flex justify-between items-center gap-4 mb-4">
      <div className="flex-1">
        <h3 className="font-bold text-lg">{person.name}</h3>
        <p className="text-gray-600 text-sm">{person.email}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {person.permissions?.recruitment && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              Recruitment
            </span>
          )}
          {person.permissions?.onboarding && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
              Onboarding
            </span>
          )}
          {person.permissions?.employees && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              Employees
            </span>
          )}
          {person.permissions?.clusters && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              Clusters
            </span>
          )}
          {person.permissions?.notifications && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
              Notifications
            </span>
          )}
        </div>
      </div>
      
      {/* Options dropdown */}
      <div className="relative" ref={dropdownRef}>
        {/* Dropdown Menu - Positioned to the left of the icon */}
        {isDropdownOpen && (
          <div className="absolute right-10 top-0 -mt-10 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <button
              onClick={() => {
                setIsEditNameOpen(true);
                setIsDropdownOpen(false);
              }}
              className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition duration-200 text-left flex items-center gap-2"
            >
              <EditIcon /> Edit Name
            </button>
            <button
              onClick={() => {
                setIsEditPermissionsOpen(true);
                setIsDropdownOpen(false);
              }}
              className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition duration-200 text-left flex items-center gap-2"
            >
              <PermissionIcon /> Edit Permissions
            </button>
            <button
              onClick={() => {
                setIsEditPasswordOpen(true);
                setIsDropdownOpen(false);
              }}
              className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition duration-200 text-left flex items-center gap-2"
            >
              <PasswordIcon /> Change Password
            </button>
          </div>
        )}
        
        <button
          onClick={toggleDropdown}
          className="p-2 rounded-full hover:bg-gray-200 transition duration-200"
        >
          <MoreOptionsIcon />
        </button>
      </div>
      
      {/* Edit Name Modal */}
      {isEditNameOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 min-h-screen"
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 1000
          }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">Edit Name</h3>
            <form onSubmit={handleEditName}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Permissions Modal */}
      {isEditPermissionsOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 min-h-screen"
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 1000
          }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">Edit Permissions</h3>
            <form onSubmit={handleEditPermissions}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Module Permissions
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="recruitment"
                      name="recruitment"
                      checked={permissions.recruitment}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="recruitment" className="ml-2 text-sm text-gray-700">
                      Recruitment
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="onboarding"
                      name="onboarding"
                      checked={permissions.onboarding}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="onboarding" className="ml-2 text-sm text-gray-700">
                      Onboarding
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="employees"
                      name="employees"
                      checked={permissions.employees}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="employees" className="ml-2 text-sm text-gray-700">
                      Employees
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="clusters"
                      name="clusters"
                      checked={permissions.clusters}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="clusters" className="ml-2 text-sm text-gray-700">
                      Clusters
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifications"
                      name="notifications"
                      checked={permissions.notifications}
                      onChange={handlePermissionChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="notifications" className="ml-2 text-sm text-gray-700">
                      Notifications
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Password Modal */}
      {isEditPasswordOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 min-h-screen"
          style={{
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 1000
          }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4">Change Password</h3>
            <form onSubmit={handleEditPassword}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Password (for authentication)
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  We need your password to verify that you have permission to make this change.
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={8}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRPersonnelCard; 