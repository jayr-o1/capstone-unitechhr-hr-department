import React, { useState } from "react";
import JobList from "../components/RecruitmentComponents/JobList";
import Filters from "../components/RecruitmentComponents/Filters";
import PaginationControls from "../components/RecruitmentComponents/PaginationControls";

const Recruitment = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [showNewApplicants, setShowNewApplicants] = useState(false);
    const jobsPerPage = 6;

    const jobPosts = [
        {
            id: 1,
            title: "Computer Science Instructor",
            salary: "Up to 20k",
            department: "College of Computer Studies",
            daysAgo: "1 day ago",
            description:
                "Responsible for teaching programming, algorithms, and data structures.",
            status: "Open",
            newApplicants: true,
        },
        {
            id: 2,
            title: "Business Accountancy Instructor",
            salary: "Up to 20k",
            department: "College of Business Accountancy",
            daysAgo: "1 day ago",
            description:
                "Responsible for managing financial records and providing expertise in accounting principles.",
            status: "Open",
            newApplicants: true,
        },
        {
            id: 3,
            title: "Criminology Instructor",
            salary: "Up to 20k",
            department: "College of Criminology",
            daysAgo: "1 day ago",
            description:
                "Teaches forensic science, law enforcement principles, and criminal justice ethics.",
            status: "Closed",
            newApplicants: false,
        },
        {
            id: 4,
            title: "Education Instructor",
            salary: "Up to 18k",
            department: "College of Education",
            daysAgo: "2 days ago",
            description:
                "Provides training on modern teaching methodologies and classroom management.",
            status: "Open",
            newApplicants: true,
        },
        {
            id: 5,
            title: "Tourism Management Instructor",
            salary: "Up to 22k",
            department: "College of Tourism",
            daysAgo: "3 days ago",
            description:
                "Teaches tourism management, hospitality, and customer service excellence.",
            status: "Open",
            newApplicants: true,
        },
        {
            id: 6,
            title: "Nursing Instructor",
            salary: "Up to 25k",
            department: "College of Nursing",
            daysAgo: "5 days ago",
            description:
                "Provides clinical training and theoretical knowledge in nursing practices.",
            status: "Closed",
            newApplicants: false,
        },
        {
            id: 7,
            title: "Psychology Instructor",
            salary: "Up to 21k",
            department: "College of Psychology",
            daysAgo: "4 days ago",
            description:
                "Focuses on psychological theories, mental health studies, and research methodologies.",
            status: "Open",
            newApplicants: false,
        },
        {
            id: 8,
            title: "Engineering Instructor",
            salary: "Up to 24k",
            department: "College of Engineering",
            daysAgo: "2 days ago",
            description:
                "Teaches engineering principles, physics, and applied mathematics.",
            status: "Open",
            newApplicants: false,
        },
        {
            id: 9,
            title: "Mathematics Instructor",
            salary: "Up to 19k",
            department: "College of Education",
            daysAgo: "6 days ago",
            description:
                "Teaches advanced mathematics, including calculus and linear algebra.",
            status: "Open",
            newApplicants: false,
        },
        {
            id: 10,
            title: "Physics Instructor",
            salary: "Up to 23k",
            department: "College of Engineering",
            daysAgo: "3 days ago",
            description:
                "Teaches classical mechanics, electromagnetism, and quantum physics.",
            status: "Closed",
            newApplicants: false,
        },
        {
            id: 11,
            title: "Chemistry Instructor",
            salary: "Up to 20k",
            department: "College of Engineering",
            daysAgo: "4 days ago",
            description:
                "Teaches organic and inorganic chemistry, as well as laboratory techniques.",
            status: "Open",
            newApplicants: false,
        },
        {
            id: 12,
            title: "Biology Instructor",
            salary: "Up to 21k",
            department: "College of Nursing",
            daysAgo: "7 days ago",
            description:
                "Teaches cellular biology, genetics, and microbiology.",
            status: "Open",
            newApplicants: false,
        },
        {
            id: 13,
            title: "History Instructor",
            salary: "Up to 18k",
            department: "College of Education",
            daysAgo: "8 days ago",
            description:
                "Teaches world history, focusing on major events and their impact.",
            status: "Closed",
            newApplicants: false,
        },
        {
            id: 14,
            title: "Literature Instructor",
            salary: "Up to 19k",
            department: "College of Education",
            daysAgo: "9 days ago",
            description:
                "Teaches classic and contemporary literature, including analysis and critique.",
            status: "Open",
            newApplicants: false,
        },
        {
            id: 15,
            title: "Economics Instructor",
            salary: "Up to 22k",
            department: "College of Business Accountancy",
            daysAgo: "10 days ago",
            description:
                "Teaches microeconomics, macroeconomics, and economic theory.",
            status: "Open",
            newApplicants: false,
        },
    ];

    // Filter jobs based on selected filters
    const filteredJobs = jobPosts
        .filter((job) => {
            const matchesDepartment =
                selectedDepartments.length === 0 ||
                selectedDepartments.includes(job.department);
            const matchesStatus =
                selectedStatus === "All" ||
                (selectedStatus === "Open" && job.status === "Open") ||
                (selectedStatus === "Closed" && job.status === "Closed");
            const matchesNewApplicants =
                !showNewApplicants || job.newApplicants;
            return matchesDepartment && matchesStatus && matchesNewApplicants;
        })
        .sort((a, b) => {
            // Sort jobs with new applicants first
            if (a.newApplicants && !b.newApplicants) return -1;
            if (!a.newApplicants && b.newApplicants) return 1;
            return 0; // Keep original order if both have or don't have new applicants
        });

    // Pagination logic
    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

    return (
        <div className="flex">
            {/* Left Side (Job Posts & Pagination) */}
            <div className="w-2/3 pr-4">
                <JobList jobs={currentJobs} />
                <PaginationControls
                    currentPage={currentPage}
                    totalJobs={filteredJobs.length}
                    jobsPerPage={jobsPerPage}
                    onNextPage={() => setCurrentPage((prev) => prev + 1)}
                    onPrevPage={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                />
            </div>

            {/* Right Side (Filters) */}
            <div className="w-1/3 pl-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <Filters
                        selectedDepartments={selectedDepartments}
                        setSelectedDepartments={setSelectedDepartments}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                        showNewApplicants={showNewApplicants}
                        setShowNewApplicants={setShowNewApplicants}
                    />
                </div>
            </div>
        </div>
    );
};

export default Recruitment;
