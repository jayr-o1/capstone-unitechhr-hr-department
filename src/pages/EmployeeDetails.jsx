import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";
import { db, storage, auth } from "../firebase";
import { getUserData } from "../services/userService";
import PageLoader from "../components/PageLoader";
import showSuccessAlert from "../components/Alerts/SuccessAlert";
import showErrorAlert from "../components/Alerts/ErrorAlert";
import showWarningAlert from "../components/Alerts/WarningAlert";
import showDeleteConfirmation from "../components/Alerts/DeleteAlert";
import EditEmployeeModal from "../components/Modals/EditEmployeeModal";

const EmployeeDetails = () => {
    const { employeeId } = useParams();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [newNote, setNewNote] = useState("");
    const [universityId, setUniversityId] = useState(null);

    // Document upload states
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [documentType, setDocumentType] = useState("resume");
    const [documentDescription, setDocumentDescription] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDocumentFormOpen, setIsDocumentFormOpen] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);

    // Skills section states
    const [isAddingSkill, setIsAddingSkill] = useState(false);
    const [editingSkill, setEditingSkill] = useState(null);
    const [skillForm, setSkillForm] = useState({
        name: "",
        category: "technical",
        proficiency: 50,
        notes: "",
    });

    // Get current user's university ID
    useEffect(() => {
        const getCurrentUserUniversity = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    setError("You must be logged in to access this page");
                    setLoading(false);
                    return;
                }

                // Get user data to find university ID
                const userDataResult = await getUserData(user.uid);
                if (
                    userDataResult.success &&
                    userDataResult.data.universityId
                ) {
                    setUniversityId(userDataResult.data.universityId);
                    console.log(
                        "User belongs to university:",
                        userDataResult.data.universityId
                    );
                } else {
                    setError("You don't have permission to access this page");
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error getting user's university:", error);
                setError("Failed to verify your permissions");
                setLoading(false);
            }
        };

        getCurrentUserUniversity();
    }, []);

    // Fetch employee data
    useEffect(() => {
        const fetchEmployee = async () => {
            if (!universityId) return;

            try {
                setLoading(true);
                const employeeRef = doc(
                    db,
                    "universities",
                    universityId,
                    "employees",
                    employeeId
                );
                const employeeDoc = await getDoc(employeeRef);

                if (employeeDoc.exists()) {
                    const employeeData = employeeDoc.data();
                    setEmployee({
                        id: employeeDoc.id,
                        ...employeeData,
                        // Ensure documents array is initialized
                        documents: employeeData.documents || [],
                        // Ensure notes array is initialized
                        notes: employeeData.notes || [],
                        dateHired:
                            employeeData.dateHired?.toDate?.() || new Date(),
                    });
                } else {
                    setError("Employee not found in your university");
                }
            } catch (err) {
                console.error("Error fetching employee:", err);
                setError(
                    "Failed to load employee data. Please try again later."
                );
            } finally {
                setLoading(false);
            }
        };

        if (universityId && employeeId) {
            fetchEmployee();
        }
    }, [employeeId, universityId]);

    // Handle status change
    const handleStatusChange = (newStatus) => {
        showWarningAlert(
            `Are you sure you want to change the status to ${newStatus}?`,
            async () => {
                try {
                    const employeeRef = doc(
                        db,
                        "universities",
                        universityId,
                        "employees",
                        employeeId
                    );
                    await updateDoc(employeeRef, {
                        status: newStatus,
                        lastUpdated: new Date(),
                    });

                    // Update local state
                    setEmployee((prev) => ({
                        ...prev,
                        status: newStatus,
                        lastUpdated: new Date(),
                    }));

                    showSuccessAlert(
                        `Status updated successfully to ${newStatus}`
                    );
                } catch (error) {
                    showErrorAlert(`Failed to update status: ${error.message}`);
                }
            },
            "Yes, change status",
            "Cancel"
        );
    };

    // Handle adding a note
    const handleAddNote = async () => {
        if (!newNote.trim() || !universityId) return;

        try {
            const employeeRef = doc(
                db,
                "universities",
                universityId,
                "employees",
                employeeId
            );
            const notes = employee.notes || [];
            const updatedNotes = [
                ...notes,
                {
                    id: Date.now().toString(),
                    content: newNote.trim(),
                    createdAt: new Date(),
                },
            ];

            await updateDoc(employeeRef, {
                notes: updatedNotes,
                lastUpdated: new Date(),
            });

            // Update local state
            setEmployee((prev) => ({
                ...prev,
                notes: updatedNotes,
                lastUpdated: new Date(),
            }));

            setNewNote("");
            setIsAddingNote(false);
            showSuccessAlert("Note added successfully");
        } catch (error) {
            showErrorAlert(`Failed to add note: ${error.message}`);
        }
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return "N/A";

        try {
            // Handle both Date objects and timestamps
            const dateObj = date instanceof Date ? date : new Date(date);

            // Check if date is valid
            if (isNaN(dateObj.getTime())) return "N/A";

            return dateObj.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        } catch (error) {
            console.error("Date formatting error:", error);
            return "N/A";
        }
    };

    // Handle file selection
    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    // Handle document upload
    const handleDocumentUpload = async () => {
        if (!selectedFile || !universityId) {
            showErrorAlert(
                !selectedFile
                    ? "Please select a file to upload"
                    : "University ID not found"
            );
            return;
        }

        if (!documentType) {
            showErrorAlert("Please select a document type");
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            // Create a reference to the file in Firebase Storage - include university path
            const fileExtension = selectedFile.name.split(".").pop();
            const timestamp = Date.now();
            const fileName = `${documentType}_${timestamp}.${fileExtension}`;
            const filePath = `universities/${universityId}/employees/${employeeId}/documents/${fileName}`;
            const storageRef = ref(storage, filePath);

            // Upload the file
            const uploadTask = uploadBytes(storageRef, selectedFile);

            // Wait for the upload to complete
            await uploadTask;
            setUploadProgress(50);

            // Get the download URL
            const downloadURL = await getDownloadURL(storageRef);
            setUploadProgress(75);

            // Add document metadata to Firestore
            const employeeRef = doc(
                db,
                "universities",
                universityId,
                "employees",
                employeeId
            );

            const newDocument = {
                id: `doc_${timestamp}`,
                type: documentType || "other", // Default to "other" if no type
                description: documentDescription || "",
                fileName: selectedFile.name,
                name: selectedFile.name, // Adding name field for compatibility
                fileSize: selectedFile.size,
                fileType: selectedFile.type || `application/${fileExtension}`,
                uploadedAt: new Date(),
                filePath: filePath,
                downloadURL: downloadURL,
                url: downloadURL, // Adding url field for compatibility
            };

            // Update the employee document with the new document information
            await updateDoc(employeeRef, {
                documents: arrayUnion(newDocument),
                lastUpdated: new Date(),
            });

            setUploadProgress(100);

            // Update local state
            setEmployee((prev) => ({
                ...prev,
                documents: [...(prev.documents || []), newDocument],
                lastUpdated: new Date(),
            }));

            // Reset form
            setSelectedFile(null);
            setDocumentType("resume");
            setDocumentDescription("");
            setIsDocumentFormOpen(false);
            setIsUploading(false);

            showSuccessAlert("Document uploaded successfully");
        } catch (error) {
            console.error("Error uploading document:", error);
            setIsUploading(false);
            showErrorAlert(`Upload failed: ${error.message}`);
        }
    };

    // Handle document download - adjust storage path
    const handleDocumentDownload = async (
        downloadURL,
        fileName,
        documentObj
    ) => {
        try {
            setDownloadLoading(true);

            // Check if we have a direct URL in the document object
            if (documentObj?.url) {
                // Open the URL directly
                window.open(documentObj.url, "_blank");
                showSuccessAlert("Document opened in a new tab");
                setDownloadLoading(false);
                return;
            }

            if (!downloadURL && !documentObj?.filePath) {
                // If we can see the document name or url in the Firebase console as shown in your image
                if (
                    documentObj?.name &&
                    documentObj?.referenceLocator !== undefined
                ) {
                    // Attempt to construct a URL directly from the Firebase console information
                    const path = `universities/${universityId}/employees/${employeeId}/documents/${documentObj.name}`;
                    const storageRef = ref(storage, path);

                    try {
                        const freshURL = await getDownloadURL(storageRef);
                        window.open(freshURL, "_blank");
                        showSuccessAlert("Document opened in a new tab");
                        setDownloadLoading(false);
                        return;
                    } catch (err) {
                        console.error(
                            "Failed to get URL from document name:",
                            err
                        );
                        // Continue to other methods
                    }
                }

                showErrorAlert(
                    "Document URL is missing. Cannot download file."
                );
                setDownloadLoading(false);
                return;
            }

            // Get a fresh download URL directly from Firebase Storage to avoid CORS issues
            // Make sure we're getting from the university-specific path
            const filePath =
                documentObj?.filePath ||
                `universities/${universityId}/employees/${employeeId}/documents/${
                    documentObj?.name || fileName || "unknown"
                }`;

            console.log("Attempting to download with path:", filePath);
            const storageRef = ref(storage, filePath);

            try {
                // Try to get a fresh download URL directly from storage
                const freshURL = await getDownloadURL(storageRef);

                // Create a temporary anchor element to download the file
                const a = document.createElement("a");

                // Set the download attribute and open in a new tab to bypass CORS
                a.href = freshURL;
                a.download = (documentObj?.name || fileName || "document")
                    .split("/")
                    .pop();
                a.target = "_blank";
                a.rel = "noopener noreferrer";

                // Simulate a click
                document.body.appendChild(a);
                a.click();

                // Clean up
                document.body.removeChild(a);
                showSuccessAlert("Document download initiated");
            } catch (storageError) {
                console.error("Error fetching fresh URL:", storageError);

                // Fallback to provided URL with direct window.open
                if (downloadURL) {
                    window.open(downloadURL, "_blank");
                    showSuccessAlert("Download initiated in a new tab");
                } else if (documentObj?.url) {
                    window.open(documentObj.url, "_blank");
                    showSuccessAlert("Download initiated in a new tab");
                } else {
                    throw new Error("No document URL available");
                }
            }
        } catch (error) {
            console.error("Download error:", error);
            showErrorAlert(`Could not download the file: ${error.message}`);
        } finally {
            setDownloadLoading(false);
        }
    };

    // Handle document deletion - adjust storage path
    const handleDocumentDelete = (document) => {
        if (!universityId) {
            showErrorAlert("Cannot delete document: University ID not found");
            return;
        }

        showDeleteConfirmation(
            document.fileName,
            async () => {
                try {
                    // Delete the file from Firebase Storage
                    const storageRef = ref(storage, document.filePath);
                    await deleteObject(storageRef);

                    // Update Firestore to remove the document reference
                    const employeeRef = doc(
                        db,
                        "universities",
                        universityId,
                        "employees",
                        employeeId
                    );
                    const updatedDocuments = employee.documents.filter(
                        (doc) => doc.id !== document.id
                    );

                    await updateDoc(employeeRef, {
                        documents: updatedDocuments,
                        lastUpdated: new Date(),
                    });

                    // Update local state
                    setEmployee((prev) => ({
                        ...prev,
                        documents: updatedDocuments,
                        lastUpdated: new Date(),
                    }));

                    showSuccessAlert("Document deleted successfully");
                } catch (error) {
                    console.error("Error deleting document:", error);
                    showErrorAlert(`Deletion failed: ${error.message}`);
                }
            },
            "Document name does not match",
            ""
        );
    };

    // Get file icon based on file type
    const getFileIcon = (fileType) => {
        // Ensure fileType is at least an empty string
        fileType = fileType || "";

        if (fileType.includes("pdf")) {
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                </svg>
            );
        } else if (fileType.includes("image")) {
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            );
        } else if (fileType.includes("word") || fileType.includes("document")) {
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            );
        } else if (
            fileType.includes("excel") ||
            fileType.includes("spreadsheet")
        ) {
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
            );
        } else {
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                </svg>
            );
        }
    };

    // Format file size
    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Copy text to clipboard
    const copyToClipboard = (text, successMessage = "Copied to clipboard!") => {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                showSuccessAlert(successMessage);
            })
            .catch((err) => {
                console.error("Failed to copy: ", err);
                showErrorAlert("Failed to copy to clipboard");
            });
    };

    // Render the edit employee modal
    const renderEditEmployeeModal = () => {
        return (
            <EditEmployeeModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                employee={employee}
                universityId={universityId}
                onEmployeeUpdated={refreshEmployeeData}
            />
        );
    };

    // Function to refresh employee data after an update
    const refreshEmployeeData = async () => {
        try {
            setLoading(true);
            const employeeRef = doc(
                db,
                "universities",
                universityId,
                "employees",
                employeeId
            );
            const employeeDoc = await getDoc(employeeRef);

            if (employeeDoc.exists()) {
                const employeeData = employeeDoc.data();
                setEmployee({
                    id: employeeDoc.id,
                    ...employeeData,
                    // Ensure documents array is initialized
                    documents: employeeData.documents || [],
                    // Ensure notes array is initialized
                    notes: employeeData.notes || [],
                    dateHired: employeeData.dateHired?.toDate?.() || new Date(),
                });
                showSuccessAlert("Employee data refreshed successfully!");
            } else {
                setError("Employee not found");
            }
        } catch (err) {
            console.error("Error refreshing employee data:", err);
            showErrorAlert("Failed to refresh employee data");
        } finally {
            setLoading(false);
        }
    };

    // Skills section functions
    const handleSaveSkill = async () => {
        if (!skillForm.name || !skillForm.proficiency || !universityId) {
            showErrorAlert("Please fill all required fields!");
            return;
        }

        try {
            const employeeRef = doc(
                db,
                "universities",
                universityId,
                "employees",
                employeeId
            );
            const skills = employee.skills || [];
            let updatedSkills;

            if (editingSkill) {
                // Update existing skill
                updatedSkills = skills.map((skill) =>
                    skill.id === editingSkill.id
                        ? {
                              ...skill,
                              name: skillForm.name,
                              category: skillForm.category,
                              proficiency: skillForm.proficiency,
                              notes: skillForm.notes,
                              updatedAt: new Date(),
                          }
                        : skill
                );
            } else {
                // Add new skill
                const newSkill = {
                    id: Date.now().toString(),
                    name: skillForm.name,
                    category: skillForm.category,
                    proficiency: skillForm.proficiency,
                    notes: skillForm.notes,
                    createdAt: new Date(),
                };
                updatedSkills = [...skills, newSkill];
            }

            await updateDoc(employeeRef, {
                skills: updatedSkills,
                lastUpdated: new Date(),
            });

            // Update local state
            setEmployee((prev) => ({
                ...prev,
                skills: updatedSkills,
                lastUpdated: new Date(),
            }));

            setIsAddingSkill(false);
            setEditingSkill(null);
            resetSkillForm();
            showSuccessAlert(
                editingSkill
                    ? "Skill updated successfully"
                    : "Skill added successfully"
            );
        } catch (error) {
            console.error("Error saving skill:", error);
            showErrorAlert(
                `Failed to ${editingSkill ? "update" : "add"} skill: ${
                    error.message
                }`
            );
        }
    };

    const handleEditSkill = (skill) => {
        setIsAddingSkill(true);
        setEditingSkill(skill);
        setSkillForm({
            name: skill.name,
            category: skill.category,
            proficiency: skill.proficiency,
            notes: skill.notes,
        });
    };

    const handleDeleteSkill = async (id) => {
        if (!universityId) {
            showErrorAlert("Cannot delete skill: University ID not found");
            return;
        }

        showDeleteConfirmation(
            `Are you sure you want to delete this skill?`,
            async () => {
                try {
                    const employeeRef = doc(
                        db,
                        "universities",
                        universityId,
                        "employees",
                        employeeId
                    );
                    const updatedSkills = employee.skills.filter(
                        (skill) => skill.id !== id
                    );

                    await updateDoc(employeeRef, {
                        skills: updatedSkills,
                        lastUpdated: new Date(),
                    });

                    // Update local state
                    setEmployee((prev) => ({
                        ...prev,
                        skills: updatedSkills,
                        lastUpdated: new Date(),
                    }));

                    showSuccessAlert("Skill deleted successfully");
                } catch (error) {
                    console.error("Error deleting skill:", error);
                    showErrorAlert("Failed to delete skill");
                }
            },
            "Yes, delete skill",
            "Cancel"
        );
    };

    const resetSkillForm = () => {
        setSkillForm({
            name: "",
            category: "technical",
            proficiency: 50,
            notes: "",
        });
    };

    // Loading state
    if (loading) {
        // Check if this is a page refresh
        const isPageRefresh =
            sessionStorage.getItem("isPageRefresh") === "true";
        return (
            <PageLoader
                message="Loading employee details..."
                contentOnly={!isPageRefresh}
                fullscreen={isPageRefresh}
            />
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] p-6 text-gray-600">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-16 h-16 text-gray-400 mb-4"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4.5a9 9 0 1112.765 0M9.75 9h4.5m-2.25-3v6"
                    />
                </svg>
                <h2 className="text-xl font-semibold text-gray-700">
                    Employee Not Found
                </h2>
                <p className="text-gray-500 mt-2">{error}</p>
                <button
                    onClick={() => navigate("/employees")}
                    className="mt-4 px-4 py-2 bg-[#9AADEA] text-white rounded-lg hover:bg-[#7b8edc] transition"
                >
                    Back to Employees
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            {/* Header with Back Button and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/employees")}
                        className="p-2 rounded-lg hover:bg-gray-100 transition"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                            />
                        </svg>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Employee Details
                    </h1>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-4 py-2 border border-[#9AADEA] text-[#9AADEA] rounded-lg hover:bg-gray-50 transition"
                    >
                        Edit Employee
                    </button>
                </div>
            </div>

            {/* Horizontal Divider */}
            <hr className="border-t border-gray-300 mb-6" />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Left Column - Basic Info */}
                <div className="col-span-1 md:col-span-1">
                    {/* Employee Avatar and Basic Info */}
                    <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
                        <div className="flex flex-col items-center mb-4">
                            <div className="h-24 w-24 bg-gray-300 rounded-full flex items-center justify-center text-2xl font-bold text-white mb-3">
                                {employee.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                            </div>
                            <h2 className="text-xl font-semibold text-center">
                                {employee.name}
                            </h2>
                            <p className="text-gray-600 text-center">
                                {employee.position}
                            </p>
                            <span
                                className={`mt-2 px-3 py-1 rounded-full text-sm font-medium 
                                    ${
                                        employee.status === "New Hire"
                                            ? "bg-blue-100 text-blue-800"
                                            : employee.status === "Active"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-red-100 text-red-800"
                                    }`}
                            >
                                {employee.status}
                            </span>
                        </div>

                        <hr className="border-t border-gray-200 mb-4" />

                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">
                                    {employee.email || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium">
                                    {employee.phone || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Department
                                </p>
                                <p className="font-medium">
                                    {employee.department || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Employee ID
                                </p>
                                <div className="flex items-center">
                                    <p className="font-medium mr-2">
                                        {employee.employeeId || "N/A"}
                                    </p>
                                    {employee.employeeId && (
                                        <button
                                            onClick={() =>
                                                copyToClipboard(
                                                    employee.employeeId,
                                                    "Employee ID copied to clipboard!"
                                                )
                                            }
                                            className="p-1 text-[#9AADEA] hover:text-white hover:bg-[#9AADEA] rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9AADEA]"
                                            title="Copy to clipboard"
                                            aria-label="Copy Employee ID to clipboard"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">
                                    Joined On
                                </p>
                                <p className="font-medium">
                                    {formatDate(employee.dateHired)}
                                </p>
                            </div>

                            <div className="pt-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                    Change Status
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() =>
                                            handleStatusChange("New Hire")
                                        }
                                        disabled={
                                            employee.status === "New Hire"
                                        }
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                            employee.status === "New Hire"
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                        }`}
                                    >
                                        Set as New Hire
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleStatusChange("Active")
                                        }
                                        disabled={employee.status === "Active"}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                            employee.status === "Active"
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                : "bg-green-100 text-green-800 hover:bg-green-200"
                                        }`}
                                    >
                                        Set as Active
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleStatusChange("Inactive")
                                        }
                                        disabled={
                                            employee.status === "Inactive"
                                        }
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                            employee.status === "Inactive"
                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                : "bg-red-100 text-red-800 hover:bg-red-200"
                                        }`}
                                    >
                                        Set as Inactive
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Detailed Info */}
                <div className="col-span-1 md:col-span-3">
                    {/* Employee Details */}
                    <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">
                            Employee Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Full Name
                                </p>
                                <p className="font-medium">{employee.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Position
                                </p>
                                <p className="font-medium">
                                    {employee.position}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Department
                                </p>
                                <p className="font-medium">
                                    {employee.department}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Salary
                                </p>
                                <p className="font-medium">
                                    {employee.salary
                                        ? `$${employee.salary}`
                                        : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Employee ID
                                </p>
                                <div className="flex items-center">
                                    <p className="font-medium mr-2">
                                        {employee.employeeId || "N/A"}
                                    </p>
                                    {employee.employeeId && (
                                        <button
                                            onClick={() =>
                                                copyToClipboard(
                                                    employee.employeeId,
                                                    "Employee ID copied to clipboard!"
                                                )
                                            }
                                            className="p-1 text-[#9AADEA] hover:text-white hover:bg-[#9AADEA] rounded transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9AADEA]"
                                            title="Copy to clipboard"
                                            aria-label="Copy Employee ID to clipboard"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Hire Date
                                </p>
                                <p className="font-medium">
                                    {formatDate(employee.dateHired)}
                                </p>
                            </div>
                        </div>

                        <hr className="border-t border-gray-200 my-6" />

                        <h3 className="text-lg font-semibold mb-4">
                            Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Email
                                </p>
                                <p className="font-medium">{employee.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Phone
                                </p>
                                <p className="font-medium">
                                    {employee.phone || "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">
                                    Address
                                </p>
                                <p className="font-medium">
                                    {employee.address || "N/A"}
                                </p>
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        {employee.emergencyContact && (
                            <>
                                <hr className="border-t border-gray-200 my-6" />
                                <h3 className="text-lg font-semibold mb-4">
                                    Emergency Contact
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">
                                            Name
                                        </p>
                                        <p className="font-medium">
                                            {employee.emergencyContact.name ||
                                                "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">
                                            Relationship
                                        </p>
                                        <p className="font-medium">
                                            {employee.emergencyContact
                                                .relationship || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">
                                            Phone
                                        </p>
                                        <p className="font-medium">
                                            {employee.emergencyContact.phone ||
                                                "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">
                                            Email
                                        </p>
                                        <p className="font-medium">
                                            {employee.emergencyContact.email ||
                                                "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Bank Details */}
                        {employee.bankDetails && (
                            <>
                                <hr className="border-t border-gray-200 my-6" />
                                <h3 className="text-lg font-semibold mb-4">
                                    Bank Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">
                                            Bank Name
                                        </p>
                                        <p className="font-medium">
                                            {employee.bankDetails.bankName ||
                                                "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">
                                            Account Number
                                        </p>
                                        <p className="font-medium">
                                            {employee.bankDetails
                                                .accountNumber || "N/A"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">
                                            Routing Number
                                        </p>
                                        <p className="font-medium">
                                            {employee.bankDetails
                                                .routingNumber || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Onboarding Progress */}
                        {employee.onboardingChecklist &&
                            employee.onboardingChecklist.length > 0 && (
                                <>
                                    <hr className="border-t border-gray-200 my-6" />
                                    <h3 className="text-lg font-semibold mb-4">
                                        Onboarding Checklist
                                    </h3>
                                    <div className="space-y-3">
                                        {employee.onboardingChecklist.map(
                                            (item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center gap-3"
                                                >
                                                    <div
                                                        className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                                            item.completed
                                                                ? "bg-green-500"
                                                                : "bg-gray-200"
                                                        }`}
                                                    >
                                                        {item.completed && (
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-3 w-3 text-white"
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
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span
                                                        className={`text-sm ${
                                                            item.completed
                                                                ? "line-through text-gray-500"
                                                                : "text-gray-700"
                                                        }`}
                                                    >
                                                        {item.task}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </>
                            )}
                    </div>

                    {/* Notes Section */}
                    <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Notes</h3>
                            <button
                                onClick={() => setIsAddingNote(true)}
                                className="px-3 py-1 bg-[#9AADEA] text-white rounded-lg hover:bg-[#7b8edc] transition"
                            >
                                Add Note
                            </button>
                        </div>

                        {/* Add Note Form */}
                        {isAddingNote && (
                            <div className="mb-4 border border-gray-200 rounded-lg p-4">
                                <textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Enter your note here..."
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 mb-3"
                                    rows={4}
                                ></textarea>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setIsAddingNote(false);
                                            setNewNote("");
                                        }}
                                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddNote}
                                        disabled={!newNote.trim()}
                                        className={`px-3 py-1 rounded-lg ${
                                            newNote.trim()
                                                ? "bg-[#9AADEA] text-white hover:bg-[#7b8edc]"
                                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                        } transition`}
                                    >
                                        Save Note
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Notes List */}
                        <div className="space-y-4">
                            {employee.notes && employee.notes.length > 0 ? (
                                employee.notes.map((note) => (
                                    <div
                                        key={note.id}
                                        className="border-l-4 border-[#9AADEA] pl-4 py-2"
                                    >
                                        <p className="text-gray-800">
                                            {note.content}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {formatDate(
                                                note.createdAt?.toDate?.() ||
                                                    note.createdAt
                                            )}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 italic">
                                    No notes available.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Documents Section */}
                    <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Documents</h3>
                            <button
                                onClick={() => setIsDocumentFormOpen(true)}
                                className="px-3 py-1 bg-[#9AADEA] text-white rounded-lg hover:bg-[#7b8edc] transition"
                            >
                                Upload Document
                            </button>
                        </div>

                        {/* Document Upload Form */}
                        {isDocumentFormOpen && (
                            <div className="mb-6 border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium mb-3">
                                    Upload a New Document
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Document Type*
                                        </label>
                                        <select
                                            value={documentType}
                                            onChange={(e) =>
                                                setDocumentType(e.target.value)
                                            }
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="resume">
                                                Resume/CV
                                            </option>
                                            <option value="certification">
                                                Certification
                                            </option>
                                            <option value="201file">
                                                201 File
                                            </option>
                                            <option value="identification">
                                                ID/License
                                            </option>
                                            <option value="contract">
                                                Contract
                                            </option>
                                            <option value="evaluation">
                                                Performance Evaluation
                                            </option>
                                            <option value="other">
                                                Other Document
                                            </option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <input
                                            type="text"
                                            value={documentDescription}
                                            onChange={(e) =>
                                                setDocumentDescription(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Brief description of the document"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select File*
                                    </label>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {selectedFile && (
                                        <p className="mt-1 text-sm text-gray-500">
                                            Selected file: {selectedFile.name} (
                                            {formatFileSize(selectedFile.size)})
                                        </p>
                                    )}
                                </div>

                                {isUploading && (
                                    <div className="mb-4">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full"
                                                style={{
                                                    width: `${uploadProgress}%`,
                                                }}
                                            ></div>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Uploading... {uploadProgress}%
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setIsDocumentFormOpen(false);
                                            setSelectedFile(null);
                                            setDocumentType("resume");
                                            setDocumentDescription("");
                                        }}
                                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDocumentUpload}
                                        disabled={!selectedFile || isUploading}
                                        className={`px-3 py-1 rounded-lg ${
                                            selectedFile && !isUploading
                                                ? "bg-[#9AADEA] text-white hover:bg-[#7b8edc]"
                                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                        } transition`}
                                    >
                                        {isUploading
                                            ? "Uploading..."
                                            : "Upload Document"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Documents List */}
                        <div className="overflow-x-auto">
                            {employee.documents &&
                            employee.documents.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                File
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Uploaded
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {employee.documents.map((document) => (
                                            <tr
                                                key={document.id}
                                                className="hover:bg-gray-50"
                                            >
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {getFileIcon(
                                                            document.fileType ||
                                                                ""
                                                        )}
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                                                {document.fileName ||
                                                                    document.name ||
                                                                    "Untitled Document"}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {document.fileSize
                                                                    ? formatFileSize(
                                                                          document.fileSize
                                                                      )
                                                                    : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {document.type
                                                            ? document.type
                                                                  .charAt(0)
                                                                  .toUpperCase() +
                                                              document.type.slice(
                                                                  1
                                                              )
                                                            : "Other"}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {document.description ||
                                                        "-"}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(
                                                        document.uploadedAt?.toDate?.() ||
                                                            document.uploadedAt
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex justify-end space-x-2">
                                                        <button
                                                            onClick={() =>
                                                                handleDocumentDownload(
                                                                    document.downloadURL ||
                                                                        document.url,
                                                                    document.fileName ||
                                                                        document.name,
                                                                    document
                                                                )
                                                            }
                                                            className="text-[#9AADEA] hover:text-white hover:bg-[#9AADEA] rounded transition-colors duration-200 p-1"
                                                            title="Download document"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-5 w-5"
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
                                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                                />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDocumentDelete(
                                                                    document
                                                                )
                                                            }
                                                            className="text-red-500 hover:text-red-700 transition"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-5 w-5"
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
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-12 w-12 text-gray-400 mx-auto mb-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1}
                                            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <p className="text-gray-500">
                                        No documents uploaded yet.
                                    </p>
                                    <button
                                        onClick={() =>
                                            setIsDocumentFormOpen(true)
                                        }
                                        className="mt-3 px-4 py-2 bg-[#9AADEA] text-white rounded-lg hover:bg-[#7b8edc] transition text-sm"
                                    >
                                        Upload Your First Document
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                Skills & Competencies
                            </h3>
                            <button
                                onClick={() => setIsAddingSkill(true)}
                                className="px-3 py-1 bg-[#9AADEA] text-white rounded-lg hover:bg-[#7b8edc] transition"
                            >
                                Add Skill
                            </button>
                        </div>

                        {/* Add/Edit Skill Form */}
                        {(isAddingSkill || editingSkill) && (
                            <div className="mb-6 border border-gray-200 rounded-lg p-4">
                                <h4 className="font-medium mb-3">
                                    {editingSkill
                                        ? "Edit Skill"
                                        : "Add New Skill"}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Skill Name*
                                        </label>
                                        <input
                                            type="text"
                                            value={skillForm.name}
                                            onChange={(e) =>
                                                setSkillForm({
                                                    ...skillForm,
                                                    name: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., JavaScript, Leadership, Communication"
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category
                                        </label>
                                        <select
                                            value={skillForm.category}
                                            onChange={(e) =>
                                                setSkillForm({
                                                    ...skillForm,
                                                    category: e.target.value,
                                                })
                                            }
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="technical">
                                                Technical
                                            </option>
                                            <option value="soft">
                                                Soft Skill
                                            </option>
                                            <option value="language">
                                                Language
                                            </option>
                                            <option value="certification">
                                                Certification
                                            </option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Proficiency Level* (
                                        {skillForm.proficiency}%)
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={skillForm.proficiency}
                                        onChange={(e) =>
                                            setSkillForm({
                                                ...skillForm,
                                                proficiency: parseInt(
                                                    e.target.value
                                                ),
                                            })
                                        }
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between text-xs mt-1 text-gray-500">
                                        <span>Beginner</span>
                                        <span>Intermediate</span>
                                        <span>Advanced</span>
                                        <span>Expert</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={skillForm.notes}
                                        onChange={(e) =>
                                            setSkillForm({
                                                ...skillForm,
                                                notes: e.target.value,
                                            })
                                        }
                                        placeholder="Additional details about this skill"
                                        rows="3"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                    ></textarea>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setIsAddingSkill(false);
                                            setEditingSkill(null);
                                            resetSkillForm();
                                        }}
                                        className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveSkill}
                                        disabled={
                                            !skillForm.name ||
                                            !skillForm.proficiency
                                        }
                                        className={`px-3 py-1 rounded-lg ${
                                            skillForm.name &&
                                            skillForm.proficiency
                                                ? "bg-[#9AADEA] text-white hover:bg-[#7b8edc]"
                                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                        } transition`}
                                    >
                                        {editingSkill
                                            ? "Update Skill"
                                            : "Add Skill"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Skills List */}
                        <div className="space-y-4">
                            {employee.skills && employee.skills.length > 0 ? (
                                employee.skills.map((skill) => (
                                    <div
                                        key={skill.id}
                                        className="bg-gray-50 rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <div>
                                                <h4 className="font-medium">
                                                    {skill.name}
                                                </h4>
                                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                                    {skill.category
                                                        ? skill.category
                                                              .charAt(0)
                                                              .toUpperCase() +
                                                          skill.category.slice(
                                                              1
                                                          )
                                                        : "Technical"}
                                                </span>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() =>
                                                        handleEditSkill(skill)
                                                    }
                                                    className="text-[#9AADEA] hover:text-white hover:bg-[#9AADEA] rounded transition-colors duration-200 p-1"
                                                    title="Edit skill"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                        />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteSkill(
                                                            skill.id
                                                        )
                                                    }
                                                    className="text-red-500 hover:text-white hover:bg-red-500 rounded transition-colors duration-200 p-1"
                                                    title="Delete skill"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                                            <div
                                                className="bg-blue-600 h-2.5 rounded-full"
                                                style={{
                                                    width: `${skill.proficiency}%`,
                                                }}
                                            ></div>
                                        </div>

                                        <div className="flex justify-between text-xs text-gray-500 mb-2">
                                            <span>Beginner</span>
                                            <span>Intermediate</span>
                                            <span>Advanced</span>
                                            <span>Expert</span>
                                        </div>

                                        {skill.notes && (
                                            <p className="text-sm text-gray-600 mt-2 italic">
                                                {skill.notes}
                                            </p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-12 w-12 text-gray-400 mx-auto mb-3"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1}
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                    <p className="text-gray-500">
                                        No skills added yet.
                                    </p>
                                    <button
                                        onClick={() => setIsAddingSkill(true)}
                                        className="mt-3 px-4 py-2 bg-[#9AADEA] text-white rounded-lg hover:bg-[#7b8edc] transition text-sm"
                                    >
                                        Add First Skill
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Render the edit modal */}
            {renderEditEmployeeModal()}
        </div>
    );
};

export default EmployeeDetails;
