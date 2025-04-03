import React, { useState, useEffect } from "react";
import { getPendingHRHeads, approveHRHead, rejectHRHead } from "../../services/adminService";
import { getAllUniversities } from "../../services/universityService";
import PageLoader from "../../components/PageLoader";
import { Check, X, AlertCircle, Search } from "lucide-react";
import toast from "react-hot-toast";

const SystemAdminApprovals = () => {
  const [loading, setLoading] = useState(true);
  const [pendingHeads, setPendingHeads] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingItems, setProcessingItems] = useState({});

  // Fetch pending HR Heads and universities data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch pending HR head approvals
        const pendingResult = await getPendingHRHeads();
        setPendingHeads(pendingResult.pendingHRHeads || []);
        
        // Fetch universities for reference
        const universitiesResult = await getAllUniversities();
        setUniversities(universitiesResult.universities || []);
      } catch (error) {
        console.error("Error fetching approvals data:", error);
        toast.error("Failed to load approvals data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle approval of an HR Head
  const handleApprove = async (headId) => {
    try {
      // Set item as processing
      setProcessingItems(prev => ({ ...prev, [headId]: true }));
      
      // Call approval service
      const result = await approveHRHead(headId);
      
      if (result.success) {
        toast.success("HR Head approved successfully");
        
        // Remove from pending list
        setPendingHeads(prevHeads => prevHeads.filter(head => head.id !== headId));
      } else {
        toast.error(result.message || "Failed to approve HR Head");
      }
    } catch (error) {
      console.error("Error approving HR Head:", error);
      toast.error("An error occurred while approving");
    } finally {
      // Clear processing state
      setProcessingItems(prev => ({ ...prev, [headId]: false }));
    }
  };

  // Handle rejection of an HR Head
  const handleReject = async (headId) => {
    try {
      // Confirm rejection
      if (!window.confirm("Are you sure you want to reject this account? This action cannot be undone.")) {
        return;
      }
      
      // Set item as processing
      setProcessingItems(prev => ({ ...prev, [headId]: true }));
      
      // Call rejection service
      const result = await rejectHRHead(headId);
      
      if (result.success) {
        toast.success("HR Head rejected successfully");
        
        // Remove from pending list
        setPendingHeads(prevHeads => prevHeads.filter(head => head.id !== headId));
      } else {
        toast.error(result.message || "Failed to reject HR Head");
      }
    } catch (error) {
      console.error("Error rejecting HR Head:", error);
      toast.error("An error occurred while rejecting");
    } finally {
      // Clear processing state
      setProcessingItems(prev => ({ ...prev, [headId]: false }));
    }
  };

  // Filter pending heads based on search term
  const filteredHeads = pendingHeads.filter(head => 
    head.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    head.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    head.universityName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get university name based on ID
  const getUniversityName = (universityId) => {
    const university = universities.find(uni => uni.id === universityId);
    return university?.name || "Unknown University";
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">HR Head Approvals</h1>
        <p className="text-gray-600">
          Review and approve HR Head account requests.
        </p>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, email, or university..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Approvals List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {filteredHeads.length === 0 ? (
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-1">No Pending Approvals</h3>
            <p className="text-gray-600">
              There are no HR Head accounts pending approval at this time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    University
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHeads.map((head) => (
                  <tr key={head.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{head.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-600">{head.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-600">
                        {head.universityName || getUniversityName(head.universityId)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-600">
                        {head.createdAt ? new Date(head.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleApprove(head.id)}
                          disabled={processingItems[head.id]}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(head.id)}
                          disabled={processingItems[head.id]}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemAdminApprovals; 