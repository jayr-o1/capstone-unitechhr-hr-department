import React from "react";

const FormField = ({
    type = "text",
    name,
    value,
    onChange,
    placeholder,
    exampleText = "", // New prop for example text
    required = false,
    options = [],
    min,
    error = "",
    containerClassName = "",
    inputClassName = "",
    labelClassName = "",
}) => {
    return (
        <div className={`relative ${containerClassName}`}>
            {type === "select" ? (
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`cursor-pointer w-full p-3 border ${
                        error ? "border-red-500" : "border-gray-300"
                    } rounded-md focus:outline-none focus:border-[#9AADEA] peer appearance-none bg-white ${inputClassName}`}
                    required={required}
                >
                    <option value="" hidden></option>
                    {options.map((option, index) => (
                        <option key={index} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            ) : type === "textarea" ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`w-full p-3 border ${
                        error ? "border-red-500" : "border-gray-300"
                    } rounded-md focus:outline-none focus:border-[#9AADEA] peer ${inputClassName}`}
                    placeholder=" " // Add a space to ensure the placeholder is "shown"
                    required={required}
                ></textarea>
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`w-full p-3 border ${
                        error ? "border-red-500" : "border-gray-300"
                    } rounded-md focus:outline-none focus:border-[#9AADEA] peer ${inputClassName}`}
                    placeholder=" " // Add a space to ensure the placeholder is "shown"
                    required={required}
                    min={min}
                />
            )}
            <label
                className={`absolute left-3 transition-all duration-200 pointer-events-none bg-white px-1 z-10 
                ${
                    value !== "" || (type === "select" && value !== "") // Check if the input has a value or if it's a select with a value
                        ? "-top-2 text-sm text-[#9AADEA]"
                        : "top-3 text-gray-500"
                } 
                peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#9AADEA] ${labelClassName}`}
            >
                {placeholder}
            </label>

            {/* Display example text as a hint below the input */}
            {exampleText && value === "" && (
                <p className="text-sm text-gray-400 mt-1">{exampleText}</p>
            )}

            {/* Display error message if present */}
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
    );
};

export default FormField;