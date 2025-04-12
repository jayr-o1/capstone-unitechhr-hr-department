import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const EmployeePageLoader = ({ isLoading, fullscreen, contentOnly, message }) => {
    const [showRefreshHint, setShowRefreshHint] = useState(false);
    const [loadingStartTime, setLoadingStartTime] = useState(null);
    
    useEffect(() => {
        if (isLoading) {
            setLoadingStartTime(Date.now());
            const timer = setTimeout(() => {
                setShowRefreshHint(true);
            }, 8000); // Show refresh hint after 8 seconds
            
            return () => clearTimeout(timer);
        } else {
            setShowRefreshHint(false);
            setLoadingStartTime(null);
        }
    }, [isLoading]);
    
    const handleRefreshClick = () => {
        // Reload the page
        window.location.reload();
    };
    
    const getLoaderStyles = () => {
        if (contentOnly) {
            // Only cover the content area with absolute positioning
            return {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10 // Lower z-index to stay below fixed header/sidebar
            };
        } else if (fullscreen) {
            // Cover the entire screen
            return {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999 // Higher z-index to cover everything
            };
        } else {
            // Default for employee layout - responsive for different layouts
            return {
                position: 'fixed',
                top: isMobile() ? "56px" : "60px", // Adjust for mobile vs desktop header height
                left: isMobile() ? 0 : "16rem", // Adjust for mobile vs desktop
                right: 0,
                bottom: 0,
                zIndex: 50
            };
        }
    };
    
    // Helper to detect mobile screens
    const isMobile = () => {
        return window.innerWidth < 768;
    };
    
    return (
        <AnimatePresence>
            {(isLoading !== undefined ? isLoading : true) && (
                <motion.div
                    className="flex flex-col justify-center items-center bg-white bg-opacity-70 backdrop-blur-sm cursor-pointer"
                    style={getLoaderStyles()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    onClick={showRefreshHint ? handleRefreshClick : undefined}
                >
                    {/* Rotating elements with company colors */}
                    <motion.div
                        className="absolute"
                        initial={{ rotate: 360 }}
                        animate={{ rotate: 0 }}
                        transition={{
                            duration: 1,
                            ease: "easeInOut",
                            repeat: Infinity,
                            repeatType: "loop",
                            delay: 0.25,
                        }}
                    >
                        <motion.svg
                            width="64"
                            height="64"
                            viewBox="0 0 135 135"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="#131674" // Primary UNITECH HR color
                        >
                            <path d="M67.447 58c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm9.448 9.447c0 5.523 4.477 10 10 10 5.522 0 10-4.477 10-10s-4.478-10-10-10c-5.523 0-10 4.477-10 10zm-9.448 9.448c-5.523 0-10 4.477-10 10 0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zM58 67.447c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10z">
                                <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    from="0 67 67"
                                    to="360 67 67"
                                    dur="1s"
                                    repeatCount="indefinite"
                                />
                            </path>
                        </motion.svg>
                    </motion.div>

                    {/* Rotating Counterclockwise */}
                    <motion.div
                        className="absolute"
                        initial={{ rotate: -360 }}
                        animate={{ rotate: 0 }}
                        transition={{
                            duration: 2,
                            ease: "easeInOut",
                            repeat: Infinity,
                            repeatType: "loop",
                            delay: 0.25,
                        }}
                    >
                        <motion.svg
                            width="64"
                            height="64"
                            viewBox="0 0 135 135"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="#8d46a5" // Secondary UNITECH HR color
                        >
                            <path d="M28.19 40.31c6.627 0 12-5.374 12-12 0-6.628-5.373-12-12-12-6.628 0-12 5.372-12 12 0 6.626 5.372 12 12 12zm30.72-19.825c4.686 4.687 12.284 4.687 16.97 0 4.686-4.686 4.686-12.284 0-16.97-4.686-4.687-12.284-4.687-16.97 0-4.687 4.686-4.687 12.284 0 16.97zm35.74 7.705c0 6.627 5.37 12 12 12 6.626 0 12-5.373 12-12 0-6.628-5.374-12-12-12-6.63 0-12 5.372-12 12zm19.822 30.72c-4.686 4.686-4.686 12.284 0 16.97 4.687 4.686 12.285 4.686 16.97 0 4.687-4.686 4.687-12.284 0-16.97-4.685-4.687-12.283-4.687-16.97 0zm-7.704 35.74c-6.627 0-12 5.37-12 12 0 6.626 5.373 12 12 12s12-5.374 12-12c0-6.63-5.373-12-12-12zm-30.72 19.822c-4.686-4.686-12.284-4.686-16.97 0-4.686 4.687-4.686 12.285 0 16.97 4.686 4.687 12.284 4.687 16.97 0 4.687-4.685 4.687-12.283 0-16.97zm-35.74-7.704c0-6.627-5.372-12-12-12-6.626 0-12 5.373-12 12s5.374 12 12 12c6.628 0 12-5.373 12-12zm-19.823-30.72c4.687-4.686 4.687-12.284 0-16.97-4.686-4.686-12.284-4.686-16.97 0-4.687 4.686-4.687 12.284 0 16.97 4.686 4.687 12.284 4.687 16.97 0z">
                                <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    from="0 67 67"
                                    to="-360 67 67"
                                    dur="2s"
                                    repeatCount="indefinite"
                                />
                            </path>
                        </motion.svg>
                    </motion.div>
                    
                    {/* Custom UNITECH HR branding */}
                    <motion.div
                        className="absolute mb-28"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <div className="text-2xl font-fredoka font-bold bg-gradient-to-r from-[#131674] to-[#8d46a5] text-transparent bg-clip-text">
                            UNITECH HR
                        </div>
                    </motion.div>
                    
                    {/* Optional loading message */}
                    {message && (
                        <motion.p 
                            className="text-gray-700 mt-24 font-medium text-center px-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {message}
                        </motion.p>
                    )}
                    
                    {/* Refresh hint when loading takes too long */}
                    {showRefreshHint && (
                        <motion.div
                            className="mt-32 text-center px-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <p className="text-gray-600 font-medium">Taking longer than expected?</p>
                            <button 
                                className="mt-2 text-blue-600 font-medium hover:text-blue-800 transition-colors"
                                onClick={handleRefreshClick}
                            >
                                Click to refresh
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Set default props
EmployeePageLoader.defaultProps = {
    isLoading: true,
    fullscreen: false,
    contentOnly: false,
    message: "Loading employee data..."
};

export default EmployeePageLoader; 