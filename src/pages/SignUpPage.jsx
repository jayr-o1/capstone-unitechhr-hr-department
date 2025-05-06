import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthProvider";
import loginBg from "../assets/login_bg.png";
import splashArt from "../assets/splash_art.png";
import logo from "../assets/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faEye,
    faEyeSlash,
    faCheckCircle,
    faIdCard,
    faUserTie,
    faUniversity,
} from "@fortawesome/free-solid-svg-icons";

// Success Screen Component
const SuccessScreen = ({ universityName, onProceedToLogin }) => {
    const universityCode = universityName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");

    const copyCodeToClipboard = () => {
        navigator.clipboard.writeText(universityCode);
        alert("University code copied to clipboard!");
    };

    return (
        <div
            className="min-h-screen bg-cover bg-center flex items-center justify-center p-4"
            style={{
                backgroundImage: `url(${loginBg})`,
                backgroundColor: "rgba(240, 245, 255, 0.95)",
                backgroundBlendMode: "overlay",
            }}
        >
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md border-t-4 border-blue-600 text-center animate-fadeIn">
                <div className="flex justify-center mb-6">
                    <img src={logo} alt="Logo" className="w-48 h-auto" />
                </div>

                <div className="text-green-600 text-7xl flex justify-center mb-6">
                    <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="animate-scaleIn"
                    />
                </div>

                <h2 className="text-2xl font-bold font-fredoka mb-4 text-gray-800">
                    Registration Successful
                </h2>

                <div className="text-gray-700 mb-6">
                    <p className="mb-4">
                        Your university has been registered as{" "}
                        <span className="font-semibold">{universityName}</span>
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800 mb-2">
                            University Code:
                        </p>
                        <div className="flex items-center justify-center">
                            <p className="font-mono text-xl font-bold text-blue-700 mr-2">
                                {universityCode}
                            </p>
                            <button
                                onClick={copyCodeToClipboard}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Copy code"
                            >
                                <FontAwesomeIcon icon={faCheckCircle} />
                            </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            Please save this code for employees to use when
                            registering.
                        </p>
                    </div>

                    <p>You can now log in with your email and password.</p>
                </div>

                <button
                    onClick={onProceedToLogin}
                    className="inline-block w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-base px-5 py-3 text-center transition-all duration-200 transform hover:scale-105"
                >
                    Proceed to Login
                </button>
            </div>
        </div>
    );
};

