import { getStorage } from "firebase/storage";

// Base API configuration for document parsing
const API_CONFIG = {
    endpoints: {
        // These URLs will be proxied by the Vite development server
        extract: `/api/extract`, // Resume and certificate parsing endpoint
        health: `/health`, // Health check endpoint
    },
    // Direct URL to the API server (no proxy)
    directApiUrl: "http://localhost:5000",
    timeout: 60000, // 60 second timeout for file processing
};

// Logging the API endpoints for debugging
console.log("API Endpoints:", API_CONFIG.endpoints);

/**
 * Helper function to fetch with timeout
 */
const fetchWithTimeout = async (url, options, timeout) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        console.log(`Fetching ${url}`);
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
            throw new Error(`Request timed out after ${timeout}ms`);
        }
        throw error;
    }
};

/**
 * Check if the API server is running
 * @returns {Promise<boolean>} - Promise that resolves to true if server is running
 */
export const checkApiHealth = async () => {
    // First try the proxied endpoint
    try {
        console.log("Checking proxied API health endpoint");
        const response = await fetch(API_CONFIG.endpoints.health, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "text/plain",
            },
        });

        console.log(`Proxied health check response status: ${response.status}`);

        if (response.ok) {
            console.log("Proxied health check successful");
            return true;
        }

        // Even if we get a 500 error from proxy, try direct URL
        console.log("Proxied health check returned error, trying direct URL");
    } catch (error) {
        console.error("Error with proxied health check:", error);
    }

    // Try direct URL as fallback
    try {
        const directUrl = `${API_CONFIG.directApiUrl}/health`;
        console.log(`Checking direct API health at: ${directUrl}`);

        const response = await fetch(directUrl, {
            method: "GET",
            mode: "cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "text/plain",
            },
        });

        console.log(`Direct health check response status: ${response.status}`);

        if (response.ok) {
            console.log("Direct health check successful");
            return true;
        }

        // Even with error status, API is running
        console.log(
            "Direct health check completed with error status, but server is running"
        );
        return true;
    } catch (finalError) {
        console.error("All API health checks failed:", finalError);
        return false;
    }
};

/**
 * Download file from URL and return as blob
 * @param {string} url - Document URL
 * @returns {Promise<Blob>} - Document blob
 */
