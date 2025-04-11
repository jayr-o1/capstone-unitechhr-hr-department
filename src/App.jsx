import React, { useEffect, useState } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
    useNavigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import AccountLayout from "./components/AccountLayout";
import EmployeeLayout from "./components/employee/EmployeeLayout";
import Dashboard from "./pages/Dashboard";
import Recruitment from "./pages/Recruitment";
import JobDetails from "./pages/RecruitmentModule/JobDetails";
import ApplicantDetails from "./pages/RecruitmentModule/ApplicantDetails";
import Onboarding from "./pages/Onboarding";
import Employees from "./pages/Employees";
import EmployeeDetails from "./pages/EmployeeDetails";
import Clusters from "./pages/Clusters";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HRHeadPanel from "./pages/HRHeadPanel";
import License from "./pages/License";

// Employee pages
import EmployeeDashboard from "./pages/employee/Dashboard";
import EmployeeProfile from "./pages/employee/Profile";
import CareerProgress from "./pages/employee/CareerProgress";

import { JobProvider } from "./contexts/JobContext";
import AuthProvider, { useAuth } from "./contexts/AuthProvider";
import { scheduleJobsCleanup } from "./utils/cleanupUtil";
import { getUserData } from "./services/userService";
import { Toaster } from 'react-hot-toast';

// System Admin imports
import SystemAdminLayout from "./components/Layouts/SystemAdminLayout";
import SystemAdminDashboard from "./pages/system-admin/Dashboard";
import SystemAdminLicenses from "./pages/system-admin/Licenses";
import SystemAdminLogin from "./pages/system-admin/Login";
import SignOut from "./pages/SignOut";
import { getAllUniversities } from "./services/universityService";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import toast from "react-hot-toast";

