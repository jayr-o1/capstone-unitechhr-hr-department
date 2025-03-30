import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "./Layouts/Header";
import Sidebar from "./Layouts/Sidebar";
import PageLoader from "./PageLoader";
import useFetchJobs from "../hooks/useFetchJobs"; // Import the useFetchJobs hook

const Layout = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { jobId, applicantId } = useParams();

    // Fetch jobs using the useFetchJobs hook
    const { jobs, loading: jobsLoading, error: jobsError, universityId } = useFetchJobs();

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
        
        // For all other paths, check the path mapping
        const paths = location.pathname.split("/").filter(path => path !== "");
        if (paths.length === 0) {
            return "Dashboard";
        }
        
        const fullPath = `/${paths[0]}`;
        return pageTitles[fullPath] || paths[0].charAt(0).toUpperCase() + paths[0].slice(1);
    }, [location.pathname, jobId, applicantId, getJobTitle, getApplicantName, pageTitles]);
    
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
                    breadcrumb.push({
                        title: "Employee Details",
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
    }, [location.pathname, jobs, getJobTitle, getApplicantName, pageTitles]);

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
            <Sidebar />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col ml-64">
                {/* Header (Full Width) */}
                <Header
                    title={currentPage}
                    breadcrumb={breadcrumbData}
                    onBreadcrumbClick={handleBreadcrumbClick}
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

            {/* Ribbon button on the right edge */}
            <button
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                className="fixed top-1/2 right-0 transform -translate-y-1/2 bg-blue-600 text-white rounded-l-md shadow-lg hover:bg-blue-700 transition-all duration-300 z-50 flex flex-col items-center justify-center"
                style={{
                    width: "40px",
                    height: "120px",
                    boxShadow: "-3px 0px 10px rgba(0, 0, 0, 0.1)",
                }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-6 w-6 ${
                        isPanelOpen ? "rotate-180" : ""
                    } transition-transform duration-700 animate-spin-slow`}
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
                <div
                    className="writing-mode-vertical mt-2 text-xs font-semibold"
                    style={{
                        writingMode: "vertical-rl",
                        textOrientation: "mixed",
                        transform: "rotate(180deg)",
                    }}
                >
                    Settings
                </div>
            </button>

            {/* Collapsible Side Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-40 overflow-y-auto ${
                    isPanelOpen ? "translate-x-0" : "translate-x-full"
                }`}
                style={{ borderLeft: "1px solid #e2e8f0" }}
            >
                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                            TEMPLATE CUSTOMIZER
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
                        Set preferences that will be cooked for your live
                        preview demonstration.
                    </p>

                    {/* Panel Content Container (Empty for now as requested) */}
                    <div className="space-y-6 border-t pt-6 flex-grow">
                        {/* Content will be added later as needed */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Layout;
