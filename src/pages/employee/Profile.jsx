import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { useLocation } from 'react-router-dom';
import { 
  getEmployeeData, 
  updateEmployeeProfile,
  getEmployeeDocuments,
  uploadEmployeeDocument,
  deleteEmployeeDocument,
  getEmployeeSkills
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      
      if (!userDetails || !userDetails.universityId) {
        setError('User details not available');
        setUploading(false);
        return;
      }
      
      const result = await uploadEmployeeDocument(
        user.uid, 
        userDetails.universityId, 
        file,
        documentType
      );
      
      if (result.success) {
        setSuccess('Document uploaded successfully');
        
        // Refresh documents
        const docsData = await getEmployeeDocuments(user.uid, userDetails.universityId);
        if (docsData.success) {
          setDocuments(docsData.documents);
        }
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setError(result.message || 'Failed to upload document');
      }
      
      setUploading(false);
    } catch (err) {
      console.error("Error uploading document:", err);
      setError("An error occurred while uploading document");
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

  const handleAddSkill = () => {
    toast.success('This feature will be available soon!');
  };

  const handleEditSkill = (skillId) => {
    toast.success('Edit feature will be available soon!');
  };

  const handleRemoveSkill = (skillId) => {
    toast.success('Remove feature will be available soon!');
  };

  const handleUploadDocument = () => {
    toast.success('Upload feature will be available soon!');
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
          <h2 className="text-xl font-bold mb-4">Personal Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Department */}
            <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon={faBuilding} className="text-blue-500 mr-2" />
                <h3 className="font-medium">Department</h3>
              </div>
              <p className="text-sm md:text-base text-gray-700">{employeeData?.department || 'Computer Science'}</p>
            </div>
            
            {/* Position */}
            <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-2">
                <FontAwesomeIcon icon={faIdBadge} className="text-blue-500 mr-2" />
                <h3 className="font-medium">Position</h3>
              </div>
              <p className="text-sm md:text-base text-gray-700">{employeeData?.position || 'Associate Professor'}</p>
            </div>
          </div>
          
          {/* Education Section */}
          <h3 className="text-lg font-bold mt-6 mb-4">Education</h3>
          <div className="space-y-4">
            {employeeData?.education?.map((edu, index) => (
              <div key={index} className="p-3 md:p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center mb-1">
                  <FontAwesomeIcon icon={faGraduationCap} className="text-blue-500 mr-2" />
                  <h4 className="font-medium">{edu.institution}</h4>
                </div>
                <p className="text-sm md:text-base text-gray-700 ml-6">{edu.degree}</p>
                <p className="text-xs md:text-sm text-gray-500 ml-6">{edu.year}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6" ref={skillsSectionRef}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Skills</h2>
            <button 
              onClick={handleAddSkill} 
              className="flex items-center text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-1" />
              Add Skill
            </button>
          </div>
          
          <div className="space-y-4">
            {skills.map((skill) => (
              <div key={skill.id} className="bg-gray-50 rounded-lg p-3 md:p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{skill.name}</h3>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditSkill(skill.id)}
                      className="text-gray-600 hover:text-blue-600"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button 
                      onClick={() => handleRemoveSkill(skill.id)}
                      className="text-gray-600 hover:text-red-600"
                    >
                      <FontAwesomeIcon icon={faTrashAlt} />
                    </button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${skill.proficiency}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span>Beginner</span>
                  <span>Proficient</span>
                  <span>Expert</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Documents</h2>
            <button 
              onClick={handleUploadDocument} 
              className="flex items-center text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-1" />
              Upload
            </button>
          </div>
          
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
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">{doc.type}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-500">{doc.uploadDate}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-right text-sm">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-2">View</button>
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
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile; 