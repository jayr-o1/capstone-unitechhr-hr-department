import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthProvider";
import { useLocation, useNavigate } from "react-router-dom";
import {
    getEmployeeData,
    updateEmployeeProfile,
    getEmployeeDocuments,
    uploadEmployeeDocument,
    deleteEmployeeDocument,
    getEmployeeSkills,
    addEmployeeSkill,
    updateEmployeeSkill,
    deleteEmployeeSkill,
} from "../../services/employeeService";
import {
    extractSkillsFromMultipleDocuments,
    checkApiHealth,
} from "../../services/documentParserService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser,
    faEnvelope,
    faPhone,
    faBuilding,
    faBriefcase,
    faCalendarAlt,
    faUpload,
    faFileAlt,
    faFilePdf,
    faFileImage,
    faFileWord,
    faFileExcel,
    faTrashAlt,
    faCheck,
    faTimes,
    faIdBadge,
    faGraduationCap,
    faPlus,
    faEdit,
    faMagic,
    faSpinner,
    faClipboardList,
    faInfoCircle,
    faDownload,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";
import EmployeePageLoader from "../../components/employee/EmployeePageLoader";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from "firebase/storage";
import { db, storage, auth } from "../../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
// Import custom alert components
import showSuccessAlert from "../../components/Alerts/SuccessAlert";
import showErrorAlert from "../../components/Alerts/ErrorAlert";
import showWarningAlert from "../../components/Alerts/WarningAlert";
import showDeleteConfirmation from "../../components/Alerts/DeleteAlert";

