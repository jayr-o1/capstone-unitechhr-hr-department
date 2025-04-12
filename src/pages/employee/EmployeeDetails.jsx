import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthProvider';
import { getEmployeeDetailById } from '../../services/employeeService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faPhone, faBuilding, faBriefcase, faGraduationCap, faIdBadge } from '@fortawesome/free-solid-svg-icons';
import EmployeePageLoader from '../../components/employee/EmployeePageLoader';
import toast from 'react-hot-toast';

const EmployeeDetails = () => {
  const { id } = useParams();
  const { userDetails } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadEmployeeDetails = async () => {
      if (!id || !userDetails?.universityId) {
        setError("Missing employee ID or university information");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await getEmployeeDetailById(id, userDetails.universityId);
        
        if (result.success) {
          setEmployee(result.data);
        } else {
          setError(result.message || "Failed to load employee details");
          toast.error(result.message || "Failed to load employee details");
        }
      } catch (err) {
        console.error("Error loading employee details:", err);
        setError("An error occurred while loading employee details");
        toast.error("An error occurred while loading employee details");
      } finally {
        setLoading(false);
      }
    };

    loadEmployeeDetails();
  }, [id, userDetails]);

  if (loading) {
    return <EmployeePageLoader isLoading={true} message="Loading employee details..." />;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-8">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-lg mb-4">
          <p>Employee not found</p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Employee Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-blue-100 text-blue-600 rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl mr-4">
              {employee.name?.charAt(0) || 'E'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{employee.name}</h1>
              <p className="text-gray-600">{employee.position}</p>
              <p className="text-gray-500 text-sm">{employee.department}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {employee.status || 'Active'}
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
              Employee ID: {employee.employeeId}
            </span>
          </div>
        </div>
      </div>

      {/* Employee Details */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Employee Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Contact Information</h3>
            
            {employee.email && (
              <div className="flex items-start">
                <FontAwesomeIcon icon={faEnvelope} className="text-gray-500 mt-1 w-5 h-5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-gray-800">{employee.email}</p>
                </div>
              </div>
            )}
            
            {employee.phone && (
              <div className="flex items-start">
                <FontAwesomeIcon icon={faPhone} className="text-gray-500 mt-1 w-5 h-5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-800">{employee.phone}</p>
                </div>
              </div>
            )}
            
            {employee.employeeId && (
              <div className="flex items-start">
                <FontAwesomeIcon icon={faIdBadge} className="text-gray-500 mt-1 w-5 h-5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Employee ID</p>
                  <p className="text-gray-800">{employee.employeeId}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Job Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Job Information</h3>
            
            {employee.department && (
              <div className="flex items-start">
                <FontAwesomeIcon icon={faBuilding} className="text-gray-500 mt-1 w-5 h-5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="text-gray-800">{employee.department}</p>
                </div>
              </div>
            )}
            
            {employee.position && (
              <div className="flex items-start">
                <FontAwesomeIcon icon={faBriefcase} className="text-gray-500 mt-1 w-5 h-5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="text-gray-800">{employee.position}</p>
                </div>
              </div>
            )}
            
            {employee.joinDate && (
              <div className="flex items-start">
                <FontAwesomeIcon icon={faUser} className="text-gray-500 mt-1 w-5 h-5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Join Date</p>
                  <p className="text-gray-800">{new Date(employee.joinDate.seconds * 1000).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Skills Section */}
      {employee.skills && employee.skills.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Skills</h2>
          
          <div className="space-y-4">
            {employee.skills.map((skill, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{skill.name}</h4>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {skill.category || 'Technical'}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${skill.proficiency}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Beginner</span>
                  <span>Intermediate</span>
                  <span>Advanced</span>
                  <span>Expert</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDetails; 