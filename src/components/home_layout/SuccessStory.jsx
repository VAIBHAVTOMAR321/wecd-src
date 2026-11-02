import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Form, Spinner, Alert } from "react-bootstrap";
import {
  FaUsers,
  FaMapMarkerAlt,
  FaLayerGroup,
  FaBookOpen,
  FaFilter,
  FaTrophy,
  FaChartBar,
  FaBullseye,
  FaUniversity,
  FaArrowRight,
} from "react-icons/fa";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "../../../src/assets/css/SuccessStory.css";
import { useLanguage } from "../../context/LanguageContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const API_BASE = "https://mahadevaaya.com/srcproject/srcproject_backend/api";
const DEPARTMENTS_API = `${API_BASE}/departments/`;
// Public district master-list API. No JWT or login is required.
const DISTRICTS_API = `${API_BASE}/districts/`;
// Public aggregate endpoint: district-wise count of CNCP registration forms.
const DISTRICT_COUNTS_API = `${API_BASE}/district-registration-counts/`;

const copy = {
  en: {
    badge: "Our Achievements",
    heading: "Impact & Success Stories",
    subheading:
      "A live overview of registrations across districts, departments, categories and schemes.",
    filters: "Explore data",
    allDistricts: "All available districts",
    allDepartments: "All departments",
    allCategories: "All categories",
    allSchemes: "All schemes",
    districts: "Districts in data",
    registered: "Registered students",
    categories: "Categories",
    schemes: "Schemes",
    districtPerformance: "District-wise registration",
    districtDesc:
      "District-wise registration totals calculated from submitted CNCP registration forms.",
    categoryPerformance: "Category-wise registrations",
    categoryDesc:
      "Distinct registered-student counts reported by the department API",
    schemePerformance: "Scheme-wise registrations",
    schemeDesc: "Registered students mapped to each scheme",
    districtBreakdown: "District breakdown",
    departmentBreakdown: "Department breakdown",
    categoryBreakdown: "Category breakdown",
    schemeBreakdown: "Scheme breakdown",
    registrations: "Registrations",
    noDistrict: "District registration totals are not available.",
    noDistrictDesc:
      "The district-wise registration count API did not return any matching records.",
    noData: "No records match the selected filters.",
    loading: "Loading live data…",
    retry: "Retry",
    apiError: "Unable to load data from the API.",
    dataNote:
      "Only values returned by the connected APIs are shown. Completion and success-rate figures are not displayed because the supplied APIs do not provide those fields.",
    district: "District",
    department: "Department",
    category: "Category",
    scheme: "Scheme",
    view: "View details",
    total: "Total",
  },
  hi: {
    badge: "हमारी उपलब्धियाँ",
    heading: "प्रभाव और उपलब्धियाँ",
    subheading: "जिला, विभाग, श्रेणी और योजनाओं के पंजीकरण का लाइव विवरण।",
    filters: "डेटा देखें",
    allDistricts: "सभी उपलब्ध जिले",
    allDepartments: "सभी विभाग",
    allCategories: "सभी श्रेणियाँ",
    allSchemes: "सभी योजनाएँ",
    districts: "डेटा में जिले",
    registered: "पंजीकृत विद्यार्थी",
    categories: "श्रेणियाँ",
    schemes: "योजनाएँ",
    districtPerformance: "जिला-वार पंजीकरण",
    districtDesc:
      "जिला-वार पंजीकरण संख्या CNCP के जमा किए गए पंजीकरण फॉर्म से प्राप्त की गई है।",
    categoryPerformance: "श्रेणी-वार पंजीकरण",
    categoryDesc:
      "विभाग API द्वारा दिए गए पंजीकृत विद्यार्थियों के अलग-अलग आँकड़े",
    schemePerformance: "योजना-वार पंजीकरण",
    schemeDesc: "प्रत्येक योजना से जुड़े पंजीकृत विद्यार्थी",
    districtBreakdown: "जिला विवरण",
    departmentBreakdown: "विभाग विवरण",
    categoryBreakdown: "श्रेणी विवरण",
    schemeBreakdown: "योजना विवरण",
    registrations: "पंजीकरण",
    noDistrict: "जिला-वार पंजीकरण संख्या उपलब्ध नहीं है।",
    noDistrictDesc: "जिला-वार पंजीकरण API से संबंधित रिकॉर्ड नहीं मिले।",
    noData: "चयनित फ़िल्टर के लिए कोई रिकॉर्ड नहीं मिला।",
    loading: "लाइव डेटा लोड हो रहा है…",
    retry: "पुनः प्रयास करें",
    apiError: "API से डेटा लोड नहीं हो सका।",
    dataNote:
      "यहाँ केवल API से प्राप्त आँकड़े दिखाए गए हैं। पूर्णता और सफलता दर नहीं दिखाई गई है क्योंकि उपलब्ध API ये फ़ील्ड प्रदान नहीं करती हैं।",
    district: "जिला",
    department: "विभाग",
    category: "श्रेणी",
    scheme: "योजना",
    view: "विवरण देखें",
    total: "कुल",
  },
};

