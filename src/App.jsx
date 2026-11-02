import React from "react";
import {
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import Home from "./components/home_layout/Home";
import Login from "./components/login/Login";
import NavBar from "./components/nav_bar/NavBar";

import DisDashBoard from "./components/all_dashbords/dis_admin/DisDashBoard";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import SuccessStory from "./components/home_layout/SuccessStory";
import AboutUs from "./components/home_layout/AboutUs";
import Footer from "./components/footer/Footer";
import StateDashBoard from "./components/all_dashbords/state_Admin/StateDashBoard";
import StateDepartmentManage from "./components/all_dashbords/state_admin/StateDepartmentManage";
import DepartDashBoard from "./components/all_dashbords/depart/DepartDashBoard";
import AssignedStudents from "./components/all_dashbords/depart/AssignedStudents";
import CWCDashBoard from "./components/all_dashbords/cwc_dashboard/CWCDashBoard";
import { LanguageProvider } from "./context/LanguageContext";
import ChildWelfareCommiRegi from "./components/all_dashbords/cwc_dashboard/ChildWelfareCommiRegi";
import CWCRegiDetails from "./components/all_dashbords/cwc_dashboard/CWCRegiDetails";

// A wrapper component to conditionally render the NavBar
const AppContent = () => {
  const location = useLocation();
  const isDisRoute = ["/DisDashBoard", "/DepartDashBoard", "/DepartAssignedStudents", "/StateDashBoard", "/StateDepartmentManage", "/CWCRegiDetails", "/ChildWelfareCommiRegi","/CWCDashBoard"].some((route) =>
    location.pathname.startsWith(route)
  );

  return (
    <>
      {!isDisRoute && <NavBar />}
      <div className={!isDisRoute ? "main-content" : ""}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/AboutUs" element={<AboutUs />} />
          <Route path="/SuccessStory" element={<SuccessStory />} />
          

          {/* Dis Routes */}
          <Route path="/DisDashboard" element={<DisDashBoard />} />
          <Route path="/StateDashBoard" element={<StateDashBoard />} />
          <Route path="/StateDepartmentManage" element={<StateDepartmentManage />} />
          <Route path="/DepartDashBoard" element={<DepartDashBoard />} />
          <Route path="/DepartAssignedStudents" element={<AssignedStudents />} />
          <Route path="/CWCDashBoard" element={<CWCDashBoard />} />
          <Route path="/ChildWelfareCommiRegi" element={<ChildWelfareCommiRegi />} />
          <Route path="/CWCRegiDetails" element={<CWCRegiDetails  />} />
          
          
          {/* Add other Dis routes from DisLeftNav here as needed */}
        </Routes>
      </div>
      {!isDisRoute && <Footer />}
    </>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;