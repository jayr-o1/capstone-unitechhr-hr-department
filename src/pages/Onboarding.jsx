import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    setDoc,
    addDoc,
} from "firebase/firestore";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import showSuccessAlert from "../components/Alerts/SuccessAlert";
import showErrorAlert from "../components/Alerts/ErrorAlert";
import PageLoader from "../components/PageLoader";
import { auth } from "../firebase";
import { getUserData } from "../services/userService";

// Default onboarding checklist items
const defaultChecklist = [
    { id: 1, task: "Complete personal information form", completed: false },
    { id: 2, task: "Submit required documents", completed: false },
    { id: 3, task: "Review company policies", completed: false },
    { id: 4, task: "Complete IT setup", completed: false },
    { id: 5, task: "Schedule orientation", completed: false },
    { id: 6, task: "Sign employment contract", completed: false },
];

const Onboarding = () => {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [highlightedApplicant, setHighlightedApplicant] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [newTaskText, setNewTaskText] = useState("");
    const [expandedChecklists, setExpandedChecklists] = useState({});
    const location = useLocation();
    const navigate = useNavigate();

    // Function to calculate completion percentage
    const calculateProgress = (checklist) => {
        if (!checklist || checklist.length === 0) return 0;
        const completed = checklist.filter((item) => item.completed).length;
        return Math.round((completed / checklist.length) * 100);
    };

    // Handle checklist item toggle
    const handleChecklistToggle = async (
        jobId,
        applicantId,
        taskId,
        universityId = null
    ) => {
        try {
            setLoading(true);
            let applicantRef;

            // Determine which collection to update based on universityId
            if (universityId) {
                applicantRef = doc(
                    db,
                    "universities",
                    universityId,
                    "jobs",
                    jobId,
                    "applicants",
                    applicantId
                );
                console.log(
                    `Toggling checklist for university applicant: ${applicantId} in job ${jobId}`
                );
            } else {
                applicantRef = doc(
                    db,
                    "jobs",
                    jobId,
                    "applicants",
                    applicantId
                );
                console.log(
                    `Toggling checklist for global applicant: ${applicantId} in job ${jobId}`
                );
            }

            const applicantDoc = await getDoc(applicantRef);
            if (!applicantDoc.exists()) {
                throw new Error("Applicant not found");
            }

            // Get current checklist or use default if not exists
            const checklist =
                applicantDoc.data().onboardingChecklist || defaultChecklist;

            // Find and toggle task
            const updatedChecklist = checklist.map((task) => {
                if (task.id === taskId) {
                    return { ...task, completed: !task.completed };
                }
                return task;
            });

            const progress = calculateProgress(updatedChecklist);

            await updateDoc(applicantRef, {
                onboardingChecklist: updatedChecklist,
                onboardingProgress: progress,
                onboardingUpdatedAt: serverTimestamp(),
            });

            // Update local state
            setApplicants((prev) =>
                prev.map((applicant) =>
                    applicant.id === applicantId && applicant.jobId === jobId
                        ? {
                              ...applicant,
                              onboardingChecklist: updatedChecklist,
                              onboardingProgress: progress,
                          }
                        : applicant
                )
            );

            showSuccessAlert("Checklist updated successfully!");
        } catch (error) {
            console.error("Error updating checklist:", error);
            showErrorAlert("Failed to update checklist: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch applicants with "In Onboarding" status
    useEffect(() => {
        const fetchOnboardingApplicants = async () => {
            try {
                setLoading(true);
                const onboardingApplicants = [];
                const user = auth.currentUser;
                let userUniversityId = null;

                // Get the current user's university ID if available
                if (user) {
                    const userDataResult = await getUserData(user.uid);
                    if (
                        userDataResult.success &&
                        userDataResult.data.universityId
                    ) {
                        userUniversityId = userDataResult.data.universityId;
                        console.log(
                            "User belongs to university:",
                            userUniversityId
                        );
                    }
                }

                // First get applicants from global jobs collection
                console.log(
                    "Fetching onboarding applicants from global collection..."
                );
                const jobsSnapshot = await getDocs(collection(db, "jobs"));

                // For each job, get applicants in onboarding
                for (const jobDoc of jobsSnapshot.docs) {
                    const jobId = jobDoc.id;
                    const applicantsQuery = query(
                        collection(db, "jobs", jobId, "applicants"),
                        where("status", "==", "In Onboarding")
                    );

                    const applicantsSnapshot = await getDocs(applicantsQuery);
                    console.log(
                        `Found ${applicantsSnapshot.size} onboarding applicants in global job ${jobId}`
                    );

                    applicantsSnapshot.docs.forEach((doc) => {
                        onboardingApplicants.push({
                            id: doc.id,
                            jobId: jobId,
                            jobTitle: jobDoc.data().title,
                            universityId: jobDoc.data().universityId || null,
                            ...doc.data(),
                            onboardingStartedAt:
                                doc.data().onboardingStartedAt?.toDate() ||
                                new Date(),
                        });
                    });
                }

                // If user has a university ID, also check university-specific jobs
                if (userUniversityId) {
                    console.log(
                        `Fetching onboarding applicants from university ${userUniversityId} collection...`
                    );
                    const universityJobsSnapshot = await getDocs(
                        collection(db, "universities", userUniversityId, "jobs")
                    );

                    // For each university job, get applicants in onboarding
                    for (const jobDoc of universityJobsSnapshot.docs) {
                        const jobId = jobDoc.id;
                        const applicantsQuery = query(
                            collection(
                                db,
                                "universities",
                                userUniversityId,
                                "jobs",
                                jobId,
                                "applicants"
                            ),
                            where("status", "==", "In Onboarding")
                        );

                        const applicantsSnapshot = await getDocs(
                            applicantsQuery
                        );
                        console.log(
                            `Found ${applicantsSnapshot.size} onboarding applicants in university job ${jobId}`
                        );

                        applicantsSnapshot.docs.forEach((doc) => {
                            // Check if this applicant is already in the list (avoid duplicates)
                            const existingIndex =
                                onboardingApplicants.findIndex(
                                    (app) =>
                                        app.id === doc.id && app.jobId === jobId
                                );

                            if (existingIndex === -1) {
                                onboardingApplicants.push({
                                    id: doc.id,
                                    jobId: jobId,
                                    jobTitle: jobDoc.data().title,
                                    universityId: userUniversityId,
                                    ...doc.data(),
                                    onboardingStartedAt:
                                        doc
                                            .data()
                                            .onboardingStartedAt?.toDate() ||
                                        new Date(),
                                });
                            }
                        });
                    }
                }

                console.log(
                    `Total onboarding applicants found: ${onboardingApplicants.length}`
                );

                // Sort by onboarding start date (newest first)
                onboardingApplicants.sort(
                    (a, b) => b.onboardingStartedAt - a.onboardingStartedAt
                );

                setApplicants(onboardingApplicants);

                // Check if we're coming from a redirect with a new onboarding applicant
                if (
                    location.state?.newOnboarding &&
                    location.state?.applicantId
                ) {
                    setHighlightedApplicant(
                        `${location.state.jobId}-${location.state.applicantId}`
                    );

                    // Scroll to the highlighted applicant element
                    setTimeout(() => {
                        const element = document.getElementById(
                            `applicant-${location.state.jobId}-${location.state.applicantId}`
                        );
                        if (element) {
                            element.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                            });
                        }
                    }, 500);
                }
            } catch (err) {
                console.error("Error fetching onboarding applicants:", err);
                setError("Failed to load applicants. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchOnboardingApplicants();
    }, [location]);

    // Handle starting the onboarding process for an applicant
    const handleStartOnboarding = async (
        jobId,
        applicantId,
        universityId = null
    ) => {
        try {
            setLoading(true);

            let applicantRef;
            let applicantDoc;

            // Determine which collection to update based on universityId
            if (universityId) {
                applicantRef = doc(
                    db,
                    "universities",
                    universityId,
                    "jobs",
                    jobId,
                    "applicants",
                    applicantId
                );
                console.log(
                    `Starting onboarding for university applicant: ${applicantId} in job ${jobId}`
                );
            } else {
                applicantRef = doc(
                    db,
                    "jobs",
                    jobId,
                    "applicants",
                    applicantId
                );
                console.log(
                    `Starting onboarding for global applicant: ${applicantId} in job ${jobId}`
                );
            }

            applicantDoc = await getDoc(applicantRef);
            if (!applicantDoc.exists()) {
                throw new Error("Applicant not found");
            }

            // Initialize onboarding checklist if not already present
            const applicantData = applicantDoc.data();
            const onboardingChecklist =
                applicantData.onboardingChecklist || defaultChecklist;

            await updateDoc(applicantRef, {
                onboardingStatus: "In Progress",
                onboardingUpdatedAt: serverTimestamp(),
                onboardingChecklist: onboardingChecklist,
                onboardingProgress: calculateProgress(onboardingChecklist),
            });

            // Update local state
            setApplicants((prev) =>
                prev.map((applicant) =>
                    applicant.id === applicantId && applicant.jobId === jobId
                        ? {
                              ...applicant,
                              onboardingStatus: "In Progress",
                              onboardingChecklist: onboardingChecklist,
                              onboardingProgress:
                                  calculateProgress(onboardingChecklist),
                          }
                        : applicant
                )
            );

            showSuccessAlert("Onboarding process started!");
        } catch (error) {
            console.error("Error starting onboarding:", error);
            showErrorAlert(
                "Failed to start onboarding process: " + error.message
            );
        } finally {
            setLoading(false);
        }
    };

    // Complete onboarding and make applicant an employee
    const handleCompleteOnboarding = async (
        jobId,
        applicantId,
        universityId = null
    ) => {
        try {
            setLoading(true);

            let applicantRef;

            // Determine which collection to update based on universityId
            if (universityId) {
                applicantRef = doc(
                    db,
                    "universities",
                    universityId,
                    "jobs",
                    jobId,
                    "applicants",
                    applicantId
                );
                console.log(
                    `Completing onboarding for university applicant: ${applicantId} in job ${jobId}`
                );
            } else {
                applicantRef = doc(
                    db,
                    "jobs",
                    jobId,
                    "applicants",
                    applicantId
                );
                console.log(
                    `Completing onboarding for global applicant: ${applicantId} in job ${jobId}`
                );
            }

            // Get applicant data
            const applicantDoc = await getDoc(applicantRef);
            if (!applicantDoc.exists()) {
                throw new Error("Applicant not found");
            }

            const applicantData = applicantDoc.data();

            // Check if onboarding is complete
            const onboardingChecklist =
                applicantData.onboardingChecklist || defaultChecklist;
            const progress = calculateProgress(onboardingChecklist);

            if (progress < 100) {
                throw new Error(
                    "Cannot complete onboarding until all checklist items are completed"
                );
            }

            // Create employee data from applicant data
            const employeeData = {
                name: applicantData.name || "",
                email: applicantData.email || "",
                phone: applicantData.phone || "",
                position:
                    applicantData.applyingFor || applicantData.jobTitle || "",
                department: applicantData.department || "",
                salary: applicantData.salary || 0,
                dateStarted: new Date(),
                status: "New Hire",
                role: "Employee",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                onboardingCompletedAt: serverTimestamp(),
                jobId: jobId,
                formerApplicantId: applicantId,
                onboardingChecklist: applicantData.onboardingChecklist || [],
                onboardingProgress: 100,
                employeeDetails: {
                    address: applicantData.address || "",
                    dateOfBirth: applicantData.dateOfBirth || null,
                    emergencyContact: applicantData.emergencyContact || "",
                    emergencyContactPhone:
                        applicantData.emergencyContactPhone || "",
                },
                universityId: universityId || null,
            };

            let newEmployeeDoc;

            // Add employee to the main database (for backwards compatibility)
            const mainEmployeesRef = collection(db, "employees");
            newEmployeeDoc = await addDoc(mainEmployeesRef, employeeData);
            console.log(
                "Created new employee in main collection with ID:",
                newEmployeeDoc.id
            );

            // If this is a university applicant, also add to university's employees subcollection
            if (universityId) {
                const universityEmployeesRef = doc(
                    db,
                    "universities",
                    universityId,
                    "employees",
                    newEmployeeDoc.id
                );

                // Use the same ID from the main collection
                await setDoc(universityEmployeesRef, {
                    ...employeeData,
                    // Add employeeId field which the Employees page expects
                    employeeId: newEmployeeDoc.id,
                });

                console.log(
                    "Created new employee in university collection with ID:",
                    newEmployeeDoc.id
                );
            }

            // Update the applicant's status to reflect completion
            await updateDoc(applicantRef, {
                status: "Hired",
                onboardingStatus: "Completed",
                onboardingCompletedAt: serverTimestamp(),
                employeeId: newEmployeeDoc.id,
                updatedAt: serverTimestamp(),
            });

            // Update local state
            setApplicants((prev) =>
                prev.filter(
                    (applicant) =>
                        !(
                            applicant.id === applicantId &&
                            applicant.jobId === jobId
                        )
                )
            );

            showSuccessAlert("Onboarding completed! Employee record created.");

            // Navigate to employees page
            setTimeout(() => {
                navigate("/employees");
            }, 2000);
        } catch (error) {
            console.error("Error completing onboarding:", error);
            showErrorAlert(
                "Failed to complete onboarding process: " + error.message
            );
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format dates
    const formatDate = (date) => {
        if (!date) return "Not started";

        try {
            const dateObj = date instanceof Date ? date : new Date(date);

            if (isNaN(dateObj.getTime())) {
                return "Invalid date";
            }

            return dateObj.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch (error) {
            console.error("Error formatting date:", error);
            return "Invalid date";
        }
    };

    // Check if this is a page refresh
    const isPageRefresh =
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("isPageRefresh") === "true";

    // Add new task to checklist
    const handleAddTask = async (jobId, applicantId, universityId = null) => {
        if (!newTaskText.trim()) {
            showErrorAlert("Task text cannot be empty");
            return;
        }

        try {
            setLoading(true);
            let applicantRef;

            // Determine which collection to update based on universityId
            if (universityId) {
                applicantRef = doc(
                    db,
                    "universities",
                    universityId,
                    "jobs",
                    jobId,
                    "applicants",
                    applicantId
                );
                console.log(
                    `Adding task for university applicant: ${applicantId} in job ${jobId}`
                );
            } else {
                applicantRef = doc(
                    db,
                    "jobs",
                    jobId,
                    "applicants",
                    applicantId
                );
                console.log(
                    `Adding task for global applicant: ${applicantId} in job ${jobId}`
                );
            }

            const applicantDoc = await getDoc(applicantRef);
            if (!applicantDoc.exists()) {
                throw new Error("Applicant not found");
            }

            // Get current checklist or use default if not exists
            const checklist =
                applicantDoc.data().onboardingChecklist || defaultChecklist;

            // Generate a unique task ID
            const newTaskId =
                Math.max(0, ...checklist.map((task) => task.id)) + 1;

            // Add new task
            const updatedChecklist = [
                ...checklist,
                { id: newTaskId, task: newTaskText, completed: false },
            ];

            const progress = calculateProgress(updatedChecklist);

            await updateDoc(applicantRef, {
                onboardingChecklist: updatedChecklist,
                onboardingProgress: progress,
                onboardingUpdatedAt: serverTimestamp(),
            });

            // Update local state
            setApplicants((prev) =>
                prev.map((applicant) =>
                    applicant.id === applicantId && applicant.jobId === jobId
                        ? {
                              ...applicant,
                              onboardingChecklist: updatedChecklist,
                              onboardingProgress: progress,
                          }
                        : applicant
                )
            );

            // Reset new task text
            setNewTaskText("");
            setEditingTask(null);

            showSuccessAlert("Task added successfully!");
        } catch (error) {
            console.error("Error adding task:", error);
            showErrorAlert("Failed to add task: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Delete task from checklist
    const handleDeleteTask = async (
        jobId,
        applicantId,
        taskId,
        universityId = null
    ) => {
        // Ask for confirmation before deleting
        if (!window.confirm("Are you sure you want to delete this task?")) {
            return;
        }

        try {
            setLoading(true);
            let applicantRef;

            // Determine which collection to update based on universityId
            if (universityId) {
                applicantRef = doc(
                    db,
                    "universities",
                    universityId,
                    "jobs",
                    jobId,
                    "applicants",
                    applicantId
                );
                console.log(
                    `Deleting task for university applicant: ${applicantId} in job ${jobId}`
                );
            } else {
                applicantRef = doc(
                    db,
                    "jobs",
                    jobId,
                    "applicants",
                    applicantId
                );
                console.log(
                    `Deleting task for global applicant: ${applicantId} in job ${jobId}`
                );
            }

            const applicantDoc = await getDoc(applicantRef);
            if (!applicantDoc.exists()) {
                throw new Error("Applicant not found");
            }

            // Get current checklist
            const checklist =
                applicantDoc.data().onboardingChecklist || defaultChecklist;

            // Remove the specified task
            const updatedChecklist = checklist.filter(
                (task) => task.id !== taskId
            );

            // Calculate new progress
            const progress = calculateProgress(updatedChecklist);

            await updateDoc(applicantRef, {
                onboardingChecklist: updatedChecklist,
                onboardingProgress: progress,
                onboardingUpdatedAt: serverTimestamp(),
            });

            // Update local state
            setApplicants((prev) =>
                prev.map((applicant) =>
                    applicant.id === applicantId && applicant.jobId === jobId
                        ? {
                              ...applicant,
                              onboardingChecklist: updatedChecklist,
                              onboardingProgress: progress,
                          }
                        : applicant
                )
            );

            showSuccessAlert("Task deleted successfully!");
        } catch (error) {
            console.error("Error deleting task:", error);
            showErrorAlert("Failed to delete task: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Edit task in checklist
    const handleEditTask = async (
        jobId,
        applicantId,
        taskId,
        newText,
        universityId = null
    ) => {
        if (!newText.trim()) {
            showErrorAlert("Task text cannot be empty");
            return;
        }

        try {
            setLoading(true);
            let applicantRef;

            // Determine which collection to update based on universityId
            if (universityId) {
                applicantRef = doc(
                    db,
                    "universities",
                    universityId,
                    "jobs",
                    jobId,
                    "applicants",
                    applicantId
                );
                console.log(
                    `Editing task for university applicant: ${applicantId} in job ${jobId}`
                );
            } else {
                applicantRef = doc(
                    db,
                    "jobs",
                    jobId,
                    "applicants",
                    applicantId
                );
                console.log(
                    `Editing task for global applicant: ${applicantId} in job ${jobId}`
                );
            }

            const applicantDoc = await getDoc(applicantRef);
            if (!applicantDoc.exists()) {
                throw new Error("Applicant not found");
            }

            // Get current checklist
            const checklist =
                applicantDoc.data().onboardingChecklist || defaultChecklist;

            // Update task text while preserving completion status
            const updatedChecklist = checklist.map((task) => {
                if (task.id === taskId) {
                    return { ...task, task: newText };
                }
                return task;
            });

            const progress = calculateProgress(updatedChecklist);

            await updateDoc(applicantRef, {
                onboardingChecklist: updatedChecklist,
                onboardingProgress: progress,
                onboardingUpdatedAt: serverTimestamp(),
            });

            // Update local state
            setApplicants((prev) =>
                prev.map((applicant) =>
                    applicant.id === applicantId && applicant.jobId === jobId
                        ? {
                              ...applicant,
                              onboardingChecklist: updatedChecklist,
                              onboardingProgress: progress,
                          }
                        : applicant
                )
            );

            // Reset editing state
            setEditingTask(null);
            setNewTaskText("");

            showSuccessAlert("Task updated successfully!");
        } catch (error) {
            console.error("Error updating task:", error);
            showErrorAlert("Failed to update task: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Toggle checklist expansion
    const toggleChecklist = (applicantId) => {
        setExpandedChecklists((prev) => ({
            ...prev,
            [applicantId]: !prev[applicantId],
        }));
    };

    // Show PageLoader during loading state
    if (loading) {
        return (
            <PageLoader
                isLoading={true}
                fullscreen={isPageRefresh}
                contentOnly={!isPageRefresh}
            />
        );
    }

    if (error)
        return (
            <div className="text-center py-10">
                <p className="text-red-500">{error}</p>
            </div>
        );

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                    Applicant Onboarding
                </h1>
                <p className="text-gray-600">
                    Manage and track applicants in the onboarding process
                </p>
            </div>

            {loading ? (
                <PageLoader text="Loading onboarding information..." />
            ) : error ? (
                <div className="p-4 bg-red-100 text-red-700 rounded-md">
                    Error: {error}
                </div>
            ) : applicants.length === 0 ? (
                <div className="p-8 bg-gray-50 rounded-lg text-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 mx-auto text-gray-400 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">
                        No applicants in the onboarding process
                    </h3>
                    <p className="text-gray-600 mb-4">
                        When applicants are hired, they will appear here to
                        complete the onboarding process.
                    </p>
                    <button
                        onClick={() => navigate("/recruitment")}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        Go to Recruitment
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {applicants.map((applicant) => (
                        <div
                            key={`${applicant.jobId}-${applicant.id}`}
                            className={`
                                bg-white rounded-lg shadow-md overflow-hidden border-t-4
                                ${
                                    applicant.onboardingStatus === "Not Started"
                                        ? "border-yellow-500"
                                        : applicant.onboardingStatus ===
                                          "In Progress"
                                        ? "border-blue-500"
                                        : "border-green-500"
                                }
                                ${
                                    highlightedApplicant === applicant.id
                                        ? "ring-2 ring-indigo-500"
                                        : ""
                                }
                            `}
                        >
                            <div className="p-4 border-b">
                                <div className="font-medium text-gray-800 text-lg mb-1">
                                    {applicant.name}
                                </div>
                                <div className="text-sm text-gray-600 mb-2">
                                    {applicant.jobTitle || "Unknown position"}
                                </div>
                                <div className="flex items-center justify-between">
                                    <span
                                        className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${
                                            applicant.onboardingStatus ===
                                            "Not Started"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : applicant.onboardingStatus ===
                                                  "In Progress"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-green-100 text-green-800"
                                        }`}
                                    >
                                        {applicant.onboardingStatus ||
                                            "Not Started"}
                                    </span>
                                    <div className="text-sm text-gray-600">
                                        {applicant.onboardingProgress || 0}%
                                        complete
                                    </div>
                                </div>
                            </div>

                            <div className="p-4">
                                <div className="h-4 bg-gray-200 rounded-full mb-4">
                                    <div
                                        className={`h-4 rounded-full ${
                                            applicant.onboardingProgress ||
                                            0 < 50
                                                ? "bg-yellow-500"
                                                : (applicant.onboardingProgress ||
                                                      0) < 100
                                                ? "bg-blue-500"
                                                : "bg-green-500"
                                        }`}
                                        style={{
                                            width: `${
                                                applicant.onboardingProgress ||
                                                0
                                            }%`,
                                        }}
                                    ></div>
                                </div>

                                <div className="mb-4">
                                    <div className="text-sm font-medium text-gray-600 mb-2">
                                        Onboarding Started
                                    </div>
                                    <div className="text-gray-800">
                                        {formatDate(
                                            applicant.onboardingStartedAt
                                        )}
                                    </div>
                                </div>

                                <div className="flex space-x-2 mb-4">
                                    {applicant.onboardingStatus ===
                                        "Not Started" && (
                                        <button
                                            onClick={() =>
                                                handleStartOnboarding(
                                                    applicant.jobId,
                                                    applicant.id,
                                                    applicant.universityId
                                                )
                                            }
                                            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 transition-colors flex-1"
                                            disabled={loading}
                                        >
                                            Start Onboarding
                                        </button>
                                    )}

                                    {applicant.onboardingStatus ===
                                        "In Progress" && (
                                        <button
                                            onClick={() =>
                                                handleCompleteOnboarding(
                                                    applicant.jobId,
                                                    applicant.id,
                                                    applicant.universityId
                                                )
                                            }
                                            className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 transition-colors flex-1"
                                            disabled={
                                                loading ||
                                                applicant.onboardingProgress <
                                                    100
                                            }
                                        >
                                            Complete Onboarding
                                        </button>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-gray-800">
                                            Onboarding Checklist
                                        </span>
                                        <button
                                            onClick={() =>
                                                toggleChecklist(applicant.id)
                                            }
                                            className="text-gray-600 hover:text-gray-800"
                                        >
                                            {expandedChecklists[
                                                applicant.id
                                            ] ? (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    </div>

                                    {expandedChecklists[applicant.id] && (
                                        <div className="mt-2 space-y-2">
                                            {(
                                                applicant.onboardingChecklist ||
                                                defaultChecklist
                                            ).map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between group"
                                                >
                                                    <div className="flex items-center flex-1">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                item.completed
                                                            }
                                                            onChange={() =>
                                                                handleChecklistToggle(
                                                                    applicant.jobId,
                                                                    applicant.id,
                                                                    item.id,
                                                                    applicant.universityId
                                                                )
                                                            }
                                                            className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                            disabled={
                                                                loading ||
                                                                applicant.onboardingStatus ===
                                                                    "Not Started"
                                                            }
                                                        />
                                                        <div className="ml-3 text-sm flex-1">
                                                            {editingTask ===
                                                            item.id ? (
                                                                <div className="flex">
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            newTaskText
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            setNewTaskText(
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        className="border rounded px-2 py-1 text-sm flex-1 mr-2"
                                                                        autoFocus
                                                                    />
                                                                    <button
                                                                        onClick={() =>
                                                                            handleEditTask(
                                                                                applicant.jobId,
                                                                                applicant.id,
                                                                                item.id,
                                                                                newTaskText,
                                                                                applicant.universityId
                                                                            )
                                                                        }
                                                                        className="bg-green-600 text-white px-2 py-1 rounded text-xs"
                                                                        disabled={
                                                                            loading
                                                                        }
                                                                    >
                                                                        Save
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <span
                                                                    className={`${
                                                                        item.completed
                                                                            ? "line-through text-gray-500"
                                                                            : "text-gray-700"
                                                                    }`}
                                                                >
                                                                    {item.task}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {editingTask !==
                                                        item.id && (
                                                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingTask(
                                                                        item.id
                                                                    );
                                                                    setNewTaskText(
                                                                        item.task
                                                                    );
                                                                }}
                                                                className="text-gray-500 hover:text-blue-600"
                                                                disabled={
                                                                    loading ||
                                                                    applicant.onboardingStatus ===
                                                                        "Not Started"
                                                                }
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-4 w-4"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                                    />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteTask(
                                                                        applicant.jobId,
                                                                        applicant.id,
                                                                        item.id,
                                                                        applicant.universityId
                                                                    )
                                                                }
                                                                className="text-gray-500 hover:text-red-600"
                                                                disabled={
                                                                    loading ||
                                                                    applicant.onboardingStatus ===
                                                                        "Not Started"
                                                                }
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="h-4 w-4"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Add new task input */}
                                            {applicant.onboardingStatus ===
                                                "In Progress" && (
                                                <div className="flex items-center mt-3">
                                                    <input
                                                        type="text"
                                                        value={newTaskText}
                                                        onChange={(e) =>
                                                            setNewTaskText(
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="Add new task..."
                                                        className="flex-1 border rounded px-3 py-1 text-sm mr-2"
                                                        disabled={loading}
                                                    />
                                                    <button
                                                        onClick={() =>
                                                            handleAddTask(
                                                                applicant.jobId,
                                                                applicant.id,
                                                                applicant.universityId
                                                            )
                                                        }
                                                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                                                        disabled={
                                                            loading ||
                                                            !newTaskText.trim()
                                                        }
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Onboarding;