const number = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const labelOf = (item, language, enKey, hiKey) =>
  language === "hi"
    ? item?.[hiKey] || item?.[enKey] || "-"
    : item?.[enKey] || item?.[hiKey] || "-";
const unwrap = (payload) =>
  Array.isArray(payload) ? payload : payload?.data || payload?.results || [];

function ChartPanel({
  title,
  subtitle,
  labels,
  values,
  color = "#3986c9",
  emptyText,
}) {
  const hasData = labels.length > 0;
  const data = {
    labels,
    datasets: [
      {
        label: title,
        data: values,
        backgroundColor: "rgba(44, 126, 190, .72)",
        borderColor: color,
        borderWidth: 1.5,
        borderRadius: 7,
        maxBarThickness: 42,
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${number(ctx.parsed.y).toLocaleString("en-IN")}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#5b6b7c", maxRotation: 35, minRotation: 0 },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#edf1f5" },
        ticks: {
          color: "#718096",
          callback: (v) => Number(v).toLocaleString("en-IN"),
        },
      },
    },
  };
  return (
    <div className="ss-chart-card">
      <div className="ss-chart-heading">
        <span className="ss-chart-icon">
          <FaChartBar />
        </span>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      {hasData ? (
        <div className="ss-chart-canvas">
          <Bar data={data} options={options} />
        </div>
      ) : (
        <div className="ss-empty-chart">{emptyText}</div>
      )}
    </div>
  );
}