// Temporary component until we create the full page
const SystemAdminUniversities = () => {
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUniversity, setSelectedUniversity] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        code: "",
    });
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUniversities();
    }, []);

    const fetchUniversities = async () => {
        try {
            setLoading(true);
            const result = await getAllUniversities();
            if (result.success) {
                // Get additional collection counts for each university
                const universitiesWithCounts = await Promise.all(
                    result.universities.map(async (uni) => {
                        // Get employees count
                        let employeesCount = 0;
                        try {
                            const employeesRef = collection(db, "universities", uni.id, "employees");
                            const employeesSnapshot = await getDocs(employeesRef);
                            employeesCount = employeesSnapshot.size;
                        } catch (err) {
                            console.error(`Error fetching employees for university ${uni.id}:`, err);
                        }

                        // Get HR heads count
                        let hrHeadsCount = 0;
                        let hrHeadsList = [];
                        try {
                            const hrHeadsRef = collection(db, "universities", uni.id, "hr_head");
                            const hrHeadsSnapshot = await getDocs(hrHeadsRef);
                            hrHeadsCount = hrHeadsSnapshot.size;
                            hrHeadsList = hrHeadsSnapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                        } catch (err) {
                            console.error(`Error fetching HR heads for university ${uni.id}:`, err);
                        }

                        // Get HR personnel count
                        let hrPersonnelCount = 0;
                        let hrPersonnelList = [];
                        try {
                            const hrPersonnelRef = collection(db, "universities", uni.id, "hr_personnel");
                            const hrPersonnelSnapshot = await getDocs(hrPersonnelRef);
                            hrPersonnelCount = hrPersonnelSnapshot.size;
                            hrPersonnelList = hrPersonnelSnapshot.docs.map(doc => ({
                                id: doc.id,
                                ...doc.data()
                            }));
                        } catch (err) {
                            console.error(`Error fetching HR personnel for university ${uni.id}:`, err);
                        }

                        // Get jobs count
                        let jobsCount = 0;
                        try {
                            const jobsRef = collection(db, "universities", uni.id, "jobs");
                            const jobsSnapshot = await getDocs(jobsRef);
                            jobsCount = jobsSnapshot.size;
                        } catch (err) {
                            console.error(`Error fetching jobs for university ${uni.id}:`, err);
                        }
                        
                        return {
                            id: uni.id,
                            name: uni.name,
                            code: uni.code || 'N/A',
                            hrHeads: hrHeadsCount,
                            hrHeadsList: hrHeadsList,
                            hrPersonnel: hrPersonnelCount,
                            hrPersonnelList: hrPersonnelList,
                            employees: employeesCount,
                            jobs: jobsCount,
                            createdAt: uni.createdAt ? 
                                new Date(uni.createdAt.seconds * 1000).toLocaleDateString() : 
                                'N/A'
                        };
                    })
                );
                
                setUniversities(universitiesWithCounts);
            } else {
                setError("Failed to load universities");
            }
        } catch (err) {
            console.error("Error fetching universities:", err);
            setError("An error occurred while fetching universities");
        } finally {
            setLoading(false);
        }
    };

    const handleViewUniversity = (university) => {
        setSelectedUniversity(university);
        setShowViewModal(true);
    };

    const handleEditClick = (university) => {
        setSelectedUniversity(university);
        setFormData({
            name: university.name,
            code: university.code === 'N/A' ? '' : university.code,
        });
        setShowEditModal(true);
    };

    const handleDeleteUniversity = async (universityId) => {
        try {
            // Show confirmation dialog
            const confirmDelete = window.confirm("Are you sure you want to delete this university? This action cannot be undone and will delete all associated data.");
            
            if (!confirmDelete) {
                return;
            }
            
            // Delete university logic would go here
            // For now, just remove from the state for demo purposes
            setUniversities(prevUniversities => 
                prevUniversities.filter(uni => uni.id !== universityId)
            );
            
            toast.success("University deleted successfully");
        } catch (error) {
            console.error("Error deleting university:", error);
            toast.error("Failed to delete university");
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Clear error when user types
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: null
            });
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) {
            errors.name = "University name is required";
        }
        if (!formData.code.trim()) {
            errors.code = "University code is required";
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // In a real application, you would call an API to update the university
            // For now, just update the state
            const updatedUniversities = universities.map(uni => {
                if (uni.id === selectedUniversity.id) {
                    return {
                        ...uni,
                        name: formData.name,
                        code: formData.code
                    };
                }
                return uni;
            });
            
            setUniversities(updatedUniversities);
            setShowEditModal(false);
            toast.success("University updated successfully");
        } catch (error) {
            console.error("Error updating university:", error);
            toast.error("Failed to update university");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Universities Management</h1>
                    <p className="text-gray-600">
                        Add, edit, and manage universities in the system.
                    </p>
                </div>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                    <span className="mr-2">+</span>
                    Add University
                </button>
            </div>

            {/* Loading and Error States */}
            {loading ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-2 text-gray-600">Loading universities...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    <p className="font-medium">{error}</p>
                    <p className="mt-1">Please try refreshing the page.</p>
                </div>
            ) : universities.length === 0 ? (
                <div className="bg-gray-50 rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-600">No universities found in the system.</p>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Add Your First University
                    </button>
                </div>
            ) : (
                /* Universities Table */
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Code
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        HR Heads
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        HR Personnel
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employees
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Jobs
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {universities.map((university) => (
                                    <tr key={university.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{university.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                                                {university.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {university.hrHeads}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {university.hrPersonnel}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {university.employees}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {university.jobs}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {university.createdAt}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button 
                                                onClick={() => handleViewUniversity(university)}
                                                className="text-green-600 hover:text-green-900 mr-3"
                                            >
                                                View
                                            </button>
                                            <button 
                                                onClick={() => handleEditClick(university)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteUniversity(university.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* University View Modal */}
            {showViewModal && selectedUniversity && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-3xl w-full mx-4 shadow-xl">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {selectedUniversity.name} Details
                                </h3>
                                <button 
                                    onClick={() => setShowViewModal(false)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <span className="sr-only">Close</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                            <div className="mb-6">
                                <h4 className="text-md font-semibold text-gray-700 mb-2">University Information</h4>
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Name</p>
                                            <p className="font-medium">{selectedUniversity.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Code</p>
                                            <p className="font-medium">{selectedUniversity.code}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Created</p>
                                            <p className="font-medium">{selectedUniversity.createdAt}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">ID</p>
                                            <p className="font-medium text-xs">{selectedUniversity.id}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="text-md font-semibold text-gray-700 mb-2">
                                    HR Heads ({selectedUniversity.hrHeads})
                                </h4>
                                {selectedUniversity.hrHeadsList && selectedUniversity.hrHeadsList.length > 0 ? (
                                    <div className="bg-gray-50 rounded-md divide-y divide-gray-200">
                                        {selectedUniversity.hrHeadsList.map(head => (
                                            <div key={head.id} className="p-3">
                                                <div className="flex items-start">
                                                    <div className="mr-3">
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                            {head.displayName?.charAt(0) || head.email?.charAt(0) || 'U'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{head.displayName || 'No Name'}</p>
                                                        <p className="text-sm text-gray-500">{head.email}</p>
                                                        <div className="mt-1">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                HR Head
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No HR Heads found for this university.</p>
                                )}
                            </div>

                            <div className="mb-6">
                                <h4 className="text-md font-semibold text-gray-700 mb-2">
                                    HR Personnel ({selectedUniversity.hrPersonnel})
                                </h4>
                                {selectedUniversity.hrPersonnelList && selectedUniversity.hrPersonnelList.length > 0 ? (
                                    <div className="bg-gray-50 rounded-md divide-y divide-gray-200">
                                        {selectedUniversity.hrPersonnelList.map(personnel => (
                                            <div key={personnel.id} className="p-3">
                                                <div className="flex items-start">
                                                    <div className="mr-3">
                                                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                                                            {personnel.displayName?.charAt(0) || personnel.email?.charAt(0) || 'U'}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{personnel.displayName || 'No Name'}</p>
                                                        <p className="text-sm text-gray-500">{personnel.email}</p>
                                                        <div className="mt-1">
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                HR Personnel
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-sm">No HR Personnel found for this university.</p>
                                )}
                            </div>

                            <div>
                                <h4 className="text-md font-semibold text-gray-700 mb-2">Summary</h4>
                                <div className="bg-gray-50 p-3 rounded-md">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Total Employees</p>
                                            <p className="font-medium">{selectedUniversity.employees}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Jobs</p>
                                            <p className="font-medium">{selectedUniversity.jobs}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowViewModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* University Edit Modal */}
            {showEditModal && selectedUniversity && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg max-w-lg w-full mx-4 shadow-xl">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Edit University
                                </h3>
                                <button 
                                    onClick={() => setShowEditModal(false)}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <span className="sr-only">Close</span>
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="px-6 py-4">
                                <div className="mb-4">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        University Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        value={formData.name}
                                        onChange={handleFormChange}
                                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${formErrors.name ? 'border-red-300' : ''}`}
                                    />
                                    {formErrors.name && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                                    )}
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                                        University Code
                                    </label>
                                    <input
                                        type="text"
                                        name="code"
                                        id="code"
                                        value={formData.code}
                                        onChange={handleFormChange}
                                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${formErrors.code ? 'border-red-300' : ''}`}
                                    />
                                    {formErrors.code && (
                                        <p className="mt-1 text-sm text-red-600">{formErrors.code}</p>
                                    )}
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const auth = useAuth();
    
    console.log("ProtectedRoute: Auth state", {
        user: auth?.user ? "exists" : "null",
        userRole: auth?.userDetails?.role,
        loading: auth?.loading,
        isSystemAdmin: auth?.userDetails?.role === 'system_admin',
        isEmployee: auth?.userDetails?.role === 'employee',
        allowedRoles
    });
    
    // If still loading auth state, show a loader
    if (auth?.loading) {
        console.log("ProtectedRoute: Auth is still loading, showing loader");
        return (
            <div className="w-full h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
            </div>
        );
    }

    // If user is not authenticated, redirect to login
    if (!auth?.user) {
        console.log("ProtectedRoute: No user found, redirecting to login");
        return <Navigate to="/" />;
    }

    // If user is authenticated but no userDetails or role, something is wrong
    if (!auth?.userDetails?.role) {
        console.log("ProtectedRoute: Missing userDetails or role, showing error");
        return (
            <div className="w-full h-screen flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h1>
                <p className="text-gray-700 mb-4">There was a problem with your login session.</p>
                <button 
                    onClick={() => window.location.href = '/'}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Return to Login
                </button>
            </div>
        );
    }

    // Check if the user's role is allowed for this route
    if (allowedRoles.length > 0 && !allowedRoles.includes(auth.userDetails.role)) {
        console.log(`ProtectedRoute: User role ${auth.userDetails.role} not allowed for this route`);
        
        // Redirect based on role
        if (auth.userDetails.role === 'system_admin') {
            return <Navigate to="/system-admin/dashboard" />;
        } else if (auth.userDetails.role === 'employee') {
            return <Navigate to="/employee/dashboard" />;
        } else {
            return <Navigate to="/dashboard" />;
        }
    }

    // If authenticated with valid userDetails, render the children components
    console.log("ProtectedRoute: Auth valid, rendering children");
    return children;
};

function AppContent() {
    const auth = useAuth();
    
    console.log("AppContent: Auth context", { 
        isObject: !!auth, 
        hasUser: !!auth?.user,
        loading: auth?.loading
    });
    
    const { user, userDetails } = auth || {};

    useEffect(() => {
        // Page refresh detection
        try {
            // First, always mark the refresh flag for immediate availability
            sessionStorage.setItem("isPageRefresh", "true");

            // Then check if it's a genuine page refresh using Performance API
            if (window.performance) {
                const navEntry =
                    performance.getEntriesByType &&
                    performance.getEntriesByType("navigation")[0];

                if (navEntry) {
                    // If it's not a reload, clear the flag
                    if (navEntry.type !== "reload") {
                        sessionStorage.removeItem("isPageRefresh");
                    } else {
                        // If it is a reload, keep the flag for 3 seconds
                        setTimeout(() => {
                            sessionStorage.removeItem("isPageRefresh");
                        }, 3000);
                    }
                }
            }
        } catch (error) {
            console.error("Error in refresh detection:", error);
            // If any error, default to keeping the flag
            setTimeout(() => {
                sessionStorage.removeItem("isPageRefresh");
            }, 3000);
        }
    }, []);

    // Initialize scheduled cleanup for deleted jobs
    useEffect(() => {
        // Only when authenticated
        if (user) {
            const getUserUniversity = async () => {
                try {
                    // Get user data to find university ID
                    const userDataResult = await getUserData(user.uid);
                    if (userDataResult.success && userDataResult.data.universityId) {
                        // Schedule cleanup to run once per day (1440 minutes) with the university ID
                        const stopCleanup = scheduleJobsCleanup(1440, userDataResult.data.universityId);
                        
                        // Store the cleanup function to be called on unmount
                        return stopCleanup;
                    }
                } catch (error) {
                    console.error("Error getting user's university:", error);
                }
                
                // Return no-op function if we couldn't get the universityId
                return () => {};
            };
            
            // Start the process and get the cleanup function
            const cleanupPromise = getUserUniversity();
            
            // Clean up function when component unmounts
            return () => {
                cleanupPromise.then(stopCleanup => stopCleanup());
            };
        }
    }, [user]);

    // Check if user is an employee or system admin
    const isEmployee = userDetails?.role === 'employee';
    const isSystemAdmin = userDetails?.role === 'system_admin';

    return (
        <Router>
            {/* Toast notifications */}
            <Toaster position="top-right" />
            
            <Routes>
                {/* Authentication Routes */}
                {!user ? (
                    <>
                        <Route path="/" element={<AccountLayout />}>
                            <Route index element={<LoginPage />} />
                            <Route path="/signup" element={<SignUpPage />} />
                            <Route
                                path="/forgot-password"
                                element={<ForgotPasswordPage />}
                            />
                            <Route
                                path="/reset-password"
                                element={<ResetPasswordPage />}
                            />
                            {/* System Admin Login */}
                            <Route
                                path="/system-admin/login"
                                element={<SystemAdminLogin />}
                            />
                            {/* Redirect to login for any other route if not authenticated */}
                            <Route path="*" element={<Navigate to="/" />} />
                        </Route>
                    </>
                ) : isSystemAdmin ? (
                    <>
                        {/* System Admin Routes */}
                        <Route
                            path="/system-admin"
                            element={
                                <ProtectedRoute allowedRoles={['system_admin']}>
                                    <SystemAdminLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route
                                index
                                element={<Navigate to="/system-admin/dashboard" />}
                            />
                            <Route path="dashboard" element={<SystemAdminDashboard />} />
                            <Route path="universities" element={<SystemAdminUniversities />} />
                            <Route path="licenses" element={<SystemAdminLicenses />} />
                            {/* Add other system admin routes here */}
                        </Route>
                        {/* Redirect other routes to system admin dashboard if user is system admin */}
                        <Route
                            path="*"
                            element={<Navigate to="/system-admin/dashboard" />}
                        />
                    </>
                ) : isEmployee ? (
                    <>
                        {/* Employee Routes */}
                        <Route
                            path="/employee"
                            element={
                                <ProtectedRoute allowedRoles={['employee']}>
                                    <EmployeeLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route
                                index
                                element={<Navigate to="/employee/dashboard" />}
                            />
                            <Route path="dashboard" element={<EmployeeDashboard />} />
                            <Route path="profile" element={<EmployeeProfile />} />
                            <Route path="career" element={<CareerProgress />} />
                        </Route>
                        {/* Redirect HR routes to employee dashboard if user is an employee */}
                        <Route
                            path="*"
                            element={<Navigate to="/employee/dashboard" />}
                        />
                    </>
                ) : (
                    <>
                        {/* HR Staff Routes */}
                        <Route
                            path="/"
                            element={
                                <ProtectedRoute allowedRoles={['hr_head', 'hr_personnel', 'admin']}>
                                    <Layout />
                                </ProtectedRoute>
                            }
                        >
                            <Route
                                index
                                element={<Navigate to="/dashboard" />}
                            />
                            <Route path="dashboard" element={<Dashboard />} />

                            {/* Wrap Recruitment and its nested routes with JobProvider */}
                            <Route
                                path="recruitment/*"
                                element={
                                    <JobProvider>
                                        {" "}
                                        {/* Wrap only Recruitment and its children */}
                                        <Routes>
                                            <Route
                                                index
                                                element={<Recruitment />}
                                            />
                                            <Route
                                                path=":jobId"
                                                element={<JobDetails />}
                                            />{" "}
                                            {/* Nested route for JobDetails */}
                                            <Route
                                                path=":jobId/:applicantId"
                                                element={<ApplicantDetails />}
                                            />{" "}
                                            {/* Nested route for ApplicantDetails */}
                                        </Routes>
                                    </JobProvider>
                                }
                            />

                            <Route path="onboarding" element={<Onboarding />} />
                            <Route path="employees" element={<Employees />} />
                            <Route path="employees/:employeeId" element={<EmployeeDetails />} />
                            <Route path="clusters" element={<Clusters />} />
                            <Route path="profile" element={<Profile />} />
                            <Route path="license" element={<License />} />
                            <Route
                                path="subscription"
                                element={<Subscription />}
                            />
                            <Route path="hr-management" element={<HRHeadPanel />} />
                            
                            {/* Redirect employee routes to dashboard if user is HR */}
                            <Route
                                path="employee/*"
                                element={<Navigate to="/dashboard" />}
                            />
                        </Route>
                    </>
                )}
                <Route path="/signout" element={<SignOut />} />
            </Routes>
        </Router>
    );
}

function App() {
    // Set up job cleanup when component mounts
    useEffect(() => {
        scheduleJobsCleanup();
    }, []);

    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
