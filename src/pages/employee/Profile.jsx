import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  getEmployeeData, 
  updateEmployeeProfile,
  getEmployeeDocuments,
  uploadEmployeeDocument,
  deleteEmployeeDocument,
  getEmployeeSkills,
  addEmployeeSkill,
  updateEmployeeSkill,
  deleteEmployeeSkill
} from '../../services/employeeService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
  faEdit
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import EmployeePageLoader from '../../components/employee/EmployeePageLoader';
import { getStorage, ref } from 'firebase/storage';
import { db, storage, auth } from '../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
// Import custom alert components
import showSuccessAlert from '../../components/Alerts/SuccessAlert';
import showErrorAlert from '../../components/Alerts/ErrorAlert';
import showWarningAlert from '../../components/Alerts/WarningAlert';
import showDeleteConfirmation from '../../components/Alerts/DeleteAlert';

// Document Upload Modal Component
const DocumentUploadModal = ({ isOpen, onClose, onUpload, loading }) => {
  const fileInputRef = useRef(null);
  const [documentType, setDocumentType] = useState('certification');
  const [documentDescription, setDocumentDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);

  // Reset form completely when modal opens or closes
  useEffect(() => {
    resetForm();
  }, [isOpen]);

  // Document type options
  const documentTypeOptions = [
    { value: 'certification', label: 'Certification' },
    { value: 'resume', label: 'Resume/CV' },
    { value: 'degree', label: 'Degree/Diploma' },
    { value: 'training', label: 'Training Document' },
    { value: 'identification', label: 'ID Document' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }
    
    // Call upload and reset form upon success (handled in parent component)
    onUpload(selectedFile, documentType, documentDescription);
  };
  
  const resetForm = () => {
    setDocumentDescription('');
    setSelectedFile(null);
    setDocumentType('certification');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) return faFilePdf;
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(extension)) return faFileImage;
    if (['doc', 'docx'].includes(extension)) return faFileWord;
    if (['xls', 'xlsx', 'csv'].includes(extension)) return faFileExcel;
    
    return faFileAlt;
  };

  // Function to format file size in a readable way
  const formatFileSize = (sizeInBytes) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
      }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Upload Document</h2>
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
            <button onClick={() => setError(null)} aria-label="Dismiss error" className="text-red-500 hover:text-red-700">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Type Field */}
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">Document Type<span className="text-red-500">*</span></label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              disabled={loading}
              required
            >
              {documentTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Select the type of document you're uploading</p>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">Description</label>
            <input 
              type="text"
              value={documentDescription}
              onChange={(e) => setDocumentDescription(e.target.value)}
              placeholder="E.g., 'My resume updated May 2023' or 'Microsoft Certification'"
              className="w-full p-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">Add a short description to help identify this document later</p>
          </div>

          {/* File Upload Field */}
          <div>
            <label className="block text-gray-700 font-medium mb-1 text-sm">File<span className="text-red-500">*</span></label>
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
                ${selectedFile 
                  ? 'border-blue-300 bg-blue-50 hover:bg-blue-100' 
                  : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'}`}
              onClick={() => {
                if (fileInputRef.current && !loading) {
                  fileInputRef.current.click();
                }
              }}
            >
              {selectedFile ? (
                <div className="py-2">
                  <FontAwesomeIcon icon={getFileIcon(selectedFile.name)} className="text-blue-500 text-4xl mb-3" />
                  <p className="text-sm font-medium break-all text-gray-800">{selectedFile.name}</p>
                  <div className="flex items-center justify-center mt-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {formatFileSize(selectedFile.size)}
                    </span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {selectedFile.name.split('.').pop().toUpperCase()}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
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
                  <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-3xl mb-3" />
                  <p className="text-gray-500 font-medium mb-1">Click to browse files</p>
                  <p className="text-gray-400 text-sm">or drag and drop</p>
                  <p className="text-xs text-gray-400 mt-2">Supported files: PDF, Word, Excel, Images</p>
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
                ${loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'}`}
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center">
                  <FontAwesomeIcon icon={faUpload} className="mr-2" />
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
  const [activeTab, setActiveTab] = useState('personal');
  
  // Refs for scrolling
  const skillsSectionRef = useRef(null);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    bio: '',
    address: '',
    education: ''
  });
  
  // Document upload
  const fileInputRef = useRef(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Skills state
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [skillForm, setSkillForm] = useState({
    name: '',
    category: 'technical',
    proficiency: 50,
    notes: ''
  });
  
  // Debug Firebase Storage on component mount
  useEffect(() => {
    console.log("===== FIREBASE STORAGE DEBUGGING =====");
    console.log("Storage instance:", storage);
    
    try {
      // Test if we can create a storage reference
      const testRef = ref(storage, 'test/debug.txt');
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
    const tabParam = params.get('tab');
    
    if (tabParam && ['personal', 'skills', 'documents'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (location.state?.activeTab) {
      // Also support the previous approach with location state
      setActiveTab(location.state.activeTab);
      
      // Update URL to match the state
      const params = new URLSearchParams(location.search);
      params.set('tab', location.state.activeTab);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [location.search, location.state]);
  
  // Update URL when tab changes
  useEffect(() => {
    if (activeTab) {
      const params = new URLSearchParams(location.search);
      params.set('tab', activeTab);
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, [activeTab]);
  
  // Check for active tab in navigation state
  useEffect(() => {
    // Small delay to ensure DOM elements are rendered
    setTimeout(() => {
      if (activeTab === 'skills' && skillsSectionRef.current) {
        skillsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 300);
  }, [activeTab]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        if (userDetails && userDetails.universityId) {
          setLoading(true);
          
          // Fetch employee data
          const empData = await getEmployeeData(user.uid, userDetails.universityId);
          if (empData.success) {
            setEmployeeData(empData.data);
            
            // Initialize form data
            setFormData({
              name: empData.data.name || user.displayName || '',
              email: empData.data.email || user.email || '',
              phone: empData.data.phone || '',
              position: empData.data.position || '',
              department: empData.data.department || '',
              bio: empData.data.bio || '',
              address: empData.data.address || '',
              education: empData.data.education || ''
            });
          } else {
            setError('Failed to load employee data');
          }
          
          // Fetch documents
          const docsData = await getEmployeeDocuments(user.uid, userDetails.universityId);
          if (docsData.success) {
            console.log("Documents loaded:", docsData.documents);
            setDocuments(docsData.documents);
          } else {
            console.error("Failed to load documents:", docsData.message);
          }
          
          // Fetch skills
          const skillsData = await getEmployeeSkills(user.uid, userDetails.universityId);
          if (skillsData.success) {
            setSkills(skillsData.skills || []);
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      if (!userDetails || !userDetails.universityId) {
        setError('User details not available');
        setSaving(false);
        return;
      }
      
      const result = await updateEmployeeProfile(user.uid, userDetails.universityId, formData);
      
      if (result.success) {
        setSuccess('Profile updated successfully');
        setEditMode(false);
        
        // Update local state
        setEmployeeData(prev => ({
          ...prev,
          ...formData
        }));
      } else {
        setError(result.message || 'Failed to update profile');
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
  const handleDocumentUpload = async (file, docType, description) => {
    if (!file || !userDetails?.universityId) {
      showErrorAlert(!file ? 'No file selected' : 'Cannot determine your university');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      // Debug before upload
      console.log("===== UPLOAD DEBUGGING =====");
      console.log("File to upload:", file);
      console.log("Auth state:", auth.currentUser);
      console.log("Storage instance:", storage);
      console.log("User ID:", user.uid);
      console.log("University ID:", userDetails.universityId);
      
      // Check if the storage instance is valid
      if (!storage) {
        console.error("Storage instance is not available");
        setError("Storage connection not available. Please refresh the page.");
        showErrorAlert("Storage connection not available. Please refresh the page.");
        setUploading(false);
        return;
      }
      
      // Get file extension and create additional metadata
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const fileSize = file.size;
      const fileType = file.type || `application/${fileExtension}`;
      
      // Prepare metadata to enrich the document object
      const documentMetadata = {
        fileSize,
        fileType,
        originalName: file.name,
        uploadedBy: user.displayName || user.email || "Employee",
        type: docType,  // Document type from form
        description: description || "",
        createdAt: new Date().toISOString(),
        uploadStatus: 'completed'
      };
      
      // Upload the document
      const result = await uploadEmployeeDocument(
        user.uid, 
        userDetails.universityId, 
        file,
        docType,
        description
      );
      
      console.log("Upload result:", result);
      console.log("===== END UPLOAD DEBUGGING =====");
      
      if (result.success) {
        // Create a more complete document object by combining the result with our metadata
        const enhancedDocument = {
          ...result.document,  // This contains name, url, etc.
          ...documentMetadata,
          id: result.document.id || `doc_${Date.now()}`,
        };
        
        // Update document in Firestore with the enhanced data
        try {
          const employeeRef = doc(db, 'universities', userDetails.universityId, 'employees', user.uid);
          const employeeDoc = await getDoc(employeeRef);
          
          if (employeeDoc.exists()) {
            const employeeData = employeeDoc.data();
            const currentDocuments = employeeData.documents || [];
            
            // Find the document we just uploaded and update it with enhanced metadata
            const updatedDocuments = currentDocuments.map(doc => {
              if (doc.name === enhancedDocument.name) {
                return enhancedDocument;
              }
              return doc;
            });
            
            // Update Firestore
            await updateDoc(employeeRef, {
              documents: updatedDocuments
            });
            
            console.log("Enhanced document metadata saved");
          }
        } catch (err) {
          console.error("Warning: Could not save enhanced metadata", err);
          // Continue anyway as the document was uploaded successfully
        }
        
        setSuccess('Document uploaded successfully');
        showSuccessAlert('Document uploaded successfully');
        
        // Refresh documents
        const docsData = await getEmployeeDocuments(user.uid, userDetails.universityId);
        if (docsData.success) {
          setDocuments(docsData.documents);
        }
        
        // Close modal and reset state
        setIsUploadModalOpen(false);
      } else {
        setError(result.message || 'Failed to upload document');
        showErrorAlert(result.message || 'Failed to upload document');
      }
    } catch (err) {
      console.error("Error uploading document:", err);
      console.error("Error details:", {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      setError("An error occurred while uploading document");
      showErrorAlert("An error occurred while uploading document");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId, fileName) => {
    showWarningAlert(
      'Are you sure you want to delete this document?',
      async () => {
    try {
      setError(null);
      setSuccess(null);
      
      if (!userDetails || !userDetails.universityId) {
        setError('User details not available');
            showErrorAlert('User details not available');
        return;
      }
      
          // Find the document to check if it's using base64
          const docToDelete = documents.find(doc => doc.id === documentId);
          const isBase64Document = docToDelete && docToDelete.base64Content;
          
          // If it's a base64 document, we only need to update Firestore
          if (isBase64Document) {
            // Get the employee document
            const employeeRef = doc(db, 'universities', userDetails.universityId, 'employees', user.uid);
            const employeeDoc = await getDoc(employeeRef);
            
            if (employeeDoc.exists()) {
              // Filter out the document from the array
              const employeeData = employeeDoc.data();
              const updatedDocuments = (employeeData.documents || []).filter(doc => {
                // Use id field if it exists, otherwise compare whole document
                return doc.id !== documentId;
              });
              
              // Update Firestore
              await updateDoc(employeeRef, {
                documents: updatedDocuments,
                updatedAt: serverTimestamp()
              });
              
              setSuccess('Document deleted successfully');
              showSuccessAlert('Document deleted successfully');
              // Update local state
              setDocuments(prev => prev.filter(doc => doc.id !== documentId));
            } else {
              setError('Employee document not found');
              showErrorAlert('Employee document not found');
            }
          } else {
            // For regular Firebase Storage documents, use the deleteEmployeeDocument function
      const result = await deleteEmployeeDocument(
        user.uid,
        userDetails.universityId,
        documentId,
        fileName
      );
      
      if (result.success) {
        setSuccess('Document deleted successfully');
              showSuccessAlert('Document deleted successfully');
        
        // Update local state
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } else {
        setError(result.message || 'Failed to delete document');
              showErrorAlert(result.message || 'Failed to delete document');
            }
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      setError("An error occurred while deleting document");
          showErrorAlert("An error occurred while deleting document");
    }
      }
    );
  };

  // Handler for retrying failed uploads
  const handleRetryUpload = async (documentId) => {
    try {
      if (!userDetails?.universityId) {
        showErrorAlert('Cannot determine your university');
        return;
      }
      
      setError(null);
      
      // Find the document in our local state
      const docToRetry = documents.find(doc => doc.id === documentId);
      if (!docToRetry) {
        showErrorAlert('Document not found');
        return;
      }
      
      // Set loading state
      setUploading(true);
      
      // TODO: Implement server-side functionality to retry the upload
      // For now, we'll just show a message
      showWarningAlert('This feature is not yet implemented. Please delete the document and upload again.');
      
      // Refresh documents
      const docsData = await getEmployeeDocuments(user.uid, userDetails.universityId);
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
    
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) return faFilePdf;
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) return faFileImage;
    if (['doc', 'docx'].includes(extension)) return faFileWord;
    if (['xls', 'xlsx', 'csv'].includes(extension)) return faFileExcel;
    
    return faFileAlt;
  };

  const handleRemoveSkill = (skillId) => {
    showWarningAlert(
      'Are you sure you want to delete this skill?',
      () => deleteSkill(skillId),
      'Yes, Delete',
      'Cancel',
      'Skill deleted successfully'
    );
  };

  const resetSkillForm = () => {
    setSkillForm({
      name: '',
      category: 'technical',
      proficiency: 50,
      notes: ''
    });
  };

  const handleEditSkill = (skill) => {
    setEditingSkill(skill);
    setIsAddingSkill(true);
    setSkillForm({
      name: skill.name,
      category: skill.category || 'technical',
      proficiency: skill.proficiency || 50,
      notes: skill.notes || ''
    });
    
    // Scroll to the form
    if (skillsSectionRef.current) {
      skillsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAddSkill = () => {
    setIsAddingSkill(true);
    setEditingSkill(null);
    resetSkillForm();
  };

  const handleCancelSkill = () => {
    setIsAddingSkill(false);
    setEditingSkill(null);
    resetSkillForm();
  };

  const handleSaveSkill = async () => {
    try {
      setError(null);
      setSuccess(null);
      
      if (!userDetails || !userDetails.universityId) {
        setError('User details not available');
        return;
      }
      
      if (!skillForm.name) {
        setError('Skill name is required');
        return;
      }
      
      let result;
      
      if (editingSkill) {
        // Update existing skill
        result = await updateEmployeeSkill(
          user.uid,
          userDetails.universityId,
          editingSkill.id,
          skillForm
        );
      } else {
        // Add new skill
        result = await addEmployeeSkill(
          user.uid,
          userDetails.universityId,
          skillForm
        );
      }
      
      if (result.success) {
        setSuccess(editingSkill ? 'Skill updated successfully' : 'Skill added successfully');
        
        // Refresh skills
        const skillsData = await getEmployeeSkills(user.uid, userDetails.universityId);
        if (skillsData.success) {
          setSkills(skillsData.skills || []);
        }
        
        // Reset form
        setIsAddingSkill(false);
        setEditingSkill(null);
        resetSkillForm();
      } else {
        setError(result.message || `Failed to ${editingSkill ? 'update' : 'add'} skill`);
      }
    } catch (err) {
      console.error(`Error ${editingSkill ? 'updating' : 'adding'} skill:`, err);
      setError(`An error occurred while ${editingSkill ? 'updating' : 'adding'} skill`);
    }
  };

  const deleteSkill = async (skillId) => {
    try {
      setError(null);
      setSuccess(null);
      
      if (!userDetails || !userDetails.universityId) {
        setError('User details not available');
        return;
      }
      
      const result = await deleteEmployeeSkill(
        user.uid,
        userDetails.universityId,
        skillId
      );
      
      if (result.success) {
        setSuccess('Skill deleted successfully');
        
        // Update local state
        setSkills(prev => prev.filter(skill => skill.id !== skillId));
      } else {
        setError(result.message || 'Failed to delete skill');
      }
    } catch (err) {
      console.error("Error deleting skill:", err);
      setError("An error occurred while deleting skill");
    }
  };

  if (loading) {
    return <EmployeePageLoader isLoading={true} message="Loading your profile..." />;
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
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="md:mr-6 mb-4 md:mb-0 flex justify-center md:justify-start">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl md:text-4xl font-bold">
              {employeeData?.name?.charAt(0) || userDetails?.name?.charAt(0) || user?.displayName?.charAt(0) || userDetails?.displayName?.charAt(0) || userDetails?.fullName?.charAt(0) || 'U'}
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{employeeData?.name || userDetails?.name || user?.displayName || userDetails?.displayName || userDetails?.fullName || 'Employee'}</h1>
            <p className="text-gray-600 text-sm md:text-base mb-2">{employeeData?.position || 'Associate Professor'} - {employeeData?.department || 'Computer Science'}</p>
            <div className="flex flex-col md:flex-row md:items-center text-sm mt-3 space-y-2 md:space-y-0 md:space-x-4">
              <div className="flex items-center justify-center md:justify-start">
                <FontAwesomeIcon icon={faEnvelope} className="text-blue-500 mr-2" />
                <span>{employeeData?.email || 'jane.doe@example.com'}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start">
                <FontAwesomeIcon icon={faPhone} className="text-blue-500 mr-2" />
                <span>{employeeData?.phone || '+1 234 567 8901'}</span>
              </div>
              <div className="flex items-center justify-center md:justify-start">
                <FontAwesomeIcon icon={faIdBadge} className="text-blue-500 mr-2" />
                <span>{employeeData?.employeeId || 'EMP00123'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-md p-2 mb-6 overflow-x-auto">
        <div className="flex min-w-max">
          <button
            className={`py-2 px-4 ${activeTab === 'personal' ? 'bg-blue-100 text-blue-700 font-medium rounded-lg' : 'text-gray-600 hover:bg-gray-100 rounded-lg'}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Information
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'skills' ? 'bg-blue-100 text-blue-700 font-medium rounded-lg' : 'text-gray-600 hover:bg-gray-100 rounded-lg'}`}
            onClick={() => setActiveTab('skills')}
          >
            Skills
          </button>
          <button
            className={`py-2 px-4 ${activeTab === 'documents' ? 'bg-blue-100 text-blue-700 font-medium rounded-lg' : 'text-gray-600 hover:bg-gray-100 rounded-lg'}`}
            onClick={() => setActiveTab('documents')}
          >
            Documents
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'personal' && (
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Personal Information</h2>
            {!editMode ? (
              <button 
                onClick={() => setEditMode(true)} 
                className="flex items-center text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FontAwesomeIcon icon={faEdit} className="mr-1" />
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-2">
                <button 
                  onClick={() => setEditMode(false)} 
                  className="flex items-center text-sm bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} className="mr-1" />
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
                      <FontAwesomeIcon icon={faCheck} className="mr-1" />
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
                <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FontAwesomeIcon icon={faBriefcase} className="text-blue-500 mr-2" />
                    <h3 className="font-medium">Position</h3>
                  </div>
                  <p className="text-sm md:text-base text-gray-700">{employeeData?.position || 'Not specified'}</p>
                </div>
                
            {/* Department */}
            <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon={faBuilding} className="text-blue-500 mr-2" />
                <h3 className="font-medium">Department</h3>
              </div>
                  <p className="text-sm md:text-base text-gray-700">{employeeData?.department || 'Not specified'}</p>
                </div>
                
                {/* Email */}
                <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FontAwesomeIcon icon={faEnvelope} className="text-blue-500 mr-2" />
                    <h3 className="font-medium">Email</h3>
                  </div>
                  <p className="text-sm md:text-base text-gray-700">{employeeData?.email || 'Not specified'}</p>
            </div>
            
                {/* Phone */}
            <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                    <FontAwesomeIcon icon={faPhone} className="text-blue-500 mr-2" />
                    <h3 className="font-medium">Phone</h3>
                  </div>
                  <p className="text-sm md:text-base text-gray-700">{employeeData?.phone || 'Not specified'}</p>
                </div>
              </div>
              
              {/* Bio Section */}
              <div className="mt-6">
                <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FontAwesomeIcon icon={faUser} className="text-blue-500 mr-2" />
                    <h3 className="font-medium">Bio</h3>
                  </div>
                  <p className="text-sm md:text-base text-gray-700">{employeeData?.bio || 'No bio available'}</p>
            </div>
          </div>
          
              {/* Address Section */}
              <div className="mt-6">
                <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FontAwesomeIcon icon={faBuilding} className="text-blue-500 mr-2" />
                    <h3 className="font-medium">Address</h3>
                  </div>
                  <p className="text-sm md:text-base text-gray-700">{employeeData?.address || 'No address available'}</p>
                </div>
              </div>
            </>
          ) : (
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Department and Position are read-only */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Position</label>
                  <input
                    type="text"
                    value={employeeData?.position || 'Not specified'}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
                  />
                  <small className="text-gray-500">Position cannot be changed</small>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <input
                    type="text"
                    value={employeeData?.department || 'Not specified'}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
                  />
                  <small className="text-gray-500">Department cannot be changed</small>
                </div>
                
                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
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
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
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
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
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
                <label className="block text-sm font-medium text-gray-700">Address</label>
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
                <label className="block text-sm font-medium text-gray-700">Bio</label>
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

      {activeTab === 'skills' && (
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6" ref={skillsSectionRef}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Skills</h2>
            {!isAddingSkill && (
            <button 
              onClick={handleAddSkill} 
              className="flex items-center text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-1" />
              Add Skill
            </button>
            )}
          </div>
          
          {error && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 rounded-lg">
              {success}
            </div>
          )}
          
          {/* Add/Edit Skill Form */}
          {isAddingSkill && (
            <div className="mb-6 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium mb-3">
                {editingSkill ? "Edit Skill" : "Add New Skill"}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={skillForm.category}
                    onChange={(e) => 
                      setSkillForm({...skillForm, category: e.target.value})
                    }
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="technical">Technical</option>
                    <option value="soft">Soft Skill</option>
                    <option value="language">Language</option>
                    <option value="certification">Certification</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skill Name*
                  </label>
                  <input
                    type="text"
                    value={skillForm.name}
                    onChange={(e) => 
                      setSkillForm({...skillForm, name: e.target.value})
                    }
                    placeholder="e.g., JavaScript, Leadership, Communication"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proficiency Level* ({skillForm.proficiency}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={skillForm.proficiency}
                  onChange={(e) => 
                    setSkillForm({...skillForm, proficiency: parseInt(e.target.value)})
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
                    setSkillForm({...skillForm, notes: e.target.value})
                  }
                  placeholder="Additional details about this skill"
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelSkill}
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSkill}
                  disabled={!skillForm.name}
                  className={`px-3 py-1 rounded-lg ${
                    skillForm.name
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  } transition`}
                >
                  {editingSkill ? "Update Skill" : "Add Skill"}
                </button>
              </div>
            </div>
          )}
          
          {/* Skills List */}
          <div className="space-y-4">
            {skills.length > 0 ? (
              skills.map((skill) => (
                <div key={skill.id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                    <div>
                      <h4 className="font-medium">{skill.name}</h4>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {skill.category ? skill.category.charAt(0).toUpperCase() + skill.category.slice(1) : 'Technical'}
                      </span>
                    </div>
                  <div className="flex space-x-2">
                    <button 
                        onClick={() => handleEditSkill(skill)}
                        className="text-blue-600 hover:text-blue-800"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      onClick={() => handleRemoveSkill(skill.id)}
                        className="text-red-600 hover:text-red-800"
                    >
                      <FontAwesomeIcon icon={faTrashAlt} />
                    </button>
                  </div>
                </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${skill.proficiency}%` }}
                  ></div>
                </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Beginner</span>
                    <span>Intermediate</span>
                    <span>Advanced</span>
                  <span>Expert</span>
                  </div>
                  
                  {skill.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic">{skill.notes}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                <FontAwesomeIcon icon={faGraduationCap} className="text-gray-400 text-3xl mb-2" />
                <p className="text-gray-500">No skills added yet.</p>
                <button 
                  onClick={handleAddSkill}
                  className="mt-3 text-blue-500 hover:text-blue-700 hover:underline"
                >
                  Add your first skill
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Documents</h2>
            <div className="flex space-x-2">
              <button 
                onClick={async () => {
                  try {
                    // Show loading state
                    setLoading(true);
                    
                    const docsData = await getEmployeeDocuments(user.uid, userDetails.universityId);
                    if (docsData.success) {
                      setDocuments(docsData.documents);
                      showSuccessAlert('Documents refreshed');
                    } else {
                      showErrorAlert('Failed to refresh documents');
                    }
                    // End loading state
                    setLoading(false);
                  } catch (err) {
                    showErrorAlert('Error refreshing documents');
                    console.error(err);
                    setLoading(false);
                  }
                }}
                className="flex items-center text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-300 transition-colors mr-2"
              >
                <FontAwesomeIcon icon={faFileAlt} className="mr-1" />
                Refresh
              </button>
              <button 
                onClick={handleUploadDocument} 
                className="flex items-center text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={uploading}
              >
                {uploading ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUpload} className="mr-1" />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Document Upload Modal */}
          <DocumentUploadModal 
            isOpen={isUploadModalOpen}
            onClose={handleCloseUploadModal}
            onUpload={handleDocumentUpload}
            loading={uploading}
          />
          
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FontAwesomeIcon icon={faFileAlt} className="text-4xl mb-3" />
              <p>No documents uploaded yet</p>
              <button 
                onClick={handleUploadDocument}
                className="mt-3 text-blue-500 hover:text-blue-700 hover:underline"
              >
                Upload your first document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {documents.map((document) => (
                <div 
                  key={document.id} 
                  className="border border-gray-200 rounded-lg p-4 flex flex-col hover:bg-gray-50 relative group transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {/* Upload Status Badge */}
                  {document.uploadStatus === 'pending' && (
                    <span className="absolute top-3 right-3 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                      Processing...
                    </span>
                  )}
                  {document.uploadStatus === 'failed' && (
                    <span className="absolute top-3 right-3 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                      Upload Failed
                    </span>
                  )}
                  {!document.uploadStatus && document.url && (
                    <span className="absolute top-3 right-3 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      Ready
                    </span>
                  )}
                
                  <div className="flex items-start mb-3">
                    {/* File Icon (Larger) */}
                    <div className="bg-blue-50 p-4 rounded-lg mr-4 flex items-center justify-center min-w-[60px] min-h-[60px]">
                      <FontAwesomeIcon 
                        icon={getFileIcon(document.name)} 
                        className="text-3xl text-blue-500" 
                      />
                    </div>
                    
                    {/* Document Details */}
                    <div className="flex-1 min-w-0">
                      {/* File Name */}
                      <h3 className="font-semibold text-lg truncate text-gray-800">{document.name}</h3>
                      
                      {/* Document Type Badge */}
                      <div className="mt-1 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {document.type || "Document"}
                        </span>
                        
                        {/* File extension badge */}
                        {document.name && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {document.name.split('.').pop().toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      {/* Description if available */}
                      {document.description && (
                        <p className="text-gray-600 text-sm mb-2 italic line-clamp-2">{document.description}</p>
                      )}

                      {/* Metadata with proper formatting and more readable date */}
                      <div className="grid grid-cols-1 gap-1 mt-2">
                        <p className="text-xs text-gray-500 flex items-center">
                          <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 text-gray-400" />
                          Uploaded: {document.createdAt?.toLocaleDateString?.() || document.createdAt?.toDate?.()?.toLocaleDateString() || 'Recent upload'}
                        </p>
                        
                        {/* Don't show URL in the interface for cleaner look */}
                        {/* Document ID for tracing purposes - only show on hover */}
                        <p className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          ID: {document.id?.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons in a clearly separated section */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end items-center gap-2">
                    {/* View button for documents with URL */}
                    {document.url && document.url !== 'pending_upload' && (
                      <a 
                        href={document.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-md transition-colors text-sm font-medium"
                      >
                        <FontAwesomeIcon icon={faFileAlt} className="mr-1" />
                        View Document
                      </a>
                    )}
                    
                    {/* Retry upload for failed documents */}
                    {document.uploadStatus === 'failed' && (
                      <button
                        onClick={() => handleRetryUpload(document.id)}
                        className="flex items-center justify-center bg-yellow-50 hover:bg-yellow-100 text-yellow-600 px-3 py-1.5 rounded-md transition-colors text-sm font-medium"
                      >
                        <FontAwesomeIcon icon={faUpload} className="mr-1" />
                        Retry
                      </button>
                    )}
                    
                    {/* Delete button */}
                    <button 
                      onClick={() => handleDeleteDocument(document.id, document.fileName || document.name)}
                      className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-md transition-colors text-sm font-medium"
                    >
                      <FontAwesomeIcon icon={faTrashAlt} className="mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile; 