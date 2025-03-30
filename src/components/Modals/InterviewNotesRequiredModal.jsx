import React, { useState } from "react";

const InterviewNotesRequiredModal = ({ isOpen, onClose, interviews, onAddNotes }) => {
    if (!isOpen) return null;

    // Format date for display
    const formatDate = (dateTime) => {
        try {
            return new Date(dateTime).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return "Invalid date";
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Interview Notes Required
                </h2>
                <p className="text-gray-600 mb-4">
                    The following interviews need feedback notes before you can proceed:
                </p>

                <div className="max-h-80 overflow-y-auto mb-5">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Interview
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Interviewer
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {interviews.map((interview) => (
                                <tr key={interview.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {interview.title}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(interview.dateTime)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                        {interview.interviewer}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => onAddNotes(interview)}
                                            className="text-blue-600 hover:text-blue-900 font-medium"
                                        >
                                            Add Notes
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                    <p className="text-sm text-gray-600">
                        Please add notes to all interviews before proceeding.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InterviewNotesRequiredModal; 