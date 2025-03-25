import React, { useState, useEffect } from "react";
import { Briefcase, Users, CalendarCheck } from "lucide-react";
import { db } from "../../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const RecruitmentMetrics = () => {
    const [metrics, setMetrics] = useState({
        openPositions: 0,
        pendingApplicants: 0,
        scheduledApplicants: 0,
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                // Get all jobs
                const jobsSnapshot = await getDocs(
                    query(collection(db, "jobs"), where("status", "==", "Open"))
                );
                const openPositions = jobsSnapshot.size;

                let totalPendingApplicants = 0;
                let totalScheduledApplicants = 0;

                // For each job, get applicants
                for (const jobDoc of jobsSnapshot.docs) {
                    const jobId = jobDoc.id;
                    const applicantsRef = collection(db, "jobs", jobId, "applicants");

                    // Get pending applicants (status is "Applied")
                    const pendingSnapshot = await getDocs(
                        query(applicantsRef, where("status", "==", "Applied"))
                    );
                    totalPendingApplicants += pendingSnapshot.size;

                    // Get scheduled applicants (status is "Interview Scheduled")
                    const scheduledSnapshot = await getDocs(
                        query(applicantsRef, where("status", "==", "Interview Scheduled"))
                    );
                    totalScheduledApplicants += scheduledSnapshot.size;
                }

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

        fetchMetrics();
    }, []);

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
