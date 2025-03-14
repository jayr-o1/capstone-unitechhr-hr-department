import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Recruitment from "./pages/Recruitment";
import JobDetails from "./pages/JobDetails"; // Import the JobDetails component
import Onboarding from "./pages/Onboarding";
import Employees from "./pages/Employees";
import Clusters from "./pages/Clusters";

function App() {
    return (
        <Router>
            <Routes>
                {/* Wrap all routes with the Layout component */}
                <Route path="/" element={<Layout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="recruitment">
                        <Route index element={<Recruitment />} />
                        <Route path=":jobId" element={<JobDetails />} />{" "}
                        {/* Nested route for JobDetails */}
                    </Route>
                    <Route path="onboarding" element={<Onboarding />} />
                    <Route path="employees" element={<Employees />} />
                    <Route path="clusters" element={<Clusters />} />
                    {/* Add more routes here */}
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
