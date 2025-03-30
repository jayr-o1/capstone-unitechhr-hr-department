import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const PageLoader = ({ isLoading, fullscreen, contentOnly }) => {
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
            // Cover everything except header and sidebar
            return {
                position: 'fixed',
                top: "4rem", // Adjust this to match the height of your Header
                left: "16rem", // Adjust this to match the width of your Sidebar
                right: 0,
                bottom: 0,
                zIndex: 50
            };
        }
    };
    
    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    className={`flex justify-center items-center bg-white bg-opacity-70`}
                    style={getLoaderStyles()}
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1, ease: "easeIn" }}
                >
                    {/* Rotating Clockwise */}
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
                            fill="#4361ee"
                        >
                            <path d="M67.447 58c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm9.448 9.447c0 5.523 4.477 10 10 10 5.522 0 10-4.477 10-10s-4.478-10-10-10c-5.523 0-10 4.477-10 10zm-9.448 9.448c-5.523 0-10 4.477-10 10 0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zM58 67.447c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10z">
                                <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    from="0 67 67"
                                    to="360 67 67"
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
                            fill="#4361ee"
                        >
                            <path d="M28.19 40.31c6.627 0 12-5.374 12-12 0-6.628-5.373-12-12-12-6.628 0-12 5.372-12 12 0 6.626 5.372 12 12 12zm30.72-19.825c4.686 4.687 12.284 4.687 16.97 0 4.686-4.686 4.686-12.284 0-16.97-4.686-4.687-12.284-4.687-16.97 0-4.687 4.686-4.687 12.284 0 16.97zm35.74 7.705c0 6.627 5.37 12 12 12 6.626 0 12-5.373 12-12 0-6.628-5.374-12-12-12-6.63 0-12 5.372-12 12zm19.822 30.72c-4.686 4.686-4.686 12.284 0 16.97 4.687 4.686 12.285 4.686 16.97 0 4.687-4.686 4.687-12.284 0-16.97-4.685-4.687-12.283-4.687-16.97 0zm-7.704 35.74c-6.627 0-12 5.37-12 12 0 6.626 5.373 12 12 12s12-5.374 12-12c0-6.63-5.373-12-12-12zm-30.72 19.822c-4.686-4.686-12.284-4.686-16.97 0-4.686 4.687-4.686 12.285 0 16.97 4.686 4.687 12.284 4.687 16.97 0 4.687-4.685 4.687-12.283 0-16.97zm-35.74-7.704c0-6.627-5.372-12-12-12-6.626 0-12 5.373-12 12s5.374 12 12 12c6.628 0 12-5.373 12-12zm-19.823-30.72c4.687-4.686 4.687-12.284 0-16.97-4.686-4.686-12.284-4.686-16.97 0-4.687 4.686-4.687 12.284 0 16.97 4.686 4.687 12.284 4.687 16.97 0z">
                                <animateTransform
                                    attributeName="transform"
                                    type="rotate"
                                    from="0 67 67"
                                    to="-360 67 67"
                                    repeatCount="indefinite"
                                />
                            </path>
                        </motion.svg>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Set default props
PageLoader.defaultProps = {
    isLoading: false,
    fullscreen: false,
    contentOnly: false
};

export default PageLoader;