import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { 
  getEmployeeDocuments,
  uploadEmployeeDocument,
  deleteEmployeeDocument
} from '../../services/employeeService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt,
  faFilePdf,
  faFileImage,
  faFileWord,
  faFileExcel,
  faTrashAlt,
  faUpload,
  faSearch,
  faFileDownload,
  faTimes,
  faCheck
} from '@fortawesome/free-solid-svg-icons';

const Documents = () => {
  const { user, userDetails } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  
  // Document upload
  const fileInputRef = useRef(null);
  const [documentType, setDocumentType] = useState('certification');
  const [documentName, setDocumentName] = useState('');
  
  useEffect(() => {
    loadDocuments();
  }, [user, userDetails]);
  
  const loadDocuments = async () => {
    try {
      if (userDetails && userDetails.universityId) {
        setLoading(true);
        
        const docsData = await getEmployeeDocuments(user.uid, userDetails.universityId);
        if (docsData.success) {
          setDocuments(docsData.documents);
        } else {
          setError('Failed to load documents');
        }
        
        setLoading(false);
      }
    } catch (err) {
      console.error("Error loading documents:", err);
      setError("An error occurred while loading documents");
      setLoading(false);
    }
  };
  
  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    const file = fileInputRef.current.files[0];
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
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
        await loadDocuments();
        
        // Reset form
        setDocumentName('');
        setDocumentType('certification');
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
  
  // Filter and search documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || doc.type === filter;
    
    return matchesSearch && matchesFilter;
  });
  
  // Document type options
  const documentTypeOptions = [
    { value: 'certification', label: 'Certification' },
    { value: 'resume', label: 'Resume/CV' },
    { value: 'degree', label: 'Degree/Diploma' },
    { value: 'training', label: 'Training Document' },
    { value: 'identification', label: 'ID Document' },
    { value: 'other', label: 'Other' }
  ];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Documents</h1>
      
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
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Upload New Document</h2>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Document Type</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  disabled={uploading}
                >
                  {documentTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Select File</label>
                <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setDocumentName(e.target.files[0].name);
                      }
                    }}
                    disabled={uploading}
                  />
                  
                  {documentName ? (
                    <div>
                      <p className="text-gray-600 mb-2 break-all">{documentName}</p>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          setDocumentName('');
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-3xl mb-2" />
                      <p className="text-gray-500 mb-2">Drag and drop a file or click to browse</p>
                      <button
                        type="button"
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                        onClick={() => fileInputRef.current.click()}
                        disabled={uploading}
                      >
                        Browse Files
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 flex items-center justify-center"
                disabled={uploading || !documentName}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUpload} className="mr-2" />
                    Upload Document
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Documents List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 md:mb-0">My Documents</h2>
              
              <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-3">
                {/* Search bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border rounded-md w-full"
                  />
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                  />
                </div>
                
                {/* Filter */}
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="p-2 border rounded-md w-full md:w-auto"
                >
                  <option value="all">All Types</option>
                  {documentTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FontAwesomeIcon icon={faFileAlt} className="text-gray-300 text-5xl mb-4" />
                <p className="text-gray-500">No documents found.</p>
                <p className="text-gray-500 text-sm mt-2">
                  {documents.length > 0 
                    ? 'Try adjusting your search or filter.' 
                    : 'Upload your first document to get started.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start">
                      <div className="text-3xl text-blue-500 mr-4">
                        <FontAwesomeIcon icon={getFileIcon(doc.name)} />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="font-medium text-lg text-gray-800">{doc.name}</h3>
                            <p className="text-gray-500 text-sm capitalize">{doc.type}</p>
                            <p className="text-gray-400 text-xs mt-1">
                              {doc.createdAt
                                ? new Date(doc.createdAt.seconds * 1000).toLocaleDateString()
                                : 'Unknown date'}
                            </p>
                          </div>
                          
                          <div className="flex mt-3 md:mt-0 space-x-2">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center"
                            >
                              <FontAwesomeIcon icon={faFileDownload} className="mr-1" />
                              <span>View</span>
                            </a>
                            
                            <button
                              onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                              className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center"
                            >
                              <FontAwesomeIcon icon={faTrashAlt} className="mr-1" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documents; 