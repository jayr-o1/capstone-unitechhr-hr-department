import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import loginBg from "../assets/login_bg.png";
import splashArt from "../assets/splash_art.png";
import logo from "../assets/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faArrowLeft, faSchool, faIdCard, faSearch } from "@fortawesome/free-solid-svg-icons";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import showWarningAlert from "../components/Alerts/WarningAlert";
import toast from "react-hot-toast";

const UNIVERSITY_STORAGE_KEY = "unitech_university_data";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState("hr"); // Default to HR login
  const [universityId, setUniversityId] = useState("");
  const [universityName, setUniversityName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [step, setStep] = useState(1); // Step 1: Choose login mode, Step 2: Enter university ID (for employee), Step 3: Login
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidationError, setCodeValidationError] = useState("");
  const [error, setError] = useState("");
  
  const navigate = useNavigate();
  const { login, loading, error: authError } = useAuth();

  // Load saved university information when component mounts
  useEffect(() => {
    const savedUniversityData = localStorage.getItem(UNIVERSITY_STORAGE_KEY);
    if (savedUniversityData) {
      try {
        const { id, name } = JSON.parse(savedUniversityData);
        if (id && name) {
          console.log("Found saved university data:", id, name);
          setUniversityId(id);
          setUniversityName(name);
        }
      } catch (error) {
        console.error("Error parsing saved university data:", error);
        localStorage.removeItem(UNIVERSITY_STORAGE_KEY);
      }
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate inputs
    if (!password) {
      setError("Please enter your password");
      return;
    }
    
    let loginEmail = "";
    
    // If this is employee login mode
    if (loginMode === "employee") {
      // Validate employee ID for employee login
      if (!employeeId) {
        setError("Please enter your employee ID");
        return;
      }
      
      // Construct login email with the marker for employee logins
      loginEmail = `${employeeId}@${universityId}_EMPLOYEE_LOGIN_MARKER.com`;
      
      // Debug logs
      console.log("Employee login attempt with:", {
        employeeId,
        universityId,
        loginEmail
      });
    } else {
      // Regular HR login with email
      loginEmail = email;
      
      // Validate email format for HR login
      if (!loginEmail || !loginEmail.includes('@')) {
        setError("Please enter a valid email address");
        return;
      }
      
      console.log("HR login attempt with:", {
        email: loginEmail
      });
    }
    
    // Show loading toast
    const loadingToast = toast.loading(
      loginMode === 'employee' 
        ? 'Logging in as employee...' 
        : 'Logging in as HR staff...'
    );
    
    try {
      const result = await login(loginEmail, password);
      console.log("Login result:", result);
      
      // Clear loading toast
      toast.dismiss(loadingToast);
      
      if (result.success) {
        // Show success toast with appropriate details
        const userName = result.role === 'employee' 
          ? result.employeeData?.name || employeeId
          : 'HR Staff';
        
        toast.success(`Welcome, ${userName}! Login successful.`);
        
        // If this is an employee login, save university data to localStorage
        if (result.role === 'employee' && result.universityId && result.universityName) {
          console.log(`Login successful for employee ${result.employeeData?.name || employeeId} at ${result.universityName}`);
          
          // Update localStorage with the university data
          saveUniversityData(result.universityCode || result.universityId, result.universityName);
          
          // Add a small delay to allow the toast to show before navigation
          setTimeout(() => {
            // Navigate to employee dashboard with replace:true to prevent going back to login
            console.log("Navigating to employee dashboard");
            navigate("/employee/dashboard", { replace: true });
          }, 800);
        } else {
          // For HR staff, navigate to HR dashboard with a small delay
          setTimeout(() => {
            console.log("Navigating to HR dashboard");
            navigate("/dashboard", { replace: true });
          }, 800);
        }
      } else if (result.message) {
        // Show error toast if there's an error message
        toast.error(result.message);
      }
    } catch (error) {
      // Clear loading toast and show error
      toast.dismiss(loadingToast);
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    }
  };

  const handleModeSelection = (mode) => {
    setLoginMode(mode);
    if (mode === "employee") {
      // If we already have university data, skip to step 3
      if (universityId && universityName) {
        setStep(3);
      } else {
        setStep(2); // Otherwise go to university ID step
      }
    } else {
      setStep(1); // If HR mode, stay on the same step but update the mode
    }
  };

  const validateUniversityCode = async (code) => {
    if (!code.trim()) return false;
    
    setValidatingCode(true);
    setCodeValidationError("");
    
    console.log("Validating university code:", code);
    
    try {
      // Query for the university with this code
      const universitiesRef = collection(db, "universities");
      const universityQuery = query(universitiesRef, where("code", "==", code));
      console.log("Querying for university with code:", code);
      
      const universitySnapshot = await getDocs(universityQuery);
      console.log("Query results:", universitySnapshot.size, "results found");
      
      // If no results found by code, check if it might be a direct document ID instead
      if (universitySnapshot.empty) {
        console.log("No university found with code, checking if it's a document ID:", code);
        
        try {
          // Try to get the document directly by ID
          const universityDocRef = doc(db, "universities", code);
          const universityDoc = await getDoc(universityDocRef);
          
          if (universityDoc.exists()) {
            console.log("Found university by document ID:", code);
            const name = universityDoc.data().name;
            console.log("University name:", name);
            
            setUniversityName(name);
            saveUniversityData(code, name);
            setValidatingCode(false);
            return true;
          }
        } catch (docError) {
          console.error("Error checking document by ID:", docError);
        }
        
        // If we reach here, university was not found by code or direct ID
        console.error("University not found with code or ID:", code);
        
        // Log all universities in the database for debugging
        const allUniversitiesQuery = query(collection(db, "universities"));
        const allUniversities = await getDocs(allUniversitiesQuery);
        console.log("Total universities in the database:", allUniversities.size);
        
        if (allUniversities.size > 0) {
          console.log("All universities in the database:");
          allUniversities.forEach(doc => {
            console.log(`- ID: ${doc.id}, Name: ${doc.data().name}, Code: ${doc.data().code || 'No code'}`);
          });
        }
        
        setCodeValidationError("University not found. Please check your code.");
        setValidatingCode(false);
        return false;
      }
      
      // Get the university name
      const universityDoc = universitySnapshot.docs[0];
      const name = universityDoc.data().name;
      console.log("Found university:", name, "with code:", code);
      
      setUniversityName(name);
      
      // Save university data to localStorage
      saveUniversityData(code, name);
      
      setValidatingCode(false);
      return true;
    } catch (error) {
      console.error("Error validating university code:", error);
      setCodeValidationError("Error validating code. Please try again.");
      setValidatingCode(false);
      return false;
    }
  };
  
  // Save university data to localStorage
  const saveUniversityData = (id, name) => {
    try {
      localStorage.setItem(UNIVERSITY_STORAGE_KEY, JSON.stringify({ id, name }));
      console.log("Saved university data to localStorage:", id, name);
    } catch (error) {
      console.error("Error saving university data:", error);
    }
  };
  
  // Clear university data from localStorage
  const clearUniversityData = () => {
    try {
      localStorage.removeItem(UNIVERSITY_STORAGE_KEY);
      setUniversityId("");
      setUniversityName("");
      console.log("Cleared university data from localStorage");
    } catch (error) {
      console.error("Error clearing university data:", error);
    }
  };

  const handleUniversitySubmit = async (e) => {
    e.preventDefault();
    if (universityId.trim() === "") return;
    
    const isValid = await validateUniversityCode(universityId);
    if (isValid) {
      setStep(3); // Move to employee login step
    }
  };

  const goBack = () => {
    if (step === 3) {
      // Use the custom warning alert instead of window.confirm
      showWarningAlert(
        "Are you sure you want to change your university?",
        () => {
          clearUniversityData();
          setStep(2); // Go back to university ID step
        },
        "Yes, Change",
        "Keep Current University"
      );
    } else if (step === 2) {
      setStep(1); // Go back to mode selection
      setLoginMode("hr");
    }
  };

  // Add a helper function to render the login mode toggle
  const renderLoginModeToggle = () => {
    return (
      <div className="flex items-center justify-center mb-4 md:mb-6">
        <div className="flex p-1 bg-gray-100 rounded-full w-full sm:w-auto">
          <button
            className={`px-3 md:px-4 py-2 rounded-full text-sm md:text-base flex-1 sm:flex-initial ${
              loginMode === "hr"
                ? "bg-blue-600 text-white"
                : "bg-transparent text-gray-700"
            }`}
            onClick={() => handleModeSelection("hr")}
            type="button"
          >
            <FontAwesomeIcon icon={faIdCard} className="mr-1 md:mr-2" />
            HR Login
          </button>
          <button
            className={`px-3 md:px-4 py-2 rounded-full text-sm md:text-base flex-1 sm:flex-initial ${
              loginMode === "employee"
                ? "bg-blue-600 text-white"
                : "bg-transparent text-gray-700"
            }`}
            onClick={() => handleModeSelection("employee")}
            type="button"
          >
            <FontAwesomeIcon icon={faSchool} className="mr-1 md:mr-2" />
            Employee Login
          </button>
        </div>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
        {/* Left Column - Hidden on mobile */}
        <div className="hidden md:flex flex-col items-center justify-center text-center p-6 space-y-4">
          <img
            src={splashArt}
            alt="Splash Art"
            className="w-full max-w-md h-auto object-contain transform -translate-y-12 translate-x-10"
          />
          <p className="text-2xl font-semibold text-[#75808B] font-fredoka -translate-y-12 translate-x-10">
            A Smart HRIS Solution for Optimized University HR Management
          </p>
        </div>

        {/* Right Column - Full width on mobile */}
        <div className="flex items-center justify-center py-4 px-3 md:p-6 md:col-span-1 col-span-2">
          <div className="bg-white p-4 md:p-8 rounded-lg shadow-lg w-full max-w-md border border-black">
            {/* Logo */}
            <div className="flex justify-center mb-3 md:mb-4">
              <img src={logo} alt="Logo" className="w-36 md:w-48 h-auto" />
            </div>

            {/* Sign In Text */}
            <h2 className="text-xl md:text-2xl font-bold font-fredoka text-center mb-2 md:mb-4">
              {step === 1 ? "Sign In" : step === 2 ? "Enter University ID" : "Employee Login"}
            </h2>

            {/* Welcome Back Text */}
            <p className="text-center text-[#75808B] font-fredoka text-sm md:text-base text-gray-600 mb-4 md:mb-6">
              {step === 1 
                ? "Welcome back! Please sign in to continue." 
                : step === 2 
                ? "Please enter your university's unique identifier." 
                : `Welcome! Please sign in with your employee credentials for ${universityName || universityId}.`}
            </p>
            
            {/* Loading Spinner */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 md:h-12 md:w-12 border-t-4 border-blue-500"></div>
                <p className="text-sm text-gray-600 mt-4">Loading...</p>
              </div>
            )}

            {/* Step 1: Choose Login Mode */}
            {!loading && step === 1 && (
              <div>
                {/* Toggle between HR and Employee login */}
                {renderLoginModeToggle()}

                {/* HR Login Form */}
                <form className="space-y-3 md:space-y-4" onSubmit={handleLogin}>
                  {/* Error Messages */}
                  {(authError || error) && (
                    <p className="text-red-500 text-center mb-2 md:mb-3 text-sm">{error || authError}</p>
                  )}

                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-1 md:mb-2 text-sm font-medium text-gray-900"
                    >
                      Your email
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 text-sm md:text-base"
                      placeholder="hr@university.edu"
                      required
                    />
                  </div>
                  
                  {/* Password */}
                  <div className="relative">
                    <label
                      htmlFor="password"
                      className="block mb-1 md:mb-2 text-sm font-medium text-gray-900"
                    >
                      Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 text-sm md:text-base"
                      required
                    />
                    {/* Eye Icon */}
                    <FontAwesomeIcon
                      icon={showPassword ? faEyeSlash : faEye}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3 transform translate-y-1/3 cursor-pointer text-gray-600"
                    />
                  </div>

                  {/* Remember Me and Forgot Password */}
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="remember"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
                        />
                      </div>
                      <div className="ml-2 text-sm">
                        <label htmlFor="remember" className="text-gray-500">
                          Remember me
                        </label>
                      </div>
                    </div>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Sign in Button */}
                  <button
                    type="submit"
                    className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mt-2"
                  >
                    Sign in
                  </button>

                  {/* Sign Up Link */}
                  <p className="text-sm font-light text-gray-500 text-center mt-2">
                    Don't have an account yet?{" "}
                    <Link
                      to="/signup"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      Sign up
                    </Link>
                  </p>
                </form>
              </div>
            )}

            {/* Step 2: Enter University ID (for employee login) */}
            {!loading && step === 2 && (
              <div>
                {/* Toggle between HR and Employee login */}
                {renderLoginModeToggle()}

                <form className="space-y-3 md:space-y-4" onSubmit={handleUniversitySubmit}>
                  {/* Error Messages */}
                  {(authError || error || codeValidationError) && (
                    <p className="text-red-500 text-center mb-2 md:mb-3 text-sm">
                      {error || codeValidationError || authError}
                    </p>
                  )}

                  <div>
                    <label
                      htmlFor="universityId"
                      className="block mb-1 md:mb-2 text-sm font-medium text-gray-900"
                    >
                      University Identifier
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faSchool}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        name="universityId"
                        id="universityId"
                        value={universityId}
                        onChange={(e) => setUniversityId(e.target.value)}
                        className="pl-10 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 text-sm md:text-base"
                        placeholder="university-code"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This is a unique identifier provided by your university HR department.
                    </p>
                  </div>

                  {/* Continue Button */}
                  <button
                    type="submit"
                    className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center mt-2"
                    disabled={validatingCode}
                  >
                    {validatingCode ? (
                      <>
                        <span className="mr-2 inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Validating...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faSearch} className="mr-2" />
                        Find University & Continue
                      </>
                    )}
                  </button>

                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={goBack}
                    className="w-full text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                    Back
                  </button>
                </form>
              </div>
            )}

            {/* Step 3: Employee Login Form */}
            {!loading && step === 3 && (
              <div>
                {/* Toggle between HR and Employee login */}
                {renderLoginModeToggle()}

                <form className="space-y-3 md:space-y-4" onSubmit={handleLogin}>
                  {/* Error Messages */}
                  {(authError || error) && (
                    <p className="text-red-500 text-center mb-2 md:mb-3 text-sm">{error || authError}</p>
                  )}

                  {/* University ID Display */}
                  <div className="bg-blue-50 p-2 md:p-3 rounded-lg flex items-center mb-2">
                    <FontAwesomeIcon icon={faSchool} className="text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">University:</p>
                      <p className="text-blue-600 font-semibold text-sm md:text-base">{universityName || universityId}</p>
                      {universityName && (
                        <p className="text-xs text-gray-500">Code: {universityId}</p>
                      )}
                    </div>
                  </div>

                  {/* Employee ID */}
                  <div>
                    <label
                      htmlFor="employeeId"
                      className="block mb-1 md:mb-2 text-sm font-medium text-gray-900"
                    >
                      Employee ID
                    </label>
                    <div className="relative">
                      <FontAwesomeIcon
                        icon={faIdCard}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        name="employeeId"
                        id="employeeId"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        className="pl-10 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 text-sm md:text-base"
                        placeholder="EMP12345"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <label
                      htmlFor="password"
                      className="block mb-1 md:mb-2 text-sm font-medium text-gray-900"
                    >
                      Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2 text-sm md:text-base"
                      required
                    />
                    {/* Eye Icon */}
                    <FontAwesomeIcon
                      icon={showPassword ? faEyeSlash : faEye}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-3 transform translate-y-1/3 cursor-pointer text-gray-600"
                    />
                  </div>

                  {/* Remember Me and Forgot Password */}
                  <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="remember"
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300"
                        />
                      </div>
                      <div className="ml-2 text-sm">
                        <label htmlFor="remember" className="text-gray-500">
                          Remember me
                        </label>
                      </div>
                    </div>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  {/* Sign in Button */}
                  <button
                    type="submit"
                    className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mt-2"
                  >
                    Sign in
                  </button>

                  {/* Change University Button */}
                  <button
                    type="button"
                    onClick={goBack}
                    className="w-full text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center flex items-center justify-center"
                  >
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                    Change University
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 