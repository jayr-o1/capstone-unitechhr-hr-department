import React, { useState, useEffect } from "react";
import JobList from "../components/RecruitmentComponents/JobList";
import Filters from "../components/RecruitmentComponents/Filters";
import PaginationControls from "../components/RecruitmentComponents/PaginationControls";
import AddJobButton from "../components/RecruitmentComponents/AddJobButton";
import AddJobModal from "../components/Modals/AddJobModal";
import EditJobModal from "../components/Modals/EditJobModal";
import useFetchJobs from "../hooks/useFetchJobs"; // Import the useFetchJobs hook
import PageLoader from "../components/PageLoader";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import showErrorAlert from "../components/Alerts/ErrorAlert";

const Recruitment = () => {
  // Fetch jobs from Firestore
  const { jobs, loading, error, setJobs, refreshJobs } = useFetchJobs();
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [isManuallyRefreshing, setIsManuallyRefreshing] = useState(false);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);

  // State for filters
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [showNewApplicants, setShowNewApplicants] = useState(false);

  // State for modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // For AddJobModal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // For EditJobModal
  const [selectedJob, setSelectedJob] = useState(null); // Store the job being edited

  // Pagination settings
  const jobsPerPage = 5;
  
  // Force refresh the job list when jobs change
  useEffect(() => {
    setRefreshCounter(prev => prev + 1);
    
    // Reset to first page if we're on a page that no longer exists
    if (currentPage > Math.ceil(jobs.length / jobsPerPage) && currentPage > 1) {
      setCurrentPage(Math.max(1, Math.ceil(jobs.length / jobsPerPage)));
    }
  }, [jobs, currentPage, jobsPerPage]); // Using jobs object instead of just length for deeper tracking

  // Function to handle job list refresh without page reload
  const refreshJobList = async () => {
    setIsManuallyRefreshing(true);
    await refreshJobs(); // Fetch fresh data from Firestore
    setRefreshCounter(prev => prev + 1); // Force JobList to re-render
    
    // Reset the loading state after a short delay
    setTimeout(() => {
      setIsManuallyRefreshing(false);
    }, 1000);
  };

  // Filter jobs based on selected filters
  const filteredJobs = [...jobs] // Create a copy to avoid mutation issues
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

  // Function to handle updating a job
  const handleUpdateJob = async (updatedJob) => {
    try {
      // Remove applicants before updating Firestore
      const { applicants, ...jobDataWithoutApplicants } = updatedJob;
      
      // First, update the job in Firestore
      const jobRef = doc(db, "jobs", updatedJob.id);
      await updateDoc(jobRef, {
        ...jobDataWithoutApplicants,
        lastUpdated: new Date()
      });
      
      // Then update the job in the local state (keep applicants in state)
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === updatedJob.id ? { ...job, ...updatedJob } : job
        )
      );
      
      // Then refresh from Firestore to ensure we have the latest data
      await refreshJobs();
      
      // Increment the refresh counter to force JobList to re-render
      setRefreshCounter(prev => prev + 1);
      
      // Close the modal
      handleCloseEditModal();
    } catch (error) {
      showErrorAlert(`Failed to update job: ${error.message}`);
    }
  };

  // Function to handle closing a job
  const handleCloseJob = async (jobId) => {
    try {
      // Update only the status and lastUpdated fields in Firestore
      const jobRef = doc(db, "jobs", jobId);
      await updateDoc(jobRef, { 
        status: "Closed",
        lastUpdated: new Date()
      });
      
      // Update the job in the local state
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId ? { ...job, status: "Closed" } : job
        )
      );

      // Refresh jobs from Firestore to ensure UI is in sync with database
      await refreshJobs();
      
      // Increment refresh counter to force re-render
      setRefreshCounter(prev => prev + 1);
      
    } catch (error) {
      console.error("Error closing job:", error);
      showErrorAlert(`Failed to close job: ${error.message}`);
    }
  };

  // Function to handle opening a job
  const handleOpenJob = async (jobId) => {
    try {
      // Update only the status and lastUpdated fields in Firestore
      const jobRef = doc(db, "jobs", jobId);
      await updateDoc(jobRef, { 
        status: "Open",
        lastUpdated: new Date()
      });
      
      // Update the job in the local state
      setJobs((prevJobs) =>
        prevJobs.map((job) =>
          job.id === jobId ? { ...job, status: "Open" } : job
        )
      );

      // Refresh jobs from Firestore to ensure UI is in sync with database
      await refreshJobs();
      
      // Increment refresh counter to force re-render
      setRefreshCounter(prev => prev + 1);
      
    } catch (error) {
      console.error("Error opening job:", error);
      showErrorAlert(`Failed to open job: ${error.message}`);
    }
  };

  // Show appropriate loader based on loading state
  if (loading || isManuallyRefreshing) {
    // Check if this is a page refresh (Ctrl+R)
    const isPageRefresh = sessionStorage.getItem('isPageRefresh') === 'true';
    return <PageLoader isLoading={true} fullscreen={isPageRefresh || isManuallyRefreshing} />;
  }
  if (error) return <p>{error}</p>;

  return (
    <div className="flex-1 flex">
      {/* Left Side (Job Posts & Pagination) */}
      <div className="w-2/3 flex flex-col justify-between">
        <JobList
          key={`job-list-main-${refreshCounter}`}
          jobs={currentJobs}
          onCloseJob={handleCloseJob}
          onOpenJob={handleOpenJob}
          onEditJob={handleOpenEditModal}
          onDelete={refreshJobList} // Pass the refresh function to JobList
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
                <button
                  onClick={refreshJobList}
                  className="cursor-pointer w-full px-5 py-3 bg-green-500 text-white text-lg font-semibold rounded-lg hover:bg-green-600 transition duration-200"
                >
                  Refresh Jobs
                </button>
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
        onJobAdded={refreshJobList} // Pass the refresh function
      />

      {/* Edit Job Modal */}
      <EditJobModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        initialData={selectedJob}
        onUpdateJob={handleUpdateJob}
        onJobUpdated={refreshJobList} // Pass the refresh function
      />
    </div>
  );
};

export default Recruitment;