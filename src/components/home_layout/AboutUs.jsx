import React, { useEffect, useMemo, useState } from "react";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import {
  FaDatabase, FaBalanceScale, FaHandsHelping, FaChartLine, FaHeartbeat,
  FaSchool, FaRunning, FaMapMarkedAlt, FaHome, FaBriefcase, FaBuilding,
  FaHardHat, FaTint, FaShoppingCart, FaUsers, FaLeaf, FaChild,
  FaHandHoldingHeart, FaShieldAlt, FaBookOpen, FaGraduationCap, FaLaptop,
  FaArrowRight, FaFileAlt, FaQuoteLeft, FaBullseye, FaEye, FaCogs,
  FaLayerGroup, FaProjectDiagram, FaHandshake, FaStar, FaCheckCircle
} from "react-icons/fa";
import "../../../src/assets/css/aboutus.css";
import { useLanguage } from "../../context/LanguageContext";

const API_URL =
  "https://mahadevaaya.com/srcproject/srcproject_backend/api/departments/";

const translations = {
  en: {
    aboutSrc: "About SRC",
    aboutTitle: "About <span>State Resource Center</span>",
    aboutDesc:
      "SRC is a centralized digital platform designed to provide information about government departments, categories and schemes for child welfare and empowerment.",
    visionTitle: "Our Vision",
    missionTitle: "Our Mission",
    visionQuote:
      "Every child should have access to information about their rights.",
    missionQuote:
      "To make information about government schemes and services accessible and transparent.",
    visionPoints: [
      "Ensuring access to information for every child",
      "Promoting transparency and accountability",
      "Protecting and empowering child rights",
    ],
    missionPoints: [
      "A centralized repository of department schemes",
      "Simple access to categorized information",
      "An integrated information platform for citizens",
    ],
    howSrcWorks: "How SRC Works",
    howSrcWorksDesc: "How department information is organized for citizens",
    departments: "Government Departments",
    departmentsDesc: "Departments and their registered categories and schemes",
    empowermentTitle: "Categories & Schemes",
    empowermentDesc: "Live categories and schemes fetched from the department API",
    viewAllDepts: "Showing all",
    departments_suffix: "Departments",
    categories_suffix: "Categories",
    schemes_suffix: "Schemes",
    students_suffix: "Registered Students",
    registeredStudents: "Registered students",
    noCategories: "No categories available",
    noSchemes: "No schemes available",
    loading: "Loading department information...",
    loadError: "Unable to load department information. Please try again.",
    retry: "Retry",
    howItWorks: [
      { title: "Department Information", desc: "Department details are maintained on the platform." },
      { title: "Categorization", desc: "Each department's information is organized into categories." },
      { title: "Scheme Mapping", desc: "Schemes are linked to their respective categories." },
      { title: "Registration Counts", desc: "Registered student counts are displayed from saved selections." },
      { title: "Public Access", desc: "Citizens can view the available department, category and scheme information." },
    ],
  },
  hi: {
    aboutSrc: "एसआरसी के बारे में",
    aboutTitle: "<span>राज्य संसाधन केंद्र</span> के बारे में",
    aboutDesc:
      "एसआरसी बाल कल्याण और सशक्तिकरण से संबंधित सरकारी विभागों, श्रेणियों और योजनाओं की जानकारी प्रदान करने वाला एक केंद्रीकृत डिजिटल प्लेटफॉर्म है।",
    visionTitle: "हमारा दृष्टिकोण",
    missionTitle: "हमारा मिशन",
    visionQuote: "हर बच्चे को अपने अधिकारों की जानकारी उपलब्ध होनी चाहिए।",
    missionQuote: "सरकारी योजनाओं और सेवाओं की जानकारी को सुलभ और पारदर्शी बनाना।",
    visionPoints: [
      "हर बच्चे तक सूचना की पहुँच सुनिश्चित करना",
      "पारदर्शिता और जवाबदेही को बढ़ावा देना",
      "बाल अधिकारों की सुरक्षा और सशक्तिकरण",
    ],
    missionPoints: [
      "विभागीय योजनाओं का केंद्रीकृत भंडार",
      "वर्गीकृत जानकारी तक सरल पहुँच",
      "नागरिकों के लिए एकीकृत सूचना मंच",
    ],
    howSrcWorks: "एसआरसी कैसे काम करता है",
    howSrcWorksDesc: "विभागीय जानकारी नागरिकों के लिए कैसे व्यवस्थित की जाती है",
    departments: "सरकारी विभाग",
    departmentsDesc: "विभाग और उनसे संबंधित पंजीकृत श्रेणियाँ एवं योजनाएँ",
    empowermentTitle: "श्रेणियाँ एवं योजनाएँ",
    empowermentDesc: "विभाग API से प्राप्त नवीनतम श्रेणियाँ और योजनाएँ",
    viewAllDepts: "कुल",
    departments_suffix: "विभाग",
    categories_suffix: "श्रेणियाँ",
    schemes_suffix: "योजनाएँ",
    students_suffix: "पंजीकृत विद्यार्थी",
    registeredStudents: "पंजीकृत विद्यार्थी",
    noCategories: "कोई श्रेणी उपलब्ध नहीं है",
    noSchemes: "कोई योजना उपलब्ध नहीं है",
    loading: "विभाग की जानकारी लोड हो रही है...",
    loadError: "विभाग की जानकारी लोड नहीं हो सकी। कृपया पुनः प्रयास करें।",
    retry: "पुनः प्रयास करें",
    howItWorks: [
      { title: "विभाग की जानकारी", desc: "प्लेटफॉर्म पर विभागों का विवरण उपलब्ध कराया जाता है।" },
      { title: "वर्गीकरण", desc: "प्रत्येक विभाग की जानकारी श्रेणियों में व्यवस्थित होती है।" },
      { title: "योजना मैपिंग", desc: "योजनाएँ अपनी संबंधित श्रेणियों से जुड़ी होती हैं।" },
      { title: "पंजीकरण संख्या", desc: "सहेजे गए चयन के आधार पर पंजीकृत विद्यार्थियों की संख्या दिखाई जाती है।" },
      { title: "सार्वजनिक पहुँच", desc: "नागरिक विभाग, श्रेणी और योजना की उपलब्ध जानकारी देख सकते हैं।" },
    ],
  },
};

