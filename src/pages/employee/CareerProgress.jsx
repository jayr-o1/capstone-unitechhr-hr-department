import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  getEmployeeSkills, 
  getCareerPaths,
  getEmployeeData
} from '../../services/employeeService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faGraduationCap, 
  faAward, 
  faCheckCircle,
  faChevronRight,
  faStar,
  faStarHalfAlt,
  faCertificate,
  faArrowRight,
  faLightbulb,
  faBriefcase,
  faTrophy
} from '@fortawesome/free-solid-svg-icons';
import PageLoader from '../../components/PageLoader';

const CareerProgress = () => {
  const { user, userDetails } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [employeeData, setEmployeeData] = useState(null);
  const [skills, setSkills] = useState([]);
  const [careerPaths, setCareerPaths] = useState([]);
  const [selectedCareerPath, setSelectedCareerPath] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Refs for scrolling
  const careerPathDetailsRef = useRef(null);
  
  // Check for section and careerPathId in URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sectionParam = params.get('section');
    const careerPathParam = params.get('careerPathId');
    
    if (sectionParam && ['overview', 'career-path', 'skills-gap'].includes(sectionParam)) {
      setActiveSection(sectionParam);
    }
    
    // Set selected career path from URL if it exists and we have loaded career paths
    if (careerPathParam && careerPaths.length > 0) {
      const pathFromParam = careerPaths.find(path => path.id === careerPathParam);
      if (pathFromParam) {
        setSelectedCareerPath(pathFromParam);
      }
    }
  }, [location.search, careerPaths]);
  
  // Update URL when section or career path changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    
    if (activeSection) {
      params.set('section', activeSection);
    }
    
    if (selectedCareerPath?.id) {
      params.set('careerPathId', selectedCareerPath.id);
    }
    
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [activeSection, selectedCareerPath]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        if (userDetails && userDetails.universityId) {
          setLoading(true);
          
          // Fetch employee data
          const empData = await getEmployeeData(user.uid, userDetails.universityId);
          if (empData.success) {
            setEmployeeData(empData.data);
            
            // Fetch employee skills
            const skillsData = await getEmployeeSkills(user.uid, userDetails.universityId);
            if (skillsData.success) {
              setSkills(skillsData.skills);
            }
            
            // Fetch career paths
            if (empData.data.department) {
              const careerPathsData = await getCareerPaths(
                userDetails.universityId,
                empData.data.department
              );
              if (careerPathsData.success) {
                setCareerPaths(careerPathsData.careerPaths);
                
                // Check URL for career path selection
                const params = new URLSearchParams(location.search);
                const careerPathParam = params.get('careerPathId');
                
                if (careerPathParam) {
                  const pathFromParam = careerPathsData.careerPaths.find(path => path.id === careerPathParam);
                  if (pathFromParam) {
                    setSelectedCareerPath(pathFromParam);
                  } else if (careerPathsData.careerPaths.length > 0) {
                    // Fall back to first career path if ID not found
                    setSelectedCareerPath(careerPathsData.careerPaths[0]);
                  }
                } else if (careerPathsData.careerPaths.length > 0) {
                  // No URL param, select first career path
                  setSelectedCareerPath(careerPathsData.careerPaths[0]);
                }
              }
            }
          } else {
            setError('Failed to load employee data');
          }
          
          setLoading(false);
        }
      } catch (err) {
        console.error("Error loading career data:", err);
        setError("An error occurred while loading data");
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, userDetails]);
  
  // Scroll to career details if redirect from dashboard
  useEffect(() => {
    // Check both location state and URL params for section indication
    const params = new URLSearchParams(location.search);
    const sectionParam = params.get('section');
    
    const shouldScrollToCareerPath = 
      (location.state?.fromDashboard && careerPathDetailsRef.current) || 
      (sectionParam === 'career-path' && careerPathDetailsRef.current);
      
    if (shouldScrollToCareerPath) {
      setTimeout(() => {
        careerPathDetailsRef.current.scrollIntoView({ behavior: 'smooth' });
        setActiveSection('career-path');
      }, 300);
    }
  }, [location.state, location.search, selectedCareerPath]);
  
  const getSkillLevel = (proficiency) => {
    if (proficiency >= 90) return 'Expert';
    if (proficiency >= 70) return 'Advanced';
    if (proficiency >= 50) return 'Intermediate';
    if (proficiency >= 30) return 'Basic';
    return 'Novice';
  };
  
  const getMissingSkills = () => {
    if (!selectedCareerPath || !selectedCareerPath.requiredSkills || !skills.length) {
      return [];
    }
    
    const employeeSkillsMap = new Map();
    skills.forEach(skill => {
      employeeSkillsMap.set(skill.name.toLowerCase(), skill.proficiency || 0);
    });
    
    return selectedCareerPath.requiredSkills.filter(requiredSkill => {
      const employeeSkillLevel = employeeSkillsMap.get(requiredSkill.name.toLowerCase()) || 0;
      return employeeSkillLevel < requiredSkill.minimumProficiency;
    });
  };
  
  const getSkillProgressPercentage = () => {
    if (!selectedCareerPath || !selectedCareerPath.requiredSkills || !selectedCareerPath.requiredSkills.length) {
      return 0;
    }
    
    const missingSkills = getMissingSkills();
    const totalSkills = selectedCareerPath.requiredSkills.length;
    const acquiredSkills = totalSkills - missingSkills.length;
    
    return Math.round((acquiredSkills / totalSkills) * 100);
  };
  
  const handleViewAllSkills = () => {
    navigate('/employee/profile', { 
      state: { activeTab: 'skills' },
      search: new URLSearchParams({ tab: 'skills' }).toString()
    });
  };
  
  const handleChangeSection = (section) => {
    setActiveSection(section);
    
    // Update URL
    const params = new URLSearchParams(location.search);
    params.set('section', section);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };
  
  const handleSelectCareerPath = (careerPath) => {
    setSelectedCareerPath(careerPath);
    
    // Update URL
    const params = new URLSearchParams(location.search);
    params.set('careerPathId', careerPath.id);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };
  
  if (loading) {
    return <PageLoader isLoading={true} message="Loading your career progress..." />;
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
  
  const missingSkills = getMissingSkills();
  const skillProgressPercentage = getSkillProgressPercentage();

  return (
    <div className="pb-6">
      <h1 className="text-2xl font-bold mb-6">Career Development</h1>
      
      {/* Current Position Overview */}
      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Current Position</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-blue-50 rounded-xl p-4 flex flex-col items-center text-center">
            <div className="bg-blue-100 rounded-full p-3 mb-3">
              <FontAwesomeIcon icon={faBriefcase} className="text-blue-600 text-xl" />
            </div>
            <h3 className="font-semibold mb-1">Current Position</h3>
            <p className="text-lg font-bold text-blue-700">{employeeData?.position || 'Not assigned'}</p>
          </div>
          
          <div className="bg-indigo-50 rounded-xl p-4 flex flex-col items-center text-center">
            <div className="bg-indigo-100 rounded-full p-3 mb-3">
              <FontAwesomeIcon icon={faTrophy} className="text-indigo-600 text-xl" />
            </div>
            <h3 className="font-semibold mb-1">Next Position</h3>
            <p className="text-lg font-bold text-indigo-700">{employeeData?.nextPosition || 'Not assigned'}</p>
          </div>
          
          <div className="bg-green-50 rounded-xl p-4 flex flex-col items-center text-center">
            <div className="bg-green-100 rounded-full p-3 mb-3">
              <FontAwesomeIcon icon={faChartLine} className="text-green-600 text-xl" />
            </div>
            <h3 className="font-semibold mb-1">Completion</h3>
            <p className="text-lg font-bold text-green-700">{skillProgressPercentage}%</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{employeeData?.position || 'Not assigned'}</span>
            <span className="font-medium">{employeeData?.nextPosition || 'Not assigned'}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${skillProgressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Career Path & Skills Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Skills Overview */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <FontAwesomeIcon icon={faGraduationCap} className="text-green-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Skills Overview</h2>
              <p className="text-gray-600">{skills.length} skills acquired</p>
            </div>
          </div>
          
          {skills.length > 0 ? (
            <div className="space-y-3 mt-4">
              {skills.slice(0, 5).map((skill) => (
                <div key={skill.id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-700">{skill.name}</span>
                    <span className="text-gray-500 text-sm">{getSkillLevel(skill.proficiency)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${skill.proficiency || 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              
              {skills.length > 5 && (
                <button 
                  onClick={handleViewAllSkills}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 flex items-center cursor-pointer"
                >
                  View all skills
                  <FontAwesomeIcon icon={faArrowRight} className="ml-1 text-xs" />
                </button>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No skills recorded yet.
            </p>
          )}
        </div>
        
        {/* Career Paths */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center mb-4">
            <div className="rounded-full bg-purple-100 p-3 mr-4">
              <FontAwesomeIcon icon={faChartLine} className="text-purple-600 text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Career Paths</h2>
              <p className="text-gray-600">{careerPaths.length} available paths</p>
            </div>
          </div>
          
          {careerPaths.length > 0 ? (
            <div className="space-y-3 mt-4">
              {careerPaths.map((path) => (
                <button
                  key={path.id}
                  onClick={() => {
                    setSelectedCareerPath(path);
                    setTimeout(() => {
                      if (careerPathDetailsRef.current) {
                        careerPathDetailsRef.current.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className={`w-full text-left p-3 rounded-lg flex items-center justify-between ${
                    selectedCareerPath?.id === path.id 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon 
                      icon={faAward} 
                      className={`mr-3 ${
                        selectedCareerPath?.id === path.id ? 'text-blue-600' : 'text-gray-400'
                      }`} 
                    />
                    <span>{path.title}</span>
                  </div>
                  <FontAwesomeIcon 
                    icon={faChevronRight} 
                    className={selectedCareerPath?.id === path.id ? 'text-blue-600' : 'text-gray-400'} 
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No career paths available for your department.
            </p>
          )}
        </div>
      </div>
      
      {/* Selected Career Path Details */}
      {selectedCareerPath && (
        <div ref={careerPathDetailsRef} className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {selectedCareerPath.title}
          </h2>
          
          <p className="text-gray-600 mb-6">
            {selectedCareerPath.description}
          </p>
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-gray-700 font-medium">Skills Progress</span>
              <span className="text-gray-700 font-medium">{skillProgressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`h-4 rounded-full ${
                  skillProgressPercentage >= 75 ? 'bg-green-600' : 
                  skillProgressPercentage >= 50 ? 'bg-blue-600' : 
                  skillProgressPercentage >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${skillProgressPercentage}%` }}
              ></div>
            </div>
          </div>
          
          {/* Career Path Steps */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Career Path Steps
            </h3>
            
            <div className="space-y-6">
              {selectedCareerPath.steps?.map((step, index) => (
                <div key={index} className="relative pl-8 pb-8 border-l-2 border-blue-200">
                  {/* Timeline Dot */}
                  <div className="absolute -left-2.5 top-0">
                    <div className="bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center">
                      <span className="text-white text-xs">{index + 1}</span>
                    </div>
                  </div>
                  
                  {/* Step Content */}
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-medium text-gray-800">{step.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                    
                    {step.skills && step.skills.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Required Skills:</h5>
                        <div className="flex flex-wrap gap-2">
                          {step.skills.map((skill, skillIndex) => (
                            <span 
                              key={skillIndex}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Missing Skills */}
          {missingSkills.length > 0 && (
            <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <div className="flex items-center mb-4">
                <FontAwesomeIcon icon={faLightbulb} className="text-yellow-500 text-xl mr-3" />
                <h3 className="text-lg font-bold text-gray-800">Skills to Develop</h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                To progress in this career path, focus on developing these skills:
              </p>
              
              <div className="space-y-4">
                {missingSkills.map((skill, index) => (
                  <div key={index} className="flex items-center">
                    <FontAwesomeIcon icon={faArrowRight} className="text-yellow-500 mr-3" />
                    <div>
                      <h4 className="font-medium text-gray-800">{skill.name}</h4>
                      <p className="text-gray-600 text-sm">
                        Required level: {skill.minimumProficiency}% (
                        {getSkillLevel(skill.minimumProficiency)})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Certifications & Achievements */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Certifications & Achievements
        </h2>
        
        {employeeData?.certifications?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employeeData.certifications.map((cert, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-start">
                  <FontAwesomeIcon icon={faCertificate} className="text-blue-500 mt-1 mr-3" />
                  <div>
                    <h3 className="font-medium text-gray-800">{cert.name}</h3>
                    <p className="text-gray-500 text-sm">{cert.issuer}</p>
                    <p className="text-gray-500 text-sm">{cert.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <FontAwesomeIcon icon={faAward} className="text-gray-300 text-5xl mb-4" />
            <p className="text-gray-500">No certifications or achievements yet.</p>
            <p className="text-gray-500 text-sm mt-2">
              Upload your certifications in the Profile section.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerProgress; 