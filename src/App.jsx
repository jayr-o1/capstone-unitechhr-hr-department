import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Recruitment from "./pages/Recruitment";  // Fixed typo
import Onboarding from "./pages/Onboarding";
import Employees from "./pages/Employees";
import Clusters from "./pages/Clusters";

function App() {
  return (
      <Router>
          <Routes>
              {/* Wrap all routes with the Layout component */}
              <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="recruitment" element={<Recruitment />} />
                  <Route path="onboarding" element={<Onboarding />} />
                  <Route path="employees" element={<Employees />} />
                  <Route path="clusters" element={<Clusters />} />
                  {/* Add more routes here */}
              </Route>
          </Routes>
      </Router>
  );
}

export default App;
