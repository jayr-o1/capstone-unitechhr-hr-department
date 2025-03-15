import React, { useState } from "react";
import JobList from "../components/RecruitmentComponents/JobList";
import Filters from "../components/RecruitmentComponents/Filters";
import PaginationControls from "../components/RecruitmentComponents/PaginationControls";
import AddJobButton from "../components/RecruitmentComponents/AddJobButton";
import AddJobModal from "../components/Modals/AddJobModal";
import EditJobModal from "../components/Modals/EditJobModal"; // Import EditJobModal
import jobDetailsData from "../data/jobDetailsData";

const Recruitment = () => {
    // State for pagination
    const [currentPage, setCurrentPage] = useState(1);

    // State for filters
    const [selectedDepartments, setSelectedDepartments] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [showNewApplicants, setShowNewApplicants] = useState(false);

    // State for modals
    const [isAddModalOpen, setIsAddModalOpen] = useState(false); // For AddJobModal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); // For EditJobModal

    // State for jobs
    const [jobs, setJobs] = useState(jobDetailsData);
    const [selectedJob, setSelectedJob] = useState(null); // Store the job being edited

    // Pagination settings
    const jobsPerPage = 5;

    // Filter jobs based on selected filters
    const filteredJobs = jobs
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

    // Function to open the Add Job modal
    const handleOpenAddModal = () => {
        setIsAddModalOpen(true);
    };

    // Function to close the Add Job modal
    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
    };

    // Function to open the Edit Job modal
    const handleOpenEditModal = (job) => {
        setSelectedJob(job); // Set the job to be edited
        setIsEditModalOpen(true); // Open the modal
    };

    // Function to close the Edit Job modal
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
    };

    // Function to handle closing a job
    const handleCloseJob = (jobId) => {
        setJobs((prevJobs) =>
            prevJobs.map((job) =>
                job.id === jobId ? { ...job, status: "Closed" } : job
            )
        );
    };

    // Function to handle opening a job
    const handleOpenJob = (jobId) => {
        setJobs((prevJobs) =>
            prevJobs.map((job) =>
                job.id === jobId ? { ...job, status: "Open" } : job
            )
        );
    };

    // Function to handle updating a job
    const handleUpdateJob = (updatedJob) => {
        setJobs((prevJobs) =>
            prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
        );
        handleCloseEditModal(); // Close the modal after updating
    };

    return (
        <div className="flex-1 flex">
            {/* Left Side (Job Posts & Pagination) */}
            <div className="w-2/3 flex flex-col justify-between">
                <JobList
                    jobs={currentJobs}
                    onCloseJob={handleCloseJob}
                    onOpenJob={handleOpenJob}
                    onEditJob={handleOpenEditModal} // Pass the edit function
                />
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
                <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
                    {/* Controls Section */}
                    <div className="relative w-full mb-4">
                        <h3 className="absolute left-3 -top-3 bg-white px-2 text-gray-400 text-sm font-semibold">
                            Controls
                        </h3>
                        <div className="border border-gray-300 rounded-lg p-4">
                            <div className="flex flex-col gap-2">
                                <AddJobButton
                                    onOpenModal={handleOpenAddModal}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="relative w-full">
                        <h3 className="absolute left-3 -top-3 bg-white px-2 text-gray-400 text-sm font-semibold">
                            Filters
                        </h3>
                        <div className="border border-gray-300 rounded-lg p-4">
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
            </div>

            {/* Add Job Modal */}
            <AddJobModal
                isOpen={isAddModalOpen}
                onClose={handleCloseAddModal}
            />

            {/* Edit Job Modal */}
            <EditJobModal
                isOpen={isEditModalOpen}
                onClose={handleCloseEditModal}
                initialData={selectedJob}
                onUpdateJob={handleUpdateJob} // Pass the update function
            />
        </div>
    );
};

export default Recruitment;