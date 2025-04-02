import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { 
  getEmployeeData, 
  updateEmployeeProfile,
  getEmployeeDocuments,
  uploadEmployeeDocument,
  deleteEmployeeDocument
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
  faTimes
} from '@fortawesome/free-solid-svg-icons';

const EmployeeProfile = () => {
  const { user, userDetails } = useAuth();
  const [employeeData, setEmployeeData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Employee Profile</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6 flex items-center justify-between">
          <p>{error}</p>
          <button onClick={() => setError(null)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 text-green-700 p-4 rounded-md mb-6 flex items-center justify-between">
          <p>{success}</p>
          <button onClick={() => setSuccess(null)}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Personal Information</h2>
              <button 
                onClick={() => setEditMode(!editMode)} 
                className={`px-4 py-2 rounded-md ${editMode 
                  ? 'bg-gray-200 text-gray-700' 
                  : 'bg-blue-600 text-white'}`}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            
            {editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Full Name</label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faUser} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="pl-10 w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faEnvelope} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="pl-10 w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Phone</label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faPhone} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="pl-10 w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2">Position</label>
                    <div className="relative">
                      <FontAwesomeIcon icon={faBriefcase} className="absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className="pl-10 w-full p-2 border rounded-md"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Department</label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faBuilding} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      className="pl-10 w-full p-2 border rounded-md"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    rows="3"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    rows="4"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-gray-700 mb-2">Education</label>
                  <textarea
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    rows="3"
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                  >
                    {saving ? (
                      <>
                        <span className="mr-2">Saving...</span>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCheck} className="mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faUser} className="text-blue-600 mt-1 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                      <p>{formData.name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faEnvelope} className="text-blue-600 mt-1 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Email</h3>
                      <p>{formData.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faPhone} className="text-blue-600 mt-1 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                      <p>{formData.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faBriefcase} className="text-blue-600 mt-1 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Position</h3>
                      <p>{formData.position || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faBuilding} className="text-blue-600 mt-1 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Department</h3>
                      <p>{formData.department || 'Not assigned'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-600 mt-1 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Employee ID</h3>
                      <p>{employeeData?.employeeId || 'Not assigned'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Address</h3>
                  <p className="whitespace-pre-line">{formData.address || 'Not provided'}</p>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Bio</h3>
                  <p className="whitespace-pre-line">{formData.bio || 'No bio provided'}</p>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Education</h3>
                  <p className="whitespace-pre-line">{formData.education || 'No education details provided'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Documents Section */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Documents</h2>
            
            {/* Upload Form */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3">Upload New Document</h3>
              
              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-2">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="certification">Certification</option>
                  <option value="resume">Resume/CV</option>
                  <option value="degree">Degree/Diploma</option>
                  <option value="training">Training</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label className="block text-gray-700 text-sm mb-2">File</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="w-full p-2 border rounded-md"
                  disabled={uploading}
                />
              </div>
              
              {uploading && (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500"></div>
                </div>
              )}
            </div>
            
            {/* Documents List */}
            <div>
              <h3 className="font-medium mb-3">Your Documents</h3>
              
              {documents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50">
                      <div className="flex items-center">
                        <FontAwesomeIcon icon={getFileIcon(doc.name)} className="text-blue-600 mr-3 text-lg" />
                        <div>
                          <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">
                            {doc.name}
                          </a>
                          <p className="text-xs text-gray-500 capitalize">{doc.type}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FontAwesomeIcon icon={faTrashAlt} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile; 