import React, { useState, useEffect } from "react";
import { getAllUniversities } from "../../services/universityService";
import { Building, BarChart2, PieChart, ShieldCheck, Users, Briefcase, Plus, Key } from "lucide-react";
import PageLoader from "../../components/PageLoader";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { getAllLicenses } from "../../services/licenseService";

const SystemAdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUniversities: 0,
    totalLicenses: 0,
    totalHRHeads: 0,
    totalHRPersonnel: 0,
    totalEmployees: 0,
    totalJobs: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    database: { status: "operational", message: "No issues detected" },
    auth: { status: "operational", message: "No issues detected" },
    storage: { status: "operational", message: "No issues detected" }
  });

  // Debug logging on component mount
  useEffect(() => {
    console.log("SystemAdminDashboard mounted");
  }, []);

  // Function to fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      // Create a combined list of recent activities from different sources
      const activities = [];

      // Fetch recent university registrations
      const universitiesRef = collection(db, "universities");
      const universitiesQuery = query(universitiesRef, orderBy("createdAt", "desc"), limit(5));
      const universitiesSnapshot = await getDocs(universitiesQuery);
      
      universitiesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.createdAt) {
          activities.push({
            type: "university_added",
            title: `New university added: ${data.name}`,
            timestamp: data.createdAt,
            icon: <Building className="w-4 h-4 text-blue-500" />
          });
        }
      });

      // Fetch recent license generations
      const licensesRef = collection(db, "licenses");
      const licensesQuery = query(licensesRef, orderBy("createdAt", "desc"), limit(5));
      const licensesSnapshot = await getDocs(licensesQuery);
      
      licensesSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.createdAt) {
          activities.push({
            type: "license_generated",
            title: `New license generated: ${data.licenseKey?.substring(0, 16)}${data.licenseKey?.length > 16 ? '...' : ''}`,
            timestamp: data.createdAt,
            icon: <Key className="w-4 h-4 text-purple-500" />
          });
        }
      });

      // Sort activities by timestamp
      activities.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
      
      // Take the most recent 5
      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      setRecentActivities([]);
    }
  };

  // Function to check system health
  const checkSystemHealth = async () => {
    try {
      // Check database health by attempting to fetch a document
      let dbStatus = { status: "operational", message: "No issues detected" };
      try {
        const healthCheck = await getDocs(query(collection(db, "system_health"), limit(1)));
        console.log("Database health check successful");
      } catch (dbError) {
        console.error("Database health check failed:", dbError);
        dbStatus = { status: "issues", message: "Connection issues detected" };
      }

      // For auth and storage, we'll simulate health checks
      // In a real application, you would implement proper health checks for these services
      
      setSystemHealth({
        database: dbStatus,
        auth: { status: "operational", message: "No issues detected" },
        storage: { status: "operational", message: "No issues detected" }
      });
    } catch (error) {
      console.error("Error checking system health:", error);
    }
  };

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
        
        // Fetch licenses
        let licensesResult = { licenses: [] };
        try {
          licensesResult = await getAllLicenses();
          console.log("Licenses data:", licensesResult);
        } catch (licensesError) {
          console.error("Error fetching licenses:", licensesError);
        }
        
        // Initialize counters
        let totalHRHeads = 0;
        let totalHRPersonnel = 0;
        let totalEmployees = 0;
        let totalJobs = 0;

        // Fetch counts from each university's collections
        if (universitiesResult.success && universitiesResult.universities.length > 0) {
          await Promise.all(universitiesResult.universities.map(async (uni) => {
            try {
              // Count HR Heads
              const hrHeadsRef = collection(db, "universities", uni.id, "hr_head");
              const hrHeadsSnapshot = await getDocs(hrHeadsRef);
              totalHRHeads += hrHeadsSnapshot.size;

              // Count HR Personnel
              const hrPersonnelRef = collection(db, "universities", uni.id, "hr_personnel");
              const hrPersonnelSnapshot = await getDocs(hrPersonnelRef);
              totalHRPersonnel += hrPersonnelSnapshot.size;

              // Count Employees
              const employeesRef = collection(db, "universities", uni.id, "employees");
              const employeesSnapshot = await getDocs(employeesRef);
              totalEmployees += employeesSnapshot.size;

              // Count Jobs
              const jobsRef = collection(db, "universities", uni.id, "jobs");
              const jobsSnapshot = await getDocs(jobsRef);
              totalJobs += jobsSnapshot.size;
            } catch (err) {
              console.error(`Error fetching collections for university ${uni.id}:`, err);
            }
          }));
        }
        
        // Set stats
        setStats({
          totalUniversities: universitiesResult.universities?.length || 0,
          totalLicenses: licensesResult.success ? licensesResult.licenses?.length || 0 : 0,
          totalHRHeads,
          totalHRPersonnel,
          totalEmployees,
          totalJobs
        });
        
        // Fetch recent activities
        await fetchRecentActivities();
        
        // Check system health
        await checkSystemHealth();
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
      title: "Active Licenses",
      value: stats.totalLicenses,
      icon: <ShieldCheck className="w-8 h-8 text-purple-500" />,
      color: "bg-purple-100",
      link: "/system-admin/licenses"
    },
    {
      title: "HR Heads",
      value: stats.totalHRHeads,
      icon: <Users className="w-8 h-8 text-green-500" />,
      color: "bg-green-100",
      link: "/system-admin/universities"
    },
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: <Users className="w-8 h-8 text-orange-500" />,
      color: "bg-orange-100",
      link: "/system-admin/universities"
    }
  ];

  // Helper function to format date
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown date";
    
    const date = timestamp instanceof Timestamp ? 
      timestamp.toDate() : 
      (timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp));
    
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">System Administration</h1>
        <p className="text-gray-600">
          Manage system-wide settings, universities, and licenses.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            to="/system-admin/universities" 
            className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-300"
          >
            <Building className="w-5 h-5 mr-3 text-blue-500" />
            <span className="font-medium text-blue-700">Manage Universities</span>
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
          
          <ul className="divide-y divide-gray-200">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <li key={index} className="py-3">
                  <div className="flex items-start">
                    <div className="mr-2 mt-0.5">
                      {activity.icon}
                    </div>
                    <div>
                      <p className="text-gray-800">{activity.title}</p>
                      <p className="text-sm text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="py-3 text-gray-500">No recent activities found</li>
            )}
          </ul>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-gray-600" />
            System Health
          </h2>
          <div className="space-y-4">
            <div className={`${systemHealth.database.status === 'operational' ? 'bg-green-50' : 'bg-orange-50'} p-4 rounded-lg`}>
              <h3 className={`font-medium ${systemHealth.database.status === 'operational' ? 'text-green-800' : 'text-orange-800'} flex items-center`}>
                <div className={`w-3 h-3 rounded-full ${systemHealth.database.status === 'operational' ? 'bg-green-500' : 'bg-orange-500'} mr-2`}></div>
                Database Status
              </h3>
              <p className={`${systemHealth.database.status === 'operational' ? 'text-green-700' : 'text-orange-700'} mt-1`}>
                {systemHealth.database.status === 'operational' ? 'Operational' : 'Degraded'} - {systemHealth.database.message}
              </p>
            </div>
            <div className={`${systemHealth.auth.status === 'operational' ? 'bg-green-50' : 'bg-orange-50'} p-4 rounded-lg`}>
              <h3 className={`font-medium ${systemHealth.auth.status === 'operational' ? 'text-green-800' : 'text-orange-800'} flex items-center`}>
                <div className={`w-3 h-3 rounded-full ${systemHealth.auth.status === 'operational' ? 'bg-green-500' : 'bg-orange-500'} mr-2`}></div>
                Authentication Services
              </h3>
              <p className={`${systemHealth.auth.status === 'operational' ? 'text-green-700' : 'text-orange-700'} mt-1`}>
                {systemHealth.auth.status === 'operational' ? 'Operational' : 'Degraded'} - {systemHealth.auth.message}
              </p>
            </div>
            <div className={`${systemHealth.storage.status === 'operational' ? 'bg-green-50' : 'bg-orange-50'} p-4 rounded-lg`}>
              <h3 className={`font-medium ${systemHealth.storage.status === 'operational' ? 'text-green-800' : 'text-orange-800'} flex items-center`}>
                <div className={`w-3 h-3 rounded-full ${systemHealth.storage.status === 'operational' ? 'bg-green-500' : 'bg-orange-500'} mr-2`}></div>
                Storage Services
              </h3>
              <p className={`${systemHealth.storage.status === 'operational' ? 'text-green-700' : 'text-orange-700'} mt-1`}>
                {systemHealth.storage.status === 'operational' ? 'Operational' : 'Degraded'} - {systemHealth.storage.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAdminDashboard;