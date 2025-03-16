const RecruiterNotes = ({ scheduledInterviews, onAddNotes, selectedInterviewId, notes, onSaveNotes, onNotesChange }) => {
    return (
      <div className="mt-6 border border-gray-300 rounded-lg p-6 bg-white shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recruiter's Notes</h2>
        {/* Scheduled Interviews */}
        {scheduledInterviews.map((interview) => (
          <div key={interview.id} className="mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-800 font-medium">
                {new Date(interview.dateTime).toLocaleString()}
              </span>
              <button
                onClick={() => onAddNotes(interview.id)}
                className="px-4 py-2 bg-[#9AADEA] text-white rounded-lg hover:bg-[#7b8edc] transition duration-200 cursor-pointer"
              >
                Add Notes
              </button>
            </div>
            {/* Notes Editor */}
            {selectedInterviewId === interview.id && (
              <div className="mt-2">
                <textarea
                  value={notes}
                  onChange={onNotesChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9AADEA]"
                  placeholder="Add notes for this interview..."
                />
                <button
                  onClick={onSaveNotes}
                  className="mt-2 px-4 py-2 bg-[#4CAF50] text-white rounded-lg hover:bg-[#45a049] transition duration-200 cursor-pointer"
                >
                  Save Notes
                </button>
              </div>
            )}
            {/* Display Notes */}
            {interview.notes && (
              <div className="mt-2 text-gray-700">{interview.notes}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  export default RecruiterNotes;