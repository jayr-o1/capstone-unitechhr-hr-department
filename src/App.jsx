import React, { useEffect } from "react";
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
import SystemAdminApprovals from "./pages/system-admin/Approvals";
import SystemAdminLogin from "./pages/system-admin/Login";

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
                            <Route path="approvals" element={<SystemAdminApprovals />} />
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
