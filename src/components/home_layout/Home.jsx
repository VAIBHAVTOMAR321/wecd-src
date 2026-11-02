import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
} from "react-bootstrap";

import {
  FaShieldAlt,
  FaBalanceScale,
  FaChild,
  FaHandsHelping,
  FaHeartbeat,
  FaSchool,
  FaRunning,
  FaMapMarkedAlt,
  FaHome,
  FaBriefcase,
  FaBuilding,
  FaHardHat,
  FaBookOpen,
  FaGraduationCap,
  FaLaptop,
  FaArrowRight,
  FaSearch,
  FaCheckCircle,
  FaUsers,
  FaChartLine,
  FaTint,
  FaShoppingCart,
  FaLeaf,
  FaHandHoldingHeart,
  FaDatabase,
  FaFileAlt,
  FaAppleAlt,
} from "react-icons/fa";
import { useLanguage } from "../../context/LanguageContext";

import "./Home.css";
import drcHomeImg from "../../assets/images/drc_home-img.png";

const translations = {
  en: {
    heroBadge: "State Resource Center",
    heroTitle1: "Empowering Children",
    heroTitle2: "Through Information",
    heroDescription: "A centralized digital platform where you can easily find information about departments, schemes, services, objectives, and benefits available for children.",
    exploreButton: "Explore Departments",
    browseButton: "Browse Schemes",
    statDepartments: "Departments",
    statDepartmentsDesc: "Active government bodies",
    statSchemes: "Schemes",
    statSchemesDesc: "Child welfare programs",
    statBeneficiaries: "Beneficiaries",
    statBeneficiariesDesc: "Children reached nationwide",
    howItWorksBadge: "How SRC Works",
    howItWorksTitle: "From Department to Beneficiary",
    howItWorksDescription: "Find information in SRC in a simple and organized way.",
    timelineSteps: ["Department", "Work Area", "Scheme / Service", "Objective", "Benefits"],
    departmentsTitle: "Government Departments",
    departmentsDescription: "Department-wise work, schemes, and services related to children in one place.",
    studentsSuffix: "Students",
    schemesSuffix: "Schemes",
    statsTitle: "Department Statistics",
    statsDescription: "A graphical overview of student and scheme counts across various departments.",
    statsStudentsTitle: "Registered Students",
    statsSchemesTitle: "Available Schemes",
    statsShowLess: "Show Less",
    statsShowMore: "more",
    empowermentBadge: "Child Empowerment",
    empowermentTitle: "Key Areas of Child Empowerment",
    empowermentDescription: "Key areas related to children's education, safety, health, and development.",
    beneficiariesLabel: "Beneficiaries",
    schemesByAreaLabel: "Schemes by Area",
    beneficiariesByAreaLabel: "Beneficiaries by Area",
    findSchemesBadge: "For You",
    findSchemesTitle: "Find Schemes by Department",
    findSchemesDescription: "Select a department to see the government schemes relevant to its work area.",
    schemesUnder: "Schemes under",
    noSchemesFound: "No schemes found for this department.",
    objectiveLabel: "Objective",
    eligibilityLabel: "Eligibility",
    benefitsLabel: "Benefits",
    schemesTitle: "Key Schemes & Services",
    schemesDescription: "Get information about the objectives, eligibility, and benefits of the scheme.",
    allDepartments: "All Departments",
    enrolledLabel: "Enrolled",
    activeStatus: "Active",
    statusLabel: "Status",
    departments: [
      { name: "Justice and Legal Advisory Department", workArea: "Child Rights and Legal Aid", studentCount: 1250, schemesCount: 5 },
      { name: "Finance Department", workArea: "Financial assistance and budget for schemes", studentCount: 8500, schemesCount: 8 },
      { name: "Planning Department", workArea: "Planning for state development", studentCount: 3200, schemesCount: 6 },
      { name: "Health and Family Welfare Department", workArea: "Child health, nutrition and medicine", studentCount: 15000, schemesCount: 12 },
      { name: "Education Department", workArea: "Child education, schools and literacy", studentCount: 25000, schemesCount: 15 },
      { name: "Youth Welfare and Sports Department", workArea: "Sports, youth development and talent encouragement", studentCount: 7800, schemesCount: 9 },
      { name: "Panchayati Raj Department", workArea: "Child welfare programs at rural level", studentCount: 11200, schemesCount: 7 },
      { name: "Rural Development Department", workArea: "Development and assistance programs for rural children", studentCount: 9500, schemesCount: 10 },
      { name: "Skill Development and Service Scheme Department", workArea: "Skills and vocational training", studentCount: 6400, schemesCount: 11 },
      { name: "Housing and Urban Development Department", workArea: "Child and family assistance in urban areas", studentCount: 4800, schemesCount: 8 },
      { name: "Labor Department", workArea: "Child labor prevention and welfare of children of workers", studentCount: 2100, schemesCount: 6 },
      { name: "Water Supply Department", workArea: "Availability of clean drinking water", studentCount: 18000, schemesCount: 4 },
      { name: "Food and Civil Supplies Consumer Affairs Department", workArea: "Food security and supply", studentCount: 22000, schemesCount: 5 },
      { name: "Social Welfare Department", workArea: "Social security and welfare", studentCount: 13500, schemesCount: 14 },
      { name: "Agriculture Department", workArea: "Agricultural development and farmer welfare", studentCount: 5600, schemesCount: 9 },
      { name: "Women and Child Development Department", workArea: "Women empowerment and welfare", studentCount: 19800, schemesCount: 18 },
      { name: "Association for Voluntary Action (AVA)", workArea: "Community development through voluntary work", studentCount: 850, schemesCount: 3 },
      { name: "SPOTIKIM, Police Headquarters", workArea: "Law and order and child safety", studentCount: 450, schemesCount: 4 },
    ],
    empowermentAreas: [
      { title: "Child Education", description: "Education and learning opportunities", beneficiaries: 120500, programs: 25 },
      { title: "Child Protection", description: "Safety and child rights", beneficiaries: 55200, programs: 15 },
      { title: "Health & Nutrition", description: "Health and nutrition services", beneficiaries: 210000, programs: 32 },
      { title: "Scholarships", description: "Academic and financial assistance", beneficiaries: 85000, programs: 18 },
      { title: "Skill Development", description: "Skills and vocational training", beneficiaries: 42000, programs: 22 },
      { title: "Digital Literacy", description: "Digital education and awareness", beneficiaries: 75000, programs: 12 },
    ],
    schemes: [
      { studentCount: 95000, name: "Beti Bachao, Beti Padhao", department: "Women and Child Development Department", category: "Protection", objective: "To promote the safety, education, and empowerment of girls.", eligibility: "Girls and their families", benefits: "Promotion of girls' education, safety, and social awareness." },
      { studentCount: 85000, name: "Mid-Day Meal Scheme", department: "Education Department", category: "Nutrition", objective: "To improve school attendance and nutrition levels of children.", eligibility: "Students of eligible schools", benefits: "Provision of nutritious meals in school." },
      { studentCount: 120000, name: "Integrated Child Development Services", department: "Women and Child Development Department", category: "Health", objective: "To improve the health, nutrition, and early development of young children.", eligibility: "Children aged 0-6 years and eligible mothers", benefits: "Nutrition, health check-ups, and Anganwadi services." },
      { studentCount: 45000, name: "Sukanya Samriddhi Yojana", department: "Finance Department", category: "Finance", objective: "To promote savings for a girl child's future education and other needs.", eligibility: "Eligible girl children", benefits: "Savings and financial benefits as per government rules." },
      { studentCount: 15000, name: "Child Labor Prevention and Rehabilitation", department: "Labor Department", category: "Welfare", objective: "To prevent child labor and connect children with education and rehabilitation.", eligibility: "Children affected by child labor", benefits: "Education, skill training, and rehabilitation support." },
    ],
  },
  hi: {
    heroBadge: "राज्य संसाधन केंद्र",
    heroTitle1: "बच्चों को सशक्त बनाना",
    heroTitle2: "सूचना के माध्यम से",
    heroDescription: "एक केंद्रीकृत डिजिटल प्लेटफॉर्म जहाँ आप विभाग, योजनाएँ, सेवाएँ, उद्देश्य और बच्चों के लिए उपलब्ध लाभ आसानी से खोज सकते हैं।",
    exploreButton: "विभागों को अन्वेषण करें",
    browseButton: "योजनाएं ब्राउज़ करें",
    statDepartments: "विभाग",
    statDepartmentsDesc: "सक्रिय सरकारी निकाय",
    statSchemes: "योजनाएं",
    statSchemesDesc: "बाल कल्याण कार्यक्रम",
    statBeneficiaries: "लाभार्थी",
    statBeneficiariesDesc: "देश भर में बच्चों तक पहुंच",
    howItWorksBadge: "डीआरसी कैसे काम करता है",
    howItWorksTitle: "विभाग से लाभार्थी तक",
    howItWorksDescription: "एसआरसी में जानकारी को सरल और व्यवस्थित तरीके से खोजें।",
    timelineSteps: ["विभाग", "कार्य क्षेत्र", "योजना / सेवा", "उद्देश्य", "लाभ"],
    departmentsTitle: "सरकारी विभाग",
    departmentsDescription: "विभागवार कार्य, योजनाएँ और बच्चों से संबंधित सेवाओं की जानकारी एक ही स्थान पर।",
    studentsSuffix: "छात्र",
    schemesSuffix: "योजनाएं",
    statsTitle: "विभाग सांख्यिकी",
    statsDescription: "विभिन्न विभागों में छात्र और योजना गणना का एक ग्राफिकल अवलोकन।",
    statsStudentsTitle: "पंजीकृत छात्र",
    statsSchemesTitle: "उपलब्ध योजनाएं",
    statsShowLess: "कम दिखाएं",
    statsShowMore: "और",
    empowermentBadge: "बाल अधिकारिता",
    empowermentTitle: "बाल अधिकारिता के प्रमुख क्षेत्र",
    empowermentDescription: "बच्चों की शिक्षा, सुरक्षा, स्वास्थ्य और विकास से जुड़े प्रमुख क्षेत्र।",
    beneficiariesLabel: "लाभार्थी",
    schemesByAreaLabel: "क्षेत्र द्वारा योजनाएं",
    beneficiariesByAreaLabel: "क्षेत्र द्वारा लाभार्थी",
    findSchemesBadge: "आपके लिए",
    findSchemesTitle: "विभाग द्वारा योजनाएं खोजें",
    findSchemesDescription: "इसके कार्य क्षेत्र से संबंधित सरकारी योजनाओं को देखने के लिए एक विभाग का चयन करें।",
    schemesUnder: "के तहत योजनाएं",
    noSchemesFound: "इस विभाग के लिए कोई योजना नहीं मिली।",
    objectiveLabel: "उद्देश्य",
    eligibilityLabel: "पात्रता",
    benefitsLabel: "लाभ",
    schemesTitle: "प्रमुख योजनाएं और सेवाएं",
    schemesDescription: "योजना के उद्देश्य, पात्रता और लाभ की जानकारी प्राप्त करें।",
    allDepartments: "सभी विभाग",
    enrolledLabel: "नामांकित",
    activeStatus: "सक्रिय",
    statusLabel: "स्थिति",
    departments: [
        { name: "न्याय एवं विधि परामर्शी विभाग", workArea: "बाल अधिकार एवं कानूनी सहायता", studentCount: 1250, schemesCount: 5 },
        { name: "वित्त विभाग", workArea: "योजनाओं के लिए वित्तीय सहायता एवं बजट", studentCount: 8500, schemesCount: 8 },
        { name: "नियोजन विभाग", workArea: "राज्य के विकास की योजना", studentCount: 3200, schemesCount: 6 },
        { name: "स्वास्थ्य एवं परिवार कल्याण विभाग", workArea: "बाल स्वास्थ्य, पोषण एवं चिकित्सा", studentCount: 15000, schemesCount: 12 },
        { name: "शिक्षा विभाग", workArea: "बाल शिक्षा, विद्यालय एवं साक्षरता", studentCount: 25000, schemesCount: 15 },
        { name: "युवा कल्याण एवं खेल विभाग", workArea: "खेल, युवा विकास एवं प्रतिभा प्रोत्साहन", studentCount: 7800, schemesCount: 9 },
        { name: "पंचायती राज विभाग", workArea: "ग्रामीण स्तर पर बाल कल्याण कार्यक्रम", studentCount: 11200, schemesCount: 7 },
        { name: "ग्राम्य विकास विभाग", workArea: "ग्रामीण बच्चों के विकास एवं सहायता कार्यक्रम", studentCount: 9500, schemesCount: 10 },
        { name: "कौशल विकास एवं सेवा योजना विभाग", workArea: "कौशल एवं व्यावसायिक प्रशिक्षण", studentCount: 6400, schemesCount: 11 },
        { name: "आवास एवं शहरी विकास विभाग", workArea: "शहरी क्षेत्रों में बाल एवं परिवार सहायता", studentCount: 4800, schemesCount: 8 },
        { name: "श्रम विभाग", workArea: "बाल श्रम रोकथाम एवं श्रमिक परिवारों के बच्चों का कल्याण", studentCount: 2100, schemesCount: 6 },
        { name: "पेयजल विभाग", workArea: "स्वच्छ पेयजल की उपलब्धता", studentCount: 18000, schemesCount: 4 },
        { name: "खाद्य एवं नागरिक आपूर्ति उपभोक्ता विभाग", workArea: "खाद्य सुरक्षा और आपूर्ति", studentCount: 22000, schemesCount: 5 },
        { name: "समाज कल्याण विभाग", workArea: "सामाजिक सुरक्षा और कल्याण", studentCount: 13500, schemesCount: 14 },
        { name: "कृषि विभाग", workArea: "कृषि विकास और किसान कल्याण", studentCount: 5600, schemesCount: 9 },
        { name: "महिला कल्याण विभाग", workArea: "महिला सशक्तिकरण एवं कल्याण", studentCount: 19800, schemesCount: 18 },
        { name: "एसोसिएशन फॉर वॉलंटरी एक्शन (AVA)", workArea: "स्वैच्छिक कार्यों के माध्यम से सामुदायिक विकास", studentCount: 850, schemesCount: 3 },
        { name: "एसपीओटीकाईएम, पुलिस मुख्यालय", workArea: "कानून व्यवस्था और बाल सुरक्षा", studentCount: 450, schemesCount: 4 },
    ],
    empowermentAreas: [
        { title: "बाल शिक्षा", description: "शिक्षा एवं सीखने के अवसर", beneficiaries: 120500, programs: 25 },
        { title: "बाल संरक्षण", description: "सुरक्षा एवं बाल अधिकार", beneficiaries: 55200, programs: 15 },
        { title: "स्वास्थ्य एवं पोषण", description: "स्वास्थ्य एवं पोषण सेवाएँ", beneficiaries: 210000, programs: 32 },
        { title: "छात्रवृत्ति", description: "शैक्षणिक एवं वित्तीय सहायता", beneficiaries: 85000, programs: 18 },
        { title: "कौशल विकास", description: "कौशल एवं व्यावसायिक प्रशिक्षण", beneficiaries: 42000, programs: 22 },
        { title: "डिजिटल साक्षरता", description: "डिजिटल शिक्षा एवं जागरूकता", beneficiaries: 75000, programs: 12 },
    ],
    schemes: [
        { studentCount: 95000, name: "बेटी बचाओ, बेटी पढ़ाओ", department: "महिला कल्याण विभाग", category: "Protection", objective: "बालिकाओं की सुरक्षा, शिक्षा एवं सशक्तिकरण को बढ़ावा देना।", eligibility: "बालिकाएँ एवं उनके परिवार", benefits: "बालिकाओं की शिक्षा, सुरक्षा एवं सामाजिक जागरूकता को बढ़ावा।" },
        { studentCount: 85000, name: "मध्याह्न भोजन योजना", department: "शिक्षा विभाग", category: "Nutrition", objective: "बच्चों की विद्यालय में उपस्थिति और पोषण स्तर में सुधार करना।", eligibility: "पात्र विद्यालयों के विद्यार्थी", benefits: "विद्यालय में पौष्टिक भोजन की सुविधा।" },
        { studentCount: 120000, name: "एकीकृत बाल विकास सेवाएँ", department: "महिला कल्याण विभाग", category: "Health", objective: "छोटे बच्चों के स्वास्थ्य, पोषण और प्रारंभिक विकास में सुधार करना।", eligibility: "0–6 वर्ष के बच्चे एवं पात्र माताएँ", benefits: "पोषण, स्वास्थ्य जांच एवं आंगनवाड़ी सेवाएँ।" },
        { studentCount: 45000, name: "सुकन्या समृद्धि योजना", department: "वित्त विभाग", category: "Finance", objective: "बालिका के भविष्य की शिक्षा एवं अन्य आवश्यकताओं के लिए बचत को बढ़ावा देना।", eligibility: "पात्र बालिकाएँ", benefits: "बचत एवं सरकारी नियमों के अनुसार वित्तीय लाभ।" },
        { studentCount: 15000, name: "बाल श्रम रोकथाम एवं पुनर्वास", department: "श्रम विभाग", category: "Welfare", objective: "बाल श्रम को रोकना तथा बच्चों को शिक्षा एवं पुनर्वास से जोड़ना।", eligibility: "बाल श्रम से प्रभावित बच्चे", benefits: "शिक्षा, कौशल प्रशिक्षण एवं पुनर्वास सहायता।" },
    ],
  }
};

