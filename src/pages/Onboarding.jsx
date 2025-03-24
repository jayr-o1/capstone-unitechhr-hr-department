import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";
import showSuccessAlert from "../components/Alerts/SuccessAlert";
import showErrorAlert from "../components/Alerts/ErrorAlert";
import PageLoader from "../components/PageLoader";

const Onboarding = () => {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [highlightedApplicant, setHighlightedApplicant] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Fetch applicants with "In Onboarding" status
    useEffect(() => {
        const fetchOnboardingApplicants = async () => {
            try {
                setLoading(true);
                const onboardingApplicants = [];

                // Get all jobs
                const jobsSnapshot = await getDocs(collection(db, "jobs"));

                // For each job, get applicants in onboarding
                for (const jobDoc of jobsSnapshot.docs) {
                    const jobId = jobDoc.id;
                    const applicantsQuery = query(
                        collection(db, "jobs", jobId, "applicants"),
                        where("status", "==", "In Onboarding")
                    );

                    const applicantsSnapshot = await getDocs(applicantsQuery);

                    applicantsSnapshot.docs.forEach((doc) => {
                        onboardingApplicants.push({
                            id: doc.id,
                            jobId: jobId,
                            jobTitle: jobDoc.data().title,
                            ...doc.data(),
                            onboardingStartedAt:
                                doc.data().onboardingStartedAt?.toDate() ||
                                new Date(),
                        });
                    });
                }

                // Sort by onboarding start date (newest first)
                onboardingApplicants.sort(
                    (a, b) => b.onboardingStartedAt - a.onboardingStartedAt
                );

                setApplicants(onboardingApplicants);

                // Check if we're coming from a redirect with a new onboarding applicant
                if (
                    location.state?.newOnboarding &&
                    location.state?.applicantId
                ) {
                    setHighlightedApplicant(
                        `${location.state.jobId}-${location.state.applicantId}`
                    );

                    // Scroll to the highlighted applicant element
                    setTimeout(() => {
                        const element = document.getElementById(
                            `applicant-${location.state.jobId}-${location.state.applicantId}`
                        );
                        if (element) {
                            element.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                            });
                        }
                    }, 500);
                }
            } catch (err) {
                console.error("Error fetching onboarding applicants:", err);
                setError("Failed to load applicants. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchOnboardingApplicants();
    }, [location]);

    // Handle starting the onboarding process for an applicant
    const handleStartOnboarding = async (jobId, applicantId) => {
        try {
            const applicantRef = doc(
                db,
                "jobs",
                jobId,
                "applicants",
                applicantId
            );

            await updateDoc(applicantRef, {
                onboardingStatus: "In Progress",
                onboardingUpdatedAt: serverTimestamp(),
            });

            // Update the local state
            setApplicants((prevApplicants) =>
                prevApplicants.map((applicant) =>
                    applicant.id === applicantId && applicant.jobId === jobId
                        ? { ...applicant, onboardingStatus: "In Progress" }
                        : applicant
                )
            );

            showSuccessAlert("Onboarding process started!");
        } catch (error) {
            console.error("Error starting onboarding:", error);
            showErrorAlert("Failed to start onboarding process");
        }
    };

    // Complete onboarding and make applicant an employee
    const handleCompleteOnboarding = async (jobId, applicantId) => {
        try {
            const applicantRef = doc(
                db,
                "jobs",
                jobId,
                "applicants",
                applicantId
            );

            await updateDoc(applicantRef, {
                status: "Hired",
                onboardingStatus: "Completed",
                onboardingCompletedAt: serverTimestamp(),
                isEmployee: true,
            });

            // Update the local state
            setApplicants((prevApplicants) =>
                prevApplicants.filter(
                    (applicant) =>
                        !(
                            applicant.id === applicantId &&
                            applicant.jobId === jobId
                        )
                )
            );

            showSuccessAlert("Applicant successfully hired as employee!");
        } catch (error) {
            console.error("Error completing onboarding:", error);
            showErrorAlert("Failed to complete onboarding process");
        }
    };

    // Format date for display
    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Check if this is a page refresh
    const isPageRefresh =
        typeof sessionStorage !== "undefined" &&
        sessionStorage.getItem("isPageRefresh") === "true";

    // Show PageLoader during loading state
    if (loading) {
        return <PageLoader isLoading={true} fullscreen={isPageRefresh} />;
    }

    if (error)
        return (
            <div className="text-center py-10">
                <p className="text-red-500">{error}</p>
            </div>
        );

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Applicant Onboarding</h1>

            {applicants.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow">
                    <p className="text-gray-500">
                        No applicants in the onboarding process.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {applicants.map((applicant) => (
                        <div
                            key={`${applicant.jobId}-${applicant.id}`}
                            id={`applicant-${applicant.jobId}-${applicant.id}`}
                            className={`p-4 bg-white rounded-lg shadow transition-all ${
                                highlightedApplicant ===
                                `${applicant.jobId}-${applicant.id}`
                                    ? "border-2 border-blue-500 transform scale-102"
                                    : ""
                            }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        {applicant.name}
                                    </h2>
                                    <p className="text-gray-600">
                                        {applicant.applyingFor ||
                                            "Position N/A"}{" "}
                                        • {applicant.jobTitle || "Job N/A"}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Onboarding Started:{" "}
                                        {formatDate(
                                            applicant.onboardingStartedAt
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm ${
                                            applicant.onboardingStatus ===
                                            "In Progress"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-yellow-100 text-yellow-800"
                                        }`}
                                    >
                                        {applicant.onboardingStatus ||
                                            "Not Started"}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Email
                                    </p>
                                    <p>{applicant.email || "N/A"}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Phone
                                    </p>
                                    <p>{applicant.phone || "N/A"}</p>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end gap-3">
                                {applicant.onboardingStatus ===
                                "Not Started" ? (
                                    <button
                                        onClick={() =>
                                            handleStartOnboarding(
                                                applicant.jobId,
                                                applicant.id
                                            )
                                        }
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition cursor-pointer"
                                    >
                                        Start Onboarding
                                    </button>
                                ) : (
                                    <button
                                        onClick={() =>
                                            handleCompleteOnboarding(
                                                applicant.jobId,
                                                applicant.id
                                            )
                                        }
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition cursor-pointer"
                                    >
                                        Complete & Hire
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Onboarding;
