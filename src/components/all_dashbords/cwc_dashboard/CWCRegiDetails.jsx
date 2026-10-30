import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  Table,
  Button,
  Modal,
  Badge,
  Form,
} from "react-bootstrap";
import {
  FaEye,
  FaFilePdf,
  FaClipboardList,
  FaSave,
  FaPlus,
  FaBuilding,
  FaLock,
} from "react-icons/fa";
import CWCLeftNav from "./CWCLeftNav";
import CWCtopNav from "./CWCTopNav";
import { useAuth } from "../../login/AuthContext";
import "../../../../src/assets/css/cwcregis.css";

const CWC_API_URL =
  "https://mahadevaaya.com/srcproject/srcproject_backend/api/cncp-child-welfare-committee/";
const DISTRICT_API_URL =
  "https://mahadevaaya.com/srcproject/srcproject_backend/api/districts/";
const DEPT_ASSIGN_API_URL =
  "https://mahadevaaya.com/srcproject/srcproject_backend/api/cncp-child-welfare-department/";
const DEPARTMENTS_LIST_API_URL =
  "https://mahadevaaya.com/srcproject/srcproject_backend/api/departments/";

// ---------- Helper: safely parse JSON from any response ----------
// If the body is HTML (Django error page / 404 / 500), returns a clean
// error object instead of throwing "Unexpected token '<'".
const safeJson = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return { __raw: text };
    }
  }
  // HTML or other — return as a faux error payload
  return {
    status: false,
    message: `Server returned ${response.status} ${response.statusText}. Non-JSON response.`,
    __raw: text.slice(0, 500),
  };
};