const departmentIcons = [
    <FaBalanceScale />, <FaHandsHelping />, <FaChartLine />, <FaHeartbeat />, <FaSchool />,
    <FaRunning />, <FaMapMarkedAlt />, <FaHome />, <FaBriefcase />, <FaBuilding />,
    <FaHardHat />, <FaTint />, <FaShoppingCart />, <FaUsers />, <FaLeaf />,
    <FaChild />, <FaHandHoldingHeart />, <FaShieldAlt />,
];

const departmentColors = [
    "#e7f5ff", "#fff8e1", "#eaf6f5", "#fdeee9", "#e4f8fb", "#f6eefe", "#f0f9e6",
    "#fff9e6", "#e0f7fa", "#fef0f5", "#f9fbe7", "#ebf9f8", "#fff5f7", "#f3eef2",
    "#edf8f3", "#fef3f7", "#fffde6", "#eeeffd"
];

const departmentIconColors = [
    "#8ecae6", "#fca311", "#2a9d8f", "#e76f51", "#48cae4", "#c77dff", "#70e000",
    "#ffbe0b", "#00b4d8", "#f72585", "#c0d628", "#ade8f4", "#ff8fab", "#b5838d",
    "#52b788", "#f78fb3", "#ffdd00", "#a2a6f0"
];

