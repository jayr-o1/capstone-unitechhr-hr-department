import React, { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "./Layouts/Header";
import Sidebar from "./Layouts/Sidebar";
import PageLoader from "./PageLoader";
import jobDetailsData from "../data/jobDetailsData"; // Import job details

const Layout = () => {
    const [isLoading, setIsLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { jobId, applicantId } = useParams(); // Get jobId and applicantId from URL

    // Define a mapping of paths to page titles
    const pageTitles = {
        "/dashboard": "Dashboard",
        "/recruitment": "Recruitment",
        "/onboarding": "Onboarding",
        "/employees": "Employees",
        "/clusters": "Clusters",
    };

    // Get the job title if on a job details page
    const getJobTitle = (jobId) => {
        const job = jobDetailsData.find((job) => job.id === Number(jobId));
        return job ? job.title : "Job Details";
    };

    // Get the applicant name if on an applicant details page
    const getApplicantName = (jobId, applicantId) => {
        const job = jobDetailsData.find((job) => job.id === Number(jobId));
        if (job) {
            const applicant = job.applicants.find((app) => app.id === Number(applicantId));
            return applicant ? applicant.name : "Applicant Details";
        }
        return "Applicant Details";
    };

    // Get the current page title
    const currentPage =
        location.pathname.startsWith("/recruitment/") && jobId
            ? applicantId
                ? getApplicantName(jobId, applicantId)
                : getJobTitle(jobId)
            : pageTitles[location.pathname] || "Dashboard";

    // Update browser tab title when route changes
    useEffect(() => {
        document.title = `Unitech HR | ${currentPage}`;
    }, [currentPage]);

    // Show loader when route changes
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    // Function to generate breadcrumb data
    const generateBreadcrumb = () => {
        const paths = location.pathname
            .split("/")
            .filter((path) => path !== ""); // Split the path into segments
        const breadcrumb = [];

        // Add the "Recruitment" root path
        if (paths[0] === "recruitment") {
            breadcrumb.push({
                title: "Recruitment",
                path: "/recruitment",
            });

            // If a job is opened, use job title instead of ID
            if (paths.length > 1) {
                const jobTitle = getJobTitle(paths[1]);
                breadcrumb.push({
                    title: jobTitle,
                    path: `/recruitment/${paths[1]}`,
                });

                // If an applicant is opened, add applicant name
                if (paths.length > 2) {
                    const applicantName = getApplicantName(paths[1], paths[2]);
                    breadcrumb.push({
                        title: applicantName,
                        path: null, // No path for the last segment
                    });
                }
            }
        } else {
            // Add other pages
            const rootPath = `/${paths[0]}`;
            breadcrumb.push({
                title: pageTitles[rootPath] || paths[0],
                path: rootPath,
            });
        }

        return breadcrumb;
    };

    // Handle click on breadcrumb items
    const handleBreadcrumbClick = (path) => {
        if (path) {
            navigate(path); // Navigate to the clicked path
        }
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar (Fixed Width) */}
            <Sidebar />

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col ml-64">
                {/* Header (Full Width) */}
                <Header
                    title={currentPage}
                    breadcrumb={generateBreadcrumb()}
                    onBreadcrumbClick={handleBreadcrumbClick}
                />

                {/* Page Content (Only this part gets the loader) */}
                <div className="relative flex-1 h-[calc(100vh-4rem)] p-4 bg-gray-100 overflow-y-auto">
                    {/* PageLoader positioned relative to the Outlet container */}
                    <PageLoader isLoading={isLoading} />

                    {/* Outlet with conditional opacity and pointer-events */}
                    <div
                        className={
                            isLoading ? "opacity-50 pointer-events-none" : ""
                        }
                    >
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Layout;