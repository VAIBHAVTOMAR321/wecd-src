import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Container, Row, Col, Card, Spinner, Alert, Badge, Button, Table } from "react-bootstrap";
import {
  FaUsers, FaBuilding, FaLayerGroup, FaClipboardList, FaChartLine,
  FaFileAlt, FaSyncAlt, FaArrowRight, FaCheckCircle, FaClock,
  FaExclamationCircle, FaSitemap
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DisTopNav from "./DisTopNav";
import DisLeftnav from "./DisLeftnav";
import "./DisDashBoard.css";

const API_BASE = "https://mahadevaaya.com/srcproject/srcproject_backend/api";

const REFRESH_URL = `${API_BASE}/refresh-token/`;

const readAccessToken = () =>
  localStorage.getItem("accessToken") ||
  localStorage.getItem("access") ||
  localStorage.getItem("access_token") ||
  sessionStorage.getItem("accessToken") ||
  sessionStorage.getItem("access") ||
  sessionStorage.getItem("access_token") ||
  "";

const readRefreshToken = () =>
  localStorage.getItem("refreshToken") ||
  localStorage.getItem("refresh") ||
  sessionStorage.getItem("refreshToken") ||
  sessionStorage.getItem("refresh") ||
  "";

const saveAccessToken = (token) => {
  if (!token) return;
  // AuthContext stores tokens in localStorage using these exact keys.
  localStorage.setItem("accessToken", token);
};

const refreshAccessToken = async () => {
  const refresh = readRefreshToken();

  if (!refresh) {
    throw new Error("No refresh token found. Please log in again.");
  }

  const response = await fetch(REFRESH_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.access) {
    throw new Error(
      payload.detail || payload.error || "Session expired. Please log in again."
    );
  }

  saveAccessToken(payload.access);
  return payload.access;
};

const fetchWithAuth = async (url, options = {}) => {
  let token = readAccessToken();

  if (!token) {
    throw new Error("Access token not found. Please log in again.");
  }

  const makeRequest = (accessToken) =>
    fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });

  let response = await makeRequest(token);

  // Refresh once if the access token has expired, then retry the original API.
  if (response.status === 401) {
    token = await refreshAccessToken();
    response = await makeRequest(token);
  }

  return response;
};

const getArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getFormId = (item) =>
  item?.form_id?.form_id ??
  item?.form_id?.id ??
  item?.form_id ??
  item?.form?.form_id ??
  item?.registration_no ??
  item?.id;

const getDepartmentName = (item) =>
  item?.department_name ??
  item?.department ??
  item?.assigned_department ??
  item?.department_details?.department ??
  "Department not specified";

const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(value || 0);