const empowermentIcons = [
    <FaBookOpen />, <FaShieldAlt />, <FaHeartbeat />, <FaGraduationCap />, <FaBriefcase />, <FaLaptop />
];

const schemeIcons = {
    Protection: <FaShieldAlt />,
    Nutrition: <FaLeaf />,
    Health: <FaHeartbeat />,
    Finance: <FaBriefcase />,
    Welfare: <FaHandsHelping />,
};

const categoryColors = {
  Protection: "#7c3aed",
  Nutrition: "#16a34a",
  Health: "#dc2626",
  Finance: "#0ea5e9",
  Welfare: "#f59e0b",
};

const statRingSegments = [
  { label: 'Education', percent: 35, color: '#1a5276' },
  { label: 'Health', percent: 25, color: '#e74c3c' },
  { label: 'Nutrition', percent: 20, color: '#138808' },
  { label: 'Protection', percent: 12, color: '#8e44ad' },
  { label: 'Welfare', percent: 8, color: '#FF9933' },
];
// =====================================================
// HOME COMPONENT
// =====================================================

function Home() {
  const { language } = useLanguage();
  const t = translations[language];

  const [apiDepartments, setApiDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      try {
        const response = await fetch('https://mahadevaaya.com/srcproject/srcproject_backend/api/departments/');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setApiDepartments(data.data || []);
        setDepartmentsError(null);
      } catch (err) {
        setDepartmentsError(err.message);
        setApiDepartments([]);
      } finally {
        setDepartmentsLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  // All department, category and scheme records are read from the departments API.
  const departments = apiDepartments.map((dept, i) => {
    const categories = dept.categories || [];
    return {
      id: dept.id,
      name: language === "en" ? dept.department : (dept.department_hindi || dept.department),
      studentCount: categories.reduce((sum, category) => sum + Number(category.registered_student_count || 0), 0),
      schemesCount: categories.reduce((sum, category) => sum + (category.schemes || []).length, 0),
      icon: departmentIcons[i % departmentIcons.length],
      cardColor: departmentColors[i % departmentColors.length],
      color: departmentIconColors[i % departmentIconColors.length],
    };
  });

  const empowermentAreas = apiDepartments.flatMap((dept) => (dept.categories || []).map((category, i) => ({
    title: language === "en" ? category.category : (category.category_hindi || category.category),
    beneficiaries: Number(category.registered_student_count || 0),
    programs: (category.schemes || []).length,
    icon: empowermentIcons[i % empowermentIcons.length],
  })));

  const schemes = apiDepartments.flatMap((dept) => (dept.categories || []).flatMap((category) =>
    (category.schemes || []).map((scheme) => ({
      id: scheme.id,
      name: language === "en" ? scheme.scheme : (scheme.scheme_hindi || scheme.scheme),
      department: language === "en" ? dept.department : (dept.department_hindi || dept.department),
      category: language === "en" ? category.category : (category.category_hindi || category.category),
      studentCount: Number(scheme.registered_student_count || 0),
      icon: <FaBookOpen />,
    }))
  ));
  const schemeDepartments = [t.allDepartments, ...Array.from(new Set(schemes.map((scheme) => scheme.department)))];
  
  const [activeSchemeDepartment, setActiveSchemeDepartment] = useState(t.allDepartments);
  const [studentLegendExpanded, setStudentLegendExpanded] = useState(false);
  const [schemeLegendExpanded, setSchemeLegendExpanded] = useState(false);
  const [hoverStat, setHoverStat] = useState(null);
  const [expandedDepartment, setExpandedDepartment] = useState(null);

  const totalSchemes = schemes.length;

  const allCategories = apiDepartments.flatMap((dept) => dept.categories || []);
  const schemeMax = allCategories.length > 0 ? Math.max(...allCategories.map((c) => c.schemes?.length || 0)) : 0;

  const categories = empowermentAreas.slice(0, 5).map((category, i) => ({ label: category.title, icon: category.icon, color: ['#1a5276', '#e74c3c', '#27ae60', '#8e44ad', '#FF9933'][i], count: category.beneficiaries }));
  // inside your component:
  const [activeCard, setActiveCard] = useState(null);
  const [activeTag, setActiveTag] = useState(null);
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: "",
    x: 0,
    y: 0,
  });

  const filteredSchemes =
    activeSchemeDepartment === t.allDepartments
      ? schemes : activeSchemeDepartment === "All Departments" ? schemes
      : schemes.filter((scheme) => scheme.department === activeSchemeDepartment);

  const handleSchemeDepartmentSelect = (department) => {
    setActiveSchemeDepartment(department);
  };
const statCards = [
  { key: 'dept', icon: <FaDatabase />, label: t.statDepartments, value: departments.length, suffix: '+', color: '#FF9933', desc: t.statDepartmentsDesc },
  { key: 'scheme', icon: <FaFileAlt />, label: t.statSchemes, value: totalSchemes.toLocaleString('en-IN'), suffix: '+', color: '#1a5276', desc: t.statSchemesDesc },
];
  const generateConicGradient = (data, key, colors) => {
    const total = data.reduce((sum, item) => sum + item[key], 0);
    if (!data.length || total <= 0) return "conic-gradient(#e5e7eb 0% 100%)";
    let cumulativePercentage = 0;
    const gradientParts = data.map((item, index) => {
      const percentage = (item[key] / total) * 100;
      const start = cumulativePercentage;
      cumulativePercentage += percentage;
      const end = cumulativePercentage;
      return `${colors[index]} ${start}% ${end}%`;
    });
    return `conic-gradient(${gradientParts.join(", ")})`;
  };

  const sortedByStudent = [...departments].sort((a, b) => b.studentCount - a.studentCount);
  const studentChartGradient = generateConicGradient(
    sortedByStudent,
    'studentCount',
    sortedByStudent.map(d => d.color)
  );

  const sortedBySchemes = [...departments].sort((a, b) => b.schemesCount - a.schemesCount);
  const schemeChartGradient = generateConicGradient(
    sortedBySchemes,
    'schemesCount',
    sortedBySchemes.map(d => d.color)
  );

  const handleMouseMove = (e, data, key) => {
    const chart = e.currentTarget;
    const rect = chart.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const angle = (Math.atan2(y - centerY, x - centerX) * 180 / Math.PI + 450) % 360;
    const percentage = angle / 360;

    const total = data.reduce((sum, item) => sum + item[key], 0);
    if (!data.length || total <= 0) return "conic-gradient(#e5e7eb 0% 100%)";
    let cumulativePercentage = 0;

    let foundDept = null;
    for (const item of data) {
        const itemPercentage = item[key] / total;
        if (percentage >= cumulativePercentage && percentage < cumulativePercentage + itemPercentage) {
            foundDept = item;
            break;
        }
        cumulativePercentage += itemPercentage;
    }

    if (foundDept) {
        setTooltip({
            visible: true,
            content: `${foundDept.name}: ${foundDept[key].toLocaleString('en-IN')}`,
            x: e.clientX,
            y: e.clientY,
        });
    }
};

const handleMouseLeave = () => {
    setTooltip({ visible: false, content: '', x: 0, y: 0 });
};
  const handleScroll = (id) => { // This closing brace was incorrect
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="drc-home">
      {tooltip.visible && (
        <div className="chart-tooltip" style={{ top: tooltip.y, left: tooltip.x }}>
          {tooltip.content}
        </div>
      )}


      {/* =================================================
          HERO
      ================================================= */}

<section className="drc-hero">
  <Container>
    <Row className="align-items-stretch hero-row">

      {/* ===== LEFT — CONTENT + INTERACTIVE STATS ===== */}
      <Col lg={7} className="hero-left">

        <div className="hero-badge">
          <FaDatabase />
          <span>{t.heroBadge}</span>
        </div>

        <h1>
          {t.heroTitle1}
          <span>{t.heroTitle2}</span>
        </h1>

        <p>
          {t.heroDescription}
        </p>

        {/* Interactive Stat Cards Row */}
        <div className="hero-stat-cards">
          {statCards.map((stat) => (
            <div
              key={stat.key}
              className={`stat-card ${hoverStat === stat.key ? 'stat-card-active' : ''}`}
              style={{ '--stat-color': stat.color }}
              onMouseEnter={() => setHoverStat(stat.key)}
              onMouseLeave={() => setHoverStat(null)}
            >
              <div className="stat-card-icon">{stat.icon}</div>
              <div className="stat-card-body">
                <strong>{stat.value}<small>{stat.suffix}</small></strong>
                <span>{stat.label}</span>
              </div>
              <div className="stat-card-desc">
                <FaArrowRight />
                <span>{stat.desc}</span>
              </div>
              <div className="stat-card-bar" />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="hero-buttons">
          <Button className="primary-btn" onClick={() => handleScroll("departments")}>
            {t.exploreButton} <FaArrowRight />
          </Button>
          <Button className="secondary-btn" onClick={() => handleScroll("schemes")}>
            {t.browseButton}
          </Button>
        </div>

        {/* Interactive Category Tags */}
        <div className="hero-categories">
          {categories.map((cat, i) => (
            <div
              key={i}
              className={`cat-tag ${activeTag === i ? 'cat-tag-active' : ''}`}
              style={{ '--cat-color': cat.color, '--cat-delay': `${i * 0.07}s` }}
              onMouseEnter={() => setActiveTag(i)}
              onMouseLeave={() => setActiveTag(null)}
            >
              <span className="cat-icon">{cat.icon}</span>
              <span className="cat-label">{cat.label}</span>
              <span className="cat-count">{cat.count}</span>
            </div>
          ))}
        </div>

      </Col>


      {/* ===== RIGHT — IMAGE + DATA PANEL ===== */}
      <Col lg={5} className="hero-right">

        <div className="right-panel">

          {/* Full Image */}
          <div className="panel-image">
            <img src={drcHomeImg} alt="Children Education and Empowerment" />
            <div className="panel-image-overlay" />

          </div>

          {/* Data strip below image */}
          <div className="panel-data-strip">
            <div className="strip-item">
              <div className="strip-icon" style={{ background: '#FF9933' }}><FaDatabase /></div>
              <div>
                <strong>{departments.length}+</strong>
                <span>{t.statDepartments}</span>
              </div>
            </div>
            <div className="strip-divider" />
            <div className="strip-item">
              <div className="strip-icon" style={{ background: '#1a5276' }}><FaFileAlt /></div>
              <div>
                <strong>{totalSchemes.toLocaleString('en-IN')}+</strong>
                <span>{t.statSchemes}</span>
              </div>
            </div>
            <div className="strip-divider" />
            <div className="strip-item">
              <div className="strip-icon" style={{ background: '#138808' }}><FaCheckCircle /></div>
              <div>
                <strong>{t.activeStatus}</strong>
                <span>{t.statusLabel}</span>
              </div>
            </div>
          </div>

          {/* Mini progress section */}
          <div className="panel-progress">
            {[
              { label: 'Education', pct: 35, color: '#1a5276' },
              { label: 'Health', pct: 25, color: '#e74c3c' },
              { label: 'Nutrition', pct: 20, color: '#27ae60' },
              { label: 'Protection', pct: 12, color: '#8e44ad' },
              { label: 'Welfare', pct: 8, color: '#FF9933' },
            ].map((bar, i) => (
              <div key={i} className="progress-row">
                <span className="progress-label">{bar.label}</span>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${bar.pct}%`, background: bar.color }} />
                </div>
                <span className="progress-pct">{bar.pct}%</span>
              </div>
            ))}
          </div>

          {/* Tricolor footer */}
          <div className="panel-tricolor">
            <div style={{ background: '#FF9933' }} />
            <div style={{ background: '#ffffff' }} />
            <div style={{ background: '#138808' }} />
          </div>

        </div>

      </Col>

    </Row>
  </Container>
</section>


   


      {/* =================================================
          HOW IT WORKS
      ================================================= */}

      <section className="section flow-section section-padding">

        <Container>

          <div className="section-heading">

            <Badge>{t.howItWorksBadge}</Badge>

            <h2>
              {t.howItWorksTitle}
            </h2>

            <p>
              {t.howItWorksDescription}
            </p>

          </div>


          <div className="timeline-container">
            <div className="timeline-item">
              <div className="timeline-icon"><FaBuilding /></div>
              <div className="timeline-content">
                <span className="timeline-step">{language === 'en' ? 'Step' : 'चरण'} 1</span>
                <h5>{t.timelineSteps[0]}</h5>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-icon"><FaBriefcase /></div>
              <div className="timeline-content">
                <span className="timeline-step">{language === 'en' ? 'Step' : 'चरण'} 2</span>
                <h5>{t.timelineSteps[1]}</h5>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-icon"><FaBookOpen /></div>
              <div className="timeline-content">
                <span className="timeline-step">{language === 'en' ? 'Step' : 'चरण'} 3</span>
                <h5>{t.timelineSteps[2]}</h5>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-icon"><FaGraduationCap /></div>
              <div className="timeline-content">
                <span className="timeline-step">{language === 'en' ? 'Step' : 'चरण'} 4</span>
                <h5>{t.timelineSteps[3]}</h5>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-icon"><FaHandsHelping /></div>
              <div className="timeline-content">
                <span className="timeline-step">{language === 'en' ? 'Step' : 'चरण'} 5</span>
                <h5>{t.timelineSteps[4]}</h5>
              </div>
            </div>
          </div>

        </Container>

      </section>


      {/* =================================================
          DEPARTMENTS
      ================================================= */}

      <section id="departments" className="section departments-section section-padding">

        <Container>

          <div className="section-heading">
           

            <h2>
              {t.departmentsTitle}
            </h2>

            <p>
              {t.departmentsDescription}
            </p>
          </div>


          {departmentsLoading ? (
            <div className="text-center py-5">
              {language === 'en' ? 'Loading departments...' : 'विभाग लोड हो रहे हैं...'}
            </div>
          ) : departmentsError ? (
            <div className="text-center py-5 text-danger">
              {departmentsError}
            </div>
          ) : (
            <Row className="g-4">
              {apiDepartments.map((dept) => {
                const idx = apiDepartments.indexOf(dept);
                const icon = departmentIcons[idx % departmentIcons.length];
                const cardColor = departmentColors[idx % departmentColors.length];
                const color = departmentIconColors[idx % departmentIconColors.length];
                const categoryCount = dept.categories?.length || 0;
                const schemeCount = dept.categories?.reduce((sum, c) => sum + (c.schemes?.length || 0), 0) || 0;
                const isExpanded = expandedDepartment === dept.id;
                return (
                  <Col md={6} lg={4} xl={3} key={dept.id}>
                    <Card
                      className={`department-card ${isExpanded ? 'department-card-expanded' : ''}`}
                      style={{ backgroundColor: cardColor, cursor: 'pointer' }}
                      onClick={() => setExpandedDepartment(expandedDepartment === dept.id ? null : dept.id)}
                    >
                      <Card.Body>
                        <div className="department-header">
                          <div className="department-icon" style={{ background: color, color: '#fff' }}>{icon}</div>
                          <div>
                            <h5>{language === 'en' ? dept.department : dept.department_hindi}</h5>
                            <span className="expand-indicator">{isExpanded ? '&#9650;' : '&#9660;'}</span>
                          </div>
                        </div>

                        <div className="department-stats">
                          <div>
                            <strong>{categoryCount}</strong>
                            <small>{language === 'en' ? 'Categories' : 'श्रेणियां'}</small>
                          </div>
                          <div>
                            <strong>{schemeCount}</strong>
                            <small>{language === 'en' ? 'Schemes' : 'योजनाएं'}</small>
                          </div>
                        </div>

                        {isExpanded && (
                          <>
                            <div className="department-categories-expanded">
                              {dept.categories?.map((cat) => (
                                <div key={cat.id} className="department-category-expanded">
                                  <h6>
                                    <span>{language === 'en' ? cat.category : (cat.category_hindi || cat.category)}</span>
                                    <span className="registered-count-badge">
                                      {Number(cat.registered_student_count || 0).toLocaleString('en-IN')} {t.studentsSuffix}
                                    </span>
                                  </h6>
                                  <div className="department-schemes-expanded">
                                    {cat.schemes?.map((sch) => (
                                      <span key={sch.id} className="department-scheme-expanded">
                                        <span>{language === 'en' ? sch.scheme : (sch.scheme_hindi || sch.scheme)}</span>
                                        <strong className="scheme-registered-count">
                                          {Number(sch.registered_student_count || 0).toLocaleString('en-IN')} {t.studentsSuffix}
                                        </strong>
                                      </span>
                                    ))}
                                    {!cat.schemes || cat.schemes.length === 0 && <span className="text-muted small">{t.noSchemesFound}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}

        </Container>

      </section>

      {/* =================================================
          DEPARTMENT STATS
      ================================================= */}

      <section id="department-stats" className="section department-stats-section">
        <Container>
          <div className="section-heading">
            <h2>{t.statsTitle}</h2>
            <p>{t.statsDescription}</p>
          </div>

          <Row className="g-5">
            <Col lg={6}>
              <div className="pie-chart-card">
                <h4 className="chart-title">{t.statsStudentsTitle}</h4>
                <div className="pie-chart-wrapper">
                  <div
                    className="pie-chart"
                    style={{ background: studentChartGradient }}
                    onMouseMove={(e) => handleMouseMove(e, sortedByStudent, 'studentCount')}
                    onMouseLeave={handleMouseLeave}
                  ></div>
                  <ul className="pie-chart-legend">
                    {sortedByStudent.slice(0, studentLegendExpanded ? sortedByStudent.length : 5).map((dept, index) => (
                      <li key={index}>
                        <span className="legend-color" style={{ backgroundColor: dept.color }}></span>
                        <span className="legend-label">{dept.name}</span>
                        <span className="legend-value">{dept.studentCount.toLocaleString('en-IN')}</span>
                      </li>
                    ))}
                    {sortedByStudent.length > 5 && (
                      <li className="legend-toggle" onClick={() => setStudentLegendExpanded(!studentLegendExpanded)}>
                        {studentLegendExpanded ? t.statsShowLess : `... ${language === 'en' ? 'and' : 'और'} ${sortedByStudent.length - 5} ${t.statsShowMore}`}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </Col>

            <Col lg={6}>
              <div className="pie-chart-card">
                <h4 className="chart-title">{t.statsSchemesTitle}</h4>
                <div className="pie-chart-wrapper">
                  <div
                    className="pie-chart"
                    style={{ background: schemeChartGradient }}
                    onMouseMove={(e) => handleMouseMove(e, sortedBySchemes, 'schemesCount')}
                    onMouseLeave={handleMouseLeave}
                  ></div>
                  <ul className="pie-chart-legend">
                    {sortedBySchemes.slice(0, schemeLegendExpanded ? sortedBySchemes.length : 5).map((dept, index) => (
                      <li key={index}>
                        <span className="legend-color" style={{ backgroundColor: dept.color }}></span>
                        <span className="legend-label">{dept.name}</span>
                        <span className="legend-value">{dept.schemesCount}</span>
                      </li>
                    ))}
                    {sortedBySchemes.length > 5 && (
                       <li className="legend-toggle" onClick={() => setSchemeLegendExpanded(!schemeLegendExpanded)}>
                         {schemeLegendExpanded ? t.statsShowLess : `... ${language === 'en' ? 'and' : 'और'} ${sortedBySchemes.length - 5} ${t.statsShowMore}`}
                       </li>
                    )}
                  </ul>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>


      {/* =================================================
          CHILD EMPOWERMENT
      ================================================= */}

      <section className="section empowerment-section section-padding">

        <Container>

          <div className="section-heading light-heading">

            <Badge>{t.empowermentBadge}</Badge>

            <h2>
              {t.empowermentTitle}
            </h2>

            <p>
              {t.empowermentDescription}
            </p>

          </div>


          <Row className="g-5 align-items-center">
            <Col lg={6}>
              <div className="empowerment-list">
                {allCategories.map((cat, index) => {
                  const schemeCount = cat.schemes?.length || 0;
                  return (
                    <div className="empowerment-item" key={cat.id}>
                      <div className="empowerment-item-icon">
                        {empowermentIcons[index % empowermentIcons.length]}
                      </div>
                      <div className="empowerment-item-content">
                        <h5>{language === 'en' ? cat.category : cat.category_hindi}</h5>
                        <p>{schemeCount} {t.schemesSuffix}</p>
                      </div>
                      <div className="empowerment-item-stats">
                        <div>
                          <strong>{schemeCount}</strong>
                          <small>{t.schemesSuffix}</small>
                        </div>
                      </div>
                      <div className="empowerment-item-arrow">
                        <FaArrowRight />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Col>
            <Col lg={6}>
              <div className="empowerment-chart-container">
                <div className="empowerment-chart">
                  <h5 className="empowerment-chart-title">{t.schemesByAreaLabel}</h5>
                  {allCategories.map((cat) => (
                    <div className="bar-chart-item" key={cat.id}>
                      <div className="bar-chart-label">{language === 'en' ? cat.category : cat.category_hindi}</div>
                      <div className="bar-chart-bar-wrapper">
                        <div
                          className="bar-chart-bar scheme-bar"
                          style={{ width: `${schemeMax > 0 ? ((cat.schemes?.length || 0) / schemeMax) * 100 : 0}%` }}
                        >
                          <span>{cat.schemes?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Col>
          </Row>


        </Container>

      </section>


      {/* =================================================
          SCHEMES
      ================================================= */}

      <section id="schemes" className="section schemes-section section-padding">

        <Container>

          <div className="section-heading">

            <Badge>{t.schemesTitle}</Badge>

            <h2>
             {t.schemesTitle}
            </h2>

            <p>
              {t.schemesDescription}
            </p>

          </div>

          <div className="schemes-filters-row">
            {schemeDepartments.map((dept, index) => (
              <button
                key={index}
                className={`scheme-pill ${activeSchemeDepartment === dept ? 'active' : ''}`}
                onClick={() => handleSchemeDepartmentSelect(dept)}
              >
                {dept}
              </button>
            ))}
          </div>

          <Row className="g-4 scheme-card-grid">
            {filteredSchemes.map((scheme, index) => (
              <Col lg={4} md={6} key={index}>
                <div className="scheme-card">
                  <div className="scheme-card-accent" />
                  <div className="scheme-card-header">
                    <div className="scheme-badge" style={{ backgroundColor: categoryColors[scheme.category] || "#1a5276" }}>
                      <span className="scheme-badge-dot" />
                      {scheme.category}
                    </div>
                    <div className="scheme-card-icon">
                      {scheme.icon}
                    </div>
                  </div>

                  <div className="scheme-card-body">
                    <h3>{scheme.name}</h3>
                    <p className="scheme-card-meta">{scheme.department}</p>
                    <p className="scheme-registered-total">
                      <strong>{scheme.studentCount.toLocaleString('en-IN')}</strong>
                      <span>{t.studentsSuffix}</span>
                    </p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

        </Container>

      </section>


   
     


     

   

    </div>
  );
}

export default Home;