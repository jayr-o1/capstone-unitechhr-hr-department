import React, { useState } from "react";
import { Link } from "react-router-dom";

const Subscription = () => {
    const [subscriptionData] = useState({
        platform: "UNITECH HR",
        price: "$19.99",
        plan: "PRO",
        nextPayment: "11/29/2024"
    });

    const handleCancelSubscription = () => {
        // This would typically show a confirmation dialog
        if (window.confirm("Are you sure you want to cancel your subscription?")) {
            // Handle cancellation logic here (to be implemented)
            alert("Subscription cancellation requested");
        }
    };

    return (
        <div className="flex-1 p-6 bg-white shadow-md rounded-lg">
            <div className="flex flex-col">
                <div className="flex items-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Subscription Details</h1>
                    
                    <div className="flex ml-auto">
                        <Link
                            to="/home"
                            className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:text-blue-600 mr-2"
                        >
                            Home
                        </Link>
                        <Link
                            to="/subscription"
                            className="cursor-pointer px-3 py-2 text-sm text-blue-600 font-semibold border-b-2 border-blue-600"
                        >
                            Subscription
                        </Link>
                    </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg mb-8">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Payment</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {subscriptionData.platform}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {subscriptionData.price}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {subscriptionData.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {subscriptionData.nextPayment}
                                </td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {subscriptionData.platform}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {subscriptionData.price}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {subscriptionData.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    10/31/2024
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div className="flex justify-center">
                    <button
                        onClick={handleCancelSubscription}
                        className="px-6 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                        Cancel Subscription
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Subscription; 