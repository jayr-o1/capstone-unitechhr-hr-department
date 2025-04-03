import React, { useState, useEffect } from "react";
import { getAllUniversities } from "../../services/universityService";
import { getPendingHRHeads } from "../../services/adminService";
import { Building, UserCheck, Users, Layers, BarChart2, PieChart, Link2, ShieldCheck } from "lucide-react";
import PageLoader from "../../components/PageLoader";
import { Link } from "react-router-dom";

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
      link: "/system-admin/universities"
    },
    {
      title: "Pending Approvals",
      value: stats.pendingApprovals,
      icon: <UserCheck className="w-8 h-8 text-amber-500" />,
      color: "bg-amber-100",
      link: "/system-admin/approvals"
    },
    {
      title: "Total HR Heads",
      value: stats.totalHRHeads,
      icon: <Users className="w-8 h-8 text-green-500" />,
      color: "bg-green-100",
      link: "/system-admin/users"
    },
    {
      title: "Active Licenses",
      value: 25, // Placeholder value
      icon: <ShieldCheck className="w-8 h-8 text-purple-500" />,
      color: "bg-purple-100",
      link: "/system-admin/licenses"
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
          <Link
            to={card.link}
            key={index}
            className="bg-white rounded-lg shadow-sm p-6 transition-all duration-300 hover:shadow-md hover:translate-y-[-2px]"
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
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/system-admin/universities" 
            className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-300"
          >
            <Building className="w-5 h-5 mr-3 text-blue-500" />
            <span className="font-medium text-blue-700">Manage Universities</span>
          </Link>
          
          <Link 
            to="/system-admin/approvals" 
            className="flex items-center p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors duration-300"
          >
            <UserCheck className="w-5 h-5 mr-3 text-amber-500" />
            <span className="font-medium text-amber-700">Review Approvals</span>
          </Link>
          
          <Link 
            to="/system-admin/licenses" 
            className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-300"
          >
            <ShieldCheck className="w-5 h-5 mr-3 text-purple-500" />
            <span className="font-medium text-purple-700">Manage Licenses</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart2 className="w-5 h-5 mr-2 text-gray-600" />
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

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-gray-600" />
            System Health
          </h2>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                Database Status
              </h3>
              <p className="text-green-700 mt-1">Operational - No issues detected</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                Authentication Services
              </h3>
              <p className="text-green-700 mt-1">Operational - No issues detected</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                Storage Services
              </h3>
              <p className="text-green-700 mt-1">Operational - No issues detected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAdminDashboard; 