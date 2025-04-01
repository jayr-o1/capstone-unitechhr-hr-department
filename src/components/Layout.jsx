import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "./Layouts/Header";
import Sidebar from "./Layouts/Sidebar";
import PageLoader from "./PageLoader";
import useFetchJobs from "../hooks/useFetchJobs"; // Import the useFetchJobs hook
import { doc, getDoc, collection, addDoc, getDocs, query, where, serverTimestamp, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import showSuccessAlert from "./Alerts/SuccessAlert";
import showErrorAlert from "./Alerts/ErrorAlert";
import HRPersonnelCard from "./HRComponents/HRPersonnelCard";

const Layout = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { jobId, applicantId, employeeId } = useParams();
    const [employeeName, setEmployeeName] = useState("Employee Details");
    const [userRole, setUserRole] = useState("user");
    const [isHeadHR, setIsHeadHR] = useState(false);

    // Form state for adding HR personnel
    const [hrFormData, setHrFormData] = useState({
        name: "",
        email: "",
        password: "",
        permissions: {
            recruitment: false,
            onboarding: false,
            employees: false,
            clusters: false,
            notifications: false
        }
    });
    const [hrPersonnel, setHrPersonnel] = useState([]);
    const [loadingPersonnel, setLoadingPersonnel] = useState(false);

    // Fetch jobs using the useFetchJobs hook
    const { jobs, loading: jobsLoading, error: jobsError, universityId } = useFetchJobs();

    // Check if current user is HR Head
    useEffect(() => {
        const checkUserRole = async () => {
            if (!auth.currentUser || !universityId) return;
            
            try {
                // Get the user role from authMappings for authorization
                const authMappingDoc = await getDoc(doc(db, "authMappings", auth.currentUser.uid));
                if (authMappingDoc.exists()) {
                    const authData = authMappingDoc.data();
                    setUserRole(authData.role || "user");
                    setIsHeadHR(authData.role === "hr_head" || authData.role === "admin");
                }
            } catch (error) {
                console.error("Error checking user role:", error);
            }
        };
        
        checkUserRole();
    }, [universityId]);

    // Fetch HR personnel for the university
    useEffect(() => {
        const fetchHRPersonnel = async () => {
            if (!universityId || !auth.currentUser) return;
            
            try {
                setLoadingPersonnel(true);
                
                // Always fetch the current user's data for permissions
                if (userRole === "hr_personnel") {
                    // For HR Personnel, fetch just their own data
                    const personalDataRef = doc(db, "universities", universityId, "hr_personnel", auth.currentUser.uid);
                    const personalDoc = await getDoc(personalDataRef);
                    
                    if (personalDoc.exists()) {
                        const userData = {
                            id: auth.currentUser.uid,
                            ...personalDoc.data()
                        };
                        setHrPersonnel([userData]);
                        console.log("Fetched HR personnel data:", userData);
                    } else {
                        console.log("No HR personnel data found for user:", auth.currentUser.uid);
                    }
                } else if (isHeadHR) {
                    // For HR Head, fetch all personnel if the panel is open
                    // or just their own data if the panel is closed
                    if (isPanelOpen) {
                        const hrQuery = query(
                            collection(db, "universities", universityId, "hr_personnel")
                        );
                        const snapshot = await getDocs(hrQuery);
                        
                        const personnel = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        
                        setHrPersonnel(personnel);
                        console.log("Fetched all HR personnel:", personnel);
                    } else {
                        // For HR Head when panel is closed, we should still have their own permissions data
                        const headDataRef = doc(db, "universities", universityId, "hr_head", auth.currentUser.uid);
                        const headDoc = await getDoc(headDataRef);
                        
                        if (headDoc.exists()) {
                            // HR Heads have all permissions by default
                            const userData = {
                                id: auth.currentUser.uid,
                                ...headDoc.data(),
                                permissions: {
                                    recruitment: true,
                                    onboarding: true,
                                    employees: true,
                                    clusters: true,
                                    notifications: true
                                }
                            };
                            setHrPersonnel([userData]);
                            console.log("Fetched HR head data:", userData);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching HR personnel:", error);
            } finally {
                setLoadingPersonnel(false);
            }
        };
        
        fetchHRPersonnel();
    }, [universityId, isPanelOpen, isHeadHR, auth.currentUser, userRole]);

    // Add a debug effect to log when hrPersonnel changes
    useEffect(() => {
        console.log("Current hrPersonnel state:", hrPersonnel);
        console.log("Current user permissions:", hrPersonnel.find(p => p.id === auth.currentUser?.uid)?.permissions);
    }, [hrPersonnel]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setHrFormData({
            ...hrFormData,
            [name]: value
        });
    };

    // Handle permission checkbox changes
    const handlePermissionChange = (e) => {
        const { name, checked } = e.target;
        setHrFormData({
            ...hrFormData,
            permissions: {
                ...hrFormData.permissions,
                [name]: checked
            }
        });
    };

    // Handle form submission to add new HR personnel
    const handleAddHRPersonnel = async (e) => {
        e.preventDefault();
        
        if (!universityId || !isHeadHR) {
            showErrorAlert("You don't have permission to add HR personnel");
            return;
        }
        
        if (!hrFormData.name || !hrFormData.email || !hrFormData.password) {
            showErrorAlert("Please fill all required fields");
            return;
        }
        
        try {
            setIsLoading(true);
            
            // Create the user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                hrFormData.email,
                hrFormData.password
            );
            
            const uid = userCredential.user.uid;
            
            // Create the user document with all details in the university subcollection
            const userDoc = {
                uid: uid,
                name: hrFormData.name,
                email: hrFormData.email,
                role: "hr_personnel",
                status: "active", // Directly activated by HR Head
                permissions: hrFormData.permissions,
                createdAt: serverTimestamp(),
                createdBy: auth.currentUser.uid,
                lastLogin: serverTimestamp()
            };
            
            // Store HR personnel data in personnel collection, NOT in hr_head
            // HR personnel should only be in the hr_personnel subcollection
            await setDoc(doc(db, "universities", universityId, "hr_personnel", uid), userDoc);
            
            // Create auth mapping for efficient login - include displayName
            await setDoc(doc(db, "authMappings", uid), {
                uid: uid,
                email: hrFormData.email,
                displayName: hrFormData.name, // Include name for better user experience
                universityId: universityId,
                role: "hr_personnel",
                status: "active",
                lastUpdated: serverTimestamp()
            });
            
            // Reset form
            setHrFormData({
                name: "",
                email: "",
                password: "",
                permissions: {
                    recruitment: false,
                    onboarding: false,
                    employees: false,
                    clusters: false,
                    notifications: false
                }
            });
            
            // Refresh HR personnel list
            const hrQuery = query(
                collection(db, "universities", universityId, "hr_personnel")
            );
            const snapshot = await getDocs(hrQuery);
            
            const personnel = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setHrPersonnel(personnel);
            
            showSuccessAlert("HR Personnel added successfully");
        } catch (error) {
            console.error("Error adding HR personnel:", error);
            showErrorAlert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Define a mapping of paths to page titles
    const pageTitles = {
        "/dashboard": "Dashboard",
        "/recruitment": "Recruitment",
        "/onboarding": "Onboarding",
        "/employees": "Employees",
        "/clusters": "Clusters",
        "/profile": "User Profile",
        "/subscription": "Subscription",
        "/hr-management": "HR Management",
    };

    // Get the job title if on a job details page - memoized to prevent unnecessary calculations
    const getJobTitle = useCallback((jobId) => {
        const job = jobs.find((job) => job.id === jobId); // Find job by ID
        return job ? job.title : "Job Details";
    }, [jobs]);

    // Get the applicant name if on an applicant details page - memoized to prevent unnecessary calculations
    const getApplicantName = useCallback((jobId, applicantId) => {
        const job = jobs.find((job) => job.id === jobId); // Find job by ID
        if (job) {
            const applicant = job.applicants.find(
                (app) => app.id === applicantId
            ); // Find applicant by ID
            return applicant ? applicant.name : "Applicant Details";
        }
        return "Applicant Details";
    }, [jobs]);

    // Fetch employee name when employeeId changes
    useEffect(() => {
        const fetchEmployeeName = async () => {
            if (!employeeId || !universityId) return;
            
            try {
                const employeeRef = doc(db, "universities", universityId, "employees", employeeId);
                const employeeDoc = await getDoc(employeeRef);
                
                if (employeeDoc.exists()) {
                    setEmployeeName(employeeDoc.data().name || "Employee Details");
                } else {
                    setEmployeeName("Employee Details");
                }
            } catch (error) {
                console.error("Error fetching employee name:", error);
                setEmployeeName("Employee Details");
            }
        };
        
        if (location.pathname.includes('/employees/') && employeeId) {
            fetchEmployeeName();
        }
    }, [employeeId, universityId, location.pathname]);

    // Get the current page title - memoized for performance
    const getCurrentPageTitle = useCallback(() => {
        // If on a job details page
        if (location.pathname.startsWith("/recruitment/") && jobId) {
            if (applicantId) {
                return getApplicantName(jobId, applicantId);
            } else {
                return getJobTitle(jobId);
            }
        }
        
        // If on an employee details page
        if (location.pathname.startsWith("/employees/") && employeeId) {
            return employeeName;
        }
        
        // For all other paths, check the path mapping
        const paths = location.pathname.split("/").filter(path => path !== "");
        if (paths.length === 0) {
            return "Dashboard";
        }
        
        const fullPath = `/${paths[0]}`;
        return pageTitles[fullPath] || paths[0].charAt(0).toUpperCase() + paths[0].slice(1);
    }, [location.pathname, jobId, applicantId, employeeId, getJobTitle, getApplicantName, pageTitles, employeeName]);
    
    // Current page is memoized to prevent unnecessary recalculations
    const currentPage = useMemo(() => getCurrentPageTitle(), [getCurrentPageTitle]);

    // Update browser tab title when route changes
    useEffect(() => {
        document.title = `Unitech HR | ${currentPage}`;
    }, [currentPage]);

    // Flag to identify browser/page refresh vs internal navigation
    useEffect(() => {
        // Check if this is the initial load
        const isInitialLoad = sessionStorage.getItem("hasLoaded") !== "true";
        
        // Set a flag in the session storage
        if (isInitialLoad) {
            sessionStorage.setItem("hasLoaded", "true");
            // Flag this as a page refresh
            sessionStorage.setItem("isPageRefresh", "true");
        } else {
            // This is just internal navigation, not a full page refresh
            sessionStorage.setItem("isPageRefresh", "false");
        }
        
        // Cleanup on unmount
        return () => {
            // We don't clean up hasLoaded as it should persist across the session
        };
    }, []);

    // Show loader when route changes
    useEffect(() => {
        setIsLoading(true);
        // Set a shorter timeout for better UX
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    // Function to generate breadcrumb data - memoized to prevent recalculation on every render
    const generateBreadcrumb = useCallback(() => {
        // Skip generation if no jobs are loaded yet and we're on a job-related page
        if (jobs.length === 0 && location.pathname.includes('/recruitment/')) {
            return []; // Return empty breadcrumb until jobs are loaded
        }
        
        // Split the path into segments and filter out empty strings
        const paths = location.pathname
            .split("/")
            .filter((path) => path !== "");
        
        // If there are no path segments, return empty array (at root)
        if (paths.length === 0) {
            return [];
        }
        
        const breadcrumb = [];
        let currentPath = "";
        
        // Handle each path segment
        for (let i = 0; i < paths.length; i++) {
            const segment = paths[i];
            currentPath += `/${segment}`;
            
            if (segment === "recruitment") {
                // Add the "Recruitment" root path
                breadcrumb.push({
                    title: "Recruitment",
                    path: "/recruitment",
                });
                
                // If a job is opened, use job title instead of ID
                if (i + 1 < paths.length) {
                    const jobId = paths[i + 1];
                    const jobTitle = getJobTitle(jobId);
                    breadcrumb.push({
                        title: jobTitle,
                        path: `/recruitment/${jobId}`,
                    });
                    
                    // If an applicant is opened, add applicant name
                    if (i + 2 < paths.length) {
                        const applicantId = paths[i + 2];
                        const applicantName = getApplicantName(jobId, applicantId);
                        breadcrumb.push({
                            title: applicantName,
                            path: null, // No path for the last segment
                        });
                        break; // Break after processing 3 levels of recruitment path
                    }
                    break; // Break after processing 2 levels of recruitment path if no applicant
                }
            } else if (segment === "onboarding") {
                breadcrumb.push({
                    title: "Onboarding",
                    path: "/onboarding",
                });
                
                // If an employee is opened in onboarding
                if (i + 1 < paths.length) {
                    breadcrumb.push({
                        title: "Employee Details",
                        path: null, // No path for the last segment
                    });
                    break;
                }
            } else if (segment === "employees") {
                breadcrumb.push({
                    title: "Employees",
                    path: "/employees",
                });
                
                // If an employee is opened
                if (i + 1 < paths.length) {
                    const empId = paths[i + 1];
                    breadcrumb.push({
                        title: employeeName,
                        path: null, // No path for the last segment
                    });
                    break;
                }
            } else if (segment === "clusters") {
                breadcrumb.push({
                    title: "Clusters",
                    path: "/clusters",
                });
                
                // If a cluster is opened
                if (i + 1 < paths.length) {
                    breadcrumb.push({
                        title: "Cluster Details",
                        path: null, // No path for the last segment
                    });
                    break;
                }
            } else if (segment === "hr-management") {
                breadcrumb.push({
                    title: "HR Management",
                    path: "/hr-management",
                });
                
                // If a subsection is opened
                if (i + 1 < paths.length) {
                    // Capitalize and replace dashes with spaces
                    const formattedTitle = paths[i + 1]
                        .split("-")
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(" ");
                        
                    breadcrumb.push({
                        title: formattedTitle,
                        path: null, // No path for the last segment
                    });
                    break;
                }
            } else {
                // For other paths like dashboard, profile, subscription
                const pageName = pageTitles[currentPath] || 
                    segment.charAt(0).toUpperCase() + segment.slice(1);
                
                breadcrumb.push({
                    title: pageName,
                    path: i === paths.length - 1 ? null : currentPath, // No path for the last segment
                });
            }
        }
        
        return breadcrumb;
    }, [location.pathname, jobs, getJobTitle, getApplicantName, pageTitles, employeeName, universityId]);

    // Memoize the breadcrumb data to prevent unnecessary recalculation
    const breadcrumbData = useMemo(() => generateBreadcrumb(), [generateBreadcrumb]);

    // Handle click on breadcrumb items
    const handleBreadcrumbClick = useCallback((path) => {
        if (path) {
            navigate(path); // Navigate to the clicked path
        }
    }, [navigate]);

    // Show a loading state while jobs are being fetched on initial load
    if (jobsLoading && !universityId) {
        // Only show full loader when university ID isn't available yet 
        // and this is a page refresh (not internal navigation)
        const isPageRefresh = sessionStorage.getItem("isPageRefresh") === "true";
        return <PageLoader isLoading={true} fullscreen={isPageRefresh} />;
    }

    // Show an error message if jobs fail to load
    if (jobsError) {
        return <div className="text-red-500 p-4">{jobsError}</div>;
    }

    return (
        <div className="flex h-screen">
            {/* Sidebar (Fixed Width) */}
            <Sidebar 
                userRole={userRole} 
                userPermissions={hrPersonnel.find(p => p.id === auth.currentUser?.uid)?.permissions}
            />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col ml-64">
                {/* Header (Full Width) */}
                <Header
                    title={currentPage}
                    breadcrumb={breadcrumbData}
                    onBreadcrumbClick={handleBreadcrumbClick}
                    userRole={userRole}
                    userPermissions={hrPersonnel.find(p => p.id === auth.currentUser?.uid)?.permissions}
                />

                {/* Page Content (Only this part gets the loader) */}
                <div className="relative flex-1 h-[calc(100vh-4rem)] p-4 bg-gray-100 overflow-y-auto">
                    {/* PageLoader positioned relative to the content container only */}
                    <PageLoader 
                        isLoading={isLoading || (jobsLoading && location.pathname.includes('/recruitment/'))} 
                        fullscreen={false}
                        contentOnly={true}
                    />

                    {/* Outlet with conditional opacity and pointer-events */}
                    <div
                        className={
                            isLoading || (jobsLoading && location.pathname.includes('/recruitment/')) 
                            ? "opacity-50 pointer-events-none" 
                            : ""
                        }
                    >
                        <Outlet />
                    </div>
                </div>
            </div>

            {/* Ribbon button on the right edge - only for HR Heads and admins */}
            {(userRole === "hr_head" || userRole === "admin") && (
                <button
                    onClick={() => setIsPanelOpen(!isPanelOpen)}
                    className={`fixed top-1/2 transform -translate-y-1/2 text-white rounded-l-md shadow-lg transition-all duration-300 z-50 flex items-center justify-center ${
                        isPanelOpen 
                        ? "right-80 bg-gray-500 hover:bg-gray-600" 
                        : "right-0 bg-blue-600 hover:bg-blue-700"
                    }`}
                    style={{
                        width: "40px",
                        height: "40px",
                        boxShadow: "-3px 0px 10px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-6 w-6 ${isPanelOpen ? "animate-spin-reverse" : "animate-spin"}`}
                        style={{ animationDuration: '3s' }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                </button>
            )}

            {/* Collapsible Side Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto ${
                    isPanelOpen ? "translate-x-0" : "translate-x-full"
                }`}
                style={{ 
                    borderLeft: "1px solid #e2e8f0"
                }}
            >
                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                            HR Administration
                        </h2>
                        <button
                            onClick={() => setIsPanelOpen(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">
                        Manage HR personnel and assign module permissions for your university.
                    </p>

                    {/* Panel Content Container */}
                    <div className="space-y-6 border-t pt-6 flex-grow">
                        {isHeadHR ? (
                            <>
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-3">Add HR Personnel</h3>
                                    <form onSubmit={handleAddHRPersonnel} className="space-y-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={hrFormData.name}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                                Email Address <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={hrFormData.email}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                                Password <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="password"
                                                id="password"
                                                name="password"
                                                value={hrFormData.password}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Module Permissions
                                            </label>
                                            <div className="space-y-2">
                                                <div className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        id="recruitment"
                                                        name="recruitment"
                                                        checked={hrFormData.permissions.recruitment}
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
                                                        checked={hrFormData.permissions.onboarding}
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
                                                        checked={hrFormData.permissions.employees}
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
                                                        checked={hrFormData.permissions.clusters}
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
                                                        checked={hrFormData.permissions.notifications}
                                                        onChange={handlePermissionChange}
                                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <label htmlFor="notifications" className="ml-2 text-sm text-gray-700">
                                                        Notifications
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                        >
                                            {isLoading ? "Adding..." : "Add HR Personnel"}
                                        </button>
                                    </form>
                                </div>
                                
                                <div className="border-t pt-6">
                                    <h3 className="font-medium text-gray-900 mb-3">Existing HR Personnel</h3>
                                    
                                    {loadingPersonnel ? (
                                        <p className="text-sm text-gray-500">Loading personnel...</p>
                                    ) : hrPersonnel.length === 0 ? (
                                        <p className="text-sm text-gray-500">No HR personnel found.</p>
                                    ) : (
                                        <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                                            {hrPersonnel.map((person) => (
                                                <HRPersonnelCard 
                                                    key={person.id} 
                                                    person={person} 
                                                    universityId={universityId}
                                                    refreshPersonnel={() => {
                                                        // Refresh HR personnel list
                                                        const fetchPersonnel = async () => {
                                                            try {
                                                                setLoadingPersonnel(true);
                                                                const hrQuery = query(
                                                                    collection(db, "universities", universityId, "hr_personnel")
                                                                );
                                                                const snapshot = await getDocs(hrQuery);
                                                                
                                                                const personnel = snapshot.docs.map(doc => ({
                                                                    id: doc.id,
                                                                    ...doc.data()
                                                                }));
                                                                
                                                                setHrPersonnel(personnel);
                                                            } catch (error) {
                                                                console.error("Error fetching HR personnel:", error);
                                                            } finally {
                                                                setLoadingPersonnel(false);
                                                            }
                                                        };
                                                        
                                                        fetchPersonnel();
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900">Access Restricted</h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Only HR Heads can manage HR personnel and permissions.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Layout;
