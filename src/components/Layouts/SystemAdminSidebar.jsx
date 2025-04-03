import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthProvider";
import { Building, Users, UserCheck, LayoutDashboard, Key, Settings, LogOut } from "lucide-react";

const SystemAdminSidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Navigation links for system admin
  const navLinks = [
    {
      name: "Dashboard",
      path: "/system-admin/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Universities",
      path: "/system-admin/universities",
      icon: <Building className="w-5 h-5" />,
    },
    {
      name: "HR Head Approvals",
      path: "/system-admin/approvals",
      icon: <UserCheck className="w-5 h-5" />,
    },
    {
      name: "Licenses",
      path: "/system-admin/licenses",
      icon: <Key className="w-5 h-5" />,
    },
    {
      name: "System Users",
      path: "/system-admin/users",
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-10 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-20 flex flex-col w-64 max-h-screen bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:z-0`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-16 px-4 py-4 border-b border-gray-200 bg-blue-700">
          <div className="flex items-center">
            <div className="bg-white p-1.5 rounded-md mr-2">
              <img
                src="/favicon.png"
                alt="Logo"
                className="h-7 w-7"
              />
            </div>
            <span className="text-xl font-semibold text-white">
              System Admin
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 lg:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="mt-4 overflow-y-auto flex-grow">
          <div className="px-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-4 py-3 mt-2 text-gray-600 transition-colors duration-300 transform rounded-lg ${
                  location.pathname === link.path ||
                  location.pathname.startsWith(`${link.path}/`)
                    ? "bg-blue-100 text-blue-700 font-medium shadow-sm"
                    : "hover:bg-gray-100 hover:text-blue-600"
                }`}
              >
                <div className="w-5 h-5 mr-3">{link.icon}</div>
                <span className="font-medium">{link.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="px-4 py-4 mt-auto border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-3 text-gray-600 transition-colors duration-300 transform rounded-lg hover:bg-red-50 hover:text-red-600 w-full"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default SystemAdminSidebar; 