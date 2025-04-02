import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { getEmployeeData, getEmployeeSkills, getCareerPaths } from '../../services/employeeService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faIdCard, faGraduationCap, faClipboardList, faChartLine } from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';

const EmployeeDashboard = () => {
  const { user, userDetails, university } = useAuth();
  const [employeeData, setEmployeeData] = useState(null);
  const [skills, setSkills] = useState([]);
  const [careerPaths, setCareerPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md">
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
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
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome, {displayName}</h1>
        <p className="opacity-90 text-lg">
          {universityName} - {position}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Employee ID Card */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <FontAwesomeIcon icon={faIdCard} className="text-blue-600 text-2xl" />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Employee ID</h3>
            <p className="text-lg font-semibold">{employeeIdDisplay}</p>
          </div>
        </div>

        {/* Department */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-indigo-100 p-3 mr-4">
            <FontAwesomeIcon icon={faBuilding} className="text-indigo-600 text-2xl" />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Department</h3>
            <p className="text-lg font-semibold">{department}</p>
          </div>
        </div>

        {/* Skillset */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <FontAwesomeIcon icon={faGraduationCap} className="text-green-600 text-2xl" />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Skills Acquired</h3>
            <p className="text-lg font-semibold">{skills.length || 0}</p>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <FontAwesomeIcon icon={faClipboardList} className="text-purple-600 text-2xl" />
          </div>
          <div>
            <h3 className="text-gray-500 text-sm font-medium">Documents</h3>
            <p className="text-lg font-semibold">{employeeData?.documents?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Skills & Career Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Skills Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">My Skills</h2>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View All
            </button>
          </div>
          
          {skills.length > 0 ? (
            <div className="space-y-3">
              {skills.slice(0, 5).map((skill) => (
                <div key={skill.id} className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${skill.proficiency || 0}%` }}
                    ></div>
                  </div>
                  <span className="ml-4 text-gray-600 min-w-[80px]">{skill.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No skills recorded yet. Update your profile to add skills.
            </p>
          )}
        </div>

        {/* Career Path */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Career Progression</h2>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Explore
            </button>
          </div>
          
          {careerPaths.length > 0 ? (
            <div className="space-y-4">
              {careerPaths.slice(0, 3).map((path) => (
                <div key={path.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-2">
                    <FontAwesomeIcon icon={faChartLine} className="text-blue-600 mr-2" />
                    <h3 className="font-medium text-gray-800">{path.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{path.description.substring(0, 120)}...</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{path.steps?.length || 0} steps</span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Details</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No career paths available for your department.
            </p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {/* You can populate this with actual activity data */}
          <div className="border-l-4 border-blue-500 pl-4 py-1">
            <p className="text-gray-700">Profile updated</p>
            <span className="text-sm text-gray-500">2 days ago</span>
          </div>
          <div className="border-l-4 border-green-500 pl-4 py-1">
            <p className="text-gray-700">New certificate uploaded</p>
            <span className="text-sm text-gray-500">1 week ago</span>
          </div>
          <div className="border-l-4 border-purple-500 pl-4 py-1">
            <p className="text-gray-700">Completed skill assessment</p>
            <span className="text-sm text-gray-500">2 weeks ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard; 