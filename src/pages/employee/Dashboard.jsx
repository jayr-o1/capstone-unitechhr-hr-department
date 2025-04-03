import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { getEmployeeData, getEmployeeSkills, getCareerPaths } from '../../services/employeeService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faIdCard, faGraduationCap, faClipboardList, faChartLine, faArrowRight, faIdBadge } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import PageLoader from '../../components/PageLoader';

const EmployeeDashboard = () => {
  const { user, userDetails, university } = useAuth();
  const [employeeData, setEmployeeData] = useState(null);
  const [skills, setSkills] = useState([]);
  const [careerPaths, setCareerPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Debug log for component mount
  useEffect(() => {
    console.log("EmployeeDashboard mounted with:", {
      user: user ? "exists" : "null",
      userDetails: userDetails ? "exists" : "null",
      university: university ? "exists" : "null"
    });
    
    if (user) {
      console.log("User properties:", {
        uid: user.uid,
        employeeId: user.employeeId,
        universityId: user.universityId || userDetails?.universityId,
        isEmployee: user.isEmployee
      });
    }
    
    if (userDetails) {
      console.log("UserDetails properties:", {
        role: userDetails.role,
        universityId: userDetails.universityId,
        name: userDetails.name,
        position: userDetails.position,
        department: userDetails.department
      });
    }
  }, [user, userDetails, university]);

  useEffect(() => {
    const loadEmployeeData = async () => {
      try {
        // If we have userDetails directly from the AuthContext (for custom employee login)
        if (userDetails && user?.isEmployee) {
          console.log("Using userDetails directly from AuthContext for employee", 
            userDetails.name || user.employeeId);
          
          // Use the userDetails directly as our employee data
          setEmployeeData({
            ...userDetails,
            employeeId: user.employeeId,
            name: userDetails.name || user.displayName,
            position: userDetails.position || "Employee",
            department: userDetails.department || "General"
          });
          
          setLoading(false);
          
          // Only fetch skills and career paths if we have departmentId
          if (userDetails.department) {
            try {
              // Try fetching skills
              const skillsData = await getEmployeeSkills(user.uid, userDetails.universityId);
              if (skillsData.success) {
                setSkills(skillsData.skills);
              }
              
              // Try fetching career paths
              const careerPathsData = await getCareerPaths(
                userDetails.universityId, 
                userDetails.department
              );
              if (careerPathsData.success) {
                setCareerPaths(careerPathsData.careerPaths);
              }
            } catch (err) {
              console.warn("Error fetching supplementary data:", err);
              // Don't set error - we still have the basic data
            }
          }
          
          return; // Exit early, we already have the data
        }
        
        // Original logic for firebase auth employees
        if (userDetails && userDetails.universityId) {
          setLoading(true);
          
          // Fetch employee data
          const empData = await getEmployeeData(user.uid, userDetails.universityId);
          console.log("Employee data fetch result:", empData);
          
          if (empData.success) {
            setEmployeeData(empData.data);
          } else {
            console.error("Failed to load employee data:", empData.message);
            setError('Failed to load employee data');
            toast.error("Could not load your employee data. Please try again later.");
          }
          
          // Fetch employee skills
          const skillsData = await getEmployeeSkills(user.uid, userDetails.universityId);
          if (skillsData.success) {
            setSkills(skillsData.skills);
          }
          
          // Fetch career paths if department is available
          if (empData.success && empData.data.department) {
            const careerPathsData = await getCareerPaths(
              userDetails.universityId, 
              empData.data.department
            );
            if (careerPathsData.success) {
              setCareerPaths(careerPathsData.careerPaths);
            }
          }
          
          setLoading(false);
        } else {
          console.error("Missing user details or university ID");
          setError("Missing user information. Please try logging in again.");
          setLoading(false);
          toast.error("Missing user information. Please try logging in again.");
        }
      } catch (err) {
        console.error("Error loading employee data:", err);
        setError("An error occurred while loading data");
        setLoading(false);
        toast.error("An error occurred. Please try again later.");
      }
    };

    loadEmployeeData();
  }, [user, userDetails]);

  // Navigation handlers
  const handleViewAllSkills = () => {
    navigate('/employee/profile', { state: { activeTab: 'skills' } });
  };

  const handleViewPersonalInfo = () => {
    navigate('/employee/profile', { state: { activeTab: 'personal' } });
  };

  const handleViewCareerDetails = () => {
    navigate('/employee/career', { state: { fromDashboard: true } });
  };

  const handleViewAllActivities = () => {
    // This could navigate to a dedicated activities page in the future
    toast.info('Activities page coming soon!');
  };

  if (loading) {
    // Check if this is a page refresh
    const isPageRefresh = sessionStorage.getItem("isPageRefresh") === "true";
    return <PageLoader isLoading={true} fullscreen={isPageRefresh} message="Loading your dashboard..." />;
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

  const displayName = user?.displayName || employeeData?.name || userDetails?.name || 'Employee';
  const position = employeeData?.position || userDetails?.position || 'Staff';
  const universityName = university?.name || userDetails?.universityName || 'Your University';
  const department = employeeData?.department || userDetails?.department || 'Not Assigned';
  const employeeIdDisplay = employeeData?.employeeId || user?.employeeId || 'N/A';

  return (
    <div>
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-4 md:p-6 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">Welcome, {displayName}</h1>
        <p className="opacity-90 text-sm md:text-lg text-white">
          {universityName} - {position}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Employee ID Card */}
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center border border-gray-100 cursor-pointer hover:bg-gray-50" onClick={handleViewPersonalInfo}>
          <div className="rounded-full bg-blue-100 p-2 md:p-3 mr-3">
            <FontAwesomeIcon icon={faIdCard} className="text-blue-600 text-lg md:text-2xl" />
          </div>
          <div>
            <h3 className="text-gray-500 text-xs md:text-sm font-medium">Employee ID</h3>
            <p className="text-md md:text-lg font-semibold">{employeeIdDisplay}</p>
          </div>
        </div>

        {/* Department */}
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center border border-gray-100 cursor-pointer hover:bg-gray-50" onClick={handleViewPersonalInfo}>
          <div className="rounded-full bg-indigo-100 p-2 md:p-3 mr-3">
            <FontAwesomeIcon icon={faBuilding} className="text-indigo-600 text-lg md:text-2xl" />
          </div>
          <div>
            <h3 className="text-gray-500 text-xs md:text-sm font-medium">Department</h3>
            <p className="text-md md:text-lg font-semibold">{department}</p>
          </div>
        </div>

        {/* Position */}
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center border border-gray-100 cursor-pointer hover:bg-gray-50" onClick={handleViewPersonalInfo}>
          <div className="rounded-full bg-green-100 p-2 md:p-3 mr-3">
            <FontAwesomeIcon icon={faIdBadge} className="text-green-600 text-lg md:text-2xl" />
          </div>
          <div>
            <h3 className="text-gray-500 text-xs md:text-sm font-medium">Position</h3>
            <p className="text-md md:text-lg font-semibold">{employeeData?.position || userDetails?.position || 'Not assigned'}</p>
          </div>
        </div>

        {/* Skillset */}
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center border border-gray-100 cursor-pointer hover:bg-gray-50" onClick={handleViewAllSkills}>
          <div className="rounded-full bg-green-100 p-2 md:p-3 mr-3">
            <FontAwesomeIcon icon={faGraduationCap} className="text-green-600 text-lg md:text-2xl" />
          </div>
          <div>
            <h3 className="text-gray-500 text-xs md:text-sm font-medium">Skills Acquired</h3>
            <p className="text-md md:text-lg font-semibold">{skills.length || 0}</p>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-xl shadow-md p-4 flex items-center border border-gray-100 cursor-pointer hover:bg-gray-50" onClick={() => navigate('/employee/profile', { state: { activeTab: 'documents' } })}>
          <div className="rounded-full bg-purple-100 p-2 md:p-3 mr-3">
            <FontAwesomeIcon icon={faClipboardList} className="text-purple-600 text-lg md:text-2xl" />
          </div>
          <div>
            <h3 className="text-gray-500 text-xs md:text-sm font-medium">Documents</h3>
            <p className="text-md md:text-lg font-semibold">{employeeData?.documents?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Skills & Career Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Skills Overview */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-800">My Skills</h2>
            <button 
              onClick={handleViewAllSkills}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center cursor-pointer"
            >
              View All
              <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-xs" />
            </button>
          </div>
          
          {skills.length > 0 ? (
            <div className="space-y-3">
              {skills.slice(0, 4).map((skill) => (
                <div key={skill.id} className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${skill.proficiency || 0}%` }}
                    ></div>
                  </div>
                  <span className="ml-3 text-gray-600 min-w-[80px] text-sm truncate">{skill.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">No skills have been added to your profile yet.</p>
            </div>
          )}
        </div>

        {/* Career Path */}
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-800">Career Path</h2>
            <button 
              onClick={handleViewCareerDetails}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center cursor-pointer"
            >
              View Details
              <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-xs" />
            </button>
          </div>
          
          {careerPaths.length > 0 ? (
            <div className="relative">
              {/* Career Path Timeline */}
              <div className="border-l-2 border-blue-500 ml-3 pl-4 space-y-4">
                {careerPaths.slice(0, 2).map((path, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-6 top-0 bg-blue-500 w-3 h-3 rounded-full"></div>
                    <h3 className="text-sm md:text-md font-semibold">{path.position || path.title}</h3>
                    <p className="text-xs md:text-sm text-gray-500 line-clamp-2">{path.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">No career path information available yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Activities & Notifications */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Recent Activities</h2>
          <button 
            onClick={handleViewAllActivities}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center cursor-pointer"
          >
            View All
            <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-xs" />
          </button>
        </div>

        {/* Activity List */}
        <div className="space-y-3">
          <div className="flex items-start p-3 rounded-lg bg-gray-50">
            <div className="bg-blue-100 p-2 rounded-lg mr-3 flex-shrink-0">
              <FontAwesomeIcon icon={faChartLine} className="text-blue-600 text-sm" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Profile Updated</h3>
              <p className="text-xs text-gray-500">Your employee profile was last updated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="flex items-start p-3 rounded-lg bg-gray-50">
            <div className="bg-green-100 p-2 rounded-lg mr-3 flex-shrink-0">
              <FontAwesomeIcon icon={faGraduationCap} className="text-green-600 text-sm" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Welcome to Your Employee Portal</h3>
              <p className="text-xs text-gray-500">You can track your career progress, documents, and more from this dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard; 