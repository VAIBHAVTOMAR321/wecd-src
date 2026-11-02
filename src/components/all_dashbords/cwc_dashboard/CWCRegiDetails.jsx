import React, { useState, useEffect, useRef } from "react";
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
  FaLayerGroup,
  FaListAlt,
} from "react-icons/fa";
import CWCLeftNav from "./CWCLeftNav";
import CWCtopNav from "./CWCTopNav";
import { useAuth } from "../../login/AuthContext";
import "../../../../src/assets/css/cwcregis.css";
import "./CWCRegiDetails.css";

const CWC_API_URL =
  "https://mahadevaaya.com/srcproject/srcproject_backend/api/cncp-child-welfare-committee/";
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
  const [activeDocument, setActiveDocument] = useState(null);
  const documentPreviewRef = useRef(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryType, setSummaryType] = useState("departments");

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
    const fetchDepartments = async () => {
      try {
        const response = await authFetch(DEPARTMENTS_LIST_API_URL);
        if (response.ok) {
          const data = await safeJson(response);
          if (response.ok && data.status && Array.isArray(data.data)) {
            setDepartments(data.data);
          } else {
            console.error("Department API response:", data);
            setDepartments([]);
          }
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
          const response = await authFetch(
            `${DEPT_ASSIGN_API_URL}?form_id=${encodeURIComponent(reg.form_id)}`
          );
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

  const openSummaryModal = (type) => {
    setSummaryType(type);
    setShowSummaryModal(true);
  };

  const closeSummaryModal = () => setShowSummaryModal(false);

  const handleViewClick = (registration) => {
    if (!registration) return;
    setActiveDocument(null);
    setSelectedRegistration(registration);
    setShowModal(true);
  };

  // When a document is selected, automatically scroll the modal to its preview.
  useEffect(() => {
    if (!activeDocument || !documentPreviewRef.current) return;

    documentPreviewRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [activeDocument]);

  // Close the registration details modal and clear the selected record.
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRegistration(null);
    setActiveDocument(null);
  };

  const handleAddDepartmentClick = (registration) => {
    const existingAssignment = assignedDepartments[registration.form_id];
    setDeptFormData({
      form_id: registration.form_id,
      department: existingAssignment?.department || "",
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
      const existingAssignment = assignedDepartments[deptFormData.form_id];
      const response = await authFetch(DEPT_ASSIGN_API_URL, {
        method: existingAssignment ? "PUT" : "POST",
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
        const assigned = Array.isArray(data.data)
          ? data.data[0]
          : data.data;
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

  // Load only the document explicitly selected by the user. This prevents
  // multiple PDF viewers from downloading/rendering when the modal opens.
  const renderDocumentPreview = (document) => {
    if (!document) return null;

    const mediaUrl = getMediaUrl(document.url);
    if (!mediaUrl) return null;

    const cleanUrl = mediaUrl.split("?")[0].split("#")[0];
    const extension = cleanUrl.split(".").pop().toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension);
    const isPdf = extension === "pdf";

    return (
      <section
        ref={documentPreviewRef}
        className="cwc-active-document-preview"
        aria-label={`${document.label} preview`}
      >
        <div className="cwc-active-document-toolbar">
          <strong>{document.label}</strong>
          <div className="cwc-active-document-actions">
            <a
              href={mediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-outline-primary"
            >
              <FaEye className="me-1" /> Open in new window
            </a>
            <Button size="sm" variant="outline-secondary" onClick={() => setActiveDocument(null)}>
              Close preview
            </Button>
          </div>
        </div>

        {isPdf ? (
          <iframe
            key={mediaUrl}
            title={document.label}
            src={`${mediaUrl}#toolbar=1&navpanes=0&view=FitH`}
            loading="lazy"
            className="cwc-document-pdf-preview"
          />
        ) : isImage ? (
          <div className="cwc-document-image-preview">
            <img src={mediaUrl} alt={document.label} loading="lazy" />
          </div>
        ) : (
          <div className="cwc-doc-preview-empty">
            <FaFilePdf className="text-muted mb-2" size={28} />
            <div className="fw-semibold">Preview is not available for this file type.</div>
            <div className="text-muted small">Use “Open in new window” to view or download this document.</div>
          </div>
        )}
      </section>
    );
  };

  const totalRegistrations = registrations.length;
  const totalCategories = departments.reduce(
    (total, department) =>
      total + (Array.isArray(department.categories) ? department.categories.length : 0),
    0
  );
  const totalSchemes = departments.reduce(
    (total, department) =>
      total +
      (Array.isArray(department.categories)
        ? department.categories.reduce(
            (categoryTotal, category) =>
              categoryTotal + (Array.isArray(category.schemes) ? category.schemes.length : 0),
            0
          )
        : 0),
    0
  );

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
            <Col xl={3} md={6} sm={6}>
              <Card
                className="cwc-stat-card cwc-stat-total h-100"
                role="button"
                tabIndex={0}
                onClick={() => openSummaryModal("registrations")}
                onKeyDown={(e) => e.key === "Enter" && openSummaryModal("registrations")}
                title="View registration details"
              >
                <Card.Body>
                  <div className="cwc-stat-icon"><FaClipboardList /></div>
                  <div className="cwc-stat-info">
                    <span className="cwc-stat-value">{totalRegistrations}</span>
                    <span className="cwc-stat-label">Total Registrations</span>
                    <small className="text-muted">Click to view details</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} md={6} sm={6}>
              <Card
                className="cwc-stat-card cwc-stat-total h-100"
                role="button"
                tabIndex={0}
                onClick={() => openSummaryModal("departments")}
                onKeyDown={(e) => e.key === "Enter" && openSummaryModal("departments")}
                title="View departments, categories and schemes"
              >
                <Card.Body>
                  <div className="cwc-stat-icon"><FaBuilding /></div>
                  <div className="cwc-stat-info">
                    <span className="cwc-stat-value">{departments.length}</span>
                    <span className="cwc-stat-label">Total Departments</span>
                    <small className="text-muted">Click to explore departments</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} md={6} sm={6}>
              <Card
                className="cwc-stat-card cwc-stat-total h-100"
                role="button"
                tabIndex={0}
                onClick={() => openSummaryModal("categories")}
                onKeyDown={(e) => e.key === "Enter" && openSummaryModal("categories")}
                title="View all categories"
              >
                <Card.Body>
                  <div className="cwc-stat-icon"><FaLayerGroup /></div>
                  <div className="cwc-stat-info">
                    <span className="cwc-stat-value">{totalCategories}</span>
                    <span className="cwc-stat-label">Total Categories</span>
                    <small className="text-muted">Click to view details</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xl={3} md={6} sm={6}>
              <Card
                className="cwc-stat-card cwc-stat-total h-100"
                role="button"
                tabIndex={0}
                onClick={() => openSummaryModal("schemes")}
                onKeyDown={(e) => e.key === "Enter" && openSummaryModal("schemes")}
                title="View all schemes"
              >
                <Card.Body>
                  <div className="cwc-stat-icon"><FaListAlt /></div>
                  <div className="cwc-stat-info">
                    <span className="cwc-stat-value">{totalSchemes}</span>
                    <span className="cwc-stat-label">Total Schemes</span>
                    <small className="text-muted">Click to view details</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Summary details modal: registrations, departments, categories and schemes */}
          <Modal show={showSummaryModal} onHide={closeSummaryModal} size="xl" centered scrollable>
            <Modal.Header closeButton>
              <Modal.Title>
                {summaryType === "registrations" && "Registration Details"}
                {summaryType === "departments" && "Departments, Categories & Schemes"}
                {summaryType === "categories" && "All Categories"}
                {summaryType === "schemes" && "All Schemes"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {summaryType === "registrations" && (
                registrations.length ? (
                  <Table striped bordered hover responsive>
                    <thead><tr><th>#</th><th>Form ID</th><th>Enrollment No.</th><th>CWC Name</th><th>District</th></tr></thead>
                    <tbody>
                      {registrations.map((reg, index) => (
                        <tr key={reg.id || reg.form_id}>
                          <td>{index + 1}</td><td>{reg.form_id}</td>
                          <td>{reg.cncp_child_enroll_number || "—"}</td>
                          <td>{reg.child_welfare_committee_name || "—"}</td>
                          <td>{reg.district || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : <Alert variant="info" className="mb-0">No registrations found.</Alert>
              )}

              {summaryType === "departments" && (
                departments.length ? departments.map((department) => (
                  <Card className="mb-3" key={department.id || department.department}>
                    <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                      <strong><FaBuilding className="me-2" />{department.department}</strong>
                      <Badge bg="secondary">{(department.categories || []).length} Categories</Badge>
                    </Card.Header>
                    <Card.Body>
                      {department.department_hindi && <div className="text-muted mb-2">{department.department_hindi}</div>}
                      {(department.categories || []).length ? department.categories.map((category) => (
                        <div className="border rounded p-3 mb-3" key={category.id || category.category}>
                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <strong><FaLayerGroup className="me-2" />{category.category}</strong>
                            <Badge bg="info">{(category.schemes || []).length} Schemes</Badge>
                          </div>
                          {category.category_hindi && <div className="text-muted small mt-1">{category.category_hindi}</div>}
                          {(category.schemes || []).length ? (
                            <ul className="mt-2 mb-0">
                              {category.schemes.map((scheme) => (
                                <li key={scheme.id || scheme.scheme}>
                                  {scheme.scheme}{scheme.scheme_hindi ? ` (${scheme.scheme_hindi})` : ""}
                                </li>
                              ))}
                            </ul>
                          ) : <div className="text-muted small mt-2">No schemes added under this category.</div>}
                        </div>
                      )) : <div className="text-muted">No categories added under this department.</div>}
                    </Card.Body>
                  </Card>
                )) : <Alert variant="info" className="mb-0">No departments found.</Alert>
              )}

              {summaryType === "categories" && (
                totalCategories ? departments.flatMap((department) =>
                  (department.categories || []).map((category) => ({ department, category }))
                ).map(({ department, category }) => (
                  <Card className="mb-2" key={`${department.id || department.department}-${category.id || category.category}`}>
                    <Card.Body>
                      <div className="fw-semibold"><FaLayerGroup className="me-2" />{category.category}</div>
                      {category.category_hindi && <div className="text-muted small">{category.category_hindi}</div>}
                      <div className="small mt-2"><strong>Department:</strong> {department.department}</div>
                      <div className="small"><strong>Schemes:</strong> {(category.schemes || []).length}</div>
                      {(category.schemes || []).length > 0 && <ul className="small mt-1 mb-0">{category.schemes.map((scheme) => <li key={scheme.id || scheme.scheme}>{scheme.scheme}{scheme.scheme_hindi ? ` (${scheme.scheme_hindi})` : ""}</li>)}</ul>}
                    </Card.Body>
                  </Card>
                )) : <Alert variant="info" className="mb-0">No categories found.</Alert>
              )}

              {summaryType === "schemes" && (
                totalSchemes ? departments.flatMap((department) =>
                  (department.categories || []).flatMap((category) =>
                    (category.schemes || []).map((scheme) => ({ department, category, scheme }))
                  )
                ).map(({ department, category, scheme }) => (
                  <div className="border rounded p-3 mb-2" key={scheme.id || `${department.department}-${category.category}-${scheme.scheme}`}>
                    <div className="fw-semibold"><FaListAlt className="me-2" />{scheme.scheme}</div>
                    {scheme.scheme_hindi && <div className="text-muted small">{scheme.scheme_hindi}</div>}
                    <div className="small mt-2"><strong>Category:</strong> {category.category}</div>
                    <div className="small"><strong>Department:</strong> {department.department}</div>
                  </div>
                )) : <Alert variant="info" className="mb-0">No schemes found.</Alert>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={closeSummaryModal}>Close</Button>
            </Modal.Footer>
          </Modal>

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
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleAddDepartmentClick(reg)}
                                  className="cwc-action-btn ms-1"
                                  title={
                                    isDeptAssigned
                                      ? "Change assigned department"
                                      : "Assign department to this child"
                                  }
                                >
                                  <FaPlus className="me-1" /> {isDeptAssigned ? "Change Dept" : "Add Dept"}
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
              fullscreen={true}
              className="cwc-registration-modal cwc-registration-modal-fullscreen"
            >
              <Modal.Header closeButton className="cwc-modal-header">
                <Modal.Title as="h5">
                  <FaClipboardList className="me-2" />
                  Registration Details - {selectedRegistration.form_id}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body
                className="cwc-modal-body cwc-modal-body-fullscreen"
              >
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
                <div className="cwc-docs-grid cwc-docs-preview-grid">
                  {[
                    { label: "Child Details", field: "cncp_child_details" },
                    { label: "Home Verification", field: "home_verification" },
                    { label: "SIR", field: "sir" },
                    { label: "Rehabilitation Plan", field: "rehabilitation_plan" },
                    { label: "Order Sent to Department", field: "order_sent_to_department" },
                    { label: "Follow-up on Direction", field: "follow_up_on_direction" },
                  ].map((doc) => {
                    const documentUrl = selectedRegistration[doc.field];
                    const isActive = activeDocument?.field === doc.field;
                    return (
                      <div className="cwc-doc-col" key={doc.field}>
                        <Card className="cwc-doc-card h-100">
                          <Card.Body className="cwc-doc-card-body">
                            <div className="cwc-doc-icon"><FaFilePdf /></div>
                            <span className="cwc-doc-label">{doc.label}</span>
                            {documentUrl ? (
                              <div className="cwc-doc-action cwc-doc-lazy-actions">
                                <Button
                                  size="sm"
                                  variant={isActive ? "primary" : "outline-primary"}
                                  onClick={() => setActiveDocument({
                                    field: doc.field,
                                    label: doc.label,
                                    url: documentUrl,
                                  })}
                                >
                                  <FaEye className="me-1" /> {isActive ? "Currently previewing" : "View in modal"}
                                </Button>
                                <a
                                  href={getMediaUrl(documentUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-secondary"
                                >
                                  Open separately
                                </a>
                              </div>
                            ) : (
                              <span className="text-muted small">Not provided</span>
                            )}
                          </Card.Body>
                        </Card>
                      </div>
                    );
                  })}
                </div>
                {activeDocument && renderDocumentPreview(activeDocument)}
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