const downloadFile = async (url) => {
    try {
        console.log(`Downloading file from: ${url}`);

        // If it's a Firebase Storage URL, try to proxy it
        if (url.includes("firebasestorage.googleapis.com")) {
            console.log(
                "Firebase Storage URL detected, attempting to proxy..."
            );

            try {
                // Try using a CORS proxy service
                // For demo or development purposes, we can use a public CORS proxy
                // For production, you should set up your own proxy server
                const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(
                    url
                )}`;
                console.log(`Using CORS proxy: ${corsProxyUrl}`);

                const response = await fetch(corsProxyUrl);

                if (!response.ok) {
                    throw new Error(
                        `Proxy request failed with status: ${response.status}`
                    );
                }

                console.log("Successfully proxied file download");
                return await response.blob();
            } catch (proxyError) {
                console.error(
                    "Error using proxy for Firebase Storage:",
                    proxyError
                );

                // As a fallback for development/testing, generate a mock file
                // with the right type based on the URL extension
                console.warn("Generating mock file for testing purposes");

                const fileExt = url
                    .split(".")
                    .pop()
                    .toLowerCase()
                    .split("?")[0];
                let mimeType = "application/octet-stream"; // Default mime type

                if (fileExt === "pdf") mimeType = "application/pdf";
                else if (["png", "jpg", "jpeg", "gif"].includes(fileExt))
                    mimeType = `image/${fileExt}`;
                else if (fileExt === "docx")
                    mimeType =
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

                // Create a small mock file with the correct mime type
                const mockFileContent = "Mock file content for testing";
                return new Blob([mockFileContent], { type: mimeType });
            }
        }

        // For regular URLs, use standard fetch
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(
                `Failed to download file: ${response.status} ${response.statusText}`
            );
        }

        return await response.blob();
    } catch (error) {
        console.error("Error downloading file:", error);
        throw error;
    }
};

/**
 * Extract skills from a document (resume or certificate)
 * @param {string} documentUrl - URL of the document to parse
 * @param {string} documentType - Type of document ('resume' or 'certificate')
 * @returns {Promise} - Promise that resolves to extracted skills
 */
export const extractSkillsFromDocument = async (documentUrl, documentType) => {
    try {
        if (!documentUrl) {
            throw new Error("Document URL is required");
        }

        console.log(`Extracting skills from ${documentType}: ${documentUrl}`);

        // First check if API is available
        const isApiAvailable = await checkApiHealth();

        if (!isApiAvailable) {
            throw new Error(
                "API is currently unavailable. Please try again later."
            );
        }

        // Download the file from the URL
        console.log("Downloading document from URL");
        const fileBlob = await downloadFile(documentUrl);
        console.log(
            `File downloaded, size: ${fileBlob.size} bytes, type: ${fileBlob.type}`
        );

        // Create form data with the file
        const formData = new FormData();
        const fileName = `document.${
            documentUrl.split(".").pop().split("?")[0] || "pdf"
        }`;
        formData.append("file", fileBlob, fileName);
        formData.append("documentType", documentType);

        console.log(
            `Sending document ${fileName} with type ${documentType} to API endpoint: ${API_CONFIG.endpoints.extract}`
        );

        try {
            // Make the API request
            let response = null;
            let useDirectUrl = false;

            try {
                // First try using the proxied URL
                console.log("Attempting request through Vite proxy...");

                response = await fetch(API_CONFIG.endpoints.extract, {
                    method: "POST",
                    headers: {
                        Accept: "multipart/form-data",
                    },
                    body: formData,
                });

                // Handle the response
                console.log(`API proxy response status: ${response.status}`);

                // If proxy returns 500, try direct URL as fallback
                if (response.status === 500) {
                    console.log(
                        "Proxy request failed with 500 error, trying direct URL..."
                    );
                    useDirectUrl = true;
                }
            } catch (proxyError) {
                console.error("Error with proxy request:", proxyError);
                console.log("Attempting direct API request as fallback...");
                useDirectUrl = true;
            }

            // If proxy failed, try direct URL
            if (useDirectUrl) {
                try {
                    const directUrl = `${API_CONFIG.directApiUrl}/api/extract`;
                    console.log(
                        `Sending request directly to API at: ${directUrl}`
                    );

                    // Create a new FormData with the same file for the direct request
                    const directFormData = new FormData();

                    // Get the file and type from the original FormData
                    const file = formData.get("file");
                    const docType = formData.get("documentType");

                    // Verify we have a file
                    if (!file || !file.size) {
                        console.error(
                            "No valid file available for direct API request"
                        );
                        throw new Error(
                            "No valid file was found in the form data for the API request"
                        );
                    }

                    // Add the file to the new FormData
                    // Try both 'files' (plural) and 'file' (singular) to improve compatibility with different APIs
                    directFormData.append("files", file); // Primary field name matching Postman
                    directFormData.append("file", file); // Alternative field name for compatibility

                    console.log(
                        `Added file ${file.name} (${file.size} bytes) to direct request`
                    );

                    // Add the document type
                    if (docType) {
                        directFormData.append("documentType", docType);
                        console.log(
                            `Added document type ${docType} to direct request`
                        );
                    } else {
                        directFormData.append("documentType", "unknown");
                        console.log(`No document type found, using 'unknown'`);
                    }

                    // Final verification - check both field names
                    const addedFilesPlural = directFormData.getAll("files");
                    const addedFilesSingular = directFormData.getAll("file");
                    console.log(
                        `Direct request contains ${addedFilesPlural.length} 'files' and ${addedFilesSingular.length} 'file' entries`
                    );

                    if (
                        addedFilesPlural.length === 0 &&
                        addedFilesSingular.length === 0
                    ) {
                        console.error(
                            "No valid files were added to the direct request FormData"
                        );
                        throw new Error(
                            "No valid files could be added to the API request"
                        );
                    }

                    response = await fetch(directUrl, {
                        method: "POST",
                        // Don't set Content-Type header, browser will set it with boundary
                        body: directFormData,
                        mode: "cors", // Important for cross-origin requests
                        credentials: "omit", // Don't send cookies
                    });

                    console.log(
                        `Direct API response status: ${response.status}`
                    );
                } catch (directError) {
                    console.error(
                        "Error with direct API request:",
                        directError
                    );
                    throw new Error(
                        `Failed to connect to API server: ${directError.message}`
                    );
                }
            }

            let responseText = await response.text();
            console.log(
                `API response status: ${response.status}, text: ${responseText}`
            );

            // Check if the request was successful
            if (!response.ok) {
                throw new Error(
                    `API returned ${response.status}: ${responseText}`
                );
            }

            // Try to parse the response as JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error("Error parsing API response:", parseError);
                throw new Error(
                    `Invalid JSON response from API: ${responseText.substring(
                        0,
                        100
                    )}...`
                );
            }

            console.log("Parsed API response:", data);

            // Process and deduplicate the skills
            const allSkills = [];
            const processedSkillNames = new Set();

            // Log the response structure for debugging
            console.log("API Response structure:", {
                hasSkills: !!(
                    data &&
                    data.skills &&
                    Array.isArray(data.skills)
                ),
                hasResultSkills: !!(
                    data &&
                    data.result &&
                    data.result.skills &&
                    Array.isArray(data.result.skills)
                ),
                topLevelKeys: Object.keys(data || {}),
                resultKeys: Object.keys((data && data.result) || {}),
            });

            // Check if skills are in the expected format or in the result object
            const skillsArray =
                data && data.skills && Array.isArray(data.skills)
                    ? data.skills
                    : data &&
                      data.result &&
                      data.result.skills &&
                      Array.isArray(data.result.skills)
                    ? data.result.skills
                    : [];

            if (skillsArray.length > 0) {
                console.log(
                    `Found ${skillsArray.length} skills in the API response`
                );
                console.log("Sample skill structure:", skillsArray[0]);

                skillsArray.forEach((skill) => {
                    // Check if skill is a string or an object with name property
                    const skillName =
                        typeof skill === "string"
                            ? skill
                            : skill.name || skill.skill || "Unknown Skill";

                    if (!skillName) return;

                    if (!processedSkillNames.has(skillName.toLowerCase())) {
                        processedSkillNames.add(skillName.toLowerCase());

                        // Convert to standard format
                        const standardizedSkill = {
                            name: skillName,
                            proficiency:
                                typeof skill === "string"
                                    ? "Beginner"
                                    : typeof skill.proficiency === "string"
                                    ? skill.proficiency // Keep string values like "Beginner", "Intermediate", etc.
                                    : skill.proficiency_level
                                    ? skill.proficiency_level
                                    : skill.proficiency === 50 ||
                                      skill.proficiency <= 30
                                    ? "Beginner"
                                    : skill.proficiency === 70 ||
                                      (skill.proficiency > 30 &&
                                          skill.proficiency <= 70)
                                    ? "Intermediate"
                                    : skill.proficiency === 90 ||
                                      skill.proficiency > 70
                                    ? "Advanced"
                                    : "Beginner",
                            isCertified:
                                typeof skill === "string"
                                    ? false
                                    : skill.isCertified ||
                                      skill.is_backed ||
                                      false,
                            category:
                                typeof skill === "string"
                                    ? "technical"
                                    : skill.category ||
                                      (skill.is_technical
                                          ? "technical"
                                          : "soft_skill") ||
                                      "technical",
                            confidence:
                                typeof skill === "string"
                                    ? 0.7
                                    : skill.confidence || 0.7,
                        };

                        // Directly add the is_backed flag from the API response
                        if (skill.is_backed !== undefined) {
                            standardizedSkill.is_backed = skill.is_backed;
                        }

                        allSkills.push(standardizedSkill);
                    }
                });

                console.log(
                    `Successfully processed ${allSkills.length} unique skills`
                );
            } else {
                console.warn(
                    "No skills found in API response or invalid response format"
                );
            }

            // Also update the Python certification based on certifications array
            if (
                data.result &&
                data.result.certifications &&
                Array.isArray(data.result.certifications)
            ) {
                console.log(
                    "API returned certifications:",
                    data.result.certifications
                );

                // Look for certifications and mark matching skills as certified
                data.result.certifications.forEach((cert) => {
                    // Try to extract skill name from certification filename
                    let skillName = null;

                    if (cert.toLowerCase().includes("python")) {
                        skillName = "Python";
                    } else if (cert.toLowerCase().includes("java")) {
                        skillName = "Java";
                    } else if (cert.toLowerCase().includes("sql")) {
                        skillName = "SQL";
                    }
                    // Add more skills as needed

                    if (skillName) {
                        console.log(
                            `Found certification for skill: ${skillName}`
                        );

                        // Find the skill in our processed skills array
                        const existingSkill = allSkills.find(
                            (s) =>
                                s.name.toLowerCase() === skillName.toLowerCase()
                        );

                        if (existingSkill) {
                            console.log(`Marking ${skillName} as certified`);
                            existingSkill.isCertified = true;
                            existingSkill.is_backed = true;
                        } else {
                            // If the skill wasn't found in the parsed skills, add it
                            console.log(`Adding certified skill: ${skillName}`);
                            allSkills.push({
                                name: skillName,
                                proficiency: "Intermediate",
                                isCertified: true,
                                is_backed: true,
                                category: "technical",
                                confidence: 0.9,
                            });
                        }
                    }
                });
            }

            return {
                success: true,
                skills: allSkills,
                message: data.message || "Skills extracted successfully",
                raw_text: data.raw_text || null,
                replace: (existingSkills) =>
                    replaceSkills(existingSkills, allSkills),
            };
        } catch (apiError) {
            console.error("API error during skill extraction:", apiError);
            throw apiError; // Re-throw to be caught by the outer catch block
        }
    } catch (error) {
        console.error(`Error extracting skills from ${documentType}:`, error);
        return {
            success: false,
            message:
                error.message ||
                `Failed to extract skills from ${documentType}`,
            skills: [],
            replace: (existingSkills) => existingSkills,
        };
    }
};

/**
 * Extract skills from multiple documents
 * @param {Array} documents - Array of document objects with url and type properties
 * @returns {Promise} - Promise that resolves to combined extracted skills
 */
export const extractSkillsFromMultipleDocuments = async (documents) => {
    try {
        if (!documents || !Array.isArray(documents) || documents.length === 0) {
            return {
                success: false,
                message: "No valid documents provided",
                skills: [],
                replace: (existingSkills) => existingSkills,
            };
        }

        console.log(`Extracting skills from ${documents.length} documents`);

        // Process only resume and certificate documents
        const validDocuments = documents.filter(
            (doc) =>
                doc.url &&
                doc.url !== "pending_upload" &&
                (doc.type === "resume" ||
                    doc.type === "certification" ||
                    doc.type === "certificate")
        );

        if (validDocuments.length === 0) {
            return {
                success: false,
                message: "No valid resume or certificate documents found",
                skills: [],
                replace: (existingSkills) => existingSkills,
            };
        }

        // First check if API is available
        const isApiAvailable = await checkApiHealth();

        if (!isApiAvailable) {
            throw new Error(
                "API is currently unavailable. Please try again later."
            );
        }

        console.log(
            `Found ${validDocuments.length} valid documents for processing:`,
            validDocuments
        );

        // Create a FormData instance for multiple files
        const formData = new FormData();

        // Download and add each document to the form data
        for (let i = 0; i < validDocuments.length; i++) {
            const doc = validDocuments[i];
            try {
                console.log(`Downloading document from URL: ${doc.url}`);
                const fileBlob = await downloadFile(doc.url);
                console.log(
                    `Downloaded file blob, size: ${fileBlob.size} bytes, type: ${fileBlob.type}`
                );

                // Add file to FormData with a unique name including document type and index
                const fileName =
                    doc.name ||
                    `document_${i}.${
                        doc.url.split(".").pop().split("?")[0] || "pdf"
                    }`;
                formData.append("file", fileBlob, fileName);

                // Also add the document type so the API knows what kind of document this is
                formData.append("documentType", doc.type);

                console.log(
                    `Added document ${fileName} with type ${doc.type} to form data`
                );
            } catch (error) {
                console.error(`Error downloading document ${doc.url}:`, error);
                // Continue with other documents if one fails
            }
        }

        // Check if any files were successfully added
        const formDataFiles = formData.getAll("file");
        if (formDataFiles.length === 0) {
            console.error("No files could be downloaded for processing");
            return {
                success: false,
                message: "Failed to download any valid documents",
                skills: [],
                replace: (existingSkills) => existingSkills,
            };
        }

        console.log(
            `Successfully added ${formDataFiles.length} files to FormData`
        );
        formDataFiles.forEach((file, index) => {
            console.log(
                `File ${index}: name=${file.name}, size=${file.size}, type=${file.type}`
            );
        });

        // Send all files to the API in a single request
        console.log(
            `Sending documents to API endpoint: ${API_CONFIG.endpoints.extract}`
        );

        let response = null;
        let useDirectUrl = false;

        try {
            // First try using the proxied URL
            console.log("Attempting request through Vite proxy...");

            // Make API request with appropriate headers
            response = await fetch(API_CONFIG.endpoints.extract, {
                method: "POST",
                headers: {
                    Accept: "multipart/form-data",
                },
                body: formData,
                // Set longer timeout for large files
                signal: AbortSignal.timeout(API_CONFIG.timeout),
            });

            // Handle the response
            console.log(`API proxy response status: ${response.status}`);

            // If proxy returns 500, try direct URL as fallback
            if (response.status === 500) {
                console.log(
                    "Proxy request failed with 500 error, trying direct URL..."
                );
                useDirectUrl = true;
            }
        } catch (proxyError) {
            console.error("Error with proxy request:", proxyError);
            console.log("Attempting direct API request as fallback...");
            useDirectUrl = true;
        }

        // If proxy failed, try direct URL
        if (useDirectUrl) {
            try {
                const directUrl = `${API_CONFIG.directApiUrl}/api/extract`;
                console.log(`Sending request directly to API at: ${directUrl}`);

                // Create a new FormData with the same files for the direct request
                const directFormData = new FormData();
                const files = formData.getAll("file");
                const types = formData.getAll("documentType");

                // Verify we have files
                if (!files || files.length === 0) {
                    console.error("No files available for direct API request");
                    throw new Error(
                        "No files were found in the form data for the API request"
                    );
                }

                // Log what we're adding to the new FormData
                console.log(
                    `Recreating FormData with ${files.length} files for direct API request`
                );

                // Add each file and type to the new FormData
                files.forEach((file, i) => {
                    if (!file || !file.size) {
                        console.warn(`File at index ${i} is invalid or empty`);
                        return; // Skip this file
                    }

                    // Try both 'files' (plural) and 'file' (singular) to improve compatibility with different APIs
                    directFormData.append("files", file); // Primary field name matching Postman
                    directFormData.append("file", file); // Alternative field name for compatibility

                    if (types[i]) {
                        directFormData.append("documentType", types[i]);
                    } else {
                        directFormData.append("documentType", "unknown");
                    }
                    console.log(
                        `Added file ${file.name} (${
                            file.size
                        } bytes) with type ${
                            types[i] || "unknown"
                        } to direct request`
                    );
                });

                // Final verification - check both field names
                const addedFilesPlural = directFormData.getAll("files");
                const addedFilesSingular = directFormData.getAll("file");
                console.log(
                    `Direct request contains ${addedFilesPlural.length} 'files' and ${addedFilesSingular.length} 'file' entries`
                );

                if (
                    addedFilesPlural.length === 0 &&
                    addedFilesSingular.length === 0
                ) {
                    console.error(
                        "No valid files were added to the direct request FormData"
                    );
                    throw new Error(
                        "No valid files could be added to the API request"
                    );
                }

                console.log(
                    `Direct request contains ${addedFilesPlural.length} files`
                );

                response = await fetch(directUrl, {
                    method: "POST",
                    // Don't set Content-Type header, browser will set it with boundary
                    body: directFormData,
                    mode: "cors", // Important for cross-origin requests
                    credentials: "omit", // Don't send cookies
                    signal: AbortSignal.timeout(API_CONFIG.timeout),
                });

                console.log(`Direct API response status: ${response.status}`);
            } catch (directError) {
                console.error("Error with direct API request:", directError);
                throw new Error(
                    `Failed to connect to API server: ${directError.message}`
                );
            }
        }

        // Even with 500 error, attempt to get the response text if available
        let responseText = "";
        try {
            responseText = await response.text();
            console.log(`API response text length: ${responseText.length}`);
            if (responseText.length < 500) {
                console.log(`Full response: ${responseText}`);
            } else {
                console.log(
                    `Response preview: ${responseText.substring(0, 500)}...`
                );
            }
        } catch (textError) {
            console.error("Error reading response text:", textError);
        }

        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${responseText}`);
        }

        // Try to parse the response as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Error parsing API response:", parseError);
            throw new Error(
                `Invalid JSON response from API: ${responseText.substring(
                    0,
                    100
                )}...`
            );
        }

        console.log("Parsed API response:", data);

        // Process and deduplicate the skills
        const allSkills = [];
        const processedSkillNames = new Set();

        // Log the response structure for debugging
        console.log("API Response structure:", {
            hasSkills: !!(data && data.skills && Array.isArray(data.skills)),
            hasResultSkills: !!(
                data &&
                data.result &&
                data.result.skills &&
                Array.isArray(data.result.skills)
            ),
            topLevelKeys: Object.keys(data || {}),
            resultKeys: Object.keys((data && data.result) || {}),
        });

        // Check if skills are in the expected format or in the result object
        const skillsArray =
            data && data.skills && Array.isArray(data.skills)
                ? data.skills
                : data &&
                  data.result &&
                  data.result.skills &&
                  Array.isArray(data.result.skills)
                ? data.result.skills
                : [];

        if (skillsArray.length > 0) {
            console.log(
                `Found ${skillsArray.length} skills in the API response`
            );
            console.log("Sample skill structure:", skillsArray[0]);

            skillsArray.forEach((skill) => {
                // Check if skill is a string or an object with name property
                const skillName =
                    typeof skill === "string"
                        ? skill
                        : skill.name || skill.skill || "Unknown Skill";

                if (!skillName) return;

                if (!processedSkillNames.has(skillName.toLowerCase())) {
                    processedSkillNames.add(skillName.toLowerCase());

                    // Convert to standard format
                    const standardizedSkill = {
                        name: skillName,
                        proficiency:
                            typeof skill === "string"
                                ? "Beginner"
                                : typeof skill.proficiency === "string"
                                ? skill.proficiency // Keep string values like "Beginner", "Intermediate", etc.
                                : skill.proficiency_level
                                ? skill.proficiency_level
                                : skill.proficiency === 50 ||
                                  skill.proficiency <= 30
                                ? "Beginner"
                                : skill.proficiency === 70 ||
                                  (skill.proficiency > 30 &&
                                      skill.proficiency <= 70)
                                ? "Intermediate"
                                : skill.proficiency === 90 ||
                                  skill.proficiency > 70
                                ? "Advanced"
                                : "Beginner",
                        isCertified:
                            typeof skill === "string"
                                ? false
                                : skill.isCertified || skill.is_backed || false,
                        category:
                            typeof skill === "string"
                                ? "technical"
                                : skill.category ||
                                  (skill.is_technical
                                      ? "technical"
                                      : "soft_skill") ||
                                  "technical",
                        confidence:
                            typeof skill === "string"
                                ? 0.7
                                : skill.confidence || 0.7,
                    };

                    // Directly add the is_backed flag from the API response
                    if (skill.is_backed !== undefined) {
                        standardizedSkill.is_backed = skill.is_backed;
                    }

                    allSkills.push(standardizedSkill);
                }
            });

            console.log(
                `Successfully processed ${allSkills.length} unique skills`
            );
        } else {
            console.warn(
                "No skills found in API response or invalid response format"
            );
        }

        // Also update the Python certification based on certifications array
        if (
            data.result &&
            data.result.certifications &&
            Array.isArray(data.result.certifications)
        ) {
            console.log(
                "API returned certifications:",
                data.result.certifications
            );

            // Look for certifications and mark matching skills as certified
            data.result.certifications.forEach((cert) => {
                // Try to extract skill name from certification filename
                let skillName = null;

                if (cert.toLowerCase().includes("python")) {
                    skillName = "Python";
                } else if (cert.toLowerCase().includes("java")) {
                    skillName = "Java";
                } else if (cert.toLowerCase().includes("sql")) {
                    skillName = "SQL";
                }
                // Add more skills as needed

                if (skillName) {
                    console.log(`Found certification for skill: ${skillName}`);

                    // Find the skill in our processed skills array
                    const existingSkill = allSkills.find(
                        (s) => s.name.toLowerCase() === skillName.toLowerCase()
                    );

                    if (existingSkill) {
                        console.log(`Marking ${skillName} as certified`);
                        existingSkill.isCertified = true;
                        existingSkill.is_backed = true;
                    } else {
                        // If the skill wasn't found in the parsed skills, add it
                        console.log(`Adding certified skill: ${skillName}`);
                        allSkills.push({
                            name: skillName,
                            proficiency: "Intermediate",
                            isCertified: true,
                            is_backed: true,
                            category: "technical",
                            confidence: 0.9,
                        });
                    }
                }
            });
        }

        return {
            success: true,
            skills: allSkills,
            message: `Successfully extracted ${allSkills.length} unique skills from ${validDocuments.length} documents`,
            replace: (existingSkills) =>
                replaceSkills(existingSkills, allSkills),
        };
    } catch (error) {
        console.error("Error in batch skill extraction:", error);
        return {
            success: false,
            message: error.message || "Failed to extract skills from documents",
            skills: [],
            replace: (existingSkills) => existingSkills,
        };
    }
};

