import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Badge, Button, Card, Col, Container, Form, Modal, Row,
  Spinner, Table,
} from "react-bootstrap";
import {
  FaUsers, FaLayerGroup, FaListAlt, FaSyncAlt, FaSlidersH, FaEye, FaFilePdf,
} from "react-icons/fa";
import DepartLeftNav from "./DepartLeftNav";
import DepartTopNav from "./DepartTopNav";
import { useAuth } from "../../login/AuthContext";
import "./AssignedStudents.css";

const API_BASE_URL = "https://mahadevaaya.com/srcproject/srcproject_backend/api";
const ASSIGNED_STUDENTS_API = `${API_BASE_URL}/cncp-department-records/`;
const DEPARTMENTS_API = `${API_BASE_URL}/departments/`;
const CATEGORY_SCHEME_API = `${API_BASE_URL}/cncp-student-category-schemes/`;

const safeJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 300) };
  }
};

const getAssignedStudent = (assignment) =>
  assignment?.form_details || assignment?.form || assignment?.student_details || {};

const AssignedStudents = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentSelections, setStudentSelections] = useState({});
  const [departmentData, setDepartmentData] = useState([]);
  const [departmentName, setDepartmentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [detailsType, setDetailsType] = useState("");

  const [selectionModalOpen, setSelectionModalOpen] = useState(false);
  const [viewAssignment, setViewAssignment] = useState(null);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedSchemes, setSelectedSchemes] = useState({});
  const [selectionLoading, setSelectionLoading] = useState(false);
  const [savingSelections, setSavingSelections] = useState(false);
  const [selectionError, setSelectionError] = useState("");
  const [selectionMessage, setSelectionMessage] = useState("");

  const { authFetch } = useAuth();

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

  const fetchPageData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [assignedResponse, departmentsResponse] = await Promise.all([
        authFetch(ASSIGNED_STUDENTS_API),
        fetch(DEPARTMENTS_API),
      ]);
      const assignedPayload = await safeJson(assignedResponse);
      const departmentsPayload = await safeJson(departmentsResponse);

      if (!assignedResponse.ok) {
        throw new Error(
          assignedPayload.message || assignedPayload.detail ||
          `Unable to fetch assigned students (${assignedResponse.status}).`
        );
      }

      const assignedRows = Array.isArray(assignedPayload)
        ? assignedPayload
        : Array.isArray(assignedPayload.data) ? assignedPayload.data : [];
      setStudents(assignedRows);

      // Load each student's saved category/scheme selections for the table.
      const selectionEntries = await Promise.all(
        assignedRows.filter((row) => row.id).map(async (row) => {
          try {
            const selectionResponse = await authFetch(
              `${CATEGORY_SCHEME_API}?assignment_id=${encodeURIComponent(row.id)}`
            );
            const selectionPayload = await safeJson(selectionResponse);
            return [
              String(row.id),
              selectionResponse.ok && selectionPayload.status !== false
                ? (selectionPayload.selected_selections || [])
                : [],
            ];
          } catch {
            return [String(row.id), []];
          }
        })
      );
      setStudentSelections(Object.fromEntries(selectionEntries));

      const allDepartments = Array.isArray(departmentsPayload)
        ? departmentsPayload
        : Array.isArray(departmentsPayload.data) ? departmentsPayload.data : [];
      const assignedDepartment = assignedRows[0]?.department || "";
      setDepartmentName(assignedDepartment);

      const ownDepartment = allDepartments.find(
        (item) => String(item.department || "").trim().toLowerCase() ===
          String(assignedDepartment).trim().toLowerCase()
      );
      setDepartmentData(ownDepartment ? [ownDepartment] : []);
    } catch (err) {
      setError(err.message || "Something went wrong while loading assigned students.");
      setStudents([]);
      setStudentSelections({});
      setDepartmentData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const categories = useMemo(
    () => departmentData.flatMap((department) => department.categories || []),
    [departmentData]
  );

  const schemes = useMemo(
    () => categories.flatMap((category) =>
      (category.schemes || []).map((scheme) => ({
        ...scheme,
        category: category.category,
        category_hindi: category.category_hindi,
      }))
    ),
    [categories]
  );

  const totalAssigned = students.length;
  const closeDetails = () => setDetailsType("");
  const toggleSidebar = () => setSidebarOpen((previous) => !previous);

  const openSelectionModal = async (assignment) => {
    setActiveAssignment(assignment);
    setSelectionModalOpen(true);
    setSelectionLoading(true);
    setSelectionError("");
    setSelectionMessage("");
    setAvailableCategories([]);
    setSelectedSchemes({});

    try {
      const response = await authFetch(
        `${CATEGORY_SCHEME_API}?assignment_id=${encodeURIComponent(assignment.id)}`
      );
      const payload = await safeJson(response);
      if (!response.ok || payload.status === false) {
        throw new Error(payload.message || payload.detail || "Unable to load categories and saved selections.");
      }

      const categoryRows = Array.isArray(payload.categories) ? payload.categories : [];
      const savedRows = Array.isArray(payload.selected_selections) ? payload.selected_selections : [];
      const initial = {};

      savedRows.forEach((item) => {
        initial[item.category_id] = (item.schemes || []).map((scheme) => String(scheme.id));
      });

      setAvailableCategories(categoryRows);
      setSelectedSchemes(initial);
    } catch (err) {
      setSelectionError(err.message || "Unable to load this student's selections.");
    } finally {
      setSelectionLoading(false);
    }
  };

  const closeSelectionModal = () => {
    if (savingSelections) return;
    setSelectionModalOpen(false);
    setActiveAssignment(null);
    setAvailableCategories([]);
    setSelectedSchemes({});
    setSelectionError("");
    setSelectionMessage("");
  };

  const toggleCategory = (categoryId, checked) => {
    setSelectedSchemes((previous) => {
      const next = { ...previous };
      if (checked) next[categoryId] = next[categoryId] || [];
      else delete next[categoryId];
      return next;
    });
  };

  const toggleScheme = (categoryId, schemeId, checked) => {
    setSelectedSchemes((previous) => {
      const current = previous[categoryId] || [];
      const nextValues = checked
        ? [...new Set([...current, String(schemeId)])]
        : current.filter((id) => id !== String(schemeId));
      return { ...previous, [categoryId]: nextValues };
    });
  };

  const saveSelections = async () => {
    if (!activeAssignment) return;

    const selections = Object.entries(selectedSchemes)
      .filter(([, schemeIds]) => schemeIds.length > 0)
      .map(([categoryId, schemeIds]) => ({
        category_id: Number(categoryId),
        scheme_ids: schemeIds.map(Number),
      }));

    const selectedCategoryWithoutScheme = Object.entries(selectedSchemes)
      .find(([, schemeIds]) => schemeIds.length === 0);

    if (selectedCategoryWithoutScheme) {
      setSelectionError("Please select at least one scheme for every selected category.");
      return;
    }

    setSavingSelections(true);
    setSelectionError("");
    setSelectionMessage("");

    try {
      const response = await authFetch(CATEGORY_SCHEME_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignment_id: activeAssignment.id,
          selections,
        }),
      });
      const payload = await safeJson(response);

      if (!response.ok || payload.status === false) {
        throw new Error(payload.message || payload.detail || "Unable to save selections.");
      }

      const updatedRows = Object.entries(selectedSchemes)
        .filter(([, schemeIds]) => schemeIds.length > 0)
        .map(([categoryId, schemeIds]) => {
          const category = availableCategories.find(
            (item) => String(item.id) === String(categoryId)
          );
          return {
            category_id: Number(categoryId),
            category: category?.category || "Category",
            schemes: (category?.schemes || [])
              .filter((scheme) => schemeIds.includes(String(scheme.id)))
              .map((scheme) => ({
                id: scheme.id,
                scheme: scheme.scheme,
                scheme_hindi: scheme.scheme_hindi,
              })),
          };
        });

      setStudentSelections((previous) => ({
        ...previous,
        [String(activeAssignment.id)]: updatedRows,
      }));
      setSelectionMessage(payload.message || "Selections saved successfully.");
    } catch (err) {
      setSelectionError(err.message || "Unable to save selections.");
    } finally {
      setSavingSelections(false);
    }
  };

  const openStudentView = (assignment) => setViewAssignment(assignment);
  const closeStudentView = () => setViewAssignment(null);

  const getDocumentUrl = (filePath) => {
    if (!filePath) return "";
    if (/^https?:\/\//i.test(filePath)) return filePath;
    const normalizedPath = String(filePath).startsWith("/")
      ? filePath
      : `/${filePath}`;
    return `https://mahadevaaya.com/srcproject/srcproject_backend${normalizedPath}`;
  };

  const renderStudentDocument = (filePath, label) => {
    const url = getDocumentUrl(filePath);
    if (!url) {
      return (
        <div className="assigned-view-document-empty">
          <FaFilePdf />
          <span>Document not provided</span>
        </div>
      );
    }

    const cleanUrl = url.split("?")[0].split("#")[0];
    const extension = cleanUrl.split(".").pop().toLowerCase();
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension);
    const isPdf = extension === "pdf";

    return (
      <div className="assigned-view-document-preview">
        <div className="assigned-view-document-toolbar">
          <strong>{label}</strong>
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
            Open in new window
          </a>
        </div>
        {isImage ? (
          <div className="assigned-view-image-frame">
            <img src={url} alt={label} />
          </div>
        ) : isPdf ? (
          <iframe
            title={label}
            src={`${url}#toolbar=1&navpanes=0&view=FitH`}
            className="assigned-view-pdf-frame"
          />
        ) : (
          <div className="assigned-view-document-empty">
            <FaFilePdf />
            <span>Preview is not available for this file type.</span>
            <a href={url} target="_blank" rel="noopener noreferrer">Open or download document</a>
          </div>
        )}
      </div>
    );
  };

  const renderDetailValue = (value) => {
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  };

  const renderAssignedCategorySchemeCells = (assignment) => {
    const rows = studentSelections[String(assignment.id)] || [];

    if (!rows.length) {
      return (
        <>
          <td><span className="assigned-unselected">Not assigned yet</span></td>
          <td><span className="assigned-unselected">—</span></td>
        </>
      );
    }

    return (
      <>
        <td>
          <div className="assigned-table-category-list">
            {rows.map((item) => (
              <div className="assigned-table-category-item" key={item.category_id}>
                <strong>{item.category}</strong>
              </div>
            ))}
          </div>
        </td>
        <td>
          <div className="assigned-table-scheme-list">
            {rows.map((item) => (
              <div className="assigned-table-scheme-group" key={item.category_id}>
                {(item.schemes || []).length ? (
                  <div className="assigned-scheme-chips">
                    {item.schemes.map((scheme) => (
                      <span className="assigned-scheme-chip" key={scheme.id}>
                        {scheme.scheme}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="assigned-unselected">No schemes selected</span>
                )}
              </div>
            ))}
          </div>
        </td>
      </>
    );
  };

  const renderStudentsTable = () => {
    if (loading) {
      return <div className="assigned-state"><Spinner animation="border" /><span>Loading assigned students...</span></div>;
    }
    if (error) return <Alert variant="danger" className="mb-0">{error}</Alert>;
    if (!students.length) return <div className="assigned-empty">No students have been assigned to your department yet.</div>;

    return (
      <div className="assigned-table-wrap">
        <Table responsive hover className="assigned-table mb-0">
          <thead>
            <tr>
              <th className="assigned-col-number">#</th>
              <th>Form ID</th>
              <th>Enrollment No.</th>
              <th>CWC Name</th>
              <th>District</th>
              <th>Department</th>
              <th className="assigned-col-category">Category</th>
              <th className="assigned-col-scheme">Related Schemes</th>
              <th className="assigned-col-action">Manage</th>
            </tr>
          </thead>
          <tbody>
            {students.map((assignment, index) => {
              const student = getAssignedStudent(assignment);
              return (
                <tr key={assignment.id || student.form_id || index}>
                  <td>{index + 1}</td>
                  <td>{student.form_id || assignment.form_id || "—"}</td>
                  <td>{student.cncp_child_enroll_number || "—"}</td>
                  <td>{student.child_welfare_committee_name || "—"}</td>
                  <td>{student.district || "—"}</td>
                  <td>
                    <Badge bg="success">
                      {assignment.department || departmentName || "Assigned"}
                    </Badge>
                  </td>
                  {renderAssignedCategorySchemeCells(assignment)}
                  <td>
                    <div className="assigned-row-actions">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="assigned-action-btn"
                        onClick={() => openStudentView(assignment)}
                      >
                        <FaEye className="me-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="assigned-action-btn"
                        onClick={() => openSelectionModal(assignment)}
                        disabled={!assignment.id}
                      >
                        <FaSlidersH className="me-1" />
                        Manage
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <div className="dashboard-container assigned-students-page">
      <DepartLeftNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} isTablet={isTablet} />
      <div className="main-content-dash">
        <DepartTopNav toggleSidebar={toggleSidebar} />
        <Container fluid className="dashboard-box mt-3 assigned-students-content">
          <div className="assigned-page-heading">
            <div>
              <h1>Assigned Students</h1>
              <p>{departmentName ? `Students assigned to ${departmentName}` : "View students assigned to your department"}</p>
            </div>
            <Button variant="outline-primary" className="assigned-refresh-btn" onClick={() => fetchPageData(true)} disabled={loading || refreshing}>
              {refreshing ? <Spinner size="sm" animation="border" /> : <FaSyncAlt />}
              <span>Refresh</span>
            </Button>
          </div>

          <Row className="g-3 assigned-summary-row">
            <Col xs={12} md={4}>
              <Card className="assigned-summary-card assigned-card-students" role="button" onClick={() => setDetailsType("students")} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && setDetailsType("students")}>
                <Card.Body><div className="assigned-card-icon"><FaUsers /></div><div className="assigned-card-copy">
                  <span className="assigned-card-label">Total Assigned Students</span><strong>{loading ? "—" : totalAssigned}</strong><small>View assigned student records</small>
                </div></Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card className="assigned-summary-card assigned-card-categories" role="button" onClick={() => setDetailsType("categories")} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && setDetailsType("categories")}>
                <Card.Body><div className="assigned-card-icon"><FaLayerGroup /></div><div className="assigned-card-copy">
                  <span className="assigned-card-label">Total Categories</span><strong>{categories.length}</strong><small>Click to view categories</small>
                </div></Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={4}>
              <Card className="assigned-summary-card assigned-card-schemes" role="button" onClick={() => setDetailsType("schemes")} tabIndex={0} onKeyDown={(event) => event.key === "Enter" && setDetailsType("schemes")}>
                <Card.Body><div className="assigned-card-icon"><FaListAlt /></div><div className="assigned-card-copy">
                  <span className="assigned-card-label">Total Schemes</span><strong>{schemes.length}</strong><small>Click to view schemes</small>
                </div></Card.Body>
              </Card>
            </Col>
          </Row>

          <Card className="assigned-list-card">
            <Card.Header>
              <div><h2>Students Assigned to Your Department</h2><span>{departmentName || "Department account"}</span></div>
              <Badge bg="primary">{totalAssigned} Students</Badge>
            </Card.Header>
            <Card.Body>{renderStudentsTable()}</Card.Body>
          </Card>
        </Container>
      </div>

      {/* Existing summary/detail modal */}
      <Modal show={!!detailsType} onHide={closeDetails} size="xl" centered scrollable className="assigned-details-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            {detailsType === "students" && "Assigned Students"}
            {detailsType === "categories" && "Department Categories"}
            {detailsType === "schemes" && "Department Schemes"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailsType === "students" && (
            <div className="assigned-modal-list">
              {students.length ? students.map((assignment, index) => {
                const student = getAssignedStudent(assignment);
                return <div className="assigned-detail-row" key={assignment.id || index}>
                  <div className="assigned-detail-number">{index + 1}</div>
                  <div>
                    <strong>{student.child_welfare_committee_name || student.cncp_child_enroll_number || `Student ${index + 1}`}</strong>
                    <span>Form ID: {student.form_id || assignment.form_id || "—"}</span>
                    <span>Enrollment: {student.cncp_child_enroll_number || "—"}</span>
                  </div>
                </div>;
              }) : <div className="assigned-empty">No assigned students found.</div>}
            </div>
          )}
          {detailsType === "categories" && (
            categories.length ? categories.map((category, index) => (
              <div className="assigned-catalog-item" key={category.id || index}>
                <div className="assigned-catalog-heading">
                  <strong>{category.category}</strong><span>{category.category_hindi || ""}</span>
                  <Badge bg="light" text="dark">{(category.schemes || []).length} Schemes</Badge>
                </div>
                {(category.schemes || []).length > 0 && <ul className="assigned-scheme-list">
                  {category.schemes.map((scheme) => <li key={scheme.id}>{scheme.scheme} {scheme.scheme_hindi ? `(${scheme.scheme_hindi})` : ""}</li>)}
                </ul>}
              </div>
            )) : <div className="assigned-empty">No categories are configured for this department.</div>
          )}
          {detailsType === "schemes" && (
            schemes.length ? schemes.map((scheme, index) => (
              <div className="assigned-scheme-detail" key={scheme.id || index}>
                <div className="assigned-detail-number">{index + 1}</div>
                <div><strong>{scheme.scheme}</strong><span>{scheme.scheme_hindi || ""}</span><small>Category: {scheme.category}</small></div>
              </div>
            )) : <div className="assigned-empty">No schemes are configured for this department.</div>
          )}
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={closeDetails}>Close</Button></Modal.Footer>
      </Modal>

      {/* Full-screen student registration details modal, matching CWCRegiDetails */}
      <Modal
        show={!!viewAssignment}
        onHide={closeStudentView}
        fullscreen
        className="assigned-student-view-modal"
      >
        {viewAssignment && (() => {
          const student = getAssignedStudent(viewAssignment);
          const assignedRows = studentSelections[String(viewAssignment.id)] || [];
          const documents = [
            { label: "Child Details", field: "cncp_child_details" },
            { label: "Home Verification", field: "home_verification" },
            { label: "SIR", field: "sir" },
            { label: "Rehabilitation Plan", field: "rehabilitation_plan" },
            { label: "Order Sent to Department", field: "order_sent_to_department" },
            { label: "Follow-up on Direction", field: "follow_up_on_direction" },
          ];

          return (
            <>
              <Modal.Header closeButton className="assigned-student-view-header">
                <Modal.Title>
                  <FaEye className="me-2" />
                  Student Registration Details - {renderDetailValue(student.form_id || viewAssignment.form_id)}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body className="assigned-student-view-body">
                <div className="assigned-view-section-heading">
                  <h5>Applicant Information</h5>
                </div>
                <Row className="g-3 mb-4">
                  <Col lg={6}>
                    <Card className="assigned-view-detail-card h-100">
                      <Card.Body>
                        <h6>Applicant / CWC Information</h6>
                        {[
                          ["State", student.state],
                          ["District", student.district],
                          ["CWC Name", student.child_welfare_committee_name],
                          ["CWC Number", student.child_welfare_committee_number],
                        ].map(([label, value]) => (
                          <div className="assigned-view-detail-item" key={label}>
                            <span>{label}</span><strong>{renderDetailValue(value)}</strong>
                          </div>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col lg={6}>
                    <Card className="assigned-view-detail-card h-100">
                      <Card.Body>
                        <h6>Child Information</h6>
                        {[
                          ["Form ID", student.form_id || viewAssignment.form_id],
                          ["Enrollment No.", student.cncp_child_enroll_number],
                          ["Date of Birth", formatDate(student.dob)],
                          ["Aadhaar No.", student.cncp_child_aadhaar_number],
                          ["Registered On", formatDate(student.created_at)],
                          ["Registration Status", student.status],
                          ["Department", viewAssignment.department || departmentName],
                          ["Department Assignment Status", viewAssignment.status],
                        ].map(([label, value]) => (
                          <div className="assigned-view-detail-item" key={label}>
                            <span>{label}</span><strong>{renderDetailValue(value)}</strong>
                          </div>
                        ))}
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                <div className="assigned-view-section-heading assigned-view-assignment-heading">
                  <h5>Assigned Categories &amp; Schemes</h5>
                  <Badge bg="primary">{assignedRows.length} Categories</Badge>
                </div>
                {assignedRows.length ? (
                  <div className="assigned-view-assignment-grid">
                    {assignedRows.map((item) => (
                      <Card className="assigned-view-assignment-card" key={item.category_id}>
                        <Card.Body>
                          <div className="assigned-view-category-title">
                            <FaLayerGroup />
                            <strong>{item.category}</strong>
                          </div>
                          {(item.schemes || []).length ? (
                            <div className="assigned-view-scheme-list">
                              {item.schemes.map((scheme) => (
                                <div className="assigned-view-scheme-item" key={scheme.id}>
                                  <FaListAlt />
                                  <span>{scheme.scheme}</span>
                                  {scheme.scheme_hindi && <small>{scheme.scheme_hindi}</small>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="assigned-unselected">No schemes assigned under this category.</div>
                          )}
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Alert variant="info">No categories or schemes have been assigned to this student yet.</Alert>
                )}

                <hr className="my-4" />
                <div className="assigned-view-section-heading">
                  <h5><FaFilePdf className="me-2" />Uploaded Documents</h5>
                </div>
                <Row className="g-3">
                  {documents.map((doc) => (
                    <Col xl={6} key={doc.field}>
                      <Card className="assigned-view-document-card h-100">
                        <Card.Body>
                          {renderStudentDocument(student[doc.field], doc.label)}
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Modal.Body>
              <Modal.Footer className="assigned-student-view-footer">
                <Button variant="secondary" onClick={closeStudentView}>Close</Button>
              </Modal.Footer>
            </>
          );
        })()}
      </Modal>

      {/* Student-specific category and scheme selection modal */}
      <Modal show={selectionModalOpen} onHide={closeSelectionModal} size="lg" centered scrollable className="assigned-details-modal assigned-selection-modal">
        <Modal.Header closeButton>
          <div>
            <Modal.Title>Assign Categories &amp; Schemes</Modal.Title>
            {activeAssignment && (() => {
              const student = getAssignedStudent(activeAssignment);
              return <div className="assigned-modal-subtitle">
                {student.child_welfare_committee_name || "Student"} · Form ID: {student.form_id || activeAssignment.form_id || "—"}
              </div>;
            })()}
          </div>
        </Modal.Header>
        <Modal.Body>
          {selectionError && <Alert variant="danger">{selectionError}</Alert>}
          {selectionMessage && <Alert variant="success">{selectionMessage}</Alert>}
          {selectionLoading ? (
            <div className="assigned-state"><Spinner animation="border" /><span>Loading department categories and saved selections...</span></div>
          ) : availableCategories.length ? (
            <>
              <p className="assigned-selection-help">Select one or more categories, then select the schemes required under each category. Existing selections are preselected.</p>
              {availableCategories.map((category) => {
                const categorySelected = Object.prototype.hasOwnProperty.call(selectedSchemes, category.id);
                const chosen = selectedSchemes[category.id] || [];
                return (
                  <section className={`assigned-selection-category ${categorySelected ? "is-selected" : ""}`} key={category.id}>
                    <Form.Check
                      type="checkbox"
                      id={`category-${category.id}`}
                      className="assigned-category-check"
                      label={<span><strong>{category.category}</strong>{category.category_hindi ? <small>{category.category_hindi}</small> : null}</span>}
                      checked={categorySelected}
                      onChange={(event) => toggleCategory(category.id, event.target.checked)}
                    />
                    {categorySelected && (
                      <div className="assigned-selection-schemes">
                        <div className="assigned-scheme-select-heading">Select schemes</div>
                        {(category.schemes || []).length ? category.schemes.map((scheme) => (
                          <Form.Check
                            key={scheme.id}
                            type="checkbox"
                            id={`scheme-${category.id}-${scheme.id}`}
                            label={<span>{scheme.scheme}{scheme.scheme_hindi ? <small>{scheme.scheme_hindi}</small> : null}</span>}
                            checked={chosen.includes(String(scheme.id))}
                            onChange={(event) => toggleScheme(category.id, scheme.id, event.target.checked)}
                          />
                        )) : <div className="text-muted small">No schemes are available in this category.</div>}
                      </div>
                    )}
                  </section>
                );
              })}
            </>
          ) : !selectionError ? (
            <div className="assigned-empty">No categories are configured for this department.</div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={closeSelectionModal} disabled={savingSelections}>Close</Button>
          <Button variant="primary" onClick={saveSelections} disabled={selectionLoading || savingSelections || !!selectionError && !availableCategories.length}>
            {savingSelections ? <><Spinner size="sm" animation="border" className="me-2" />Saving...</> : "Save Selections"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AssignedStudents;