// Document Upload Modal Component
const DocumentUploadModal = ({ isOpen, onClose, onUpload, loading }) => {
    const fileInputRef = useRef(null);
    const [documentType, setDocumentType] = useState("certification");
    const [documentDescription, setDocumentDescription] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);

    // Reset form completely when modal opens or closes
    useEffect(() => {
        resetForm();
    }, [isOpen]);

    // Document type options
    const documentTypeOptions = [
        { value: "resume", label: "Resume/CV" },
        { value: "certification", label: "Certification" },
        { value: "degree", label: "Degree/Diploma" },
        { value: "training", label: "Training Document" },
        { value: "identification", label: "ID Document" },
        { value: "other", label: "Other" },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!selectedFile) {
            setError("Please select a file to upload");
            return;
        }

        // Call upload and reset form upon success (handled in parent component)
        onUpload(selectedFile, documentType, documentDescription);
    };

    const resetForm = () => {
        setDocumentDescription("");
        setSelectedFile(null);
        setDocumentType("certification");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setError(null);
    };

    const handleCancel = () => {
        resetForm();
        onClose();
    };

    // Function to get file icon based on extension
    const getFileIcon = (fileName) => {
        if (!fileName) return faFileAlt;

        const extension = fileName.split(".").pop().toLowerCase();

        if (["pdf"].includes(extension)) return faFilePdf;
        if (["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(extension))
            return faFileImage;
        if (["doc", "docx"].includes(extension)) return faFileWord;
        if (["xls", "xlsx", "csv"].includes(extension)) return faFileExcel;

        return faFileAlt;
    };

    // Function to format file size in a readable way
    const formatFileSize = (bytes) => {
        if (bytes < 1024) {
            return `${bytes} B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        } else {
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(8px)",
                zIndex: 1000,
            }}
        >
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                {/* Modal Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        Upload Document
                    </h2>
                    <button
                        onClick={handleCancel}
                        className="text-gray-500 hover:text-gray-700 text-xl focus:outline-none"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <hr className="border-t border-gray-300 mb-4" />

                {/* Modal Body */}
                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4 flex items-center justify-between">
                        <p className="text-sm flex items-center">
                            <FontAwesomeIcon icon={faTimes} className="mr-2" />
                            {error}
                        </p>
                        <button
                            onClick={() => setError(null)}
                            aria-label="Dismiss error"
                            className="text-red-500 hover:text-red-700"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Document Type Field */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-1 text-sm">
                            Document Type<span className="text-red-500">*</span>
                        </label>
                        <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            disabled={loading}
                            required
                        >
                            {documentTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Select the type of document you're uploading
                        </p>
                    </div>

                    {/* Description Field */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-1 text-sm">
                            Description
                        </label>
                        <input
                            type="text"
                            value={documentDescription}
                            onChange={(e) =>
                                setDocumentDescription(e.target.value)
                            }
                            placeholder="E.g., 'My resume updated May 2023' or 'Microsoft Certification'"
                            className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Add a short description to help identify this
                            document later
                        </p>
                    </div>

                    {/* File Upload Field */}
                    <div>
                        <label className="block text-gray-700 font-medium mb-1 text-sm">
                            File<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    setSelectedFile(file);
                                }
                            }}
                            disabled={loading}
                        />

                        <div
                            className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all duration-200 
                ${
                    selectedFile
                        ? "border-blue-300 bg-blue-50 hover:bg-blue-100"
                        : "border-gray-300 hover:border-blue-300 hover:bg-gray-50"
                }`}
                            onClick={() => {
                                if (fileInputRef.current && !loading) {
                                    fileInputRef.current.click();
                                }
                            }}
                        >
                            {selectedFile ? (
                                <div className="py-2">
                                    <FontAwesomeIcon
                                        icon={getFileIcon(selectedFile.name)}
                                        className="text-blue-500 text-4xl mb-3"
                                    />
                                    <p className="text-sm font-medium break-all text-gray-800">
                                        {selectedFile.name}
                                    </p>
                                    <div className="flex items-center justify-center mt-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {formatFileSize(selectedFile.size)}
                                        </span>
                                        <span className="mx-2 text-gray-400">
                                            •
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                            {selectedFile.name
                                                .split(".")
                                                .pop()
                                                .toUpperCase()}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedFile(null);
                                            if (fileInputRef.current) {
                                                fileInputRef.current.value = "";
                                            }
                                        }}
                                        className="mt-3 text-sm text-red-500 hover:text-red-700 focus:outline-none"
                                        disabled={loading}
                                    >
                                        Remove file
                                    </button>
                                </div>
                            ) : (
                                <div className="py-6">
                                    <FontAwesomeIcon
                                        icon={faUpload}
                                        className="text-gray-400 text-3xl mb-3"
                                    />
                                    <p className="text-gray-500 font-medium mb-1">
                                        Click to browse files
                                    </p>
                                    <p className="text-gray-400 text-sm">
                                        or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Maximum file size: 10MB. Supported
                                        formats: PDF, DOC, DOCX, JPG, PNG
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Form Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className={`px-4 py-2 rounded-md text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                ${
                    loading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                }`}
                            disabled={loading || !selectedFile}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    Uploading...
                                </span>
                            ) : (
                                <span className="flex items-center">
                                    <FontAwesomeIcon
                                        icon={faUpload}
                                        className="mr-2"
                                    />
                                    Upload Document
                                </span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const EmployeeProfile = () => {
    const { user, userDetails } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [employeeData, setEmployeeData] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [activeTab, setActiveTab] = useState("personal");

    // Refs for scrolling
    const skillsSectionRef = useRef(null);

    // Form data
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        position: "",
        department: "",
        bio: "",
        address: "",
        education: "",
    });

    // Document upload
    const fileInputRef = useRef(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [activeDocumentFilter, setActiveDocumentFilter] = useState("all");
    const [documentType, setDocumentType] = useState("certification");
    const [documentDescription, setDocumentDescription] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDocumentFormOpen, setIsDocumentFormOpen] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);

    // Skills state
    const [extractingSkills, setExtractingSkills] = useState(false);
    const [processingSkills, setProcessingSkills] = useState(false);

    // Add a new state variable to track if skills need processing
    const [skillsNeedProcessing, setSkillsNeedProcessing] = useState(false);
    const [processedSkills, setProcessedSkills] = useState([]);

    // Ref to track if automatic extraction has been triggered
    const autoExtractionTriggered = useRef(false);

    // Debug Firebase Storage on component mount
    useEffect(() => {
        console.log("===== FIREBASE STORAGE DEBUGGING =====");
        console.log("Storage instance:", storage);

        try {
            // Test if we can create a storage reference
            const testRef = ref(storage, "test/debug.txt");
            console.log("Storage reference created successfully:", testRef);

            // Log Firebase auth state
            console.log("Current auth state:", auth.currentUser);
        } catch (err) {
            console.error("Firebase Storage Error:", err);
        }

        console.log("===== END DEBUGGING =====");
    }, []);

    // Check for tab in URL query parameters
    useEffect(() => {
        // Get tab from URL query parameters
        const params = new URLSearchParams(location.search);
        const tabParam = params.get("tab");

        if (
            tabParam &&
            ["personal", "documents", "skills"].includes(tabParam)
        ) {
            setActiveTab(tabParam);
        } else if (location.state?.activeTab) {
            // Also support the previous approach with location state
            setActiveTab(location.state.activeTab);

            // Update URL to match the state
            const params = new URLSearchParams(location.search);
            params.set("tab", location.state.activeTab);
            navigate(`${location.pathname}?${params.toString()}`, {
                replace: true,
            });
        }
    }, [location.search, location.state]);

    // Update URL when tab changes
    useEffect(() => {
        if (activeTab) {
            const params = new URLSearchParams(location.search);
            params.set("tab", activeTab);
            navigate(`${location.pathname}?${params.toString()}`, {
                replace: true,
            });

            // Reset the auto extraction flag when changing tabs
            if (activeTab !== "skills") {
                autoExtractionTriggered.current = false;
            }
        }
    }, [activeTab, location.pathname, navigate]);

    // Check for active tab in navigation state
    useEffect(() => {
        // Small delay to ensure DOM elements are rendered
        setTimeout(() => {
            if (activeTab === "skills" && skillsSectionRef.current) {
                skillsSectionRef.current.scrollIntoView({ behavior: "smooth" });
            }
        }, 300);
    }, [activeTab]);

    useEffect(() => {
        // Initial data loading
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!user || !userDetails?.universityId) {
                    setError("User details not available");
                    setLoading(false);
                    return;
                }

                console.log("Loading profile for:", user.uid);

                // Get employee data
                const employeeData = await getEmployeeData(
                    user.uid,
                    userDetails.universityId
                );

                if (employeeData.success) {
                    setEmployeeData(employeeData.data);

                    // Set form data based on employee data
                    setFormData({
                        name: employeeData.data.name || "",
                        email: employeeData.data.email || "",
                        phone: employeeData.data.phone || "",
                        position: employeeData.data.position || "",
                        department: employeeData.data.department || "",
                        bio: employeeData.data.bio || "",
                        address: employeeData.data.address || "",
                        education: employeeData.data.education || "",
                    });

                    // Get documents
                    const docsData = await getEmployeeDocuments(
                        user.uid,
                        userDetails.universityId
                    );
                    if (docsData.success) {
                        setDocuments(docsData.documents || []);
                    } else {
                        console.error(
                            "Failed to load documents:",
                            docsData.message
                        );
                    }

                    // Fetch skills
                    const skillsData = await getEmployeeSkills(
                        user.uid,
                        userDetails.universityId
                    );
                    if (skillsData.success) {
                        console.log(
                            "Skills loaded from Firestore:",
                            skillsData.skills
                        );

                        // Store original skills from Firestore
                        const loadedSkills = skillsData.skills || [];
                        setSkills(loadedSkills);

                        // Process skills immediately for display
                        const processedSkills = loadedSkills.map((skill) => {
                            // Calculate proficiency value for progress bar
                            let proficiencyValue = 25; // Default

                            if (typeof skill.proficiency === "string") {
                                const profString = skill.proficiency.trim();
                                if (profString === "Beginner")
                                    proficiencyValue = 25;
                                else if (profString === "Intermediate")
                                    proficiencyValue = 50;
                                else if (profString === "Advanced")
                                    proficiencyValue = 75;
                                else if (profString === "Expert")
                                    proficiencyValue = 100;
                            }

                            return {
                                ...skill,
                                proficiencyValue,
                            };
                        });

                        // Set processed skills for display
                        setProcessedSkills(processedSkills);

                        // We don't need additional processing since we've done it already
                        setSkillsNeedProcessing(false);
                    }

                    setLoading(false);
                }
            } catch (err) {
                console.error("Error loading employee data:", err);
                setError("An error occurred while loading data");
                setLoading(false);
            }
        };

        loadData();
    }, [user, userDetails]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSaveProfile = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            if (!userDetails || !userDetails.universityId) {
                setError("User details not available");
                setSaving(false);
                return;
            }

            const result = await updateEmployeeProfile(
                user.uid,
                userDetails.universityId,
                formData
            );

            if (result.success) {
                setSuccess("Profile updated successfully");
                setEditMode(false);

                // Update local state
                setEmployeeData((prev) => ({
                    ...prev,
                    ...formData,
                }));
            } else {
                setError(result.message || "Failed to update profile");
            }

            setSaving(false);
        } catch (err) {
            console.error("Error saving profile:", err);
            setError("An error occurred while saving profile");
            setSaving(false);
        }
    };

    const handleUploadDocument = () => {
        setIsUploadModalOpen(true);
    };

    const handleCloseUploadModal = () => {
        setIsUploadModalOpen(false);
    };

    // Handle document upload
    const handleDocumentUpload = async () => {
        if (!selectedFile || !userDetails?.universityId) {
            showErrorAlert(
                !selectedFile
                    ? "No file selected"
                    : "Cannot determine your university"
            );
            return;
        }

        if (!documentType) {
            showErrorAlert("Please select a document type");
            return;
        }

        try {
            setUploading(true);
            setUploadProgress(0);
            setError(null);

            console.log("Uploading document:", selectedFile.name);

            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB in bytes
            if (selectedFile.size > maxSize) {
                showErrorAlert(
                    `File size exceeds the maximum limit of 10MB. Current size: ${formatFileSize(
                        selectedFile.size
                    )}`
                );
                setUploading(false);
                return;
            }

            // Validate file type
            const allowedTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "image/jpeg",
                "image/png",
                "image/gif",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ];

            if (!allowedTypes.includes(selectedFile.type)) {
                showErrorAlert(
                    `File type not supported. Please upload a PDF, DOC, DOCX, JPG, or PNG file. Current type: ${selectedFile.type}`
                );
                setUploading(false);
                return;
            }

            // Determine employee ID and document ID
            let employeeId = user.uid;
            let employeeDocId = user.uid;

            // Check if this is a mock user ID from direct employee login
            if (user.uid.startsWith("emp_")) {
                // Extract the actual employee ID from the mock user ID
                const parts = user.uid.split("_");
                if (parts.length >= 2) {
                    employeeId = parts[1];
                    console.log(
                        "Extracted employeeId from mock user:",
                        employeeId
                    );
                    employeeDocId = employeeId;
                }
            }

            // Create a reference to the file in Firebase Storage
            const fileExtension = selectedFile.name
                .split(".")
                .pop()
                .toLowerCase();
            const timestamp = Date.now();
            const fileName = `${documentType}_${timestamp}.${fileExtension}`;
            const filePath = `universities/${userDetails.universityId}/employees/${employeeId}/documents/${fileName}`;
            const storageRef = ref(storage, filePath);

            // Determine file type for display
            const displayFileType = getFileExtension(selectedFile.name);

            // Upload the file
            const uploadTask = uploadBytes(storageRef, selectedFile);
            setUploadProgress(25);

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
                userDetails.universityId,
                "employees",
                employeeDocId
            );

            const newDocument = {
                id: `doc_${timestamp}`,
                type: documentType || "other", // Document category (resume, certificate, etc.)
                description: documentDescription || "",
                fileName: selectedFile.name,
                name: selectedFile.name, // Adding name field for compatibility
                fileSize: selectedFile.size,
                fileType: displayFileType, // User-friendly file type
                fileExtension: fileExtension, // Raw file extension
                mimeType: selectedFile.type || `application/${fileExtension}`, // MIME type
                uploadedAt: new Date(),
                filePath: filePath,
                downloadURL: downloadURL,
                url: downloadURL, // Adding url field for compatibility
            };

            console.log("Updating employee document with ID:", employeeDocId);

            // Update the employee document with the new document information
            const employeeDoc = await getDoc(employeeRef);
            if (employeeDoc.exists()) {
                const employeeData = employeeDoc.data();
                const currentDocuments = employeeData.documents || [];

                await updateDoc(employeeRef, {
                    documents: [...currentDocuments, newDocument],
                    updatedAt: serverTimestamp(),
                });
            } else {
                console.error(
                    "Employee document not found with ID:",
                    employeeDocId
                );
                showErrorAlert(
                    "Employee record not found. Please contact support."
                );
                setUploading(false);
                return;
            }

            setUploadProgress(100);

            // Update local state
            setDocuments((prev) => [...prev, newDocument]);

            // Reset form
            setSelectedFile(null);
            setDocumentDescription("");
            setIsDocumentFormOpen(false);

            // If this is a file input, clear it
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            showSuccessAlert("Document uploaded successfully");
        } catch (err) {
            console.error("Error uploading document:", err);
            showErrorAlert(
                `An error occurred while uploading document: ${err.message}`
            );
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = async (documentId, fileName) => {
        // Find the document to delete
        const docToDelete = documents.find((doc) => doc.id === documentId);

        if (!docToDelete) {
            showErrorAlert("Document not found");
            return;
        }

        const documentName = docToDelete.fileName || docToDelete.name;
        showDeleteConfirmation(
            documentName,
            async () => {
                try {
                    setError(null);
                    setSuccess(null);

                    if (!userDetails || !userDetails.universityId) {
                        setError("User details not available");
                        showErrorAlert("User details not available");
                        return;
                    }

                    // Determine employee ID and document ID
                    let employeeId = user.uid;
                    let employeeDocId = user.uid;

                    // Check if this is a mock user ID from direct employee login
                    if (user.uid.startsWith("emp_")) {
                        // Extract the actual employee ID from the mock user ID
                        const parts = user.uid.split("_");
                        if (parts.length >= 2) {
                            employeeId = parts[1];
                            console.log(
                                "Extracted employeeId from mock user:",
                                employeeId
                            );
                            employeeDocId = employeeId;
                        }
                    }

                    console.log("Deleting document:", docToDelete);

                    const isBase64Document = docToDelete.base64Content;

                    // If it's a base64 document, we only need to update Firestore
                    if (isBase64Document) {
                        // Get the employee document
                        const employeeRef = doc(
                            db,
                            "universities",
                            userDetails.universityId,
                            "employees",
                            employeeDocId
                        );
                        const employeeDoc = await getDoc(employeeRef);

                        if (employeeDoc.exists()) {
                            // Filter out the document from the array
                            const employeeData = employeeDoc.data();
                            const updatedDocuments = (
                                employeeData.documents || []
                            ).filter((doc) => {
                                // Use id field if it exists, otherwise compare whole document
                                return doc.id !== documentId;
                            });

                            // Update Firestore
                            await updateDoc(employeeRef, {
                                documents: updatedDocuments,
                                updatedAt: serverTimestamp(),
                            });

                            setSuccess("Document deleted successfully");
                            showSuccessAlert("Document deleted successfully");
                            // Update local state
                            setDocuments((prev) =>
                                prev.filter((doc) => doc.id !== documentId)
                            );
                        } else {
                            setError("Employee document not found");
                            showErrorAlert("Employee document not found");
                        }
                    } else {
                        try {
                            // Try to delete from Firebase Storage first using the document's stored filePath
                            if (docToDelete.filePath) {
                                // Use the exact path stored when the file was uploaded
                                console.log(
                                    "Deleting file from path:",
                                    docToDelete.filePath
                                );
                                const storageRef = ref(
                                    storage,
                                    docToDelete.filePath
                                );
                                await deleteObject(storageRef);
                            } else {
                                // Fallback to the old method if filePath is not available
                                console.log(
                                    "No filePath available, using constructed path"
                                );
                                const storageRef = ref(
                                    storage,
                                    `universities/${userDetails.universityId}/employees/${employeeId}/documents/${fileName}`
                                );
                                await deleteObject(storageRef);
                            }

                            // Update Firestore document
                            const employeeRef = doc(
                                db,
                                "universities",
                                userDetails.universityId,
                                "employees",
                                employeeDocId
                            );

                            const employeeDoc = await getDoc(employeeRef);
                            if (employeeDoc.exists()) {
                                const employeeData = employeeDoc.data();
                                const updatedDocuments = (
                                    employeeData.documents || []
                                ).filter((doc) => doc.id !== documentId);

                                await updateDoc(employeeRef, {
                                    documents: updatedDocuments,
                                    updatedAt: serverTimestamp(),
                                });

                                setSuccess("Document deleted successfully");
                                showSuccessAlert(
                                    "Document deleted successfully"
                                );

                                // Update local state
                                setDocuments((prev) =>
                                    prev.filter((doc) => doc.id !== documentId)
                                );
                            } else {
                                throw new Error("Employee document not found");
                            }
                        } catch (storageError) {
                            console.error(
                                "Error deleting from storage:",
                                storageError
                            );

                            // Even if the file deletion fails, try to remove it from Firestore
                            // This helps with cleaning up records for files that might not exist in storage
                            const employeeRef = doc(
                                db,
                                "universities",
                                userDetails.universityId,
                                "employees",
                                employeeDocId
                            );

                            const employeeDoc = await getDoc(employeeRef);
                            if (employeeDoc.exists()) {
                                const employeeData = employeeDoc.data();
                                const updatedDocuments = (
                                    employeeData.documents || []
                                ).filter((doc) => doc.id !== documentId);

                                await updateDoc(employeeRef, {
                                    documents: updatedDocuments,
                                    updatedAt: serverTimestamp(),
                                });

                                setSuccess(
                                    "Document record deleted (file may not exist in storage)"
                                );
                                showSuccessAlert("Document record deleted");

                                // Update local state
                                setDocuments((prev) =>
                                    prev.filter((doc) => doc.id !== documentId)
                                );
                            } else {
                                throw new Error("Employee document not found");
                            }
                        }
                    }
                } catch (err) {
                    console.error("Error deleting document:", err);
                    setError("An error occurred while deleting document");
                    showErrorAlert(
                        "An error occurred while deleting document: " +
                            err.message
                    );
                }
            },
            "File name does not match!",
            "Document deleted successfully"
        );
    };

    // Handler for retrying failed uploads
    const handleRetryUpload = async (documentId) => {
        try {
            if (!userDetails?.universityId) {
                showErrorAlert("Cannot determine your university");
                return;
            }

            setError(null);

            // Find the document in our local state
            const docToRetry = documents.find((doc) => doc.id === documentId);
            if (!docToRetry) {
                showErrorAlert("Document not found");
                return;
            }

            // Set loading state
            setUploading(true);

            // TODO: Implement server-side functionality to retry the upload
            // For now, we'll just show a message
            showWarningAlert(
                "This feature is not yet implemented. Please delete the document and upload again."
            );

            // Refresh documents
            const docsData = await getEmployeeDocuments(
                user.uid,
                userDetails.universityId
            );
            if (docsData.success) {
                setDocuments(docsData.documents);
            }
        } catch (err) {
            console.error("Error retrying upload:", err);
            showErrorAlert("Failed to retry upload");
        } finally {
            setUploading(false);
        }
    };

    // Get icon based on file type
    const getFileIcon = (fileName) => {
        if (!fileName) return faFileAlt;

        const extension = fileName.split(".").pop().toLowerCase();

        if (["pdf"].includes(extension)) return faFilePdf;
        if (["jpg", "jpeg", "png", "gif", "svg"].includes(extension))
            return faFileImage;
        if (["doc", "docx"].includes(extension)) return faFileWord;
        if (["xls", "xlsx", "csv"].includes(extension)) return faFileExcel;

        return faFileAlt;
    };

    // Extract skills from documents
    const extractSkillsFromDocuments = async () => {
        try {
            if (documents.length === 0) {
                showWarningAlert("No documents found to extract skills from");
                return;
            }

            setExtractingSkills(true);

            // Check if API is available
            const isApiAvailable = await checkApiHealth();
            if (!isApiAvailable) {
                showWarningAlert(
                    "Skill extraction service is currently unavailable. Please try again later."
                );
                setExtractingSkills(false);
                return;
            }

            // Filter for only resume and certificate documents
            const validDocuments = documents.filter(
                (doc) =>
                    doc.url &&
                    doc.url !== "pending_upload" &&
                    (doc.type === "resume" ||
                        doc.type === "certification" ||
                        doc.type === "certificate")
            );

            if (validDocuments.length === 0) {
                showWarningAlert("No resume or certificate documents found");
                setExtractingSkills(false);
                return;
            }

            console.log(
                `Found ${validDocuments.length} valid documents for skill extraction:`,
                validDocuments
            );

            try {
                // Extract skills from resumes and certificates
                const result = await extractSkillsFromMultipleDocuments(
                    validDocuments
                );

                if (
                    result.success &&
                    result.skills &&
                    result.skills.length > 0
                ) {
                    // Process skills to ensure proper format
                    const processedSkills = result.skills.map((skill) => {
                        // Log the raw skill data from API
                        console.log("Raw skill data from API:", skill);

                        // Keep the exact proficiency string from the API
                        const originalProficiency =
                            skill.proficiency || "Beginner";
                        console.log(
                            `Original proficiency from API for ${skill.name}: "${originalProficiency}"`
                        );

                        // Convert proficiency string to numeric value for progress bar only
                        const proficiencyValue =
                            originalProficiency === "Beginner"
                                ? 25
                                : originalProficiency === "Intermediate"
                                ? 50
                                : originalProficiency === "Advanced"
                                ? 75
                                : originalProficiency === "Expert"
                                ? 100
                                : 25; // Default to 25 (Beginner)

                        // Check if the skill is certified (is_backed is true)
                        // Convert to boolean explicitly
                        const isCertified =
                            skill.is_backed === true ||
                            skill.isCertified === true ||
                            Boolean(skill.is_backed);

                        console.log(
                            `Processing skill: ${
                                skill.name
                            }, proficiency: ${originalProficiency}, is_backed: ${
                                skill.is_backed
                            } (${typeof skill.is_backed}), isCertified: ${isCertified}`
                        );

                        return {
                            ...skill,
                            id: `skill_${Date.now()}_${Math.random()
                                .toString(36)
                                .substr(2, 9)}`,
                            proficiency: originalProficiency, // Keep exact original string
                            proficiencyValue: proficiencyValue, // For progress bar
                            isCertified: isCertified,
                            is_backed: Boolean(skill.is_backed),
                            createdAt: new Date(),
                        };
                    });

                    // Replace existing skills with extracted skills
                    const updatedSkills = result.replace
                        ? result.replace(skills)
                        : [...processedSkills];

                    // Update local state first
                    setSkills(updatedSkills);

                    // Also update processedSkills for UI rendering
                    setProcessedSkills(updatedSkills);

                    // Show success message
                    showSuccessAlert(
                        `Successfully extracted and updated ${result.skills.length} skills from your documents`
                    );

                    // Save directly to Firestore
                    try {
                        setProcessingSkills(true);

                        // Determine employee ID
                        let employeeId = user.uid;
                        let employeeDocId = user.uid;

                        // Check if this is a mock user ID from direct employee login
                        if (user.uid.startsWith("emp_")) {
                            const parts = user.uid.split("_");
                            if (parts.length >= 2) {
                                employeeId = parts[1];
                                console.log(
                                    "Extracted employeeId from mock user:",
                                    employeeId
                                );
                                employeeDocId = employeeId;
                            }
                        }

                        // Create Firestore-compatible skill objects
                        const firestoreSkills = updatedSkills.map((skill) => {
                            // Log each skill's raw data to debug
                            console.log(
                                "Processing for Firestore:",
                                JSON.stringify(skill)
                            );

                            // Ensure we're keeping original proficiency exactly as it came from API
                            const originalProficiency =
                                skill.proficiency || "Beginner";
                            console.log(
                                `Skill ${skill.name} proficiency: "${originalProficiency}"`
                            );

                            return {
                                id:
                                    skill.id ||
                                    `skill_${Date.now()}_${Math.random()
                                        .toString(36)
                                        .substr(2, 9)}`,
                                name: skill.name,
                                // Ensure original string proficiency is preserved
                                proficiency: originalProficiency,
                                isCertified:
                                    Boolean(skill.isCertified) ||
                                    Boolean(skill.is_backed),
                                notes: skill.notes || "",
                                createdAt: new Date(),
                            };
                        });

                        // Add debug logging for the final skills being saved
                        console.log(
                            "Final skills being saved to Firestore:",
                            firestoreSkills
                                .map((s) => `${s.name}: ${s.proficiency}`)
                                .join(", ")
                        );

                        console.log(
                            "Saving skills to Firestore:",
                            firestoreSkills
                        );

                        // Update the employee document
                        const employeeRef = doc(
                            db,
                            "universities",
                            userDetails.universityId,
                            "employees",
                            employeeDocId
                        );

                        await updateDoc(employeeRef, {
                            skills: firestoreSkills,
                            updatedAt: serverTimestamp(),
                        });

                        // Update both skills with the exact Firestore skills to maintain consistency
                        console.log(
                            "Setting skills state with Firestore skills",
                            firestoreSkills
                        );
                        setSkills(firestoreSkills);

                        // Generate processed skills with numeric values for UI display
                        const displaySkills = firestoreSkills.map((skill) => {
                            // Log original skill proficiency from Firestore
                            console.log(
                                `Processing display for ${skill.name}: original proficiency="${skill.proficiency}"`
                            );

                            // Get numeric value for progress bar using more robust approach
                            let proficiencyValue = 25; // Default to Beginner (25%)

                            if (typeof skill.proficiency === "string") {
                                const profString = skill.proficiency.trim();

                                if (profString === "Beginner")
                                    proficiencyValue = 25;
                                else if (profString === "Intermediate")
                                    proficiencyValue = 50;
                                else if (profString === "Advanced")
                                    proficiencyValue = 75;
                                else if (profString === "Expert")
                                    proficiencyValue = 100;
                                else proficiencyValue = 25; // Default to Beginner

                                console.log(
                                    `Mapping "${profString}" to progress value: ${proficiencyValue}%`
                                );
                            } else if (typeof skill.proficiency === "number") {
                                proficiencyValue = skill.proficiency;
                                console.log(
                                    `Using numeric proficiency: ${proficiencyValue}%`
                                );
                            } else {
                                console.log(
                                    `Unknown proficiency type, defaulting to Beginner (25%)`
                                );
                            }

                            return {
                                ...skill,
                                proficiencyValue, // Add numeric value for progress bar
                            };
                        });

                        console.log(
                            "Final processed skills for display:",
                            displaySkills
                                .map(
                                    (s) =>
                                        `${s.name}: proficiency="${s.proficiency}", value=${s.proficiencyValue}%`
                                )
                                .join(", ")
                        );

                        // Set the processed skills for UI display
                        setProcessedSkills(displaySkills);

                        // Show success alert
                        showSuccessAlert("Skills updated successfully!");
                    } catch (serverError) {
                        console.error(
                            "Error updating skills on server:",
                            serverError
                        );
                        showErrorAlert("Failed to update skills on server");
                    } finally {
                        setProcessingSkills(false);
                    }

                    // Switch to skills tab to show the extracted skills
                    setActiveTab("skills");
                } else if (
                    result.success &&
                    (!result.skills || result.skills.length === 0)
                ) {
                    // Show warning for no skills found
                    showWarningAlert(
                        "No skills could be extracted from your documents"
                    );
                } else {
                    // Show error message
                    showWarningAlert(
                        result.message ||
                            "No skills could be extracted from your documents"
                    );
                }
            } catch (error) {
                console.error("Error extracting skills:", error);
                showErrorAlert(
                    "Failed to extract skills from documents: " +
                        (error.message || "Unknown error")
                );
            }
        } catch (error) {
            console.error("Error in extraction process:", error);
            showErrorAlert(
                "An unexpected error occurred during skill extraction"
            );
        } finally {
            setExtractingSkills(false);
        }
    };

    // Format file size in a readable way
    const formatFileSize = (bytes) => {
        if (bytes < 1024) {
            return `${bytes} B`;
        } else if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        } else {
            return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        }
    };

    // Get file extension from filename
    const getFileExtension = (filename) => {
        if (!filename) return "";
        return filename.split(".").pop().toUpperCase();
    };

    // Format date for display
    const formatDate = (date) => {
        if (!date) return "—";
        if (typeof date === "string") return date;

        try {
            // Handle Firebase Timestamp
            if (date.toDate && typeof date.toDate === "function") {
                date = date.toDate();
            }

            // Format date
            return new Date(date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch (err) {
            console.error("Error formatting date:", err);
            return "Invalid date";
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    // Handle document download
    const handleDocumentDownload = async (
        downloadURL,
        fileName,
        documentObj
    ) => {
        try {
            setDownloadLoading(true);

            // Determine employee ID and document ID
            let employeeId = user.uid;
            let employeeDocId = user.uid;

            // Check if this is a mock user ID from direct employee login
            if (user.uid.startsWith("emp_")) {
                // Extract the actual employee ID from the mock user ID
                const parts = user.uid.split("_");
                if (parts.length >= 2) {
                    employeeId = parts[1];
                    console.log(
                        "Download - Extracted employeeId from mock user:",
                        employeeId
                    );
                    employeeDocId = employeeId;
                }
            }

            if (!downloadURL) {
                // If no direct URL, try to get it from storage
                if (documentObj?.filePath) {
                    try {
                        const storageRef = ref(storage, documentObj.filePath);
                        downloadURL = await getDownloadURL(storageRef);
                    } catch (err) {
                        console.error(
                            "Failed to get fresh URL from storage:",
                            err
                        );
                        showErrorAlert("Download URL not available");
                        setDownloadLoading(false);
                        return;
                    }
                } else {
                    showErrorAlert("Download URL not available");
                    setDownloadLoading(false);
                    return;
                }
            }

            // Create a temporary anchor element
            const link = document.createElement("a");
            link.href = downloadURL;
            link.setAttribute("download", fileName || "document");
            link.setAttribute("target", "_blank");
            document.body.appendChild(link);

            // Trigger download
            link.click();

            // Clean up
            document.body.removeChild(link);

            console.log(`Document downloaded successfully: ${fileName}`);
            showSuccessAlert("Document download started");
        } catch (error) {
            console.error("Error downloading document:", error);
            showErrorAlert("Failed to download document");
        } finally {
            setDownloadLoading(false);
        }
    };

    // Add a debug output for skills when they are updated
    useEffect(() => {
        if (skills.length > 0) {
            console.log("Current skills array:", skills);

            // Process the Firestore skills to add visual elements
            const processedSkills = skills.map((skill) => {
                // Convert proficiency to numeric value for progress bar
                let proficiencyValue = 0;
                if (typeof skill.proficiency === "string") {
                    proficiencyValue =
                        skill.proficiency === "Beginner"
                            ? 25
                            : skill.proficiency === "Intermediate"
                            ? 50
                            : skill.proficiency === "Advanced"
                            ? 75
                            : skill.proficiency === "Expert"
                            ? 100
                            : 25;
                } else if (typeof skill.proficiency === "number") {
                    proficiencyValue = skill.proficiency;
                }

                // Debug each skill's certification status
                console.log(
                    `Skill: ${skill.name}, proficiency: ${skill.proficiency}, proficiencyValue: ${proficiencyValue}, isCertified: ${skill.isCertified}`
                );

                return {
                    ...skill,
                    proficiencyValue, // Add numeric value for progress bar
                };
            });

            // Update the skills state with the processed skills
            setSkills(processedSkills);
        }
    }, []); // Modified dependency array to prevent infinite loop

    // Replace the old skills useEffect with this one that runs only when skillsNeedProcessing is true
    useEffect(() => {
        if (skillsNeedProcessing && skills.length > 0) {
            console.log("Processing skills for display...");
            console.log(
                "Original skills from Firestore:",
                JSON.stringify(skills)
            );

            // Process the Firestore skills to add visual elements
            const newProcessedSkills = skills.map((skill) => {
                // Log the raw skill data from Firestore
                console.log(`Raw Firestore skill [${skill.name}]:`, skill);
                console.log(
                    `Proficiency type: ${typeof skill.proficiency}, value: "${
                        skill.proficiency
                    }"`
                );

                // Convert proficiency to numeric value for progress bar
                let proficiencyValue = 0;

                // Make sure we handle the proficiency string properly with exact case matching
                if (typeof skill.proficiency === "string") {
                    // Using exact string matching to ensure correct mapping
                    const proficiencyStr = skill.proficiency.trim();
                    if (proficiencyStr === "Beginner") {
                        proficiencyValue = 25;
                    } else if (proficiencyStr === "Intermediate") {
                        proficiencyValue = 50;
                    } else if (proficiencyStr === "Advanced") {
                        proficiencyValue = 75;
                    } else if (proficiencyStr === "Expert") {
                        proficiencyValue = 100;
                    } else {
                        // Default to Beginner if string doesn't match known values
                        proficiencyValue = 25;
                    }

                    console.log(
                        `Mapped "${proficiencyStr}" to proficiency value: ${proficiencyValue}%`
                    );
                } else if (typeof skill.proficiency === "number") {
                    // If it's already a number, use it directly
                    proficiencyValue = skill.proficiency;
                    console.log(
                        `Using numeric proficiency value: ${proficiencyValue}%`
                    );
                } else {
                    // Default to Beginner if neither string nor number
                    proficiencyValue = 25;
                    console.log(
                        `Defaulting to Beginner (25%) for unknown proficiency type`
                    );
                }

                return {
                    ...skill,
                    proficiencyValue, // Add numeric value for progress bar without changing original proficiency
                };
            });

            // Log the final processed skills
            console.log(
                "Final processed skills for display:",
                newProcessedSkills
                    .map(
                        (s) =>
                            `${s.name}: ${s.proficiency} (${s.proficiencyValue}%)`
                    )
                    .join(", ")
            );

            // Update the processed skills state without modifying the original skills
            setProcessedSkills(newProcessedSkills);
            setSkillsNeedProcessing(false);
        }
    }, [skillsNeedProcessing, skills]);

    // Auto-extract skills when loading the skills tab via URL parameter
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get("tab");
        const currentPath = location.pathname;
        const isEmployeeProfilePath = currentPath === "/employee/profile";
        const isDirectTabAccess = params.has("tab") && tabParam === "skills";

        // Only trigger extraction for the exact URL the user specified
        const isExactUrl =
            isEmployeeProfilePath &&
            isDirectTabAccess &&
            Object.fromEntries(params.entries()).tab === "skills" &&
            params.toString() === "tab=skills";

        // Only trigger extraction when the URL exactly matches http://localhost:5173/employee/profile?tab=skills
        if (
            isExactUrl &&
            documents.length > 0 &&
            !extractingSkills &&
            !processingSkills &&
            !autoExtractionTriggered.current
        ) {
            // Only auto-extract if there are no existing skills
            if (processedSkills.length === 0) {
                // Check for valid documents (resume, certification, or certificate)
                const validDocuments = documents.filter(
                    (doc) =>
                        doc.url &&
                        doc.url !== "pending_upload" &&
                        (doc.type === "resume" ||
                            doc.type === "certification" ||
                            doc.type === "certificate")
                );

                if (validDocuments.length > 0) {
                    console.log(
                        "Auto-triggering skills extraction from URL parameter"
                    );
                    autoExtractionTriggered.current = true;
                    extractSkillsFromDocuments();
                } else {
                    console.log(
                        "No valid documents found for automatic skill extraction"
                    );
                }
            } else {
                console.log(
                    "Skills already exist, skipping automatic extraction"
                );
            }
        }

        // Cleanup function to reset the flag when component unmounts
        return () => {
            autoExtractionTriggered.current = false;
        };
    }, [
        location.search,
        location.pathname,
        documents,
        extractingSkills,
        processingSkills,
        processedSkills,
    ]);

    if (loading) {
        return (
            <div className="min-h-[400px] border border-gray-200 rounded-lg flex items-center justify-center">
                <EmployeePageLoader
                    isLoading={true}
                    message="Loading your profile..."
                    contentOnly={true}
                    fullscreen={false}
                />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-100 text-red-700 rounded-xl">
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="pb-6">
            {/* Profile Header */}
            <div className="bg-white rounded-lg p-5 shadow-md mb-6">
                <div className="flex flex-col md:flex-row md:items-center">
                    <div className="md:mr-6 mb-4 md:mb-0 flex justify-center md:justify-start">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl md:text-4xl font-bold">
                            {employeeData?.name?.charAt(0) ||
                                userDetails?.name?.charAt(0) ||
                                user?.displayName?.charAt(0) ||
                                userDetails?.displayName?.charAt(0) ||
                                userDetails?.fullName?.charAt(0) ||
                                "U"}
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-2xl md:text-3xl font-bold mb-2">
                            {employeeData?.name ||
                                userDetails?.name ||
                                user?.displayName ||
                                userDetails?.displayName ||
                                userDetails?.fullName ||
                                "Employee"}
                        </h1>
                        <p className="text-gray-600 text-sm md:text-base mb-2">
                            {employeeData?.position || "Associate Professor"} -{" "}
                            {employeeData?.department || "Computer Science"}
                        </p>
                        <div className="flex flex-col md:flex-row md:items-center text-sm mt-3 space-y-2 md:space-y-0 md:space-x-4">
                            <div className="flex items-center justify-center md:justify-start">
                                <FontAwesomeIcon
                                    icon={faEnvelope}
                                    className="text-blue-600 mr-2"
                                />
                                <span>
                                    {employeeData?.email ||
                                        "jane.doe@example.com"}
                                </span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start">
                                <FontAwesomeIcon
                                    icon={faPhone}
                                    className="text-blue-600 mr-2"
                                />
                                <span>
                                    {employeeData?.phone || "+1 234 567 8901"}
                                </span>
                            </div>
                            <div className="flex items-center justify-center md:justify-start">
                                <FontAwesomeIcon
                                    icon={faIdBadge}
                                    className="text-blue-600 mr-2"
                                />
                                <span>
                                    {employeeData?.employeeId || "EMP00123"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-md p-2 mb-6 overflow-x-auto">
                <div className="flex min-w-max">
                    <button
                        className={`py-2 px-4 ${
                            activeTab === "personal"
                                ? "bg-blue-100 text-blue-700 font-medium rounded-lg"
                                : "text-gray-600 hover:bg-gray-100 rounded-lg"
                        }`}
                        onClick={() => setActiveTab("personal")}
                    >
                        Personal Information
                    </button>
                    <button
                        className={`py-2 px-4 ${
                            activeTab === "documents"
                                ? "bg-blue-100 text-blue-700 font-medium rounded-lg"
                                : "text-gray-600 hover:bg-gray-100 rounded-lg"
                        }`}
                        onClick={() => setActiveTab("documents")}
                    >
                        Documents
                    </button>
                    <button
                        className={`py-2 px-4 ${
                            activeTab === "skills"
                                ? "bg-blue-100 text-blue-700 font-medium rounded-lg"
                                : "text-gray-600 hover:bg-gray-100 rounded-lg"
                        }`}
                        onClick={() => setActiveTab("skills")}
                    >
                        Skills
                    </button>
                </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === "personal" && (
                <div className="bg-white rounded-lg shadow-md p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">
                            Personal Information
                        </h2>
                        {!editMode ? (
                            <button
                                onClick={() => setEditMode(true)}
                                className="flex items-center text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <FontAwesomeIcon
                                    icon={faEdit}
                                    className="mr-1"
                                />
                                Edit Profile
                            </button>
                        ) : (
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setEditMode(false)}
                                    className="flex items-center text-sm bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    <FontAwesomeIcon
                                        icon={faTimes}
                                        className="mr-1"
                                    />
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    className="flex items-center text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <span>Saving...</span>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon
                                                icon={faCheck}
                                                className="mr-1"
                                            />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {success && (
                        <div className="mb-4 p-2 bg-green-100 text-green-700 rounded-lg">
                            {success}
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    {!editMode ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {/* Position */}
                                <div className="p-3 md:p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center mb-2">
                                        <FontAwesomeIcon
                                            icon={faBriefcase}
                                            className="text-blue-600 mr-2"
                                        />
                                        <h3 className="font-medium">
                                            Position
                                        </h3>
                                    </div>
                                    <p className="text-sm md:text-base text-gray-700">
                                        {employeeData?.position ||
                                            "Not specified"}
                                    </p>
                                </div>

                                {/* Department */}
                                <div className="p-3 md:p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center mb-2">
                                        <FontAwesomeIcon
                                            icon={faBuilding}
                                            className="text-blue-600 mr-2"
                                        />
                                        <h3 className="font-medium">
                                            Department
                                        </h3>
                                    </div>
                                    <p className="text-sm md:text-base text-gray-700">
                                        {employeeData?.department ||
                                            "Not specified"}
                                    </p>
                                </div>

                                {/* Email */}
                                <div className="p-3 md:p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center mb-2">
                                        <FontAwesomeIcon
                                            icon={faEnvelope}
                                            className="text-blue-600 mr-2"
                                        />
                                        <h3 className="font-medium">Email</h3>
                                    </div>
                                    <p className="text-sm md:text-base text-gray-700">
                                        {employeeData?.email || "Not specified"}
                                    </p>
                                </div>

                                {/* Phone */}
                                <div className="p-3 md:p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center mb-2">
                                        <FontAwesomeIcon
                                            icon={faPhone}
                                            className="text-blue-600 mr-2"
                                        />
                                        <h3 className="font-medium">Phone</h3>
                                    </div>
                                    <p className="text-sm md:text-base text-gray-700">
                                        {employeeData?.phone || "Not specified"}
                                    </p>
                                </div>
                            </div>

                            {/* Bio Section */}
                            <div className="mt-6">
                                <div className="p-3 md:p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center mb-2">
                                        <FontAwesomeIcon
                                            icon={faUser}
                                            className="text-blue-600 mr-2"
                                        />
                                        <h3 className="font-medium">Bio</h3>
                                    </div>
                                    <p className="text-sm md:text-base text-gray-700">
                                        {employeeData?.bio ||
                                            "No bio available"}
                                    </p>
                                </div>
                            </div>

                            {/* Address Section */}
                            <div className="mt-6">
                                <div className="p-3 md:p-4 rounded-lg border border-gray-200">
                                    <div className="flex items-center mb-2">
                                        <FontAwesomeIcon
                                            icon={faBuilding}
                                            className="text-blue-600 mr-2"
                                        />
                                        <h3 className="font-medium">Address</h3>
                                    </div>
                                    <p className="text-sm md:text-base text-gray-700">
                                        {employeeData?.address ||
                                            "No address available"}
                                    </p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <form className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Department and Position are read-only */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Position
                                    </label>
                                    <input
                                        type="text"
                                        value={
                                            employeeData?.position ||
                                            "Not specified"
                                        }
                                        disabled
                                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
                                    />
                                    <small className="text-gray-500">
                                        Position cannot be changed
                                    </small>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        value={
                                            employeeData?.department ||
                                            "Not specified"
                                        }
                                        disabled
                                        className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
                                    />
                                    <small className="text-gray-500">
                                        Department cannot be changed
                                    </small>
                                </div>

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Name */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Bio
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows="4"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                ></textarea>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {activeTab === "documents" && (
                <div className="bg-white rounded-lg shadow-md p-5">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Documents</h2>
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
                                        Document Category*
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
                                            Certificate
                                        </option>
                                        <option value="degree">
                                            Degree/Diploma
                                        </option>
                                        <option value="training">
                                            Training Document
                                        </option>
                                        <option value="identification">
                                            ID Document
                                        </option>
                                        <option value="contract">
                                            Contract
                                        </option>
                                        <option value="transcript">
                                            Academic Transcript
                                        </option>
                                        <option value="reference">
                                            Reference Letter
                                        </option>
                                        <option value="other">Other</option>
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
                                    File*
                                </label>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                />
                                {selectedFile && (
                                    <div className="mt-2 flex items-center text-sm text-gray-600">
                                        <span className="mr-2">
                                            <FontAwesomeIcon
                                                icon={getFileIcon(
                                                    selectedFile.name
                                                )}
                                            />
                                        </span>
                                        <div>
                                            <p className="font-medium">
                                                {selectedFile.name}
                                            </p>
                                            <p>
                                                {formatFileSize(
                                                    selectedFile.size
                                                )}{" "}
                                                -{" "}
                                                {getFileExtension(
                                                    selectedFile.name
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Maximum file size: 10MB. Supported formats:
                                    PDF, DOC, DOCX, JPG, PNG
                                </p>
                            </div>

                            {uploading && (
                                <div className="mb-4">
                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full"
                                            style={{
                                                width: `${uploadProgress}%`,
                                            }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-center text-gray-500 mt-1">
                                        Uploading: {uploadProgress}%
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setIsDocumentFormOpen(false)}
                                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDocumentUpload}
                                    disabled={!selectedFile || uploading}
                                    className={`px-3 py-1 rounded-lg ${
                                        selectedFile && !uploading
                                            ? "bg-[#9AADEA] text-white hover:bg-[#7b8edc]"
                                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    } transition`}
                                >
                                    {uploading
                                        ? "Uploading..."
                                        : "Upload Document"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Document categories with tabs */}
                    {documents && documents.length > 0 ? (
                        <div>
                            {/* Category tabs */}
                            <div className="border-b border-gray-200 mb-4">
                                <nav
                                    className="-mb-px flex space-x-4"
                                    aria-label="Document categories"
                                >
                                    <button
                                        onClick={() =>
                                            setActiveDocumentFilter("all")
                                        }
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            !activeDocumentFilter ||
                                            activeDocumentFilter === "all"
                                                ? "border-[#9AADEA] text-[#9AADEA]"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                    >
                                        All Documents
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveDocumentFilter("resume")
                                        }
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeDocumentFilter === "resume"
                                                ? "border-[#9AADEA] text-[#9AADEA]"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                    >
                                        Resumes/CVs
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveDocumentFilter(
                                                "certification"
                                            )
                                        }
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeDocumentFilter ===
                                            "certification"
                                                ? "border-[#9AADEA] text-[#9AADEA]"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                    >
                                        Certificates
                                    </button>
                                    <button
                                        onClick={() =>
                                            setActiveDocumentFilter("other")
                                        }
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeDocumentFilter === "other"
                                                ? "border-[#9AADEA] text-[#9AADEA]"
                                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                        }`}
                                    >
                                        Other Documents
                                    </button>
                                </nav>
                            </div>

                            {/* Documents List */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                File
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Category
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
                                        {documents
                                            .filter(
                                                (document) =>
                                                    !activeDocumentFilter ||
                                                    activeDocumentFilter ===
                                                        "all" ||
                                                    document.type ===
                                                        activeDocumentFilter ||
                                                    (activeDocumentFilter ===
                                                        "other" &&
                                                        document.type !==
                                                            "resume" &&
                                                        document.type !==
                                                            "certificate")
                                            )
                                            .map((document) => (
                                                <tr
                                                    key={document.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <FontAwesomeIcon
                                                                icon={getFileIcon(
                                                                    document.fileName ||
                                                                        document.name ||
                                                                        ""
                                                                )}
                                                                className="text-blue-500 mr-3"
                                                            />
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                                                    {document.fileName ||
                                                                        document.name ||
                                                                        "Untitled Document"}
                                                                </p>
                                                                <p className="text-xs text-gray-500">
                                                                    {getFileExtension(
                                                                        document.fileName ||
                                                                            document.name ||
                                                                            ""
                                                                    )}
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
                                                                document.uploadedAt ||
                                                                document.createdAt?.toDate?.() ||
                                                                document.createdAt
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
                                                                disabled={
                                                                    downloadLoading
                                                                }
                                                                className={`text-blue-600 hover:text-blue-800 ${
                                                                    downloadLoading
                                                                        ? "opacity-50 cursor-not-allowed"
                                                                        : ""
                                                                }`}
                                                                title="Download document"
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={
                                                                        faDownload
                                                                    }
                                                                />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handleDeleteDocument(
                                                                        document.id,
                                                                        document.fileName ||
                                                                            document.name
                                                                    )
                                                                }
                                                                className="text-red-600 hover:text-red-800"
                                                                title="Delete document"
                                                            >
                                                                <FontAwesomeIcon
                                                                    icon={
                                                                        faTrashAlt
                                                                    }
                                                                />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}

                                        {documents.filter((doc) => {
                                            if (
                                                !activeDocumentFilter ||
                                                activeDocumentFilter === "all"
                                            )
                                                return true;
                                            if (
                                                activeDocumentFilter ===
                                                    "resume" &&
                                                doc.type === "resume"
                                            )
                                                return true;
                                            if (
                                                activeDocumentFilter ===
                                                    "certification" &&
                                                (doc.type === "certification" ||
                                                    doc.type === "certificate")
                                            )
                                                return true;
                                            if (
                                                activeDocumentFilter ===
                                                    "other" &&
                                                doc.type !== "resume" &&
                                                doc.type !== "certificate" &&
                                                doc.type !== "certification"
                                            )
                                                return true;
                                            return false;
                                        }).length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="px-6 py-8 text-center"
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faFileAlt}
                                                        className="text-4xl mb-3"
                                                    />
                                                    <p className="text-gray-500">
                                                        No documents found in
                                                        this category
                                                    </p>
                                                    <button
                                                        onClick={() =>
                                                            setIsDocumentFormOpen(
                                                                true
                                                            )
                                                        }
                                                        className="mt-2 text-blue-500 hover:text-blue-700"
                                                    >
                                                        Upload a document
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                            <FontAwesomeIcon
                                icon={faFileAlt}
                                className="text-4xl mb-3"
                            />
                            <p>No documents uploaded yet</p>
                            <button
                                onClick={() => setIsDocumentFormOpen(true)}
                                className="mt-3 text-blue-500 hover:text-blue-700 hover:underline"
                            >
                                Upload your first document
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "skills" && (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-800">
                            Skills
                        </h3>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => extractSkillsFromDocuments()}
                                className={`flex items-center text-sm px-4 py-2 rounded-md ${
                                    extractingSkills || documents.length === 0
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                }`}
                                disabled={
                                    extractingSkills ||
                                    documents.length === 0 ||
                                    processingSkills
                                }
                                title={
                                    documents.length === 0
                                        ? "Upload documents first to extract skills"
                                        : ""
                                }
                            >
                                {extractingSkills ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon
                                            icon={faMagic}
                                            className="mr-2"
                                        />
                                        Extract Skills from Documents
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* No documents message */}
                    {!extractingSkills && documents.length === 0 && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-700 flex items-center">
                                <FontAwesomeIcon
                                    icon={faInfoCircle}
                                    className="mr-2"
                                />
                                Upload documents in the Documents tab first to
                                extract skills automatically.
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                            {error}
                        </div>
                    )}

                    {/* Skills display */}
                    <div className="overflow-x-auto mt-4">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Skill
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Proficiency
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Certified
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {processedSkills.length > 0 ? (
                                    processedSkills.map((skill) => (
                                        <tr key={skill.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-medium text-gray-900">
                                                    {skill.name}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="w-full flex items-center">
                                                    <div className="mr-2 min-w-[70px] text-xs">
                                                        {skill.proficiency ||
                                                            "Beginner"}
                                                    </div>
                                                    <div className="w-32 bg-gray-200 rounded-full h-2.5 relative">
                                                        <div
                                                            className="bg-purple-600 h-2.5 rounded-full"
                                                            style={{
                                                                width: `${
                                                                    skill.proficiencyValue ||
                                                                    (skill.proficiency ===
                                                                    "Beginner"
                                                                        ? 25
                                                                        : skill.proficiency ===
                                                                          "Intermediate"
                                                                        ? 50
                                                                        : skill.proficiency ===
                                                                          "Advanced"
                                                                        ? 75
                                                                        : 100)
                                                                }%`,
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span
                                                    title={`isCertified: ${skill.isCertified}, is_backed: ${skill.is_backed}`}
                                                >
                                                    {Boolean(
                                                        skill.isCertified
                                                    ) ||
                                                    Boolean(skill.is_backed) ? (
                                                        <span className="text-green-600">
                                                            <FontAwesomeIcon
                                                                icon={faCheck}
                                                                className="mr-1"
                                                            />
                                                            Yes
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">
                                                            <FontAwesomeIcon
                                                                icon={faTimes}
                                                                className="mr-1"
                                                            />
                                                            No
                                                        </span>
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="px-6 py-8 text-center"
                                        >
                                            <FontAwesomeIcon
                                                icon={faGraduationCap}
                                                className="text-gray-400 text-3xl mb-2"
                                            />
                                            <p className="text-gray-500 text-center">
                                                No skills extracted yet.
                                            </p>
                                            <p className="mt-2 text-sm text-gray-500 text-center">
                                                Upload documents and use the
                                                "Extract Skills from Documents"
                                                button to automatically extract
                                                your skills.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeProfile;