function Breakdown({ title, items, nameKey, countKey, emptyText }) {
  const max = Math.max(1, ...items.map((x) => number(x[countKey])));
  return (
    <div className="ss-breakdown-card">
      <h3>
        <FaBullseye /> {title}
      </h3>
      {items.length ? (
        <div className="ss-breakdown-list">
          {items.map((item, i) => (
            <div className="ss-breakdown-row" key={`${item[nameKey]}-${i}`}>
              <div className="ss-breakdown-label">
                <span>{item[nameKey]}</span>
                <strong>
                  {number(item[countKey]).toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="ss-breakdown-track">
                <div
                  className="ss-breakdown-fill"
                  style={{ width: `${(number(item[countKey]) / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="ss-empty-text">{emptyText}</p>
      )}
    </div>
  );
}

export default function SuccessStory() {
  const { language } = useLanguage();
  const t = copy[language] || copy.en;
  const [departments, setDepartments] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [districtCountsAvailable, setDistrictCountsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    district: "all",
    department: "all",
    category: "all",
    scheme: "all",
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    const headers = { Accept: "application/json" };
    const [departmentResult, districtResult, districtCountsResult] =
      await Promise.allSettled([
        fetch(DEPARTMENTS_API, { headers }),
        // Public district master list: deliberately no credentials.
        fetch(DISTRICTS_API, { method: "GET", headers, credentials: "omit" }),
        // Public aggregate endpoint: returns district names and registration counts only.
        fetch(DISTRICT_COUNTS_API, {
          method: "GET",
          headers,
          credentials: "omit",
        }),
      ]);
    try {
      if (departmentResult.status !== "fulfilled" || !departmentResult.value.ok)
        throw new Error("Departments API request failed");
      const departmentJson = await departmentResult.value.json();
      setDepartments(unwrap(departmentJson));
    } catch (e) {
      setError(e.message || t.apiError);
    }

    if (districtResult.status === "fulfilled" && districtResult.value.ok) {
      try {
        const districtJson = await districtResult.value.json();
        const rows = unwrap(districtJson);
        let countRows = [];
        if (
          districtCountsResult.status === "fulfilled" &&
          districtCountsResult.value.ok
        ) {
          const countJson = await districtCountsResult.value.json();
          countRows = unwrap(countJson);
        }
        const countMap = new Map();
        countRows.forEach((item) => {
          const key = String(item.district || item.name || "")
            .trim()
            .toLocaleLowerCase();
          const value =
            item.registered_student_count ??
            item.registration_count ??
            item.total_registrations ??
            item.total;
          if (key) countMap.set(key, number(value));
        });
        const normalized = rows
          .map((item) => {
            const name =
              item.district ||
              item.name ||
              item.district_name ||
              item.district_hindi ||
              "";
            const key = String(name).trim().toLocaleLowerCase();
            const countValue = countMap.has(key) ? countMap.get(key) : null;
            return { ...item, name, count: countValue };
          })
          .filter((item) => item.name);
        setDistricts(normalized);
        setDistrictCountsAvailable(
          countRows.length > 0 &&
            normalized.some((item) => item.count !== null),
        );
      } catch {
        setDistricts([]);
        setDistrictCountsAvailable(false);
      }
    } else {
      setDistricts([]);
      setDistrictCountsAvailable(false);
      setError(
        (old) =>
          old ||
          `Districts API failed (${districtResult.status === "fulfilled" ? districtResult.value.status : "network error"}).`,
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const departmentRows = useMemo(
    () =>
      departments.map((d) => ({
        id: d.id,
        name: labelOf(d, language, "department", "department_hindi"),
        categories: (d.categories || []).map((c) => ({
          ...c,
          name: labelOf(c, language, "category", "category_hindi"),
          count: number(c.registered_student_count),
          schemes: (c.schemes || []).map((s) => ({
            ...s,
            name: labelOf(s, language, "scheme", "scheme_hindi"),
            count: number(s.registered_student_count),
          })),
        })),
      })),
    [departments, language],
  );

  const categoryRows = useMemo(
    () =>
      departmentRows.flatMap((d) =>
        d.categories.map((c) => ({ ...c, departmentName: d.name })),
      ),
    [departmentRows],
  );
  const schemeRows = useMemo(
    () =>
      categoryRows.flatMap((c) =>
        c.schemes.map((s) => ({
          ...s,
          categoryName: c.name,
          categoryId: c.id,
          departmentName: c.departmentName,
        })),
      ),
    [categoryRows],
  );
  const districtRows = useMemo(
    () =>
      districts.map((item) => ({
        name:
          labelOf(item, language, "district", "district_hindi") || item.name,
        count: item.count,
        id: item.id,
      })),
    [districts, language],
  );

  const departmentOptions = departmentRows;
  const selectedDepartment =
    filters.department === "all"
      ? null
      : departmentRows.find((d) => String(d.id) === filters.department);
  const visibleCategories = categoryRows.filter(
    (c) =>
      (!selectedDepartment || c.departmentName === selectedDepartment.name) &&
      (filters.category === "all" || String(c.id) === filters.category),
  );
  const visibleSchemes = schemeRows.filter(
    (s) =>
      (!selectedDepartment || s.departmentName === selectedDepartment.name) &&
      (filters.category === "all" ||
        String(s.categoryId) === filters.category) &&
      (filters.scheme === "all" || String(s.id) === filters.scheme),
  );
  const visibleDistricts = districtRows.filter(
    (d) => filters.district === "all" || d.name === filters.district,
  );

  const totalRegistered = categoryRows.reduce((sum, c) => sum + c.count, 0);
  const uniqueDistrictCount = districts.length;
  const totalCategories = categoryRows.length;
  const totalSchemes = schemeRows.length;
  const stats = [
    {
      icon: <FaMapMarkerAlt />,
      value: uniqueDistrictCount,
      label: t.districts,
    },
    { icon: <FaUsers />, value: totalRegistered, label: t.registered },
    { icon: <FaLayerGroup />, value: totalCategories, label: t.categories },
    { icon: <FaBookOpen />, value: totalSchemes, label: t.schemes },
  ];

  const setFilter = (key, value) =>
    setFilters((old) => ({
      ...old,
      [key]: value,
      ...(key === "department" ? { category: "all", scheme: "all" } : {}),
      ...(key === "category" ? { scheme: "all" } : {}),
    }));
  const districtChartRows =
    filters.district === "all"
      ? districtRows
      : districtRows.filter((x) => x.name === filters.district);
  const districtMetricRows = districtChartRows.filter(
    (d) => d.count !== null && d.count !== undefined,
  );
  const categoryChartRows = visibleCategories;
  const schemeChartRows = visibleSchemes;

  return (
    <section className="success-story-section">
      <Container>
        <header className="ss-section-heading">
          <div className="ss-section-badge">
            <FaTrophy />
            <span>{t.badge}</span>
          </div>
          <h2>{t.heading}</h2>
          <p>{t.subheading}</p>
          <div className="ss-heading-tricolor">
            <i />
            <i />
            <i />
          </div>
        </header>

        {error && (
          <Alert variant="warning" className="ss-alert">
            {t.apiError} {error}
          </Alert>
        )}
        {loading ? (
          <div className="ss-loading">
            <Spinner animation="border" />
            <span>{t.loading}</span>
          </div>
        ) : (
          <>
            <Row className="g-3 ss-stats-row">
              {stats.map((s, i) => (
                <Col xs={6} lg={3} key={s.label}>
                  <div className={`ss-stat-card ss-stat-${i}`}>
                    <span className="ss-stat-icon">{s.icon}</span>
                    <strong>{s.value.toLocaleString("en-IN")}</strong>
                    <span>{s.label}</span>
                  </div>
                </Col>
              ))}
            </Row>

            <div className="ss-filters-card">
              <div className="ss-filter-title">
                <FaFilter /> <strong>{t.filters}</strong>
              </div>
              <Row className="g-3">
                <Col md={6} lg={3}>
                  <Form.Select
                    value={filters.district}
                    onChange={(e) => setFilter("district", e.target.value)}
                    className="ss-filter-select"
                  >
                    <option value="all">{t.allDistricts}</option>
                    {districtRows.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={6} lg={3}>
                  <Form.Select
                    value={filters.department}
                    onChange={(e) => setFilter("department", e.target.value)}
                    className="ss-filter-select"
                  >
                    <option value="all">{t.allDepartments}</option>
                    {departmentOptions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={6} lg={3}>
                  <Form.Select
                    value={filters.category}
                    onChange={(e) => setFilter("category", e.target.value)}
                    className="ss-filter-select"
                  >
                    <option value="all">{t.allCategories}</option>
                    {(selectedDepartment
                      ? selectedDepartment.categories
                      : categoryRows
                    ).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={6} lg={3}>
                  <Form.Select
                    value={filters.scheme}
                    onChange={(e) => setFilter("scheme", e.target.value)}
                    className="ss-filter-select"
                  >
                    <option value="all">{t.allSchemes}</option>
                    {(filters.category === "all"
                      ? schemeRows
                      : schemeRows.filter(
                          (s) => String(s.categoryId) === filters.category,
                        )
                    ).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>
            </div>

            <Row className="g-4 ss-chart-grid">
              <Col lg={7}>
                <ChartPanel
                  title={t.districtPerformance}
                  subtitle={t.districtDesc}
                  labels={districtMetricRows.map((d) => d.name)}
                  values={districtMetricRows.map((d) => d.count)}
                  emptyText={districtCountsAvailable ? t.noData : t.noDistrict}
                />
              </Col>
              <Col lg={5}>
                <Breakdown
                  title={t.districtBreakdown}
                  items={districtMetricRows}
                  nameKey="name"
                  countKey="count"
                  emptyText={
                    districtCountsAvailable ? t.noData : t.noDistrictDesc
                  }
                />
              </Col>
              <Col lg={7}>
                <ChartPanel
                  title={t.categoryPerformance}
                  subtitle={t.categoryDesc}
                  labels={categoryChartRows.map((c) => c.name)}
                  values={categoryChartRows.map((c) => c.count)}
                  emptyText={t.noData}
                />
              </Col>
              <Col lg={5}>
                <Breakdown
                  title={t.categoryBreakdown}
                  items={categoryChartRows.map((c) => ({
                    name: c.name,
                    count: c.count,
                  }))}
                  nameKey="name"
                  countKey="count"
                  emptyText={t.noData}
                />
              </Col>
              <Col lg={7}>
                <ChartPanel
                  title={t.schemePerformance}
                  subtitle={t.schemeDesc}
                  labels={schemeChartRows.map((s) => s.name)}
                  values={schemeChartRows.map((s) => s.count)}
                  emptyText={t.noData}
                />
              </Col>
              <Col lg={5}>
                <Breakdown
                  title={t.schemeBreakdown}
                  items={schemeChartRows.map((s) => ({
                    name: s.name,
                    count: s.count,
                  }))}
                  nameKey="name"
                  countKey="count"
                  emptyText={t.noData}
                />
              </Col>
            </Row>

            <div className="ss-data-note">
              <FaUniversity />
              <span>{t.dataNote}</span>
            </div>
            <div className="ss-detail-section">
              <h3>{t.departmentBreakdown}</h3>
              <Row className="g-3">
                {departmentRows
                  .filter(
                    (d) =>
                      !selectedDepartment || d.id === selectedDepartment.id,
                  )
                  .map((d) => (
                    <Col md={6} xl={4} key={d.id}>
                      <article className="ss-department-card">
                        <div className="ss-department-card-head">
                          <span>
                            <FaUniversity />
                          </span>
                          <h4>{d.name}</h4>
                        </div>
                        <div className="ss-department-meta">
                          <span>
                            {d.categories.length} {t.categories}
                          </span>
                          <span>
                            {d.categories.reduce(
                              (sum, c) => sum + c.schemes.length,
                              0,
                            )}{" "}
                            {t.schemes}
                          </span>
                        </div>
                        {d.categories.map((c) => (
                          <div className="ss-category-line" key={c.id}>
                            <div>
                              <strong>{c.name}</strong>
                              <b>{c.count.toLocaleString("en-IN")}</b>
                            </div>
                            {c.schemes.map((s) => (
                              <div className="ss-scheme-line" key={s.id}>
                                <span>
                                  <FaArrowRight /> {s.name}
                                </span>
                                <strong>
                                  {s.count.toLocaleString("en-IN")}
                                </strong>
                              </div>
                            ))}
                          </div>
                        ))}
                      </article>
                    </Col>
                  ))}
              </Row>
            </div>
          </>
        )}
        <div className="ss-refresh-row">
          <button type="button" onClick={loadData}>
            {t.retry}
          </button>
        </div>
      </Container>
    </section>
  );
}