const deptIcons = [
  <FaBalanceScale />, <FaHandsHelping />, <FaChartLine />, <FaHeartbeat />,
  <FaSchool />, <FaRunning />, <FaMapMarkedAlt />, <FaHome />, <FaBriefcase />,
  <FaBuilding />, <FaHardHat />, <FaTint />, <FaShoppingCart />, <FaUsers />,
  <FaLeaf />, <FaChild />, <FaHandHoldingHeart />, <FaShieldAlt />,
];
const categoryIcons = [
  <FaBookOpen />, <FaShieldAlt />, <FaHeartbeat />, <FaGraduationCap />,
  <FaBriefcase />, <FaLaptop />, <FaChild />, <FaHandsHelping />,
];

const themes = [
  { bg: "#fff5f0", border: "#ffd6c7", iconBg: "#ffe8df", iconColor: "#d44a0a", number: "#a83800" },
  { bg: "#eef5ff", border: "#c6dfff", iconBg: "#dae8ff", iconColor: "#2563eb", number: "#1a3fa0" },
  { bg: "#edfaf4", border: "#b8ecd0", iconBg: "#d0f5e2", iconColor: "#0d8043", number: "#06612f" },
  { bg: "#f5effe", border: "#e0ccff", iconBg: "#ecddff", iconColor: "#7c3aed", number: "#5b21b6" },
  { bg: "#eaf8fa", border: "#b6ecf2", iconBg: "#cdf2f7", iconColor: "#0891b2", number: "#056380" },
  { bg: "#fef1f7", border: "#fdcce0", iconBg: "#fdddea", iconColor: "#db2777", number: "#a01058" },
];

const readCount = (item) => Number(item?.registered_student_count ?? 0);
const getName = (item, language, englishKey, hindiKey) =>
  language === "hi" ? item?.[hindiKey] || item?.[englishKey] || "" : item?.[englishKey] || "";

