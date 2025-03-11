import React from "react";

const Dashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      
      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Number of Applicants */}
        <div className="bg-white p-6 rounded-xl shadow-lg font-fredoka font-semibold">Total Number of Applicants</div>
        
        {/* Total Number of Employees */}
        <div className="bg-white p-6 rounded-xl shadow-lg">Total Number of Employees</div>
        
        {/* Hired Applicants */}
        <div className="bg-white p-6 rounded-xl shadow-lg">Hired Applicants</div>
        
        {/* Job Post Views */}
        <div className="bg-white p-6 rounded-xl shadow-lg">Job Post Views</div>
        
        {/* Employees per Clustered Recommendation */}
        <div className="bg-white p-6 rounded-xl shadow-lg">Employees per Clustered Recommendation</div>
      </div>
    </div>
  );
};

export default Dashboard;
