import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt, 
  faUser, 
  faFileAlt, 
  faChartLine, 
  faSignOutAlt,
  faBars,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import logo from '../../assets/logo.png';
import toast from 'react-hot-toast';

const EmployeeLayout = () => {
  const { user, userDetails, university, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Debug user authentication
  useEffect(() => {
    console.log("EmployeeLayout - User:", user);
    console.log("EmployeeLayout - UserDetails:", userDetails);
    console.log("EmployeeLayout - University:", university);
    
    // Redirect to login if not authenticated
    if (!user) {
      console.log("No authenticated user found, redirecting to login");
      toast.error("Please login to access employee dashboard");
      navigate('/', { replace: true });
    }
  }, [user, userDetails, university, navigate]);

  // Check if mobile on resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Initial check
    checkIfMobile();

    // Add event listener
    window.addEventListener('resize', checkIfMobile);

    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navigation = [
    { name: 'Dashboard', icon: faTachometerAlt, path: '/employee/dashboard' },
    { name: 'Profile', icon: faUser, path: '/employee/profile' },
    { name: 'Documents', icon: faFileAlt, path: '/employee/documents' },
    { name: 'Career Progress', icon: faChartLine, path: '/employee/career' }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div 
        className={`fixed md:relative z-20 transition-all duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20'
        } bg-white md:w-64 border-r shadow-sm h-full`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center py-6 border-b">
            {isSidebarOpen || !isMobile ? (
              <img src={logo} alt="Logo" className="h-10" />
            ) : null}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-6 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-600 ${
                      location.pathname === item.path ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : ''
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                    {(isSidebarOpen || !isMobile) && (
                      <span className="ml-3">{item.name}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Profile & Logout */}
          <div className="p-4 border-t">
            {isSidebarOpen || !isMobile ? (
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                  {user?.displayName?.charAt(0) || userDetails?.name?.charAt(0) || 'U'}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.displayName || userDetails?.name || 'Employee'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {userDetails?.position || userDetails?.role || 'Employee'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center mb-4">
                <div className="bg-blue-100 text-blue-600 rounded-full w-10 h-10 flex items-center justify-center font-bold">
                  {user?.displayName?.charAt(0) || userDetails?.name?.charAt(0) || 'U'}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`flex items-center w-full px-4 py-2 text-red-600 rounded-md hover:bg-red-50 ${
                !isSidebarOpen && isMobile ? 'justify-center' : ''
              }`}
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              {(isSidebarOpen || !isMobile) && <span className="ml-2">Logout</span>}
            </button>
          </div>

          {/* Mobile Toggle Button */}
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className="absolute top-4 right-4 p-2 rounded-md bg-gray-200 text-gray-600 md:hidden"
            >
              <FontAwesomeIcon icon={isSidebarOpen ? faTimes : faBars} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b shadow-sm">
          <div className="px-4 py-4 flex items-center justify-between">
            {/* Mobile Toggle Button */}
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md bg-gray-100 text-gray-600 md:hidden"
              >
                <FontAwesomeIcon icon={faBars} />
              </button>
            )}
            <h1 className="text-xl font-bold text-gray-800">
              {navigation.find(item => item.path === location.pathname)?.name || 'Employee Portal'}
            </h1>
            <div className="flex items-center">
              <span className="hidden md:block text-sm text-gray-500">
                {university?.name || userDetails?.universityName || 'University'}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default EmployeeLayout; 