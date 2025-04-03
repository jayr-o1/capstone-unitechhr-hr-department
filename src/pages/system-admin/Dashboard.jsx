import React, { useState, useEffect } from "react";
import { getAllUniversities } from "../../services/universityService";
import { getPendingHRHeads } from "../../services/adminService";
import { Building, UserCheck, Users, Layers } from "lucide-react";
import PageLoader from "../../components/PageLoader";

const SystemAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUniversities: 0,
    pendingApprovals: 0,
    totalHRHeads: 0,
    totalEmployees: 0,
  });

  // Debug logging on component mount
  useEffect(() => {
    console.log("SystemAdminDashboard mounted");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("SystemAdminDashboard: Fetching data");
        setLoading(true);
        
        // Fetch universities
        let universitiesResult = { universities: [] };
        try {
          universitiesResult = await getAllUniversities();
          console.log("Universities data:", universitiesResult);
        } catch (universityError) {
          console.error("Error fetching universities:", universityError);
        }
        
        // Fetch pending HR head approvals
        let pendingResult = { pendingHRHeads: [] };
        try {
          pendingResult = await getPendingHRHeads();
          console.log("Pending HR heads:", pendingResult);
        } catch (pendingError) {
          console.error("Error fetching pending HR heads:", pendingError);
        }
        
        // Count total HR Heads (safely)
        const totalHRHeads = universitiesResult.universities?.reduce(
          (total, uni) => total + (uni.usersCount || 0), 
          0
        ) || 0;
        
        // Set stats
        setStats({
          totalUniversities: universitiesResult.universities?.length || 0,
          pendingApprovals: pendingResult.pendingHRHeads?.length || 0,
          totalHRHeads,
          totalEmployees: 0, // Placeholder until we have a real method to count
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <PageLoader />;
  }

  // Stat cards data
  const statCards = [
    {
      title: "Total Universities",
      value: stats.totalUniversities,
      icon: <Building className="w-8 h-8 text-blue-500" />,
      color: "bg-blue-100",
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: <UserCheck className="w-8 h-8 text-amber-500" />,
      color: "bg-amber-100",
    },
    {
      title: "Total HR Heads",
      value: stats.totalHRHeads,
      icon: <Users className="w-8 h-8 text-green-500" />,
      color: "bg-green-100",
    },
    {
      title: "Departments",
      value: 8, // Placeholder value
      icon: <Layers className="w-8 h-8 text-purple-500" />,
      color: "bg-purple-100",
    },
  ];

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">System Administration</h1>
        <p className="text-gray-600">
          Manage system-wide settings, universities, and user approvals.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 transition-all duration-300 hover:shadow-md"
          >
            <div className="flex items-center">
              <div className={`${card.color} p-3 rounded-lg mr-4`}>
                {card.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <h3 className="text-2xl font-bold text-gray-800">{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => window.location.href = '/system-admin/universities/new'} 
            className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-300"
          >
            <Building className="w-5 h-5 mr-3 text-blue-500" />
            <span className="font-medium text-blue-700">Add University</span>
          </button>
          
          <button 
            onClick={() => window.location.href = '/system-admin/approvals'} 
            className="flex items-center p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors duration-300"
          >
            <UserCheck className="w-5 h-5 mr-3 text-amber-500" />
            <span className="font-medium text-amber-700">Review Approvals</span>
          </button>
          
          <button 
            onClick={() => window.location.href = '/system-admin/users'} 
            className="flex items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-300"
          >
            <Users className="w-5 h-5 mr-3 text-green-500" />
            <span className="font-medium text-green-700">Manage System Users</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Recent Activity
        </h2>
        
        {stats.pendingApprovals > 0 ? (
          <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <UserCheck className="w-5 h-5 mr-2 text-amber-500" />
              <p className="text-amber-700 font-medium">
                You have {stats.pendingApprovals} pending HR Head approval{stats.pendingApprovals > 1 ? 's' : ''} to review.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No pending approvals at this time.</p>
        )}
        
        <ul className="divide-y divide-gray-200">
          {/* These would be replaced with actual activity logs */}
          <li className="py-3">
            <p className="text-gray-800">New university added: <span className="font-medium">Stanford University</span></p>
            <p className="text-sm text-gray-500">2 hours ago</p>
          </li>
          <li className="py-3">
            <p className="text-gray-800">HR Head approved: <span className="font-medium">John Doe</span> at <span className="font-medium">Harvard University</span></p>
            <p className="text-sm text-gray-500">Yesterday</p>
          </li>
          <li className="py-3">
            <p className="text-gray-800">System update applied: <span className="font-medium">v1.2.5</span></p>
            <p className="text-sm text-gray-500">3 days ago</p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SystemAdminDashboard; 