const CWCRegiDetails = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authFetch } = useAuth();

  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [districts, setDistricts] = useState([]);

  // Department-related state
  const [departments, setDepartments] = useState([]);
  const [assignedDepartments, setAssignedDepartments] = useState({});
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptFormData, setDeptFormData] = useState({
    form_id: "",
    department: "",
  });
  const [deptLoading, setDeptLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const response = await authFetch(DISTRICT_API_URL);
        if (response.ok) {
          const data = await safeJson(response);
          if (Array.isArray(data)) setDistricts(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDistricts();
  }, [authFetch]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await authFetch(DEPARTMENTS_LIST_API_URL);
        if (response.ok) {
          const data = await safeJson(response);
          if (Array.isArray(data)) setDepartments(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDepartments();
  }, [authFetch]);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(CWC_API_URL);
      const data = await safeJson(response);
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch registration data.");
      }
      if (data.status) {
        setRegistrations(data.data);
        fetchAssignedDepartments(data.data);
      } else {
        throw new Error(data.message || "Failed to fetch data.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authFetch]);

  const fetchAssignedDepartments = async (regs) => {
    const map = {};
    await Promise.all(
      regs.map(async (reg) => {
        try {
          const response = await authFetch(DEPT_ASSIGN_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ form_id: reg.form_id }),
          });
          const data = await safeJson(response);
          if (response.ok && data.status && data.data && data.data.length > 0) {
            map[reg.form_id] = data.data[0];
          }
        } catch (err) {
          console.error("Failed to fetch dept for", reg.form_id, err);
        }
      })
    );
    setAssignedDepartments(map);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleViewClick = (registration) => {
    setSelectedRegistration(registration);
    setShowModal(true);
  };

  const handleEditClick = (registration) => {
    if (assignedDepartments[registration.form_id]) {
      alert(
        "Editing is disabled because a department has already been assigned to this record."
      );
      return;
    }
    setEditData({ ...registration });
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRegistration(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditData({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // ---------- FIX: PUT as JSON with proper headers + safe parse ----------
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      // Build a clean JSON payload — exclude read-only / non-editable fields.
      // Send empty string for dob as null if blank (avoids 400 from DRF date validation).
      const payload = {
        form_id: editData.form_id ?? "",
        state: editData.state ?? "",
        district: editData.district ?? "",
        child_welfare_committee_name:
          editData.child_welfare_committee_name ?? "",
        child_welfare_committee_number:
          editData.child_welfare_committee_number ?? "",
        cncp_child_enroll_number: editData.cncp_child_enroll_number ?? "",
        cncp_child_aadhaar_number: editData.cncp_child_aadhaar_number ?? "",
        dob: editData.dob ? editData.dob : null,
      };

      const response = await authFetch(`${CWC_API_URL}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(response);

      if (!response.ok) {
        // Surface real backend error (DRF field errors or message)
        const msg =
          data.message ||
          (data.detail && JSON.stringify(data.detail)) ||
          (typeof data === "object"
            ? Object.entries(data)
                .map(
                  ([k, v]) =>
                    `${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`
                )
                .join(" | ")
            : "Failed to update") ||
          `Failed to update (HTTP ${response.status})`;
        alert(msg);
        setEditLoading(false);
        return;
      }

      // Success — update local state
      setRegistrations((prev) =>
        prev.map((reg) =>
          reg.id === editData.id ? { ...reg, ...payload } : reg
        )
      );
      handleCloseEditModal();
    } catch (err) {
      alert(err.message || "Network error while updating.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleAddDepartmentClick = (registration) => {
    setDeptFormData({
      form_id: registration.form_id,
      department: "",
    });
    setShowDeptModal(true);
  };

  const handleCloseDeptModal = () => {
    setShowDeptModal(false);
    setDeptFormData({ form_id: "", department: "" });
  };

  const handleDeptChange = (e) => {
    const { name, value } = e.target;
    setDeptFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    if (!deptFormData.department) {
      alert("Please select a department.");
      return;
    }
    setDeptLoading(true);
    try {
      const response = await authFetch(DEPT_ASSIGN_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deptFormData),
      });
      const data = await safeJson(response);
      if (!response.ok) {
        const msg =
          data.message ||
          (data.detail && JSON.stringify(data.detail)) ||
          `Failed to assign department (HTTP ${response.status})`;
        alert(msg);
        setDeptLoading(false);
        return;
      }
      if (data.status) {
        const assigned = data.data && data.data.length > 0 ? data.data[0] : null;
        if (assigned) {
          setAssignedDepartments((prev) => ({
            ...prev,
            [deptFormData.form_id]: assigned,
          }));
        } else {
          fetchAssignedDepartments(registrations);
        }
        handleCloseDeptModal();
      } else {
        alert(data.message || "Failed to assign department");
      }
    } catch (err) {
      alert(err.message || "Network error while assigning department.");
    } finally {
      setDeptLoading(false);
    }
  };

  const getMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `https://mahadevaaya.com/srcproject/srcproject_backend${path}`;
  };

  const renderFileLink = (url, label) => {
    const mediaUrl = getMediaUrl(url);
    if (!mediaUrl) {
      return (
        <span className="cwc-doc-missing">
          <FaFilePdf className="me-1 text-muted" /> Not provided
        </span>
      );
    }
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(mediaUrl);
    if (isImage) {
      return (
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cwc-doc-link cwc-image-link"
        >
          <img src={mediaUrl} alt={label} className="cwc-doc-thumb" />
          <span className="cwc-doc-text">{label}</span>
        </a>
      );
    }
    return (
      <a
        href={mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="cwc-doc-link"
      >
        <FaFilePdf className="me-1" />
        {label}
      </a>
    );
  };

  const totalRegistrations = registrations.length;

  return (
    <div className="dashboard-container">
      <CWCLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <CWCtopNav toggleSidebar={toggleSidebar} />

        <Container fluid className="dashboard-box mt-3">
          <div className="cwc-page-header">
            <div className="cwc-page-header-content">
              <h1 className="cwc-page-title">CNCP Child Registrations</h1>
              <p className="cwc-page-subtitle">
                Manage and review child welfare committee registration records
              </p>
            </div>
          </div>

          <Row className="cwc-stats-row g-3 mb-4">
            <Col md={12}>
              <Card className="cwc-stat-card cwc-stat-total">
                <Card.Body>
                  <div className="cwc-stat-icon">
                    <FaClipboardList />
                  </div>
                  <div className="cwc-stat-info">
                    <span className="cwc-stat-value">
                      {totalRegistrations}
                    </span>
                    <span className="cwc-stat-label">Total Registrations</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="cwc-table-card">
            <Card.Header as="h5" className="cwc-card-header">
              Registration Records
            </Card.Header>
            <Card.Body>
              {loading && (
                <div className="cwc-loading-state">
                  <Spinner animation="border" variant="primary" />
                  <p className="cwc-loading-text">Loading Registrations...</p>
                </div>
              )}
              {error && (
                <Alert variant="danger" className="cwc-alert">
                  {error}
                </Alert>
              )}
              {!loading && !error && (
                <div className="cwc-table-wrapper">
                  <Table
                    striped
                    bordered
                    hover
                    responsive
                    className="cwc-registration-table"
                  >
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Form ID</th>
                        <th>Enrollment No.</th>
                        <th>CWC Name</th>
                        <th>District</th>
                        <th>Department</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.length > 0 ? (
                        registrations.map((reg, index) => {
                          const assignedDept =
                            assignedDepartments[reg.form_id];
                          const isDeptAssigned = !!assignedDept;
                          return (
                            <tr key={reg.id} className="cwc-table-row">
                              <td className="cwc-table-index">{index + 1}</td>
                              <td className="cwc-table-form-id">
                                {reg.form_id}
                              </td>
                              <td className="cwc-table-enroll">
                                {reg.cncp_child_enroll_number}
                              </td>
                              <td className="cwc-table-cwc">
                                {reg.child_welfare_committee_name}
                              </td>
                              <td className="cwc-table-district">
                                {reg.district}
                              </td>
                              <td>
                                {isDeptAssigned ? (
                                  <Badge bg="success">
                                    <FaBuilding className="me-1" />
                                    {assignedDept.department}
                                  </Badge>
                                ) : (
                                  <Badge bg="secondary">Not assigned</Badge>
                                )}
                              </td>
                              <td>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleViewClick(reg)}
                                  className="cwc-action-btn"
                                >
                                  <FaEye className="me-1" /> View
                                </Button>
                                <Button
                                  variant="outline-warning"
                                  size="sm"
                                  onClick={() => handleEditClick(reg)}
                                  className="cwc-action-btn ms-1"
                                  disabled={isDeptAssigned}
                                  title={
                                    isDeptAssigned
                                      ? "Editing disabled - department already assigned"
                                      : "Edit registration"
                                  }
                                >
                                  {isDeptAssigned ? (
                                    <>
                                      <FaLock className="me-1" /> Edit
                                    </>
                                  ) : (
                                    "Edit"
                                  )}
                                </Button>
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleAddDepartmentClick(reg)}
                                  className="cwc-action-btn ms-1"
                                  disabled={isDeptAssigned}
                                  title={
                                    isDeptAssigned
                                      ? "Department already assigned"
                                      : "Add department to this child"
                                  }
                                >
                                  <FaPlus className="me-1" /> Add Dept
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="cwc-empty-state">
                            <FaClipboardList className="cwc-empty-icon" />
                            <p className="mb-0">No registrations found.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* View Modal */}
          {selectedRegistration && (
            <Modal
              show={showModal}
              onHide={handleCloseModal}
              size="lg"
              centered
              className="cwc-registration-modal"
            >
              <Modal.Header closeButton className="cwc-modal-header">
                <Modal.Title as="h5">
                  <FaClipboardList className="me-2" />
                  Registration Details - {selectedRegistration.form_id}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="cwc-modal-body">
                <Row className="mb-4">
                  <Col md={6}>
                    <Card className="cwc-detail-card">
                      <Card.Body>
                        <h6 className="cwc-detail-section-title">
                          Applicant Information
                        </h6>
                        <div className="cwc-detail-item">
                          <span className="cwc-detail-label">State:</span>
                          <span className="cwc-detail-value">
                            {selectedRegistration.state}
                          </span>
                        </div>
                        <div className="cwc-detail-item">
                          <span className="cwc-detail-label">District:</span>
                          <span className="cwc-detail-value">
                            {selectedRegistration.district}
                          </span>
                        </div>
                        <div className="cwc-detail-item">
                          <span className="cwc-detail-label">CWC Name:</span>
                          <span className="cwc-detail-value">
                            {
                              selectedRegistration.child_welfare_committee_name
                            }
                          </span>
                        </div>
                        <div className="cwc-detail-item">
                          <span className="cwc-detail-label">CWC Number:</span>
                          <span className="cwc-detail-value">
                            {
                              selectedRegistration.child_welfare_committee_number
                            }
                          </span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="cwc-detail-card">
                      <Card.Body>
                        <h6 className="cwc-detail-section-title">
                          Child Information
                        </h6>
                        <div className="cwc-detail-item">
                          <span className="cwc-detail-label">
                            Enrollment No.:
                          </span>
                          <span className="cwc-detail-value">
                            {selectedRegistration.cncp_child_enroll_number}
                          </span>
                        </div>
                        <div className="cwc-detail-item">
                          <span className="cwc-detail-label">Aadhaar No.:</span>
                          <span className="cwc-detail-value">
                            {selectedRegistration.cncp_child_aadhaar_number}
                          </span>
                        </div>
                        <div className="cwc-detail-item">
                          <span className="cwc-detail-label">
                            Registered On:
                          </span>
                          <span className="cwc-detail-value">
                            {new Date(
                              selectedRegistration.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
                <hr className="cwc-modal-divider" />
                <h5 className="cwc-doc-section-title">
                  <FaFilePdf className="me-2" />
                  Uploaded Documents
                </h5>
                <div className="cwc-docs-grid">
                  {[
                    { label: "Child Details", field: "cncp_child_details" },
                    {
                      label: "Home Verification",
                      field: "home_verification",
                    },
                    { label: "SIR", field: "sir" },
                    {
                      label: "Rehabilitation Plan",
                      field: "rehabilitation_plan",
                    },
                    {
                      label: "Order Sent to Department",
                      field: "order_sent_to_department",
                    },
                    {
                      label: "Follow-up on Direction",
                      field: "follow_up_on_direction",
                    },
                  ].map((doc) => (
                    <div className="cwc-doc-col" key={doc.field}>
                      <Card className="cwc-doc-card">
                        <Card.Body>
                          <div className="cwc-doc-icon">
                            <FaFilePdf />
                          </div>
                          <span className="cwc-doc-label">{doc.label}</span>
                          <div className="cwc-doc-action">
                            {renderFileLink(
                              selectedRegistration[doc.field],
                              "View Document"
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              </Modal.Body>
              <Modal.Footer className="cwc-modal-footer">
                <Button
                  variant="secondary"
                  onClick={handleCloseModal}
                  className="cwc-modal-close-btn"
                >
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          )}

          {/* Edit Modal */}
          <Modal
            show={showEditModal}
            onHide={handleCloseEditModal}
            size="lg"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Edit Registration</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleEditSubmit}>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>State</Form.Label>
                      <Form.Control
                        name="state"
                        value={editData.state || ""}
                        onChange={handleEditChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>District</Form.Label>
                      <Form.Control
                        name="district"
                        value={editData.district || ""}
                        onChange={handleEditChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>CWC Name</Form.Label>
                      <Form.Control
                        name="child_welfare_committee_name"
                        value={editData.child_welfare_committee_name || ""}
                        onChange={handleEditChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>CWC Number</Form.Label>
                      <Form.Control
                        name="child_welfare_committee_number"
                        value={editData.child_welfare_committee_number || ""}
                        onChange={handleEditChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Enrollment No.</Form.Label>
                      <Form.Control
                        name="cncp_child_enroll_number"
                        value={editData.cncp_child_enroll_number || ""}
                        onChange={handleEditChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Aadhaar No.</Form.Label>
                      <Form.Control
                        name="cncp_child_aadhaar_number"
                        value={editData.cncp_child_aadhaar_number || ""}
                        onChange={handleEditChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>DOB</Form.Label>
                      <Form.Control
                        type="date"
                        name="dob"
                        value={editData.dob || ""}
                        onChange={handleEditChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="mt-3 text-end">
                  <Button
                    variant="secondary"
                    onClick={handleCloseEditModal}
                    className="me-2"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={editLoading}>
                    {editLoading ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      <>
                        <FaSave className="me-1" /> Save
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          {/* Add Department Modal */}
          <Modal
            show={showDeptModal}
            onHide={handleCloseDeptModal}
            size="md"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>
                <FaBuilding className="me-2" />
                Add Department
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleDeptSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Form ID</Form.Label>
                  <Form.Control
                    value={deptFormData.form_id}
                    readOnly
                    plaintext
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Select Department <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select
                    name="department"
                    value={deptFormData.department}
                    onChange={handleDeptChange}
                    required
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.department} value={d.department}>
                        {d.department} ({d.department_hindi})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <div className="text-end">
                  <Button
                    variant="secondary"
                    onClick={handleCloseDeptModal}
                    className="me-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="success"
                    disabled={deptLoading}
                  >
                    {deptLoading ? (
                      <Spinner size="sm" animation="border" />
                    ) : (
                      <>
                        <FaSave className="me-1" /> Assign
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </Container>
      </div>
    </div>
  );
};

export default CWCRegiDetails;