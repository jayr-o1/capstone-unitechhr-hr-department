import React, { useEffect, useState } from "react";
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
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
import EmployeeDocuments from "./pages/employee/Documents";
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

// Temporary component until we create the full page
const SystemAdminUniversities = () => {
    const [universities, setUniversities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
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
                            try {
                                const hrHeadsRef = collection(db, "universities", uni.id, "hr_head");
                                const hrHeadsSnapshot = await getDocs(hrHeadsRef);
                                hrHeadsCount = hrHeadsSnapshot.size;
                            } catch (err) {
                                console.error(`Error fetching HR heads for university ${uni.id}:`, err);
                            }

                            // Get HR personnel count
                            let hrPersonnelCount = 0;
                            try {
                                const hrPersonnelRef = collection(db, "universities", uni.id, "hr_personnel");
                                const hrPersonnelSnapshot = await getDocs(hrPersonnelRef);
                                hrPersonnelCount = hrPersonnelSnapshot.size;
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
                                hrPersonnel: hrPersonnelCount,
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

        fetchUniversities();
    }, []);

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
                                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                                                Edit
                                            </button>
                                            <button className="text-red-600 hover:text-red-900">
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
                            <Route path="documents" element={<EmployeeDocuments />} />
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
