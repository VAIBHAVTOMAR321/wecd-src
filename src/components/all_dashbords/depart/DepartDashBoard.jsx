import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, Spinner, Alert, Table, Badge, Button, Form, Modal } from "react-bootstrap";
import {
  FaClipboardList, FaClock, FaSpinner, FaCheckCircle, FaEye,
  FaSearch, FaSyncAlt, FaFileAlt, FaBuilding
} from "react-icons/fa";
import DepartLeftNav from "./DepartLeftNav";
import DepartTopNav from "./DepartTopNav";
import { useAuth } from "../../login/AuthContext";
import "./DepartDashBoard.css";

// Department must use this endpoint, not the District assignment endpoint.
const API_BASE = "https://mahadevaaya.com/srcproject/srcproject_backend/api";
const DEPARTMENT_RECORDS_API = `${API_BASE}/cncp-department-records/`;

const extractRecords = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") {
    throw new Error("Department records API returned an unexpected response.");
  }
  if (payload.status === false) {
    throw new Error(payload.message || payload.detail || "Unable to load department records.");
  }

  for (const key of ["data", "results", "records", "assignments", "items"]) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") return extractRecords(value);
  }

  throw new Error("Department records API did not return a student list.");
};

const readValue = (item, keys, fallback = "—") => {
  for (const key of keys) {
    const value = key.split(".").reduce((obj, part) => obj?.[part], item);

    if (
      value !== undefined &&
      value !== null &&
      typeof value !== "object" &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return fallback;
};

const getStudentRecord = (record) =>
  record?.form_details ||
  record?.form ||
  record?.student_details ||
  record?.student ||
  {};

const readRecordValue = (record, keys, fallback = "—") => {
  const nestedKeys = keys.flatMap((key) => [
    key,
    `form_details.${key}`,
    `form.${key}`,
    `student_details.${key}`,
    `student.${key}`
  ]);
  const value = readValue(record, nestedKeys, "");
  return value || readValue(getStudentRecord(record), keys, fallback);
};

const getEnrollmentNumber = (record) =>
  readRecordValue(record, [
    "cncp_child_enroll_number",
    "cncp_enrollment_no",
    "enrollment_no",
    "child_enrollment_no",
    "form_id.cncp_child_enroll_number",
    "form_id.cncp_enrollment_no"
  ]);

const getFormId = (record) =>
  readRecordValue(record, [
    "form_id.form_id",
    "form_id.id",
    "form_id",
    "registration_no"
  ]);

const getStudentDisplayName = (record) => {
  const enrollmentNumber = getEnrollmentNumber(record);
  return readRecordValue(
    record,
    ["child_name", "cncp_child_name", "student_name", "name", "child.full_name"],
    enrollmentNumber !== "—" ? enrollmentNumber : getFormId(record)
  );
};

const normalizeStatus = (value) =>
  String(value || "Assigned to Department")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ");

const statusLabel = (status) => {
  const normalized = normalizeStatus(status);

  if (
    normalized.includes("complete") ||
    normalized.includes("closed") ||
    normalized.includes("resolved")
  ) return "Completed";

  if (
    normalized.includes("report submitted") ||
    normalized.includes("submitted")
  ) return "Report Submitted";

  if (normalized.includes("action taken")) return "Action Taken";

  if (
    normalized.includes("progress") ||
    normalized.includes("review") ||
    normalized.includes("working")
  ) return "In Progress";

  if (normalized.includes("clarification")) return "Clarification Required";

  return "Assigned to Department";
};

const statusVariant = (status) => {
  const label = statusLabel(status);

  if (label === "Completed" || label === "Action Taken") return "success";
  if (label === "In Progress" || label === "Report Submitted") return "primary";
  if (label === "Clarification Required") return "warning";

  return "secondary";
};

const DepartDashBoard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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

  const fetchRecords = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const response = await authFetch(DEPARTMENT_RECORDS_API);

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          payload?.message ||
          payload?.detail ||
          `Unable to load department cases (${response.status}).`;

        throw new Error(message);
      }

      setRecords(extractRecords(payload));
    } catch (err) {
      setError(err.message || "Unable to load assigned cases.");
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const getRecordStatus = (record) =>
    statusLabel(
      readRecordValue(
        record,
        [
          "department_status",
          "current_status",
          "status",
          "assignment_status"
        ],
        "Assigned to Department"
      )
    );

  const counts = useMemo(() => {
    const result = {
      total: records.length,
      pending: 0,
      progress: 0,
      completed: 0
    };

    records.forEach((record) => {
      const status = getRecordStatus(record);

      if (status === "Completed") {
        result.completed += 1;
      } else if (
        status === "In Progress" ||
        status === "Action Taken" ||
        status === "Report Submitted"
      ) {
        result.progress += 1;
      } else {
        result.pending += 1;
      }
    });

    return result;
  }, [records]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const status = getRecordStatus(record);

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "pending" &&
          status === "Assigned to Department") ||
        (activeTab === "progress" &&
          [
            "In Progress",
            "Action Taken",
            "Report Submitted",
            "Clarification Required"
          ].includes(status)) ||
        (activeTab === "completed" && status === "Completed");

      const searchable = [
        getEnrollmentNumber(record),
        getStudentDisplayName(record),
        readRecordValue(record, ["district", "district_name"], ""),
        readRecordValue(
          record,
          [
            "child_welfare_committee_name",
            "cwc_name",
            "committee_name",
            "cwc.name"
          ],
          ""
        ),
        readRecordValue(
          record,
          ["department", "department_name", "department.name"],
          ""
        )
      ].join(" ").toLowerCase();

      return matchesTab && (!query || searchable.includes(query));
    });
  }, [records, activeTab, search]);

  const openDetails = (record) => {
    setSelectedRecord(record);
    setShowDetails(true);
  };

  const toggleSidebar = () =>
    setSidebarOpen((open) => !open);

  const summaryCards = [
    {
      title: "Total Assigned Cases",
      value: counts.total,
      icon: <FaClipboardList />,
      tone: "blue",
      tab: "all"
    },
    {
      title: "Pending Cases",
      value: counts.pending,
      icon: <FaClock />,
      tone: "orange",
      tab: "pending"
    },
    {
      title: "In Progress",
      value: counts.progress,
      icon: <FaSpinner />,
      tone: "purple",
      tab: "progress"
    },
    {
      title: "Completed Cases",
      value: counts.completed,
      icon: <FaCheckCircle />,
      tone: "green",
      tab: "completed"
    }
  ];

  return (
    <div className="dashboard-container department-dashboard">
      <DepartLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      <div className="main-content-dash">
        <DepartTopNav toggleSidebar={toggleSidebar} />

        <Container fluid className="department-dashboard-content">
          <div className="department-page-heading">
            <div>
              <div className="department-eyebrow">
                CNCP CASE MANAGEMENT
              </div>

              <h2>Department Dashboard</h2>

              <p>
                Review assigned cases, record department actions and monitor
                progress.
              </p>
            </div>

            <Button
              className="department-refresh-btn"
              onClick={() => fetchRecords(true)}
              disabled={loading || refreshing}
            >
              {refreshing ? (
                <Spinner size="sm" animation="border" />
              ) : (
                <FaSyncAlt />
              )}

              <span>Refresh</span>
            </Button>
          </div>

          {error && (
            <Alert variant="danger" className="department-alert">
              <strong>Unable to load department cases.</strong>
              <div>{error}</div>

              <small>
                Check that this endpoint is the Department records API and
                that the logged-in account has department access.
              </small>
            </Alert>
          )}

          <Row className="g-3 department-summary-row">
            {summaryCards.map((card) => (
              <Col key={card.title} xs={12} sm={6} xl={3}>
                <Card
                  className={`department-summary-card ${card.tone} ${
                    activeTab === card.tab ? "selected" : ""
                  }`}
                  onClick={() => setActiveTab(card.tab)}
                >
                  <Card.Body>
                    <div className="department-summary-top">
                      <span>{card.title}</span>
                      <span className="department-summary-icon">
                        {card.icon}
                      </span>
                    </div>

                    <div className="department-summary-value">
                      {loading ? "—" : card.value}
                    </div>

                    <div className="department-summary-foot">
                      View cases <span>→</span>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Card className="department-table-card">
            <Card.Body>
              <div className="department-table-heading">
                <div>
                  <h5>Department Cases</h5>
                  <p>Cases assigned to your department</p>
                </div>

                <div className="department-search-wrap">
                  <FaSearch />

                  <Form.Control
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search child, enrollment no., district..."
                    aria-label="Search department cases"
                  />
                </div>
              </div>

              <div
                className="department-tabs"
                role="tablist"
                aria-label="Case status filters"
              >
                {[
                  ["all", "All Cases"],
                  ["pending", "Pending"],
                  ["progress", "In Progress"],
                  ["completed", "Completed"]
                ].map(([key, label]) => (
                  <button
                    type="button"
                    key={key}
                    className={activeTab === key ? "active" : ""}
                    onClick={() => setActiveTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="department-loading">
                  <Spinner animation="border" />
                  <span>Loading assigned cases...</span>
                </div>
              ) : (
                <div className="table-responsive department-table-responsive">
                  <Table
                    hover
                    className="department-cases-table align-middle"
                  >
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Enrollment No.</th>
                        <th>Student / Child</th>
                        <th>District</th>
                        <th>CWC Name</th>
                        <th>Assignment Date</th>
                        <th>Current Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRecords.length ? (
                        filteredRecords.map((record, index) => {
                          const status = getRecordStatus(record);
                          const enrollmentNumber = getEnrollmentNumber(record);

                          return (
                            <tr
                              key={
                                record.id ||
                                record.assignment_id ||
                                index
                              }
                            >
                              <td>{index + 1}</td>

                              <td className="department-enrollment">
                                {enrollmentNumber}
                              </td>

                              <td>
                                {getStudentDisplayName(record)}
                              </td>

                              <td>
                                {readRecordValue(record, [
                                  "district",
                                  "district_name",
                                  "form_id.district"
                                ])}
                              </td>

                              <td>
                                {readRecordValue(record, [
                                  "child_welfare_committee_name",
                                  "cwc_name",
                                  "committee_name",
                                  "cwc.name",
                                  "form_id.cwc_name"
                                ])}
                              </td>

                              <td>
                                {readRecordValue(record, [
                                  "assigned_at",
                                  "assignment_date",
                                  "created_at"
                                ])}
                              </td>

                              <td>
                                <Badge bg={statusVariant(status)}>
                                  {status}
                                </Badge>
                              </td>

                              <td>
                                <Button
                                  size="sm"
                                  variant="outline-primary"
                                  className="department-view-btn"
                                  onClick={() => openDetails(record)}
                                >
                                  <FaEye /> View
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan="8"
                            className="department-empty-state"
                          >
                            <FaFileAlt />
                            <strong>No cases found</strong>

                            <span>
                              {search
                                ? "Try changing your search."
                                : "No cases are currently available in this category."}
                            </span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}

              <div className="department-table-footer">
                Showing <strong>{filteredRecords.length}</strong> of{" "}
                <strong>{records.length}</strong> assigned cases
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>

      <Modal
        show={showDetails}
        onHide={() => setShowDetails(false)}
        size="lg"
        centered
        className="department-details-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <FaFileAlt /> Case Details
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {selectedRecord && (
            <>
              <div className="department-detail-banner">
                <div>
                  <small>CNCP ENROLLMENT NUMBER</small>

                  <strong>
                    {readRecordValue(selectedRecord, [
                      "cncp_child_enroll_number",
                      "cncp_enrollment_no",
                      "enrollment_no",
                      "child_enrollment_no",
                      "form_id.cncp_child_enroll_number",
                      "form_id.cncp_enrollment_no"
                    ])}
                  </strong>
                </div>

                <Badge
                  bg={statusVariant(getRecordStatus(selectedRecord))}
                >
                  {getRecordStatus(selectedRecord)}
                </Badge>
              </div>

              <Row className="g-3 mt-1">
                {[
                  [
                    "Student / Child",
                    [
                      "child_name",
                      "student_name",
                      "name",
                      "child.full_name",
                      "form_id.child_name"
                    ]
                  ],
                  [
                    "District",
                    ["district", "district_name", "form_id.district"]
                  ],
                  [
                    "CWC Name",
                    [
                      "child_welfare_committee_name",
                      "cwc_name",
                      "committee_name",
                      "cwc.name",
                      "form_id.cwc_name"
                    ]
                  ],
                  [
                    "Department",
                    ["department", "department_name", "department.name"]
                  ],
                  [
                    "Assignment Date",
                    ["assigned_at", "assignment_date", "created_at"]
                  ],
                  [
                    "Current Status",
                    [
                      "department_status",
                      "current_status",
                      "status",
                      "assignment_status"
                    ]
                  ]
                ].map(([label, keys]) => (
                  <Col xs={12} sm={6} key={label}>
                    <div className="department-detail-field">
                      <small>{label}</small>
                      <strong>
                        {label === "Student / Child"
                          ? getStudentDisplayName(selectedRecord)
                          : readRecordValue(selectedRecord, keys)}
                      </strong>
                    </div>
                  </Col>
                ))}
              </Row>

              <div className="department-detail-note">
                <FaBuilding />

                <span>
                  Use the department action/update screen to record
                  verification, rehabilitation and action-taken details
                  supported by your API.
                </span>
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDetails(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DepartDashBoard;