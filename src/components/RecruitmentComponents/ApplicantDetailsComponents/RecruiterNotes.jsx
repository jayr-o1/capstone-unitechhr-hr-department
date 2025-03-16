const RecruiterNotes = ({
    scheduledInterviews,
    onAddNotes,
    selectedInterviewId,
    notes,
    onSaveNotes,
    onNotesChange,
    onEditInterview, // New prop for handling edit functionality
}) => {
    // Function to capitalize the first letter of a string
    const capitalizeFirstLetter = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };

    return (
        <div className="mt-6 border border-gray-300 rounded-lg p-6 bg-white shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Recruiter's Notes
            </h2>
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-gray-300">
                        <th className="py-2">Schedule</th>
                        <th className="py-2">Time</th>
                        <th className="py-2">Title</th>
                        <th className="py-2">Interviewer</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {scheduledInterviews.map((interview) => (
                        <tr
                            key={interview.id}
                            className="border-b border-gray-200"
                        >
                            <td className="py-3">
                                {new Date(
                                    interview.dateTime
                                ).toLocaleDateString()}
                            </td>
                            <td className="py-3">
                                {new Date(
                                    interview.dateTime
                                ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                })}
                            </td>
                            <td className="py-3">{interview.title}</td>
                            <td className="py-3">{interview.interviewer}</td>
                            <td className="py-3">
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                        interview.status.toLowerCase() ===
                                        "pending"
                                            ? "bg-yellow-100 text-yellow-800" // Yellow for pending
                                            : interview.status.toLowerCase() ===
                                              "success"
                                            ? "bg-green-100 text-green-800" // Green for success
                                            : "bg-red-100 text-red-800" // Red for other statuses (e.g., failed)
                                    }`}
                                >
                                    {capitalizeFirstLetter(interview.status)}
                                </span>
                            </td>
                            <td className="py-3 space-x-2">
                                <button
                                    onClick={() => onAddNotes(interview.id)}
                                    className="cursor-pointer px-4 py-2 text-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#9AADEA] hover:text-white"
                                >
                                    View
                                </button>
                                <button
                                    onClick={() =>
                                        onEditInterview(interview.id)
                                    }
                                    className="cursor-pointer px-4 py-2 text-[#4CAF50] border border-[#4CAF50] rounded-lg transition duration-200 hover:bg-[#4CAF50] hover:text-white"
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Notes Editor */}
            {selectedInterviewId && (
                <div className="mt-6">
                    <textarea
                        value={notes}
                        onChange={onNotesChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AADEA]"
                        placeholder="Add notes for this interview..."
                    />
                    <button
                        onClick={onSaveNotes}
                        className="cursor-pointer px-6 py-2 text-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#9AADEA] hover:text-white"
                    >
                        Save Notes
                    </button>
                </div>
            )}
        </div>
    );
};

export default RecruiterNotes;
