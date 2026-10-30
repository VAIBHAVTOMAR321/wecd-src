import React, { useEffect, useState, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import {
  FaSave,
  FaArrowLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../login/AuthContext";
import CWCLeftNav from "./CWCLeftNav";
import CWCtopNav from "./CWCTopNav";
import "../../../../src/assets/css/cwcregis.css";

const CWC_API_URL =
  "https://mahadevaaya.com/srcproject/srcproject_backend/api/cncp-child-welfare-committee/";

const DISTRICT_API_URL =
  "https://mahadevaaya.com/srcproject/srcproject_backend/api/districts/";

const ChildWelfareCommiRegi = () => {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const { authFetch, user } = useAuth();

  // ==========================================
  // SIDEBAR STATES
  // ==========================================

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // ==========================================
  // DISTRICT STATES
  // ==========================================

  const [districts, setDistricts] = useState([]);
  const [districtLoading, setDistrictLoading] = useState(true);
  const [districtError, setDistrictError] = useState("");

  // ==========================================
  // FORM DATA
  // ==========================================

  const [formData, setFormData] = useState({
    state: "Uttarakhand",
    district: "",

    child_welfare_committee_name: "",
    child_welfare_committee_number: "",
    username: user?.username || user?.name || "",

    cncp_child_enroll_number: "",
    cncp_child_aadhaar_number: "",
    cncp_child_dob: "",

    // FILE FIELDS
    cncp_child_details: null,
    home_verification: null,
    sir: null,
    rehabilitation_plan: null,
    order_sent_to_department: null,
    follow_up_on_direction: null,
  });

  // ==========================================
  // SUBMIT STATES
  // ==========================================

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // RESPONSIVE SIDEBAR
  // ==========================================

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);

      if (width < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ==========================================
  // GET DISTRICTS
  // ==========================================

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        setDistrictLoading(true);
        setDistrictError("");

        const response = await authFetch(DISTRICT_API_URL); if (!response.ok) {
          throw new Error("Failed to fetch districts.");
        }

        const data = await response.json();

        console.log("District API Response:", data);

        if (!Array.isArray(data)) {
          throw new Error("Invalid district API response.");
        }

        setDistricts(data);
      } catch (err) {
        console.error("District API Error:", err);

        setDistrictError(
          err.message || "Unable to load districts."
        );
      } finally {
        setDistrictLoading(false);
      }
    };

    fetchDistricts();
  }, [authFetch]);

  // ==========================================
  // AUTO-FILL DISTRICT FROM LOGGED IN USER
  // ==========================================

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        state: user.state || prev.state,
        district: user.district || user.district_name || prev.district,
        username: user.username || user.name || prev.username,
      }));
    }
  }, [user]);

  // ==========================================
  // TOGGLE SIDEBAR
  // ==========================================

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  // ==========================================
  // HANDLE INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      files,
    } = e.target;

    let processedValue = value;
    if (name === 'cncp_child_aadhaar_number') {
      // Allow only digits
      processedValue = value.replace(/\D/g, '');
    }

    setFormData((prev) => ({
      ...prev,

      // If input is file -> save File object
      // Otherwise -> save normal value
      [name]:
        type === "file"
          ? files?.[0] || null
          : processedValue,
    }));

    setError("");
    setSuccess("");
  };

  // ==========================================
  // HANDLE RESET
  // ==========================================

  const handleReset = () => {
    if (formRef.current) {
      formRef.current.reset();
    }

    setFormData({
      state: "Uttarakhand",
      district: user?.district || user?.district_name || "",
      username: user?.username || user?.name || "",

      child_welfare_committee_name: "",
      child_welfare_committee_number: "",

      cncp_child_enroll_number: "",
      cncp_child_aadhaar_number: "",
      cncp_child_dob: "",

      cncp_child_details: null,
      home_verification: null,
      sir: null,
      rehabilitation_plan: null,
      order_sent_to_department: null,
      follow_up_on_direction: null,
    });

    setError("");
    setSuccess("");
  };

  // ==========================================
  // SUBMIT FORM
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // ========================================
      // CREATE FORMDATA
      // ========================================

      const payload = new FormData();

      // ========================================
      // TEXT FIELDS
      // ========================================

      payload.append(
        "state",
        formData.state
      );

      payload.append(
        "district",
        formData.username
      );

      payload.append(
        "username",
        formData.district
      );

      payload.append(
        "child_welfare_committee_name",
        formData.child_welfare_committee_name
      );

      payload.append(
        "child_welfare_committee_number",
        formData.child_welfare_committee_number
      );

      payload.append(
        "cncp_child_enroll_number",
        formData.cncp_child_enroll_number
      );

      payload.append(
        "cncp_child_aadhaar_number",
        formData.cncp_child_aadhaar_number
      );

      payload.append(
        "cncp_child_dob",
        formData.cncp_child_dob
      );

      // ========================================
      // FILE FIELDS
      // ========================================

      if (formData.cncp_child_details) {
        payload.append(
          "cncp_child_details",
          formData.cncp_child_details
        );
      }

      if (formData.home_verification) {
        payload.append(
          "home_verification",
          formData.home_verification
        );
      }

      if (formData.sir) {
        payload.append(
          "sir",
          formData.sir
        );
      }

      if (formData.rehabilitation_plan) {
        payload.append(
          "rehabilitation_plan",
          formData.rehabilitation_plan
        );
      }

      if (formData.order_sent_to_department) {
        payload.append(
          "order_sent_to_department",
          formData.order_sent_to_department
        );
      }

      if (formData.follow_up_on_direction) {
        payload.append(
          "follow_up_on_direction",
          formData.follow_up_on_direction
        );
      }

      // ========================================
      // DEBUG PAYLOAD
      // ========================================

      console.log(
        "========== FORM DATA PAYLOAD =========="
      );

      for (const [key, value] of payload.entries()) {
        console.log(
          key,
          value instanceof File
            ? {
                name: value.name,
                type: value.type,
                size: value.size,
              }
            : value
        );
      }

      // ========================================
      // POST REQUEST
      // ========================================

      const response = await authFetch(CWC_API_URL, {
        method: "POST",
        body: payload,
      });

      // ========================================
      // API RESPONSE
      // ========================================

      const responseData =
        await response.json();

      console.log(
        "POST Response:",
        responseData
      );

      // ========================================
      // API VALIDATION ERROR
      // ========================================

      if (
        !response.ok ||
        responseData.status === false
      ) {
        console.log(
          "Validation Errors:",
          responseData.errors
        );

        // Show field errors if backend provides them
        if (responseData.errors) {
          const errorMessages = Object.entries(
            responseData.errors
          )
            .map(
              ([field, messages]) =>
                `${field}: ${
                  Array.isArray(messages)
                    ? messages.join(", ")
                    : messages
                }`
            )
            .join("\n");

          throw new Error(
            errorMessages ||
              responseData.message ||
              "Validation error"
          );
        }

        throw new Error(
          responseData.message ||
            "Failed to submit registration."
        );
      }

      // ========================================
      // SUCCESS
      // ========================================

      setSuccess(
        "Child Welfare Committee registration submitted successfully."
      );

      window.alert("Registration successfully");

      // ========================================
      // RESET FORM
      // ========================================

      handleReset();
    } catch (err) {
      console.error(
        "Submit Error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong while submitting the form."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="dashboard-container">

      {/* ======================================
          LEFT NAVIGATION
      ====================================== */}

      <CWCLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      {/* ======================================
          MAIN CONTENT
      ====================================== */}

      <div className="main-content-dash">

        {/* TOP NAV */}
        <CWCtopNav
          toggleSidebar={toggleSidebar}
        />

        <Container
          fluid
          className="dashboard-box mt-3 px-3 px-md-4 pb-4"
        >

          {/* ====================================
              PAGE HEADER
          ==================================== */}

          <div className="cwc-page-header mb-4">

            <div>
              <h3 className="cwc-page-title">
                Child Welfare Committee Registration
              </h3>

              <p className="cwc-page-subtitle mb-0">
                Register CNCP child details under
                the Child Welfare Committee.
              </p>
            </div>

            <Button
              variant="outline-secondary"
              className="cwc-back-btn"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className="me-2" />
              Back
            </Button>

          </div>

          {/* ====================================
              SUCCESS
          ==================================== */}

          {success && (
            <Alert
              variant="success"
              dismissible
              onClose={() =>
                setSuccess("")
              }
            >
              {success}
            </Alert>
          )}

          {/* ====================================
              ERROR
          ==================================== */}

          {error && (
            <Alert
              variant="danger"
              dismissible
              onClose={() =>
                setError("")
              }
              style={{
                whiteSpace: "pre-line",
              }}
            >
              {error}
            </Alert>
          )}

          {/* ====================================
              DISTRICT ERROR
          ==================================== */}

          {districtError && (
            <Alert
              variant="warning"
              dismissible
              onClose={() =>
                setDistrictError("")
              }
            >
              {districtError}
            </Alert>
          )}

          {/* ====================================
              FORM CARD
          ==================================== */}

          <Card className="cwc-form-card">

            <Card.Body>
              <Form
                ref={formRef}
                onSubmit={handleSubmit}
                encType="multipart/form-data"
              >

                {/* ==================================
                    SECTION 1
                ================================== */}

                <div className="form-section-title">
                  Committee & Child Information
                </div>

                <Row className="g-3">

                  {/* STATE */}
                  <Col
                    lg={3}
                    md={6}
                    sm={12}
                  >
                    <Form.Group>

                      <Form.Label>
                        State{" "}
                        <span className="required">
                          *
                        </span>
                      </Form.Label>

                      <Form.Control
                        type="text"
                        name="state"
                        value={
                          formData.state
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter state"
                        required
                        disabled
                        readOnly
                      />

                    </Form.Group>
                  </Col>

                <Col
                    lg={3}
                    md={6}
                    sm={12}
                  >
                    <Form.Group>

                      <Form.Label>
                        District  <span className="required">
                          *
                        </span>
                      </Form.Label>

                      <Form.Control
                        type="text"
                        name="username"
                        value={
                          formData.username
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter username"
                        disabled
                        readOnly
                      />

                    </Form.Group>
                  </Col>

                  {/* CWC NAME */}
                  <Col
                    lg={3}
                    md={6}
                    sm={12}
                  >
                    <Form.Group>

                      <Form.Label>
                        CWC Name{" "}
                        <span className="required">
                          *
                        </span>
                      </Form.Label>

                      <Form.Control
                        type="text"
                        name="child_welfare_committee_name"
                        value={
                          formData.child_welfare_committee_name
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter CWC name"
                        required
                      />

                    </Form.Group>
                  </Col>

                  {/* CWC NUMBER */}
                  <Col
                    lg={3}
                    md={6}
                    sm={12}
                  >
                    <Form.Group>

                      <Form.Label>
                        CWC Number{" "}
                        <span className="required">
                          *
                        </span>
                      </Form.Label>

                      <Form.Control
                        type="text"
                        name="child_welfare_committee_number"
                        value={
                          formData.child_welfare_committee_number
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="CWC-UK-DDN-001"
                        required
                      />

                    </Form.Group>
                  </Col>

            
                  

                  {/* CNCP ENROLLMENT */}
                  <Col
                    lg={3}
                    md={6}
                    sm={12}
                  >
                    <Form.Group>

                      <Form.Label>
                        CNCP Child Enrollment No.{" "}
                        <span className="required">
                          *
                        </span>
                      </Form.Label>

                      <Form.Control
                        type="text"
                        name="cncp_child_enroll_number"
                        value={
                          formData.cncp_child_enroll_number
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="CNCP-2026-0001"
                        required
                      />

                    </Form.Group>
                  </Col>

                  {/* AADHAAR */}
                  <Col
                    lg={3}
                    md={6}
                    sm={12}
                  >
                    <Form.Group>

                      <Form.Label>
                        CNCP Child Aadhaar Number
                      </Form.Label>

                      <Form.Control
                        type="text"
                        name="cncp_child_aadhaar_number"
                        value={
                          formData.cncp_child_aadhaar_number
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter Aadhaar number"
                        maxLength={12}
                        inputMode="numeric"
                      />

                    </Form.Group>
                  </Col>

                  {/* DOB */}
                  <Col
                    lg={3}
                    md={6}
                    sm={12}
                  >
                    <Form.Group>

                      <Form.Label>
                        Child Date of Birth{" "}
                        <span className="required">
                          *
                        </span>
                      </Form.Label>

                      <Form.Control
                        type="date"
                        name="cncp_child_dob"
                        value={
                          formData.cncp_child_dob
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />

                    </Form.Group>
                  </Col>

                  {/* CHILD DETAILS FILE */}
                  <Col
                    lg={3}
                    md={6}
                    sm={12}
                  >
                    <Form.Group>

                      <Form.Label>
                        Child Details
                      </Form.Label>

                      <Form.Control
                        type="file"
                        name="cncp_child_details"
                        onChange={
                          handleChange
                        }
                      />

                      <Form.Text>
                        Upload child details document
                      </Form.Text>

                    </Form.Group>
                  </Col>

                  {/* HOME VERIFICATION FILE */}
                  <Col
                    lg={3}
                    md={6}
                    sm={12}
                  >
                    <Form.Group>

                      <Form.Label>
                        Home Verification
                      </Form.Label>

                      <Form.Control
                        type="file"
                        name="home_verification"
                        onChange={
                          handleChange
                        }
                      />

                      <Form.Text>
                        Upload verification document
                      </Form.Text>

                    </Form.Group>
                  </Col>

                </Row>

                {/* ==================================
                    SECTION 2
                ================================== */}

                <div className="form-section-title mt-4">
                  Case & Rehabilitation Documents
                </div>

                <Row className="g-3">

                  {/* SIR */}
                  <Col
                    lg={3}
                    md={6}
                    sm={12}
                  >
                    <Form.Group>

                      <Form.Label>
                        SIR
                      </Form.Label>

                      <Form.Control
                        type="file"
                        name="sir"
                        onChange={
                          handleChange
                        }
                      />

                      <Form.Text>
                        Upload SIR document
                      </Form.Text>

                    </Form.Group>
                  </Col>

                  {/* REHABILITATION */}
                  <Col
                    lg={3}
                    md={6}
                    sm={12}
                  >
                    <Form.Group>

                      <Form.Label>
                        Rehabilitation Plan
                      </Form.Label>

                      <Form.Control
                        type="file"
                        name="rehabilitation_plan"
                        onChange={
                          handleChange
                        }
                      />

                      <Form.Text>
                        Upload rehabilitation plan
                      </Form.Text>

                    </Form.Group>
                  </Col>

                  {/* ORDER */}
                  <Col
                    lg={3}
                    md={6}
                    sm={12}
                  >
                    <Form.Group>

                      <Form.Label>
                        Order Sent to Department
                      </Form.Label>

                      <Form.Control
                        type="file"
                        name="order_sent_to_department"
                        onChange={
                          handleChange
                        }
                      />

                      <Form.Text>
                        Upload department order
                      </Form.Text>

                    </Form.Group>
                  </Col>

                  {/* FOLLOW UP */}
                  <Col
                    lg={3}
                    md={6}
                    sm={12}
                  >
                    <Form.Group>

                      <Form.Label>
                        Follow-up on Direction
                      </Form.Label>

                      <Form.Control
                        type="file"
                        name="follow_up_on_direction"
                        onChange={
                          handleChange
                        }
                      />

                      <Form.Text>
                        Upload follow-up document
                      </Form.Text>

                    </Form.Group>
                  </Col>

                </Row>

                {/* ==================================
                    BUTTONS
                ================================== */}

                <div className="cwc-form-actions mt-4">

                  <Button
                    type="button"
                    variant="light"
                    className="me-2"
                    onClick={
                      handleReset
                    }
                    disabled={loading}
                  >
                    Reset
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                  >

                    {loading ? (
                      <>
                        <Spinner
                          size="sm"
                          animation="border"
                          className="me-2"
                        />

                        Submitting...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />

                        Submit Registration
                      </>
                    )}

                  </Button>

                </div>

              </Form>

            </Card.Body>

          </Card>

        </Container>

      </div>
    </div>
  );
};

export default ChildWelfareCommiRegi;