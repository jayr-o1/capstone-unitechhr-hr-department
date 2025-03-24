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
    const handleChecklistToggle = async (jobId, applicantId, taskId) => {
        try {
            const applicantRef = doc(
                db,
                "jobs",
                jobId,
                "applicants",
                applicantId
            );
            const applicantDoc = await getDoc(applicantRef);

            if (!applicantDoc.exists()) return;

            const currentChecklist =
                applicantDoc.data().onboardingChecklist || defaultChecklist;
            const updatedChecklist = currentChecklist.map((item) =>
                item.id === taskId
                    ? { ...item, completed: !item.completed }
                    : item
            );

            await updateDoc(applicantRef, {
                onboardingChecklist: updatedChecklist,
                onboardingProgress: calculateProgress(updatedChecklist),
            });

            // Update local state
            setApplicants((prevApplicants) =>
                prevApplicants.map((applicant) =>
                    applicant.id === applicantId && applicant.jobId === jobId
                        ? {
                              ...applicant,
                              onboardingChecklist: updatedChecklist,
                              onboardingProgress:
                                  calculateProgress(updatedChecklist),
                          }
                        : applicant
                )
            );

            showSuccessAlert("Checklist updated successfully!");
        } catch (error) {
            console.error("Error updating checklist:", error);
            showErrorAlert("Failed to update checklist");
        }
    };

    // Fetch applicants with "In Onboarding" status
    useEffect(() => {
        const fetchOnboardingApplicants = async () => {
            try {
                setLoading(true);
                const onboardingApplicants = [];

                // Get all jobs
                const jobsSnapshot = await getDocs(collection(db, "jobs"));

                // For each job, get applicants in onboarding
                for (const jobDoc of jobsSnapshot.docs) {
                    const jobId = jobDoc.id;
                    const applicantsQuery = query(
                        collection(db, "jobs", jobId, "applicants"),
                        where("status", "==", "In Onboarding")
                    );

                    const applicantsSnapshot = await getDocs(applicantsQuery);

                    applicantsSnapshot.docs.forEach((doc) => {
                        onboardingApplicants.push({
                            id: doc.id,
                            jobId: jobId,
                            jobTitle: jobDoc.data().title,
                            ...doc.data(),
                            onboardingStartedAt:
                                doc.data().onboardingStartedAt?.toDate() ||
                                new Date(),
                        });
                    });
                }

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
    const handleStartOnboarding = async (jobId, applicantId) => {
        try {
            const applicantRef = doc(
                db,
                "jobs",
                jobId,
                "applicants",
                applicantId
            );

            await updateDoc(applicantRef, {
                onboardingStatus: "In Progress",
                onboardingUpdatedAt: serverTimestamp(),
            });

            // Update the local state
            setApplicants((prevApplicants) =>
                prevApplicants.map((applicant) =>
                    applicant.id === applicantId && applicant.jobId === jobId
                        ? { ...applicant, onboardingStatus: "In Progress" }
                        : applicant
                )
            );

            showSuccessAlert("Onboarding process started!");
        } catch (error) {
            console.error("Error starting onboarding:", error);
            showErrorAlert("Failed to start onboarding process");
        }
    };

    // Complete onboarding and make applicant an employee
    const handleCompleteOnboarding = async (jobId, applicantId) => {
        try {
            const applicantRef = doc(
                db,
                "jobs",
                jobId,
                "applicants",
                applicantId
            );
            const applicantDoc = await getDoc(applicantRef);

            if (!applicantDoc.exists()) {
                throw new Error("Applicant not found");
            }

            const applicantData = applicantDoc.data();

            // Create employee document in employees collection
            const employeesRef = collection(db, "employees");
            const employeeData = {
                name: applicantData.name,
                email: applicantData.email,
                phone: applicantData.phone || "",
                position:
                    applicantData.applyingFor || applicantData.jobTitle || "",
                department: applicantData.department || "",
                dateHired: serverTimestamp(),
                status: "New Hire",
                employeeId: `EMP${Date.now()}`, // Generate unique employee ID
                salary: applicantData.offeredSalary || "",
                onboardingCompletedAt: serverTimestamp(),
                // Include checklist completion data
                onboardingChecklist: applicantData.onboardingChecklist || [],
                onboardingProgress: 100,
                // Additional employee information
                emergencyContact: applicantData.emergencyContact || {},
                documents: applicantData.documents || [],
                bankDetails: applicantData.bankDetails || {},
                // Track the original application
                originalApplication: {
                    jobId: jobId,
                    applicantId: applicantId,
                    applicationDate:
                        applicantData.appliedAt || serverTimestamp(),
                },
            };

            // Add to employees collection
            const newEmployeeRef = await addDoc(employeesRef, employeeData);

            // Update applicant document
            await updateDoc(applicantRef, {
                status: "Hired",
                onboardingStatus: "Completed",
                onboardingCompletedAt: serverTimestamp(),
                isEmployee: true,
                employeeId: employeeData.employeeId,
                employeeDocId: newEmployeeRef.id,
            });

            // Update the local state
            setApplicants((prevApplicants) =>
                prevApplicants.filter(
                    (applicant) =>
                        !(
                            applicant.id === applicantId &&
                            applicant.jobId === jobId
                        )
                )
            );

            showSuccessAlert(
                "Applicant successfully hired and added to employees!"
            );

            // Optional: Navigate to the employees page
            setTimeout(() => {
                navigate("/employees");
            }, 2000);
        } catch (error) {
            console.error("Error completing onboarding:", error);
            showErrorAlert(
                "Failed to complete onboarding process: " + error.message
            );
        }
    };

    // Format date for display
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Check if this is a page refresh
    const isPageRefresh =
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("isPageRefresh") === "true";

    // Add new task to checklist
    const handleAddTask = async (jobId, applicantId) => {
        if (!newTaskText.trim()) return;

        try {
            const applicantRef = doc(
                db,
                "jobs",
                jobId,
                "applicants",
                applicantId
            );
            const applicantDoc = await getDoc(applicantRef);

            if (!applicantDoc.exists()) return;

            const currentChecklist =
                applicantDoc.data().onboardingChecklist || defaultChecklist;
            const newTask = {
                id: Date.now(), // Use timestamp as unique ID
                task: newTaskText.trim(),
                completed: false,
            };

            const updatedChecklist = [...currentChecklist, newTask];

            await updateDoc(applicantRef, {
                onboardingChecklist: updatedChecklist,
            });

            // Update local state
            setApplicants((prevApplicants) =>
                prevApplicants.map((applicant) =>
                    applicant.id === applicantId && applicant.jobId === jobId
                        ? {
                              ...applicant,
                              onboardingChecklist: updatedChecklist,
                          }
                        : applicant
                )
            );

            setNewTaskText("");
            showSuccessAlert("New task added successfully!");
        } catch (error) {
            console.error("Error adding task:", error);
            showErrorAlert("Failed to add new task");
        }
    };

    // Delete task from checklist
    const handleDeleteTask = async (jobId, applicantId, taskId) => {
        try {
            const applicantRef = doc(
                db,
                "jobs",
                jobId,
                "applicants",
                applicantId
            );
            const applicantDoc = await getDoc(applicantRef);

            if (!applicantDoc.exists()) return;

            const currentChecklist =
                applicantDoc.data().onboardingChecklist || defaultChecklist;
            const updatedChecklist = currentChecklist.filter(
                (item) => item.id !== taskId
            );

            await updateDoc(applicantRef, {
                onboardingChecklist: updatedChecklist,
                onboardingProgress: calculateProgress(updatedChecklist),
            });

            // Update local state
            setApplicants((prevApplicants) =>
                prevApplicants.map((applicant) =>
                    applicant.id === applicantId && applicant.jobId === jobId
                        ? {
                              ...applicant,
                              onboardingChecklist: updatedChecklist,
                              onboardingProgress:
                                  calculateProgress(updatedChecklist),
                          }
                        : applicant
                )
            );

            showSuccessAlert("Task deleted successfully!");
        } catch (error) {
            console.error("Error deleting task:", error);
            showErrorAlert("Failed to delete task");
        }
    };

    // Edit task in checklist
    const handleEditTask = async (jobId, applicantId, taskId, newText) => {
        try {
            const applicantRef = doc(
                db,
                "jobs",
                jobId,
                "applicants",
                applicantId
            );
            const applicantDoc = await getDoc(applicantRef);

            if (!applicantDoc.exists()) return;

            const currentChecklist =
                applicantDoc.data().onboardingChecklist || defaultChecklist;
            const updatedChecklist = currentChecklist.map((item) =>
                item.id === taskId ? { ...item, task: newText } : item
            );

            await updateDoc(applicantRef, {
                onboardingChecklist: updatedChecklist,
            });

            // Update local state
            setApplicants((prevApplicants) =>
                prevApplicants.map((applicant) =>
                    applicant.id === applicantId && applicant.jobId === jobId
                        ? {
                              ...applicant,
                              onboardingChecklist: updatedChecklist,
                          }
                        : applicant
                )
            );

            setEditingTask(null);
            showSuccessAlert("Task updated successfully!");
        } catch (error) {
            console.error("Error updating task:", error);
            showErrorAlert("Failed to update task");
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
        return <PageLoader isLoading={true} fullscreen={isPageRefresh} />;
    }

    if (error)
        return (
            <div className="text-center py-10">
                <p className="text-red-500">{error}</p>
            </div>
        );

    return (
        <div className="p-6 bg-white shadow-md rounded-lg">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-300">
                <h1 className="text-3xl font-bold text-gray-900">
                    Applicant Onboarding
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                    Manage and track applicants in the onboarding process
                </p>
            </div>

            {/* Content Section */}
            <div className="p-6">
                {applicants.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-8 h-8 text-gray-400"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                                />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-lg">
                            No applicants in the onboarding process
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {applicants.map((applicant) => (
                            <div
                                key={`${applicant.jobId}-${applicant.id}`}
                                id={`applicant-${applicant.jobId}-${applicant.id}`}
                                className={`border border-gray-300 rounded-lg shadow-sm transition-all ${
                                    highlightedApplicant ===
                                    `${applicant.jobId}-${applicant.id}`
                                        ? "ring-2 ring-blue-500 transform scale-[1.02]"
                                        : ""
                                }`}
                            >
                                <div className="p-6">
                                    {/* Applicant Header */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h2 className="text-xl font-semibold text-gray-900">
                                                {applicant.name}
                                            </h2>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {applicant.applyingFor ||
                                                    "Position N/A"}{" "}
                                                •{" "}
                                                {applicant.jobTitle ||
                                                    "Job N/A"}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                applicant.onboardingStatus ===
                                                "In Progress"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                            }`}
                                        >
                                            {applicant.onboardingStatus ||
                                                "Not Started"}
                                        </span>
                                    </div>

                                    {/* Progress and Details Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                        {/* Progress Donut Chart */}
                                        <div className="flex flex-col items-center justify-center border-r border-gray-200 pr-6">
                                            <div className="w-32 h-32 relative">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-2xl font-bold text-gray-900">
                                                        {applicant.onboardingProgress ||
                                                            0}
                                                        %
                                                    </span>
                                                </div>
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                {
                                                                    value:
                                                                        applicant.onboardingProgress ||
                                                                        0,
                                                                },
                                                                {
                                                                    value:
                                                                        100 -
                                                                        (applicant.onboardingProgress ||
                                                                            0),
                                                                },
                                                            ]}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={32}
                                                            outerRadius={40}
                                                            startAngle={90}
                                                            endAngle={-270}
                                                            dataKey="value"
                                                        >
                                                            <Cell fill="#4F46E5" />
                                                            <Cell fill="#E5E7EB" />
                                                        </Pie>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-2">
                                                Completion Progress
                                            </p>
                                        </div>

                                        {/* Applicant Details */}
                                        <div className="col-span-3 grid grid-cols-3 gap-6">
                                            <div className="border-r border-gray-200 pr-6">
                                                <p className="text-sm text-gray-500">
                                                    Email
                                                </p>
                                                <p className="font-medium text-gray-900">
                                                    {applicant.email || "N/A"}
                                                </p>
                                            </div>
                                            <div className="border-r border-gray-200 pr-6">
                                                <p className="text-sm text-gray-500">
                                                    Phone
                                                </p>
                                                <p className="font-medium text-gray-900">
                                                    {applicant.phone || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    Onboarding Started
                                                </p>
                                                <p className="font-medium text-gray-900">
                                                    {new Date(
                                                        applicant.onboardingStartedAt
                                                    ).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                        }
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Checklist Section */}
                                    <div className="border-t border-gray-200 pt-6 mt-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Onboarding Checklist
                                            </h3>
                                            <button
                                                onClick={() =>
                                                    toggleChecklist(
                                                        `${applicant.jobId}-${applicant.id}`
                                                    )
                                                }
                                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                                            >
                                                <span>
                                                    {expandedChecklists[
                                                        `${applicant.jobId}-${applicant.id}`
                                                    ]
                                                        ? "Collapse"
                                                        : "Expand"}
                                                </span>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                    className={`w-4 h-4 transition-transform duration-200 ${
                                                        expandedChecklists[
                                                            `${applicant.jobId}-${applicant.id}`
                                                        ]
                                                            ? "rotate-180"
                                                            : ""
                                                    }`}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                                                    />
                                                </svg>
                                            </button>
                                        </div>

                                        <div
                                            className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                                expandedChecklists[
                                                    `${applicant.jobId}-${applicant.id}`
                                                ]
                                                    ? "max-h-[1000px] opacity-100"
                                                    : "max-h-0 opacity-0"
                                            }`}
                                        >
                                            {/* Add New Task Input */}
                                            <div className="flex gap-2 mb-4">
                                                <input
                                                    type="text"
                                                    value={newTaskText}
                                                    onChange={(e) =>
                                                        setNewTaskText(
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Add new task..."
                                                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleAddTask(
                                                            applicant.jobId,
                                                            applicant.id
                                                        )
                                                    }
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                                    disabled={
                                                        !newTaskText.trim()
                                                    }
                                                >
                                                    Add Task
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(
                                                    applicant.onboardingChecklist ||
                                                    defaultChecklist
                                                ).map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg group"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                item.completed
                                                            }
                                                            onChange={() =>
                                                                handleChecklistToggle(
                                                                    applicant.jobId,
                                                                    applicant.id,
                                                                    item.id
                                                                )
                                                            }
                                                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                        />
                                                        {editingTask ===
                                                        item.id ? (
                                                            <input
                                                                type="text"
                                                                defaultValue={
                                                                    item.task
                                                                }
                                                                className="flex-1 p-1 border border-gray-300 rounded"
                                                                onBlur={(e) => {
                                                                    handleEditTask(
                                                                        applicant.jobId,
                                                                        applicant.id,
                                                                        item.id,
                                                                        e.target
                                                                            .value
                                                                    );
                                                                }}
                                                                onKeyDown={(
                                                                    e
                                                                ) => {
                                                                    if (
                                                                        e.key ===
                                                                        "Enter"
                                                                    ) {
                                                                        handleEditTask(
                                                                            applicant.jobId,
                                                                            applicant.id,
                                                                            item.id,
                                                                            e
                                                                                .target
                                                                                .value
                                                                        );
                                                                    }
                                                                }}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <>
                                                                <span
                                                                    className={`flex-1 text-sm ${
                                                                        item.completed
                                                                            ? "text-gray-500 line-through"
                                                                            : "text-gray-900"
                                                                    }`}
                                                                >
                                                                    {item.task}
                                                                </span>
                                                                <div className="hidden group-hover:flex gap-2">
                                                                    <button
                                                                        onClick={() =>
                                                                            setEditingTask(
                                                                                item.id
                                                                            )
                                                                        }
                                                                        className="p-1 text-gray-600 hover:text-blue-600"
                                                                    >
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                            strokeWidth={
                                                                                1.5
                                                                            }
                                                                            stroke="currentColor"
                                                                            className="w-4 h-4"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() =>
                                                                            handleDeleteTask(
                                                                                applicant.jobId,
                                                                                applicant.id,
                                                                                item.id
                                                                            )
                                                                        }
                                                                        className="p-1 text-gray-600 hover:text-red-600"
                                                                    >
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                            strokeWidth={
                                                                                1.5
                                                                            }
                                                                            stroke="currentColor"
                                                                            className="w-4 h-4"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Show summary when collapsed */}
                                        {!expandedChecklists[
                                            `${applicant.jobId}-${applicant.id}`
                                        ] && (
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span>
                                                    {
                                                        (
                                                            applicant.onboardingChecklist ||
                                                            defaultChecklist
                                                        ).length
                                                    }{" "}
                                                    tasks total
                                                </span>
                                                <span>•</span>
                                                <span>
                                                    {
                                                        (
                                                            applicant.onboardingChecklist ||
                                                            defaultChecklist
                                                        ).filter(
                                                            (item) =>
                                                                item.completed
                                                        ).length
                                                    }{" "}
                                                    completed
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                                        {applicant.onboardingStatus ===
                                        "Not Started" ? (
                                            <button
                                                onClick={() =>
                                                    handleStartOnboarding(
                                                        applicant.jobId,
                                                        applicant.id
                                                    )
                                                }
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                            >
                                                Start Onboarding
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() =>
                                                    handleCompleteOnboarding(
                                                        applicant.jobId,
                                                        applicant.id
                                                    )
                                                }
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                                                disabled={
                                                    applicant.onboardingProgress !==
                                                    100
                                                }
                                            >
                                                Complete & Hire
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Onboarding;
