import React from "react";

const ViewInterviewModal = ({ selectedInterview, closeModal }) => {
  if (!selectedInterview) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
        zIndex: 1000,
      }}
    >
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-2xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {selectedInterview.title}
        </h2>
        <hr className="border-t border-gray-300 mb-6" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Date:</span>{" "}
                {new Date(selectedInterview.dateTime).toLocaleDateString()}
              </div>
              <div>
                <span className="font-semibold">Time:</span>{" "}
                {new Date(selectedInterview.dateTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
              <div>
                <span className="font-semibold">Title:</span>{" "}
                {selectedInterview.title}
              </div>
            </div>
          </div>
          <div>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Interviewer:</span>{" "}
                {selectedInterview.interviewer}
              </div>
              <div>
                <span className="font-semibold">Status:</span>{" "}
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedInterview.status.toLowerCase() === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : selectedInterview.status.toLowerCase() === "success"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedInterview.status}
                </span>
              </div>
            </div>
          </div>
          <div className="col-span-2 row-span-3">
            <span className="font-semibold">Notes:</span>{" "}
            <div className="mt-2 p-4 border border-gray-300 rounded-lg h-40 overflow-y-auto">
              {selectedInterview.notes || "No notes available."}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={closeModal}
            className="cursor-pointer px-8 py-3 text-[#9AADEA] border border-[#9AADEA] rounded-lg transition duration-200 hover:bg-[#9AADEA] hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewInterviewModal;