import React, { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "./Layouts/Header";
import Sidebar from "./Layouts/Sidebar";
import PageLoader from "./PageLoader";

const Layout = () => {
    const [isLoading, setIsLoading] = useState(false);
    const location = useLocation();

    // Define a mapping of paths to page titles
    const pageTitles = {
        "/dashboard": "Dashboard",
        "/recruitment": "Recruitment",
        "/onboarding": "Onboarding",
        "/employees": "Employees",
        "/clusters": "Clusters",
    };

    const currentPage = pageTitles[location.pathname] || "Dashboard"; // Default title

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

    return (
        <>
            <PageLoader isLoading={isLoading} />

            {/* Layout Wrapper - Sidebar + Main Content */}
            <div className="flex h-screen">
                {/* Sidebar (Fixed Width) */}
                <Sidebar />

                {/* Main Content Wrapper */}
                <div className="flex-1 flex flex-col ml-64">
                    {/* Header (Full Width) */}
                    <Header title={currentPage} />

                    {/* Page Content */}
                    <main className="flex-1 p-4">
                        <Outlet />
                    </main>
                </div>
            </div>
        </>
    );
};

export default Layout;
