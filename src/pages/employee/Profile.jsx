import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { useLocation } from 'react-router-dom';
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
import PageLoader from '../../components/PageLoader';

const EmployeeProfile = () => {
  const { user, userDetails } = useAuth();
  const location = useLocation();
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
  const [documentType, setDocumentType] = useState('certification');
  const [documentDescription, setDocumentDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Skills state
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [editingSkill, setEditingSkill] = useState(null);
  const [skillForm, setSkillForm] = useState({
    name: '',
    category: 'technical',
    proficiency: 50,
    notes: ''
  });
  
  // Check for active tab in navigation state
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      
      // Small delay to ensure DOM elements are rendered
      setTimeout(() => {
        if (location.state.activeTab === 'skills' && skillsSectionRef.current) {
          skillsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  }, [location.state]);
  
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
            setDocuments(docsData.documents);
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
    // Toggle document upload form visibility
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setDocumentType('certification');
    setDocumentDescription('');
    setSelectedFile(null);
    setUploading(false);
    setError(null);
    setSuccess(null);
    
    // Create a file input and trigger it
    fileInputRef.current.click();
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      
      // Show upload form/modal
      toast((t) => (
        <div className="p-4">
          <h3 className="font-bold mb-2">Upload Document</h3>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Document Type</label>
            <select 
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="certification">Certification</option>
              <option value="resume">Resume/CV</option>
              <option value="education">Education Document</option>
              <option value="id">ID Document</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Description</label>
            <input 
              type="text"
              value={documentDescription}
              onChange={(e) => setDocumentDescription(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Brief description of the document"
            />
          </div>
          <div className="mb-3">
            <p className="text-sm">File: <span className="font-medium">{e.target.files[0].name}</span></p>
            <p className="text-xs text-gray-500">{Math.round(e.target.files[0].size / 1024)} KB</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setSelectedFile(null);
              }}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                handleDocumentUpload();
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      ), { 
        duration: Infinity,
        style: { 
          maxWidth: '400px',
          width: '100%'
        }
      });
    }
  };
  
  // Handle document upload
  const handleDocumentUpload = async () => {
    if (!selectedFile || !userDetails?.universityId) {
      toast.error(!selectedFile ? 'No file selected' : 'Cannot determine your university');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      
      const result = await uploadEmployeeDocument(
        user.uid, 
        userDetails.universityId, 
        selectedFile,
        documentType
      );
      
      if (result.success) {
        setSuccess('Document uploaded successfully');
        toast.success('Document uploaded successfully');
        
        // Refresh documents
        const docsData = await getEmployeeDocuments(user.uid, userDetails.universityId);
        if (docsData.success) {
          setDocuments(docsData.documents);
        }
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        setSelectedFile(null);
      } else {
        setError(result.message || 'Failed to upload document');
        toast.error(result.message || 'Failed to upload document');
      }
    } catch (err) {
      console.error("Error uploading document:", err);
      setError("An error occurred while uploading document");
      toast.error("An error occurred while uploading document");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId, fileName) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      setError(null);
      setSuccess(null);
      
      if (!userDetails || !userDetails.universityId) {
        setError('User details not available');
        return;
      }
      
      const result = await deleteEmployeeDocument(
        user.uid,
        userDetails.universityId,
        documentId,
        fileName
      );
      
      if (result.success) {
        setSuccess('Document deleted successfully');
        
        // Update local state
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } else {
        setError(result.message || 'Failed to delete document');
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      setError("An error occurred while deleting document");
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
    if (!window.confirm('Are you sure you want to delete this skill?')) {
      return;
    }
    
    deleteSkill(skillId);
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
    return <PageLoader isLoading={true} message="Loading your profile..." />;
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
              {employeeData?.name?.charAt(0) || 'JD'}
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{employeeData?.name || 'Jane Doe'}</h1>
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
            <div>
              {/* Hidden file input, triggered by the Upload button */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden"
              />
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
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Upload Date</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={getFileIcon(doc.fileName)} className="text-blue-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{doc.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500 capitalize">{doc.type}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">
                        {doc.createdAt?.toDate ? 
                          doc.createdAt.toDate().toLocaleDateString() : 
                          new Date(doc.createdAt?.seconds * 1000).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-right text-sm">
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          View
                        </a>
                        <button 
                          onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile; 