const SignUpPage = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [position] = useState("HR Head");
    const [universityName, setUniversityName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [validationError, setValidationError] = useState("");
    const [registrationSuccess, setRegistrationSuccess] = useState(() => {
        // Check if we have stored registration success in localStorage
        const storedSuccess = localStorage.getItem("registration_success");
        const storedUniversity = localStorage.getItem("registered_university");
        if (storedSuccess === "true" && storedUniversity) {
            // Initialize universityName from localStorage if available
            setUniversityName(storedUniversity);
            return true;
        }
        return false;
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { register, loading: authLoading, error } = useAuth();

    // Effect to handle cleanup of localStorage when navigating away
    useEffect(() => {
        // This will run when the component unmounts
        return () => {
            // Clean up localStorage on unmount
            if (registrationSuccess) {
                localStorage.removeItem("registration_success");
                localStorage.removeItem("registered_university");
            }
        };
    }, [registrationSuccess]);

    const validateForm = () => {
        // Check if passwords match
        if (password !== confirmPassword) {
            setValidationError("Passwords do not match");
            return false;
        }

        // Check password strength (at least 8 characters for more security)
        if (password.length < 8) {
            setValidationError("Password must be at least 8 characters");
            return false;
        }

        // Validate email format with a simple regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setValidationError("Please enter a valid email address");
            return false;
        }

        // Check if name is provided
        if (!fullName.trim()) {
            setValidationError("Please enter your full name");
            return false;
        }

        // Check university name
        if (!universityName.trim()) {
            setValidationError("Please enter your university name");
            return false;
        }

        // Clear any previous validation errors
        setValidationError("");
        return true;
    };

    const handleSignUp = async (e) => {
        e.preventDefault();

        // Validate form before submitting
        if (!validateForm()) return;

        // Set loading state
        setLoading(true);
        setValidationError("");

        // Just use the full name without the position
        const displayName = fullName;

        // Include additional user metadata in the registration process
        const userMetadata = {
            fullName,
            position,
            universityName,
        };

        console.log("Submitting registration with metadata:", userMetadata);

        try {
            const result = await register(
                email,
                password,
                displayName,
                userMetadata
            );
            console.log("Registration result:", result);

            if (result && result.success) {
                console.log("Registration successful, showing success screen");
                // Store registration success and university name in localStorage
                localStorage.setItem("registration_success", "true");
                localStorage.setItem("registered_university", universityName);
                setRegistrationSuccess(true);
            } else {
                // Handle case where result exists but success is false
                setValidationError(
                    result?.message || "Registration failed. Please try again."
                );
            }
        } catch (error) {
            console.error("Registration error:", error);
            setValidationError(
                error.message ||
                    "An error occurred during registration. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    // Add a function to handle proceeding to login
    const handleProceedToLogin = () => {
        // Clean up localStorage
        localStorage.removeItem("registration_success");
        localStorage.removeItem("registered_university");
        // Navigate to login page
        navigate("/");
    };

    // If registration was successful, show the success screen
    if (registrationSuccess) {
        const storedUniversity = localStorage.getItem("registered_university");
        return (
            <SuccessScreen
                universityName={storedUniversity || universityName}
                onProceedToLogin={handleProceedToLogin}
            />
        );
    }

    return (
        <div
            className="h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${loginBg})` }}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 h-full">
                {/* Left Column */}
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <img
                        src={splashArt}
                        alt="Splash Art"
                        className="w-full max-w-md h-auto object-contain transform -translate-y-12 translate-x-10"
                    />
                    <p className="text-2xl font-semibold text-[#75808B] font-fredoka -translate-y-12 translate-x-10">
                        A Smart HRIS Solution for Optimized University HR
                        Management
                    </p>
                </div>

                {/* Right Column */}
                <div className="flex items-center justify-center p-6">
                    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl border border-black">
                        {/* Logo */}
                        <div className="flex justify-center mb-4">
                            <img
                                src={logo}
                                alt="Logo"
                                className="w-48 h-auto"
                            />
                        </div>

                        {/* Sign Up Text */}
                        <h2 className="text-2xl font-bold font-fredoka text-center mb-2">
                            HR Administrator Registration
                        </h2>

                        {/* Create Account Text */}
                        <p className="text-center text-[#75808B] font-fredoka mb-6">
                            Create your administrative account to manage
                            university HR operations
                        </p>

                        {/* Loading Spinner */}
                        {(loading || authLoading) && (
                            <div className="flex justify-center mt-4 mb-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
                            </div>
                        )}

                        {/* Form */}
                        {!(loading || authLoading) && (
                            <form className="space-y-4" onSubmit={handleSignUp}>
                                {/* Error Messages */}
                                {(error || validationError) && (
                                    <div className="bg-red-50 text-red-800 p-4 rounded-lg mb-6 border-l-4 border-red-500">
                                        <p className="font-medium">
                                            {validationError || error}
                                        </p>
                                    </div>
                                )}

                                {/* University Name - Full Width */}
                                <div>
                                    <label
                                        htmlFor="universityName"
                                        className="block mb-2 text-sm font-medium text-gray-900"
                                    >
                                        University Name
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="universityName"
                                            id="universityName"
                                            value={universityName}
                                            onChange={(e) =>
                                                setUniversityName(
                                                    e.target.value
                                                )
                                            }
                                            className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pl-10"
                                            placeholder="State University of Technology"
                                            required
                                        />
                                        <FontAwesomeIcon
                                            icon={faUniversity}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Full Name */}
                                    <div>
                                        <label
                                            htmlFor="fullName"
                                            className="block mb-2 text-sm font-medium text-gray-900"
                                        >
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="fullName"
                                                id="fullName"
                                                value={fullName}
                                                onChange={(e) =>
                                                    setFullName(e.target.value)
                                                }
                                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pl-10"
                                                placeholder="Jane Smith"
                                                required
                                            />
                                            <FontAwesomeIcon
                                                icon={faUserTie}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                        </div>
                                    </div>

                                    {/* Position Field (Immutable) */}
                                    <div>
                                        <label
                                            htmlFor="position"
                                            className="block mb-2 text-sm font-medium text-gray-900"
                                        >
                                            Position
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                name="position"
                                                id="position"
                                                value="HR Head"
                                                className="bg-gray-100 border border-gray-300 text-gray-800 rounded-lg block w-full p-2.5 pl-10 cursor-not-allowed"
                                                readOnly
                                            />
                                            <FontAwesomeIcon
                                                icon={faUserTie}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Email field - full width */}
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block mb-2 text-sm font-medium text-gray-900"
                                    >
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                        placeholder="jane.smith@university.edu"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Password */}
                                    <div>
                                        <label
                                            htmlFor="password"
                                            className="block mb-2 text-sm font-medium text-gray-900"
                                        >
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                name="password"
                                                id="password"
                                                value={password}
                                                onChange={(e) =>
                                                    setPassword(e.target.value)
                                                }
                                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword
                                                    )
                                                }
                                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                            >
                                                <FontAwesomeIcon
                                                    icon={
                                                        showPassword
                                                            ? faEyeSlash
                                                            : faEye
                                                    }
                                                    className="text-gray-400 hover:text-gray-600"
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div>
                                        <label
                                            htmlFor="confirmPassword"
                                            className="block mb-2 text-sm font-medium text-gray-900"
                                        >
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={
                                                    showConfirmPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                name="confirmPassword"
                                                id="confirmPassword"
                                                value={confirmPassword}
                                                onChange={(e) =>
                                                    setConfirmPassword(
                                                        e.target.value
                                                    )
                                                }
                                                className="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10"
                                                placeholder="••••••••"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowConfirmPassword(
                                                        !showConfirmPassword
                                                    )
                                                }
                                                className="absolute inset-y-0 right-0 flex items-center pr-3"
                                            >
                                                <FontAwesomeIcon
                                                    icon={
                                                        showConfirmPassword
                                                            ? faEyeSlash
                                                            : faEye
                                                    }
                                                    className="text-gray-400 hover:text-gray-600"
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-base px-5 py-3 text-center transition-all duration-200 transform hover:scale-105"
                                        disabled={loading || authLoading}
                                    >
                                        {loading || authLoading
                                            ? "Creating Account..."
                                            : "Create Account"}
                                    </button>
                                </div>

                                {/* Login Link */}
                                <div className="text-center mt-4">
                                    <p className="text-sm text-gray-600">
                                        Already have an account?{" "}
                                        <Link
                                            to="/"
                                            className="text-blue-600 hover:underline"
                                        >
                                            Sign in
                                        </Link>
                                    </p>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUpPage;