export default function AboutUs() {
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDepartments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const result = await response.json();
      if (result?.status === false) throw new Error(result?.message || "API error");
      setDepartments(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      console.error("About SRC department API error:", err);
      setError(t.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const totals = useMemo(() => {
    const categories = departments.flatMap((d) => d.categories || []);
    const schemes = categories.flatMap((c) => c.schemes || []);
    return {
      departments: departments.length,
      categories: categories.length,
      schemes: schemes.length,
    };
  }, [departments]);

  const howIcons = [<FaDatabase />, <FaLayerGroup />, <FaCogs />, <FaProjectDiagram />, <FaHandshake />];
  const howThemes = [
    { bg: "#fff5f0", border: "#ffd6c7", iconBg: "#ffe8df", iconColor: "#d44a0a", bar: "#e8720c" },
    { bg: "#eef5ff", border: "#c6dfff", iconBg: "#dae8ff", iconColor: "#2563eb", bar: "#3b82f6" },
    { bg: "#fef0ef", border: "#fcd5d2", iconBg: "#fde2e0", iconColor: "#dc2626", bar: "#ef4444" },
    { bg: "#f5effe", border: "#e0ccff", iconBg: "#ecddff", iconColor: "#7c3aed", bar: "#8b5cf6" },
    { bg: "#edfaf4", border: "#b8ecd0", iconBg: "#d0f5e2", iconColor: "#0d8043", bar: "#10b981" },
  ];

  const statCards = [
    { icon: <FaDatabase />, value: totals.departments, label: t.departments_suffix },
    { icon: <FaLayerGroup />, value: totals.categories, label: t.categories_suffix },
    { icon: <FaFileAlt />, value: totals.schemes, label: t.schemes_suffix },
  ];

  return (
    <div className="about-page">
      <section className="about-hero">
        <Container>
          <Row className="align-items-center g-4">
            <Col lg={6}>
              <div className="about-hero-inner">
                <div className="about-hero-badge"><FaDatabase /><span>{t.aboutSrc}</span></div>
                <h1 dangerouslySetInnerHTML={{ __html: t.aboutTitle }} />
                <p>{t.aboutDesc}</p>
                <div className="about-hero-tricolor"><div /><div /><div /></div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="about-hero-stats-grid">
                {statCards.map((card, i) => {
                  const theme = themes[i];
                  return (
                    <div key={card.label} className="about-hero-stat" style={{
                      "--stat-bg": theme.bg, "--stat-border": theme.border,
                      "--stat-icon-bg": theme.iconBg, "--stat-icon-color": theme.iconColor,
                      "--stat-number-color": theme.number,
                    }}>
                      <div className="about-hero-stat-icon">{card.icon}</div>
                      <div className="about-hero-stat-content">
                        <strong>{loading ? "—" : card.value.toLocaleString("en-IN")}</strong>
                        <span>{card.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="about-vm-section">
        <Container>
          <Row className="g-4">
            <Col lg={6}>
              <div className="vm-card vm-vision">
                <div className="vm-header"><div className="vm-icon"><FaEye /></div><h3>{t.visionTitle}</h3></div>
                <p className="vm-quote"><FaQuoteLeft />{t.visionQuote}</p>
                <div className="vm-points">
                  {t.visionPoints.map((point, i) => <div key={i} className="vm-point"><span className="vm-point-icon"><FaCheckCircle /></span><span>{point}</span></div>)}
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="vm-card vm-mission">
                <div className="vm-header"><div className="vm-icon"><FaBullseye /></div><h3>{t.missionTitle}</h3></div>
                <p className="vm-quote"><FaQuoteLeft />{t.missionQuote}</p>
                <div className="vm-points">
                  {t.missionPoints.map((point, i) => <div key={i} className="vm-point"><span className="vm-point-icon"><FaCheckCircle /></span><span>{point}</span></div>)}
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="about-flow-section">
        <Container>
          <div className="about-section-heading"><h2>{t.howSrcWorks}</h2><p>{t.howSrcWorksDesc}</p></div>
          <div className="flow-steps">
            {t.howItWorks.map((step, i) => (
              <div key={step.title} className="flow-step" style={{
                "--step-bg": howThemes[i].bg, "--step-border": howThemes[i].border,
                "--step-icon-bg": howThemes[i].iconBg, "--step-icon-color": howThemes[i].iconColor,
                "--step-bar": howThemes[i].bar, "--step-delay": `${i * 0.1}s`,
              }}>
                <div className="flow-step-number">{i + 1}</div>
                <div className="flow-step-icon">{howIcons[i]}</div>
                <h4>{step.title}</h4><p>{step.desc}</p><div className="flow-step-line" />
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="about-depts-section">
        <Container>
          <div className="about-section-heading">
            <h2>{t.departments}</h2>
            <p>{totals.departments} {t.departments_suffix} · {totals.categories} {t.categories_suffix} · {totals.schemes} {t.schemes_suffix}</p>
          </div>
          {loading && <div className="text-center py-5"><Spinner animation="border" /><p className="mt-2">{t.loading}</p></div>}
          {!loading && error && <Alert variant="danger" className="text-center">{error}<div className="mt-2"><button className="btn btn-outline-danger" onClick={fetchDepartments}>{t.retry}</button></div></Alert>}
          {!loading && !error && departments.length === 0 && <Alert variant="info">{t.noCategories}</Alert>}
          {!loading && !error && (
            <Row className="g-3">
              {departments.map((dept, i) => {
                const categories = dept.categories || [];
                const schemeCount = categories.reduce((sum, cat) => sum + (cat.schemes || []).length, 0);
                const studentCount = categories.reduce((sum, cat) => sum + readCount(cat), 0);
                const theme = themes[i % themes.length];
                return (
                  <Col md={6} lg={4} key={dept.id}>
                    <div className="about-dept-card" style={{
                      "--dept-bg": theme.bg, "--dept-border": theme.border,
                      "--dept-icon-bg": theme.iconBg, "--dept-icon-color": theme.iconColor,
                      "--dept-num-color": theme.number,
                    }}>
                      <div className="about-dept-icon">{deptIcons[i % deptIcons.length]}</div>
                      <h5>{getName(dept, language, "department", "department_hindi")}</h5>
                      <div className="about-dept-meta">
                        <span><strong>{categories.length}</strong> {t.categories_suffix}</span>
                        <span><strong>{schemeCount}</strong> {t.schemes_suffix}</span>
                      </div>
                      <div className="about-dept-meta mt-2">
                        <span><strong>{studentCount.toLocaleString("en-IN")}</strong> {t.registeredStudents}</span>
                      </div>
                      <div className="about-dept-category-list">
                        {categories.map((cat) => (
                          <div className="about-dept-category-row" key={cat.id}>
                            <span>{getName(cat, language, "category", "category_hindi")}</span>
                            <strong>{readCount(cat).toLocaleString("en-IN")}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </Container>
      </section>

      <section className="about-emp-section">
        <Container>
          <div className="about-section-heading"><h2>{t.empowermentTitle}</h2><p>{t.empowermentDesc}</p></div>
          {loading ? <div className="text-center py-4"><Spinner animation="border" /></div> : !error && (
            <Row className="g-4">
              {departments.flatMap((dept) => (dept.categories || []).map((cat) => ({
                ...cat, departmentName: getName(dept, language, "department", "department_hindi"),
              }))).map((cat, i) => {
                const theme = themes[i % themes.length];
                const schemes = cat.schemes || [];
                return (
                  <Col md={6} lg={4} key={cat.id}>
                    <div className="about-emp-card" style={{
                      "--emp-bg": theme.bg, "--emp-border": theme.border,
                      "--emp-icon-bg": theme.iconBg, "--emp-icon-color": theme.iconColor,
                      "--emp-num-color": theme.number,
                    }}>
                      <div className="about-emp-icon">{categoryIcons[i % categoryIcons.length]}</div>
                      <h4>{getName(cat, language, "category", "category_hindi")}</h4>
                      <p>{cat.departmentName}</p>
                      <div className="about-emp-stats">
                        <div><strong>{readCount(cat).toLocaleString("en-IN")}</strong><span>{t.registeredStudents}</span></div>
                        <div className="about-emp-divider" />
                        <div><strong>{schemes.length}</strong><span>{t.schemes_suffix}</span></div>
                      </div>
                      <div className="about-emp-scheme-list">
                        {schemes.length ? schemes.map((scheme) => (
                          <div key={scheme.id} className="about-emp-scheme-row">
                            <span>{getName(scheme, language, "scheme", "scheme_hindi")}</span>
                            <strong>{readCount(scheme).toLocaleString("en-IN")}</strong>
                          </div>
                        )) : <small>{t.noSchemes}</small>}
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          )}
        </Container>
      </section>
    </div>
  );
}
