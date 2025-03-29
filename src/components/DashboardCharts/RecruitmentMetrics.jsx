import React, { useState, useEffect } from "react";
import { Briefcase, Users, CalendarCheck } from "lucide-react";
import { db, auth } from "../../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getUserData } from "../../services/userService";

const RecruitmentMetrics = () => {
    const [metrics, setMetrics] = useState({
        openPositions: 0,
        pendingApplicants: 0,
        scheduledApplicants: 0,
    });
    const [loading, setLoading] = useState(true);
    const [universityId, setUniversityId] = useState(null);
    const navigate = useNavigate();

    // Get current user's university ID
    useEffect(() => {
        const getCurrentUserUniversity = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.error("No authenticated user found");
                    setLoading(false);
                    return;
                }
                
                // Get user data to find university ID
                const userDataResult = await getUserData(user.uid);
                if (userDataResult.success && userDataResult.data.universityId) {
                    setUniversityId(userDataResult.data.universityId);
                } else {
                    console.error("User doesn't have a university association");
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error getting user's university:", error);
                setLoading(false);
            }
        };
        
        getCurrentUserUniversity();
    }, []);

    // Fetch metrics when universityId changes
    useEffect(() => {
        if (universityId) {
            fetchMetrics();
        }
    }, [universityId]);

    const fetchMetrics = async () => {
        try {
            console.log("Fetching metrics with universityId:", universityId);
            
            // Get all jobs from university's collection without filtering by status
            const jobsRef = collection(db, "universities", universityId, "jobs");
            const jobsQuery = query(
                jobsRef,
                where("isDeleted", "!=", true) // Only exclude deleted jobs
            );
            
            console.log("Executing jobs query...");
            const jobsSnapshot = await getDocs(jobsQuery);
            console.log(`Found ${jobsSnapshot.size} total jobs`);
            
            // Filter open jobs client-side to be more flexible
            const openJobs = jobsSnapshot.docs.filter(doc => {
                const data = doc.data();
                // Consider a job "open" if it has status "Open" or doesn't have a status field
                return !data.status || data.status === "Open" || data.status === "open";
            });
            
            const openPositions = openJobs.length;
            console.log(`Found ${openPositions} open jobs`);

            let totalPendingApplicants = 0;
            let totalScheduledApplicants = 0;

            // For each job, get applicants from university's collection
            for (const jobDoc of jobsSnapshot.docs) {
                const jobId = jobDoc.id;
                const jobData = jobDoc.data();
                console.log(`Processing job: ${jobId}, title: ${jobData.title || 'Unknown'}`);
                
                const applicantsRef = collection(
                    db,
                    "universities",
                    universityId,
                    "jobs",
                    jobId,
                    "applicants"
                );

                // Get pending applicants (status is "Pending")
                const pendingSnapshot = await getDocs(
                    query(applicantsRef, where("status", "==", "Pending"))
                );
                console.log(`Job ${jobId} has ${pendingSnapshot.size} pending applicants`);
                totalPendingApplicants += pendingSnapshot.size;

                // Get scheduled applicants (status is "Interviewing")
                const scheduledSnapshot = await getDocs(
                    query(
                        applicantsRef,
                        where("status", "==", "Interviewing")
                    )
                );
                console.log(`Job ${jobId} has ${scheduledSnapshot.size} scheduled applicants`);
                totalScheduledApplicants += scheduledSnapshot.size;
            }

            console.log(`Total metrics - Open: ${openPositions}, Pending: ${totalPendingApplicants}, Scheduled: ${totalScheduledApplicants}`);
            
            setMetrics({
                openPositions,
                pendingApplicants: totalPendingApplicants,
                scheduledApplicants: totalScheduledApplicants,
            });
            setLoading(false);
        } catch (error) {
            console.error("Error fetching recruitment metrics:", error);
            setLoading(false);
        }
    };

    const handleMetricClick = (metricType) => {
        switch (metricType) {
            case "openPositions":
                navigate("/recruitment", { state: { filter: "open" } });
                break;
            case "pendingApplicants":
                navigate("/recruitment", { state: { filter: "pending" } });
                break;
            case "scheduledApplicants":
                navigate("/recruitment", { state: { filter: "scheduled" } });
                break;
            default:
                break;
        }
    };

    const metricsData = [
        {
            title: "Open Job Positions",
            value: loading ? "..." : metrics.openPositions.toString(),
            icon: <Briefcase size={48} className="text-blue-500" />,
            type: "openPositions",
        },
        {
            title: "Pending Applicants",
            value: loading ? "..." : metrics.pendingApplicants.toString(),
            icon: <Users size={48} className="text-yellow-500" />,
            type: "pendingApplicants",
        },
        {
            title: "Scheduled Applicants",
            value: loading ? "..." : metrics.scheduledApplicants.toString(),
            icon: <CalendarCheck size={48} className="text-green-500" />,
            type: "scheduledApplicants",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {metricsData.map((metric, index) => (
                <div
                    key={index}
                    onClick={() => handleMetricClick(metric.type)}
                    className={`bg-gray-100 p-4 rounded-lg flex flex-col items-center text-center 
                        ${loading ? "animate-pulse" : ""} 
                        cursor-pointer hover:bg-gray-200 transition-colors duration-200`}
                >
                    {metric.icon}
                    <h2 className="text-lg font-semibold mt-2">
                        {metric.title}
                    </h2>
                    <p className="text-[#9AADEA] text-3xl font-semibold">
                        {metric.value}
                    </p>
                </div>
            ))}
        </div>
    );
};

export default RecruitmentMetrics;
