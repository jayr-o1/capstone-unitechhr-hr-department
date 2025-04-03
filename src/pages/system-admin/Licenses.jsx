import React, { useState, useEffect } from "react";
import { 
  generateLicense, 
  getAllLicenses, 
  deactivateLicense, 
  deleteLicense 
} from "../../services/licenseService";
import PageLoader from "../../components/PageLoader";
import { Key, AlertCircle, Check, X, Calendar, Users, Copy, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const SystemAdminLicenses = () => {
  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState([]);
  const [processingItems, setProcessingItems] = useState({});
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  
  // Form state for generating a new license
  const [licenseForm, setLicenseForm] = useState({
    universityName: "",
    expiryDate: "",
    maxUsers: 10
  });

  // Fetch licenses on component mount
  useEffect(() => {
    fetchLicenses();
  }, []);

  // Function to fetch all licenses
  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const result = await getAllLicenses();
      if (result.success) {
        setLicenses(result.licenses || []);
      } else {
        toast.error(result.message || "Failed to load licenses");
      }
    } catch (error) {
      console.error("Error fetching licenses:", error);
      toast.error("An error occurred while loading licenses");
    } finally {
      setLoading(false);
    }
  };

  // Handle license form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLicenseForm({
      ...licenseForm,
      [name]: value
    });
  };

  // Handle generating a new license
  const handleGenerateLicense = async (e) => {
    e.preventDefault();
    
    if (!licenseForm.universityName) {
      toast.error("Please enter a university name");
      return;
    }
    
    try {
      setLoading(true);
      const result = await generateLicense(
        licenseForm.universityName,
        licenseForm.expiryDate,
        licenseForm.maxUsers
      );
      
      if (result.success) {
        toast.success("License generated successfully");
        
        // Reset form
        setLicenseForm({
          universityName: "",
          expiryDate: "",
          maxUsers: 10
        });
        
        // Close form
        setShowGenerateForm(false);
        
        // Refresh licenses
        await fetchLicenses();
      } else {
        toast.error(result.message || "Failed to generate license");
      }
    } catch (error) {
      console.error("Error generating license:", error);
      toast.error("An error occurred while generating license");
    } finally {
      setLoading(false);
    }
  };

  // Handle copying license key to clipboard
  const handleCopyLicenseKey = (licenseKey) => {
    navigator.clipboard.writeText(licenseKey)
      .then(() => {
        toast.success("License key copied to clipboard");
      })
      .catch(err => {
        console.error("Could not copy text: ", err);
        toast.error("Failed to copy license key");
      });
  };

  // Handle deactivating a license
  const handleDeactivateLicense = async (licenseId) => {
    try {
      // Confirm deactivation
      if (!window.confirm("Are you sure you want to deactivate this license?")) {
        return;
      }
      
      // Set item as processing
      setProcessingItems(prev => ({ ...prev, [licenseId]: true }));
      
      const result = await deactivateLicense(licenseId);
      
      if (result.success) {
        toast.success("License deactivated successfully");
        
        // Update license in state
        setLicenses(prevLicenses => 
          prevLicenses.map(license => 
            license.id === licenseId ? { ...license, status: 'inactive' } : license
          )
        );
      } else {
        toast.error(result.message || "Failed to deactivate license");
      }
    } catch (error) {
      console.error("Error deactivating license:", error);
      toast.error("An error occurred while deactivating license");
    } finally {
      // Clear processing state
      setProcessingItems(prev => ({ ...prev, [licenseId]: false }));
    }
  };

  // Handle deleting a license
  const handleDeleteLicense = async (licenseId) => {
    try {
      // Confirm deletion
      if (!window.confirm("Are you sure you want to delete this license? This action cannot be undone.")) {
        return;
      }
      
      // Set item as processing
      setProcessingItems(prev => ({ ...prev, [licenseId]: true }));
      
      const result = await deleteLicense(licenseId);
      
      if (result.success) {
        toast.success("License deleted successfully");
        
        // Remove license from state
        setLicenses(prevLicenses => 
          prevLicenses.filter(license => license.id !== licenseId)
        );
      } else {
        toast.error(result.message || "Failed to delete license");
      }
    } catch (error) {
      console.error("Error deleting license:", error);
      toast.error("An error occurred while deleting license");
    } finally {
      // Clear processing state
      setProcessingItems(prev => ({ ...prev, [licenseId]: false }));
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return "No expiry";
    return new Date(date).toLocaleDateString();
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'active':
        return "bg-green-100 text-green-800";
      case 'used':
        return "bg-blue-100 text-blue-800";
      case 'inactive':
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && licenses.length === 0) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">License Management</h1>
          <p className="text-gray-600">
            Generate and manage licenses for universities.
          </p>
        </div>
        <button
          onClick={() => setShowGenerateForm(!showGenerateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Key className="h-5 w-5 mr-2" />
          Generate New License
        </button>
      </div>

      {/* License Generation Form */}
      {showGenerateForm && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Generate New License</h2>
          <form onSubmit={handleGenerateLicense} className="space-y-4">
            <div>
              <label htmlFor="universityName" className="block text-sm font-medium text-gray-700 mb-1">
                University Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="universityName"
                name="universityName"
                value={licenseForm.universityName}
                onChange={handleInputChange}
                placeholder="Enter university name"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                id="expiryDate"
                name="expiryDate"
                value={licenseForm.expiryDate}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Leave blank for no expiry date</p>
            </div>
            <div>
              <label htmlFor="maxUsers" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Users
              </label>
              <input
                type="number"
                id="maxUsers"
                name="maxUsers"
                value={licenseForm.maxUsers}
                onChange={handleInputChange}
                min="1"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowGenerateForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate License"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Licenses List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {licenses.length === 0 ? (
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-1">No Licenses Found</h3>
            <p className="text-gray-600">
              You haven't generated any licenses yet. Click "Generate New License" to create one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    License Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    University
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Users
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {licenses.map((license) => (
                  <tr key={license.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-mono text-sm text-gray-900 mr-2">{license.licenseKey}</span>
                        <button 
                          onClick={() => handleCopyLicenseKey(license.licenseKey)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy to clipboard"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{license.universityName || "Not assigned"}</div>
                      {license.usedBy && (
                        <div className="text-xs text-gray-500">Used by: {license.universityId || license.usedBy}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(license.status)}`}>
                        {license.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(license.expiryDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="h-4 w-4 mr-1 text-gray-400" />
                        {license.maxUsers || "Unlimited"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {license.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleCopyLicenseKey(license.licenseKey)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                            disabled={processingItems[license.id]}
                            title="Copy license key"
                          >
                            <Copy className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeactivateLicense(license.id)}
                            className="text-amber-600 hover:text-amber-900 mr-3"
                            disabled={processingItems[license.id]}
                            title="Deactivate license"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDeleteLicense(license.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={processingItems[license.id]}
                        title="Delete license"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-8 p-4 border border-blue-100 bg-blue-50 rounded-lg">
        <div className="flex">
          <Key className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800">Development License</h3>
            <p className="text-sm text-blue-600 mt-1">
              For development purposes, you can use the following license key: <span className="font-mono font-semibold">UNITECH-HR-DEV-2023</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAdminLicenses; 