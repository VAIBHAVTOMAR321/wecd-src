import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Card, Spinner, Alert, Table, Badge } from "react-bootstrap";
import {
  FaUsers,
  FaBuilding,
  FaLayerGroup,
  FaClipboardList,
  FaChartPie,
  FaMapMarkedAlt,
  FaTrophy,
  FaSyncAlt,
  FaArrowRight,
  FaRegChartBar,
} from "react-icons/fa";
import StateLeftNav from "./StateLeftNav";
import StateTopNav from "./StateTopNav";
import "./StateDashBoard.css";

const API_BASE = "https://mahadevaaya.com/srcproject/srcproject_backend/api";
const DEPARTMENTS_API = `${API_BASE}/departments/`;
const DISTRICTS_API = `${API_BASE}/districts/`;
const DISTRICT_COUNTS_API = `${API_BASE}/district-registration-counts/`;

const numberFormat = (value) =>
  new Intl.NumberFormat("en-IN").format(Number(value) || 0);

const getArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const StateDashBoard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [districtCounts, setDistrictCounts] = useState([]);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

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

  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    const requestOptions = {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "omit",
    };

    try {
      const [departmentResponse, districtResponse, countResponse] = await Promise.all([
        fetch(DEPARTMENTS_API, requestOptions),
        fetch(DISTRICTS_API, requestOptions),
        fetch(DISTRICT_COUNTS_API, requestOptions),
      ]);

      if (!departmentResponse.ok) {
        throw new Error(`Departments API returned ${departmentResponse.status}`);
      }
      if (!districtResponse.ok) {
        throw new Error(`Districts API returned ${districtResponse.status}`);
      }
      if (!countResponse.ok) {
        throw new Error(`District registration API returned ${countResponse.status}`);
      }

      const [departmentPayload, districtPayload, countPayload] = await Promise.all([
        departmentResponse.json(),
        districtResponse.json(),
        countResponse.json(),
      ]);

      const departmentList = getArray(departmentPayload);
      const districtList = getArray(districtPayload);
      const countList = getArray(countPayload);

      setDepartments(departmentList);
      setDistricts(districtList);
      setDistrictCounts(countList);
      setTotalRegistrations(
        Number(countPayload?.total_registrations) ||
          countList.reduce(
            (sum, item) => sum + (Number(item.registered_student_count) || 0),
            0
          )
      );
    } catch (fetchError) {
      console.error("State dashboard API error:", fetchError);
      setError(
        fetchError.message ||
          "Unable to load dashboard data. Please check the API connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const summary = useMemo(() => {
    const categories = departments.flatMap((department) =>
      Array.isArray(department.categories) ? department.categories : []
    );
    const schemes = categories.flatMap((category) =>
      Array.isArray(category.schemes) ? category.schemes : []
    );

    return {
      departmentCount: departments.length,
      categoryCount: categories.length,
      schemeCount: schemes.length,
      categoryRegistrations: categories.reduce(
        (sum, category) => sum + (Number(category.registered_student_count) || 0),
        0
      ),
      schemeRegistrations: schemes.reduce(
        (sum, scheme) => sum + (Number(scheme.registered_student_count) || 0),
        0
      ),
    };
  }, [departments]);

  const rankedDistricts = useMemo(
    () =>
      [...districtCounts].sort(
        (a, b) =>
          (Number(b.registered_student_count) || 0) -
          (Number(a.registered_student_count) || 0)
      ),
    [districtCounts]
  );

  const maxDistrictCount = Math.max(
    1,
    ...rankedDistricts.map((item) => Number(item.registered_student_count) || 0)
  );

  const categoryBreakdown = useMemo(() => {
    const categoryMap = new Map();
    departments.forEach((department) => {
      (department.categories || []).forEach((category) => {
        const key = `${category.id ?? category.category}-${department.id ?? department.department}`;
        categoryMap.set(key, {
          name: category.category || "Unnamed category",
          hindi: category.category_hindi || "",
          count: Number(category.registered_student_count) || 0,
        });
      });
    });
    return [...categoryMap.values()].sort((a, b) => b.count - a.count);
  }, [departments]);

  const maxCategoryCount = Math.max(1, ...categoryBreakdown.map((item) => item.count));
  const lastUpdated = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const toggleSidebar = () => setSidebarOpen((current) => !current);

  return (
    <div className="dashboard-container">
      <StateLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      <div className="main-content-dash">
        <StateTopNav toggleSidebar={toggleSidebar} />

        <Container fluid className="state-dashboard-content">
          <div className="state-dashboard-heading">
            <div>
              <div className="state-dashboard-eyebrow">UTTARAKHAND · CNCP</div>
              <h1>State Dashboard</h1>
              <p>Child in Need of Care and Protection — State-level overview</p>
            </div>
            <div className="state-dashboard-heading-actions">
              <span className="state-last-updated">Last updated: {lastUpdated}</span>
              <button
                type="button"
                className="state-refresh-button"
                onClick={() => fetchDashboardData(true)}
                disabled={loading || refreshing}
                aria-label="Refresh dashboard"
              >
                <FaSyncAlt className={refreshing ? "state-spin" : ""} />
                <span>{refreshing ? "Refreshing" : "Refresh"}</span>
              </button>
            </div>
          </div>

          {error && (
            <Alert variant="danger" className="state-dashboard-alert">
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                <span>{error}</span>
                <button className="state-alert-retry" onClick={() => fetchDashboardData(true)}>
                  Try again
                </button>
              </div>
            </Alert>
          )}

          {loading ? (
            <div className="state-dashboard-loading">
              <Spinner animation="border" role="status" />
              <span>Loading state dashboard data...</span>
            </div>
          ) : (
            <>
              <Row className="g-3 state-kpi-row">
                <Col xl={3} sm={6}>
                  <Card className="state-kpi-card kpi-blue h-100">
                    <Card.Body>
                      <div className="state-kpi-icon"><FaUsers /></div>
                      <div className="state-kpi-copy">
                        <span>Total Registrations</span>
                        <strong>{numberFormat(totalRegistrations)}</strong>
                        <small>Across all districts</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} sm={6}>
                  <Card className="state-kpi-card kpi-purple h-100">
                    <Card.Body>
                      <div className="state-kpi-icon"><FaBuilding /></div>
                      <div className="state-kpi-copy">
                        <span>Total Departments</span>
                        <strong>{numberFormat(summary.departmentCount)}</strong>
                        <small>Departments in master data</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} sm={6}>
                  <Card className="state-kpi-card kpi-orange h-100">
                    <Card.Body>
                      <div className="state-kpi-icon"><FaLayerGroup /></div>
                      <div className="state-kpi-copy">
                        <span>Total Categories</span>
                        <strong>{numberFormat(summary.categoryCount)}</strong>
                        <small>Across all departments</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xl={3} sm={6}>
                  <Card className="state-kpi-card kpi-green h-100">
                    <Card.Body>
                      <div className="state-kpi-icon"><FaClipboardList /></div>
                      <div className="state-kpi-copy">
                        <span>Total Schemes</span>
                        <strong>{numberFormat(summary.schemeCount)}</strong>
                        <small>Available scheme records</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="g-3 mt-1">
                <Col xl={7} lg={7}>
                  <Card className="state-panel h-100">
                    <Card.Body>
                      <div className="state-panel-heading">
                        <div className="state-panel-title">
                          <span className="state-panel-icon"><FaChartPie /></span>
                          <div><h2>Registrations by Category</h2><p>Registered forms grouped by category</p></div>
                        </div>
                        <Badge bg="light" text="dark">{categoryBreakdown.length} categories</Badge>
                      </div>
                      {categoryBreakdown.length ? (
                        <div className="state-category-list">
                          {categoryBreakdown.slice(0, 8).map((category, index) => (
                            <div className="state-category-item" key={`${category.name}-${index}`}>
                              <div className="state-category-label">
                                <span className={`state-category-dot dot-${index % 5}`} />
                                <div><strong>{category.name}</strong>{category.hindi && <small>{category.hindi}</small>}</div>
                                <b>{numberFormat(category.count)}</b>
                              </div>
                              <div className="state-progress-track">
                                <div
                                  className={`state-progress-fill fill-${index % 5}`}
                                  style={{ width: `${(category.count / maxCategoryCount) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="state-empty-state">No category registration counts are available yet.</div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                <Col xl={5} lg={5}>
                  <Card className="state-panel h-100">
                    <Card.Body>
                      <div className="state-panel-heading">
                        <div className="state-panel-title">
                          <span className="state-panel-icon"><FaTrophy /></span>
                          <div><h2>Top Districts</h2><p>Districts ranked by registrations</p></div>
                        </div>
                        <Badge bg="light" text="dark">Top 5</Badge>
                      </div>
                      {rankedDistricts.length ? (
                        <div className="state-ranking-list">
                          {rankedDistricts.slice(0, 5).map((district, index) => {
                            const count = Number(district.registered_student_count) || 0;
                            return (
                              <div className="state-ranking-item" key={`${district.district}-${index}`}>
                                <span className={`state-rank-number rank-${index + 1}`}>{index + 1}</span>
                                <div className="state-ranking-main">
                                  <div className="state-ranking-label"><strong>{district.district}</strong><b>{numberFormat(count)}</b></div>
                                  <div className="state-progress-track">
                                    <div className="state-progress-fill ranking-fill" style={{ width: `${(count / maxDistrictCount) * 100}%` }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="state-empty-state">District registration counts are not available.</div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Row className="g-3 mt-1">
                <Col xl={7} lg={7}>
                  <Card className="state-panel h-100">
                    <Card.Body>
                      <div className="state-panel-heading">
                        <div className="state-panel-title">
                          <span className="state-panel-icon"><FaMapMarkedAlt /></span>
                          <div><h2>District-wise Registration Details</h2><p>Registration totals for every district</p></div>
                        </div>
                        <span className="state-panel-total">{numberFormat(totalRegistrations)} total</span>
                      </div>
                      <div className="state-table-wrap">
                        <Table responsive hover className="state-data-table mb-0">
                          <thead><tr><th>#</th><th>District</th><th className="text-end">Registrations</th><th className="text-end">Share</th></tr></thead>
                          <tbody>
                            {rankedDistricts.length ? rankedDistricts.map((district, index) => {
                              const count = Number(district.registered_student_count) || 0;
                              const share = totalRegistrations ? (count / totalRegistrations) * 100 : 0;
                              return (
                                <tr key={`${district.district}-table-${index}`}>
                                  <td>{index + 1}</td>
                                  <td><strong>{district.district}</strong>{district.district_hindi && <small className="state-hindi-name">{district.district_hindi}</small>}</td>
                                  <td className="text-end fw-semibold">{numberFormat(count)}</td>
                                  <td className="text-end">{share.toFixed(1)}%</td>
                                </tr>
                              );
                            }) : (
                              <tr><td colSpan="4" className="text-center py-4">No district count data found.</td></tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                <Col xl={5} lg={5}>
                  <Card className="state-panel h-100">
                    <Card.Body>
                      <div className="state-panel-heading">
                        <div className="state-panel-title">
                          <span className="state-panel-icon"><FaRegChartBar /></span>
                          <div><h2>Department Overview</h2><p>Departments and their category/scheme coverage</p></div>
                        </div>
                      </div>
                      <div className="state-department-list">
                        {departments.length ? departments.map((department, index) => {
                          const categoryCount = Array.isArray(department.categories) ? department.categories.length : 0;
                          const schemeCount = (department.categories || []).reduce(
                            (sum, category) => sum + (Array.isArray(category.schemes) ? category.schemes.length : 0), 0
                          );
                          return (
                            <div className="state-department-item" key={department.id ?? `${department.department}-${index}`}>
                              <div className="state-department-symbol"><FaBuilding /></div>
                              <div className="state-department-info">
                                <strong>{department.department || "Unnamed department"}</strong>
                                {department.department_hindi && <small>{department.department_hindi}</small>}
                                <span>{categoryCount} categories <i /> {schemeCount} schemes</span>
                              </div>
                              <FaArrowRight className="state-department-arrow" />
                            </div>
                          );
                        }) : <div className="state-empty-state">No department records found.</div>}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <div className="state-dashboard-footnote">
                <span>Data is fetched live from the CNCP public APIs.</span>
                <span>{numberFormat(districts.length || rankedDistricts.length)} districts in district master</span>
              </div>
            </>
          )}
        </Container>
      </div>
    </div>
  );
};

export default StateDashBoard;