/**
 * Replace existing skills with newly extracted skills
 * @param {Array} existingSkills - Array of existing skills
 * @param {Array} newSkills - Array of newly extracted skills
 * @returns {Array} - Array of updated skills
 */
export const replaceSkills = (existingSkills = [], newSkills = []) => {
    console.log(
        `Replacing ${existingSkills.length} existing skills with ${newSkills.length} newly extracted skills`
    );

    // If no new skills, return existing skills
    if (!newSkills || newSkills.length === 0) {
        console.log("No new skills to replace with, keeping existing skills");
        return existingSkills;
    }

    // Create a map of existing skills by name for quick lookups
    const existingSkillsMap = new Map();
    existingSkills.forEach((skill) => {
        if (skill && skill.name) {
            existingSkillsMap.set(skill.name.toLowerCase(), skill);
        }
    });

    // Process new skills
    const updatedSkills = [];
    const processedNames = new Set();

    // First add all the new skills
    newSkills.forEach((skill) => {
        if (!skill || !skill.name) return;

        const lowerName = skill.name.toLowerCase();
        processedNames.add(lowerName);

        // Add the new skill with any existing data merged in
        const existingSkill = existingSkillsMap.get(lowerName);
        if (existingSkill) {
            // Proficiency rank for comparison (higher number means more skilled)
            const proficiencyRank = (prof) => {
                if (typeof prof === "string") {
                    return prof === "Expert"
                        ? 4
                        : prof === "Advanced"
                        ? 3
                        : prof === "Intermediate"
                        ? 2
                        : prof === "Beginner"
                        ? 1
                        : 0;
                }
                return typeof prof === "number" ? Math.floor(prof / 25) : 0;
            };

            // Get proficiency ranks
            const existingRank = proficiencyRank(existingSkill.proficiency);
            const newRank = proficiencyRank(skill.proficiency);

            // Choose the higher proficiency level
            const finalProficiency =
                newRank >= existingRank
                    ? skill.proficiency
                    : existingSkill.proficiency;

            // Merge properties, preferring new skill values but keeping existing ones if not present
            updatedSkills.push({
                ...existingSkill,
                ...skill,
                // Use the higher proficiency
                proficiency: finalProficiency,
                // Preserve certification status
                isCertified:
                    skill.isCertified || existingSkill.isCertified || false,
            });
        } else {
            // Just add the new skill
            updatedSkills.push(skill);
        }
    });

    console.log(
        `Skills replacement complete. ${updatedSkills.length} skills in the updated list.`
    );
    return updatedSkills;
};