const DisDashBoard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [districtName, setDistrictName] = useState("District");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

  const toggleSidebar = () => setSidebarOpen((previous) => !previous);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const options = { method: "GET" };

      const [registrationResponse, assignmentResponse, departmentResponse] = await Promise.all([
        fetchWithAuth(`${API_BASE}/cncp-child-welfare-committee/`, options),
        fetchWithAuth(`${API_BASE}/cncp-child-welfare-department/`, options),
        fetch(`${API_BASE}/departments/`, {
          method: "GET",
          headers: { Accept: "application/json" },
        }),
      ]);

      if (registrationResponse.status === 403) {
        const errorData = await registrationResponse.json().catch(() => ({}));
        throw new Error(
          `Registration API permission denied (403): ${
            errorData.detail || errorData.message || JSON.stringify(errorData)
          }`
        );
      }

      if (assignmentResponse.status === 403) {
        const errorData = await assignmentResponse.json().catch(() => ({}));
        throw new Error(
          `Department Assignment API permission denied (403): ${
            errorData.detail || errorData.message || JSON.stringify(errorData)
          }`
        );
      }
      if (registrationResponse.status === 401 || assignmentResponse.status === 401) {
        throw new Error(
          "Authentication failed after token refresh. Please log out, log in again, and verify the backend JWT authentication configuration."
        );
      }
      if (!registrationResponse.ok) throw new Error(`Registration API failed (${registrationResponse.status}).`);
      if (!assignmentResponse.ok) throw new Error(`Department assignment API failed (${assignmentResponse.status}).`);
      if (!departmentResponse.ok) throw new Error(`Department master API failed (${departmentResponse.status}).`);

      const [registrationPayload, assignmentPayload, departmentPayload] = await Promise.all([
        registrationResponse.json(),
        assignmentResponse.json(),
        departmentResponse.json(),
      ]);

      const registrationRows = getArray(registrationPayload);
      const allAssignments = getArray(assignmentPayload);
      const departmentRows = getArray(departmentPayload);

      // The district registration endpoint returns only the logged-in user's district records.
      const formIds = new Set(registrationRows.map(getFormId).filter((id) => id !== undefined && id !== null).map(String));
      const districtAssignments = allAssignments.filter((item) => {
        const assignmentFormId = getFormId(item);
        return assignmentFormId !== undefined && assignmentFormId !== null && formIds.has(String(assignmentFormId));
      });

      setRegistrations(registrationRows);
      setAssignments(districtAssignments);
      setDepartments(departmentRows);
      setDistrictName(registrationPayload?.district || "District");
    } catch (err) {
      setError(err.message || "Unable to load district dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const metrics = useMemo(() => {
    const total = registrations.length;
    const assignedIds = new Set(assignments.map(getFormId).filter(Boolean).map(String));
    const assigned = registrations.filter((item) => assignedIds.has(String(getFormId(item)))).length;
    const departmentNames = new Set(assignments.map(getDepartmentName).filter((name) => name !== "Department not specified"));
    return {
      total,
      assigned,
      unassigned: Math.max(total - assigned, 0),
      departments: departmentNames.size
    };
  }, [registrations, assignments]);

  const departmentBreakdown = useMemo(() => {
    const counts = {};
    assignments.forEach((item) => {
      const name = getDepartmentName(item);
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [assignments]);

  const recentRegistrations = useMemo(() => [...registrations].sort((a, b) => {
    const dateA = new Date(a.created_at || a.created || 0).getTime();
    const dateB = new Date(b.created_at || b.created || 0).getTime();
    return dateB - dateA;
  }).slice(0, 5), [registrations]);

  const assignmentByForm = useMemo(() => {
    const map = new Map();
    assignments.forEach((item) => map.set(String(getFormId(item)), item));
    return map;
  }, [assignments]);

  const getRegistrationLabel = (item) =>
    item?.registration_no || item?.application_no || item?.form_id || item?.unique_id || `CNCP-${item?.id ?? "—"}`;

  const getCategory = (item) =>
    item?.category_name || item?.category || item?.child_category || "—";

  const getStatus = (item) => {
    const assignment = assignmentByForm.get(String(getFormId(item)));
    if (assignment) return { label: "Assigned", type: "assigned" };
    return { label: "Not Assigned", type: "pending" };
  };

  const maxDepartmentCount = Math.max(...departmentBreakdown.map((item) => item.count), 1);

  return (
    <div className="dashboard-container">
      <DisLeftnav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      <div className="main-content-dash">
        <DisTopNav toggleSidebar={toggleSidebar} />

        <Container fluid className="dashboard-box mt-3 dis-dashboard-page">
          <div className="dis-dashboard-heading">
            <div>
              <div className="dis-eyebrow">CHILD IN NEED OF CARE AND PROTECTION</div>
              <h2>District Dashboard – {districtName}</h2>
              <p>District-level registration, department assignment and application overview</p>
            </div>
            <Button className="dis-refresh-btn" onClick={() => fetchDashboardData(true)} disabled={loading || refreshing}>
              <FaSyncAlt className={refreshing ? "dis-spin" : ""} /> {refreshing ? "Refreshing" : "Refresh"}
            </Button>
          </div>

          {error && <Alert variant="danger" className="dis-dashboard-alert">{error}</Alert>}

          {loading ? (
            <div className="dis-dashboard-loading">
              <Spinner animation="border" />
              <span>Loading district dashboard...</span>
            </div>
          ) : (
            <>
              <Row className="g-3 dis-metric-row">
                <Col xl={3} sm={6}>
                  <Card className="dis-metric-card metric-blue">
                    <Card.Body>
                      <div className="dis-metric-icon"><FaUsers /></div>
                      <div><span>Total Registrations</span><strong>{formatNumber(metrics.total)}</strong><small>Applications in your district</small></div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} sm={6}>
                  <Card className="dis-metric-card metric-purple">
                    <Card.Body>
                      <div className="dis-metric-icon"><FaBuilding /></div>
                      <div><span>Assigned Applications</span><strong>{formatNumber(metrics.assigned)}</strong><small>Applications assigned to departments</small></div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} sm={6}>
                  <Card className="dis-metric-card metric-orange">
                    <Card.Body>
                      <div className="dis-metric-icon"><FaClock /></div>
                      <div><span>Pending Assignment</span><strong>{formatNumber(metrics.unassigned)}</strong><small>Applications awaiting assignment</small></div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} sm={6}>
                  <Card className="dis-metric-card metric-green">
                    <Card.Body>
                      <div className="dis-metric-icon"><FaSitemap /></div>
                      <div><span>Departments Involved</span><strong>{formatNumber(metrics.departments)}</strong><small>Departments with assigned cases</small></div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="g-3 dis-content-row">
                <Col lg={6}>
                  <Card className="dis-panel-card h-100">
                    <Card.Body>
                      <div className="dis-panel-heading"><div><FaChartLine /><h5>Application Assignment Overview</h5></div><Badge bg="light" text="dark">Current total</Badge></div>
                      <div className="dis-overview-total">{formatNumber(metrics.total)} <span>registrations</span></div>
                      <div className="dis-progress-track">
                        <div className="dis-progress-assigned" style={{ width: `${metrics.total ? (metrics.assigned / metrics.total) * 100 : 0}%` }} />
                      </div>
                      <div className="dis-legend-row">
                        <span><i className="legend-dot dot-blue" /> Assigned <b>{formatNumber(metrics.assigned)}</b></span>
                        <span><i className="legend-dot dot-orange" /> Pending <b>{formatNumber(metrics.unassigned)}</b></span>
                      </div>
                      <div className="dis-insight-note"><FaCheckCircle /> Assignment progress is calculated from district registrations matched with department assignments.</div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={6}>
                  <Card className="dis-panel-card h-100">
                    <Card.Body>
                      <div className="dis-panel-heading"><div><FaBuilding /><h5>Department-wise Assignments</h5></div><span className="dis-panel-subtitle">Top 5</span></div>
                      {departmentBreakdown.length ? (
                        <div className="dis-department-bars">
                          {departmentBreakdown.map((item) => (
                            <div className="dis-bar-row" key={item.name}>
                              <span title={item.name}>{item.name}</span>
                              <div className="dis-bar-track"><div style={{ width: `${(item.count / maxDepartmentCount) * 100}%` }} /></div>
                              <b>{formatNumber(item.count)}</b>
                            </div>
                          ))}
                        </div>
                      ) : <div className="dis-empty-state">No department assignments are available for this district yet.</div>}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="g-3 dis-content-row">
                <Col lg={7}>
                  <Card className="dis-panel-card h-100">
                    <Card.Body>
                      <div className="dis-panel-heading">
                        <div><FaFileAlt /><h5>Recent Registrations</h5></div>
                        <Button variant="link" className="dis-view-link" onClick={() => navigate("/district/registrations")}>View All <FaArrowRight /></Button>
                      </div>
                      <div className="table-responsive">
                        <Table className="dis-dashboard-table" hover>
                          <thead><tr><th>#</th><th>Registration No.</th><th>Category</th><th>Department</th><th>Status</th></tr></thead>
                          <tbody>
                            {recentRegistrations.map((item, index) => {
                              const assignment = assignmentByForm.get(String(getFormId(item)));
                              const statusInfo = getStatus(item);
                              return (
                                <tr key={item.id || getFormId(item) || index}>
                                  <td>{index + 1}</td>
                                  <td className="dis-reg-number">{getRegistrationLabel(item)}</td>
                                  <td>{getCategory(item)}</td>
                                  <td>{assignment ? getDepartmentName(assignment) : "—"}</td>
                                  <td><span className={`dis-status-pill ${statusInfo.type}`}>{statusInfo.label}</span></td>
                                </tr>
                              );
                            })}
                            {!recentRegistrations.length && <tr><td colSpan="5" className="dis-table-empty">No registrations found for this district.</td></tr>}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col lg={5}>
                  <Card className="dis-panel-card h-100">
                    <Card.Body>
                      <div className="dis-panel-heading"><div><FaLayerGroup /><h5>Department Directory</h5></div><span className="dis-panel-subtitle">{departments.length} available</span></div>
                      <div className="dis-department-list">
                        {departments.slice(0, 6).map((department) => (
                          <div className="dis-directory-item" key={department.id}>
                            <div className="dis-directory-icon"><FaBuilding /></div>
                            <div><strong>{department.department || department.name || "Department"}</strong><small>{department.department_hindi || "Department"}</small></div>
                          </div>
                        ))}
                        {!departments.length && <div className="dis-empty-state">No departments found.</div>}
                      </div>
                      <div className="dis-directory-note">This list is the public department master. Assignment totals above are calculated only from this district's matched applications.</div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="g-3 dis-content-row">
                <Col>
                  <Card className="dis-quick-card">
                    <Card.Body>
                      <div className="dis-panel-heading"><div><FaClipboardList /><h5>Quick Actions</h5></div></div>
                      <div className="dis-quick-actions">
                        <button onClick={() => navigate("/district/registrations")}><FaUsers /><span>View Registrations</span><small>Review district applications</small></button>
                        <button onClick={() => navigate("/district/department-assignment")}><FaBuilding /><span>Department Assignment</span><small>Assign applications</small></button>
                        <button onClick={() => navigate("/district/reports")}><FaFileAlt /><span>Generate Reports</span><small>Open district reports</small></button>
                        <button onClick={() => fetchDashboardData(true)}><FaSyncAlt /><span>Refresh Dashboard</span><small>Fetch latest API data</small></button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Container>
      </div>
    </div>
  );
};

export default DisDashBoard;
