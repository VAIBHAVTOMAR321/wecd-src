import React, { useCallback, useEffect, useMemo, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  FaBuilding,
  FaEdit,
  FaEye,
  FaLayerGroup,
  FaPlus,
  FaSearch,
  FaSave,
  FaTrash,
  FaTimes,
} from "react-icons/fa";
import StateLeftNav from "./StateLeftNav";
import StateTopNav from "./StateTopNav";
import "./StateDepartmentManage.css";

const BASE_URL =
  "https://mahadevaaya.com/srcproject/srcproject_backend/api/departments/";

const emptyForm = () => ({
  department_id: "",
  department: "",
  department_hindi: "",
  categories: [],
});

const getAccessToken = () => {
  // The project's AuthContext login flow stores the JWT as "accessToken".
  // Keep fallbacks for older login screens that used other storage keys.
  const storageKeys = ["accessToken", "access", "access_token"];

  for (const key of storageKeys) {
    const localValue = localStorage.getItem(key);
    if (localValue) return localValue;
  }

  for (const key of storageKeys) {
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue) return sessionValue;
  }

  // Some login flows persist the complete login response as `user`.
  try {
    const savedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (savedUser?.access) return savedUser.access;
    if (savedUser?.accessToken) return savedUser.accessToken;
  } catch (error) {
    console.warn("Unable to read saved login data:", error);
  }

  return null;
};

const parseResponse = async (response) => {
  const raw = await response.text();
  let body = {};
  try {
    body = raw ? JSON.parse(raw) : {};
  } catch {
    body = { message: raw || "The server returned an unreadable response." };
  }

  if (!response.ok) {
    const detail = body.message || body.error || body.detail;
    const validation = body.errors
      ? Object.entries(body.errors)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(", ") : JSON.stringify(errors)}`)
          .join(" | ")
      : "";
    throw new Error(detail || validation || `Request failed (${response.status})`);
  }
  return body;
};

const requestOptions = (method, body) => {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Your State access token was not found. The login flow should save the JWT as accessToken. Please log in again, then retry.");
  }
  return {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
};

const StateDepartmentManage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [formData, setFormData] = useState(emptyForm);
  const [pendingCategoryDeletes, setPendingCategoryDeletes] = useState([]);
  const [pendingSchemeDeletes, setPendingSchemeDeletes] = useState([]);

  const [showViewModal, setShowViewModal] = useState(false);
  const [viewDept, setViewDept] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

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

  const fetchDepartments = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const response = await fetch(BASE_URL, { method: "GET", headers: { Accept: "application/json" } });
      const data = await parseResponse(response);
      const rows = Array.isArray(data) ? data : data.data;
      setDepartments(Array.isArray(rows) ? rows : []);
      setApiError("");
    } catch (error) {
      setApiError(error.message || "Unable to fetch departments.");
      setDepartments([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const filteredDepartments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return departments;
    return departments.filter((department) => {
      const categoryText = (department.categories || [])
        .map((category) => `${category.category || ""} ${category.category_hindi || ""} ${(category.schemes || []).map((scheme) => `${scheme.scheme || ""} ${scheme.scheme_hindi || ""}`).join(" ")}`)
        .join(" ");
      return `${department.department || ""} ${department.department_hindi || ""} ${categoryText}`.toLowerCase().includes(term);
    });
  }, [departments, search]);

  const totalCategories = departments.reduce((sum, dept) => sum + (dept.categories || []).length, 0);
  const totalSchemes = departments.reduce(
    (sum, dept) => sum + (dept.categories || []).reduce((inner, category) => inner + (category.schemes || []).length, 0),
    0
  );

  const closeFormModal = () => {
    if (saving) return;
    setShowFormModal(false);
    setFormData(emptyForm());
    setPendingCategoryDeletes([]);
    setPendingSchemeDeletes([]);
  };

  const openAddForm = () => {
    setFormMode("add");
    setFormData(emptyForm());
    setPendingCategoryDeletes([]);
    setPendingSchemeDeletes([]);
    setApiError("");
    setShowFormModal(true);
  };

  const openEditForm = (department) => {
    setFormMode("edit");
    setFormData({
      department_id: department.id,
      department: department.department || "",
      department_hindi: department.department_hindi || "",
      categories: (department.categories || []).map((category) => ({
        ...category,
        schemes: (category.schemes || []).map((scheme) => ({ ...scheme })),
      })),
    });
    setPendingCategoryDeletes([]);
    setPendingSchemeDeletes([]);
    setApiError("");
    setShowFormModal(true);
  };

  const updateCategory = (categoryIndex, field, value) => {
    setFormData((current) => ({
      ...current,
      categories: current.categories.map((category, index) =>
        index === categoryIndex ? { ...category, [field]: value } : category
      ),
    }));
  };

  const updateScheme = (categoryIndex, schemeIndex, field, value) => {
    setFormData((current) => ({
      ...current,
      categories: current.categories.map((category, index) =>
        index === categoryIndex
          ? {
              ...category,
              schemes: (category.schemes || []).map((scheme, innerIndex) =>
                innerIndex === schemeIndex ? { ...scheme, [field]: value } : scheme
              ),
            }
          : category
      ),
    }));
  };

  const addCategory = () => {
    setFormData((current) => ({
      ...current,
      categories: [...current.categories, { category: "", category_hindi: "", schemes: [] }],
    }));
  };

  const removeCategory = (categoryIndex) => {
    const category = formData.categories[categoryIndex];
    if (formMode === "edit" && category.id) {
      setPendingCategoryDeletes((current) => [...current, category.id]);
    }
    setPendingSchemeDeletes((current) =>
      current.filter((item) => item.categoryId !== category.id)
    );
    setFormData((current) => ({
      ...current,
      categories: current.categories.filter((_, index) => index !== categoryIndex),
    }));
  };

  const addScheme = (categoryIndex) => {
    setFormData((current) => ({
      ...current,
      categories: current.categories.map((category, index) =>
        index === categoryIndex
          ? { ...category, schemes: [...(category.schemes || []), { scheme: "", scheme_hindi: "" }] }
          : category
      ),
    }));
  };

  const removeScheme = (categoryIndex, schemeIndex) => {
    const category = formData.categories[categoryIndex];
    const scheme = (category.schemes || [])[schemeIndex];
    if (formMode === "edit" && scheme?.id) {
      setPendingSchemeDeletes((current) => [...current, { id: scheme.id, categoryId: category.id }]);
    }
    setFormData((current) => ({
      ...current,
      categories: current.categories.map((item, index) =>
        index === categoryIndex
          ? { ...item, schemes: (item.schemes || []).filter((_, innerIndex) => innerIndex !== schemeIndex) }
          : item
      ),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setApiError("");
    setApiSuccess("");

    if (!formData.department.trim() || !formData.department_hindi.trim()) {
      setApiError("Please enter the department name in both English and Hindi.");
      return;
    }
    for (let i = 0; i < formData.categories.length; i += 1) {
      const category = formData.categories[i];
      if (!category.category?.trim() || !category.category_hindi?.trim()) {
        setApiError(`Please complete both names for Category ${i + 1}.`);
        return;
      }
      for (let j = 0; j < (category.schemes || []).length; j += 1) {
        const scheme = category.schemes[j];
        if (!scheme.scheme?.trim() || !scheme.scheme_hindi?.trim()) {
          setApiError(`Please complete both names for Scheme ${j + 1} in Category ${i + 1}.`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const payload = {
        department: formData.department.trim(),
        department_hindi: formData.department_hindi.trim(),
        categories: formData.categories.map((category) => ({
          ...(category.id ? { id: category.id } : {}),
          category: category.category.trim(),
          category_hindi: category.category_hindi.trim(),
          schemes: (category.schemes || []).map((scheme) => ({
            ...(scheme.id ? { id: scheme.id } : {}),
            scheme: scheme.scheme.trim(),
            scheme_hindi: scheme.scheme_hindi.trim(),
          })),
        })),
      };

      const isAdd = formMode === "add";
      const response = await fetch(BASE_URL, requestOptions(isAdd ? "POST" : "PUT", isAdd ? payload : { ...payload, department_id: formData.department_id }));
      const result = await parseResponse(response);

      // The nested PUT serializer retains omitted records, so explicitly call the
      // documented DELETE endpoints for categories/schemes removed in the editor.
      if (!isAdd) {
        for (const categoryId of pendingCategoryDeletes) {
          await parseResponse(await fetch(`${BASE_URL}?category_id=${encodeURIComponent(categoryId)}`, requestOptions("DELETE")));
        }
        for (const scheme of pendingSchemeDeletes) {
          if (!pendingCategoryDeletes.includes(scheme.categoryId)) {
            await parseResponse(await fetch(`${BASE_URL}?scheme_id=${encodeURIComponent(scheme.id)}`, requestOptions("DELETE")));
          }
        }
      }

      setApiSuccess(result.message || (isAdd ? "Department created successfully." : "Department updated successfully."));
      setShowFormModal(false);
      setFormData(emptyForm());
      setPendingCategoryDeletes([]);
      setPendingSchemeDeletes([]);
      await fetchDepartments(false);
    } catch (error) {
      setApiError(error.message || "Unable to save department.");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteConfirm = (type, id, label) => setConfirmDelete({ type, id, label });

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setApiError("");
    setApiSuccess("");
    try {
      const { type, id } = confirmDelete;
      const queryKey = type === "department" ? "department_id" : type === "category" ? "category_id" : "scheme_id";
      const response = await fetch(`${BASE_URL}?${queryKey}=${encodeURIComponent(id)}`, requestOptions("DELETE"));
      const result = await parseResponse(response);
      setApiSuccess(result.message || `${type} deleted successfully.`);
      setConfirmDelete(null);
      if (viewDept && type !== "department") {
        // Close stale details after a nested item is removed; refreshed data is authoritative.
        setShowViewModal(false);
        setViewDept(null);
      }
      await fetchDepartments(false);
    } catch (error) {
      setApiError(error.message || "Unable to delete record.");
    } finally {
      setDeleting(false);
    }
  };

  const viewDepartment = (department) => {
    setViewDept(department);
    setShowViewModal(true);
  };

  const categoryCount = (department) => (department.categories || []).length;
  const schemeCount = (department) =>
    (department.categories || []).reduce((sum, category) => sum + (category.schemes || []).length, 0);

  return (
    <div className="dashboard-container state-department-page">
      <StateLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />

      <main className="main-content-dash state-department-main">
        <StateTopNav toggleSidebar={() => setSidebarOpen((open) => !open)} />
        <Container fluid className="state-department-content">
          <div className="department-heading-row">
            <div>
              <div className="department-eyebrow">MASTER DATA MANAGEMENT</div>
              <h1 className="page-title"><FaBuilding /> Manage Departments</h1>
              <p className="department-subtitle">Organise departments, categories and schemes in one place.</p>
            </div>
            <Button className="department-primary-btn" onClick={openAddForm}>
              <FaPlus /> <span>Add Department</span>
            </Button>
          </div>

          {apiError && <Alert variant="danger" dismissible onClose={() => setApiError("")} className="department-alert">{apiError}</Alert>}
          {apiSuccess && <Alert variant="success" dismissible onClose={() => setApiSuccess("")} className="department-alert">{apiSuccess}</Alert>}

          <Row className="g-3 department-stat-row">
            <Col sm={6} xl={4}>
              <Card className="department-stat-card"><Card.Body><div className="stat-icon stat-icon-blue"><FaBuilding /></div><div><div className="stat-label">Departments</div><div className="stat-value">{departments.length}</div></div></Card.Body></Card>
            </Col>
            <Col sm={6} xl={4}>
              <Card className="department-stat-card"><Card.Body><div className="stat-icon stat-icon-violet"><FaLayerGroup /></div><div><div className="stat-label">Categories</div><div className="stat-value">{totalCategories}</div></div></Card.Body></Card>
            </Col>
            <Col sm={6} xl={4}>
              <Card className="department-stat-card"><Card.Body><div className="stat-icon stat-icon-teal"><FaListIcon /></div><div><div className="stat-label">Schemes</div><div className="stat-value">{totalSchemes}</div></div></Card.Body></Card>
            </Col>
          </Row>

          <Card className="departments-card">
            <Card.Header className="department-list-header">
              <div><h2>Department Directory</h2><p>View and manage department records</p></div>
              <InputGroup className="department-search">
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search department, category or scheme..." aria-label="Search departments" />
              </InputGroup>
            </Card.Header>
            <Card.Body className="p-0">
              {loading ? (
                <div className="department-state"><Spinner animation="border" /><span>Loading departments...</span></div>
              ) : filteredDepartments.length === 0 ? (
                <div className="department-empty-state"><div className="empty-icon"><FaBuilding /></div><h3>{search ? "No matching departments" : "No departments added yet"}</h3><p>{search ? "Try another search term." : "Start by adding a department with its categories and schemes."}</p>{!search && <Button className="department-primary-btn" onClick={openAddForm}><FaPlus /> Add Department</Button>}</div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="department-table align-middle mb-0">
                    <thead><tr><th>Department</th><th>विभाग</th><th>Categories</th><th>Schemes</th><th className="text-end">Actions</th></tr></thead>
                    <tbody>
                      {filteredDepartments.map((department) => (
                        <tr key={department.id}>
                          <td><div className="department-name-cell"><span className="department-row-icon"><FaBuilding /></span><div><strong>{department.department || "—"}</strong><small>ID: {department.id}</small></div></div></td>
                          <td className="department-hindi-cell">{department.department_hindi || "—"}</td>
                          <td><Badge bg="light" text="dark" className="count-badge">{categoryCount(department)} categories</Badge></td>
                          <td><Badge bg="light" text="dark" className="count-badge count-badge-teal">{schemeCount(department)} schemes</Badge></td>
                          <td><div className="department-actions">
                            <Button variant="light" className="action-btn action-view" title="View" onClick={() => viewDepartment(department)}><FaEye /><span>View</span></Button>
                            <Button variant="light" className="action-btn action-edit" title="Edit" onClick={() => openEditForm(department)}><FaEdit /><span>Edit</span></Button>
                            <Button variant="light" className="action-btn action-delete" title="Delete" onClick={() => openDeleteConfirm("department", department.id, department.department)}><FaTrash /><span>Delete</span></Button>
                          </div></td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
            {!loading && filteredDepartments.length > 0 && <Card.Footer className="department-list-footer">Showing {filteredDepartments.length} of {departments.length} departments</Card.Footer>}
          </Card>
        </Container>
      </main>

      {/* Add / Edit Department Modal */}
      <Modal show={showFormModal} onHide={closeFormModal} size="xl" scrollable backdrop="static" className="department-modal" dialogClassName="department-editor-dialog">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <div><div className="modal-eyebrow">DEPARTMENT SETUP</div><Modal.Title>{formMode === "add" ? "Add New Department" : "Edit Department"}</Modal.Title><div className="modal-subtitle">Enter department details and organise its categories and schemes.</div></div>
          </Modal.Header>
          <Modal.Body>
            {apiError && <Alert variant="danger" className="mb-3">{apiError}</Alert>}
            <section className="form-section">
              <div className="form-section-heading"><span className="section-number">01</span><div><h3>Department details</h3><p>Provide the department name in both languages.</p></div></div>
              <Row className="g-3">
                <Col md={6}><Form.Group><Form.Label>Department name (English) <span className="required-star">*</span></Form.Label><Form.Control required value={formData.department} onChange={(event) => setFormData((current) => ({ ...current, department: event.target.value }))} placeholder="e.g. Women and Child Development Department" /></Form.Group></Col>
                <Col md={6}><Form.Group><Form.Label>विभाग का नाम (हिन्दी) <span className="required-star">*</span></Form.Label><Form.Control required value={formData.department_hindi} onChange={(event) => setFormData((current) => ({ ...current, department_hindi: event.target.value }))} placeholder="उदाहरण: महिला एवं बाल विकास विभाग" /></Form.Group></Col>
              </Row>
            </section>

            <section className="form-section categories-section">
              <div className="form-section-heading section-heading-with-action"><div className="d-flex align-items-center gap-3"><span className="section-number">02</span><div><h3>Categories & schemes</h3><p>Add one or more categories and their associated schemes.</p></div></div><Button type="button" variant="outline-primary" className="add-inline-btn" onClick={addCategory}><FaPlus /> Add Category</Button></div>
              {formData.categories.length === 0 ? <div className="nested-empty-state"><FaLayerGroup /><span>No categories added. Use “Add Category” to begin.</span></div> : formData.categories.map((category, categoryIndex) => (
                <div className="category-editor-card" key={category.id || `new-category-${categoryIndex}`}>
                  <div className="category-editor-header"><div><Badge bg="primary" className="category-index-badge">CATEGORY {String(categoryIndex + 1).padStart(2, "0")}</Badge>{category.id && <small className="record-id">ID: {category.id}</small>}</div><Button type="button" variant="link" className="remove-record-btn" onClick={() => removeCategory(categoryIndex)}><FaTrash /> Remove category</Button></div>
                  <Row className="g-3">
                    <Col md={6}><Form.Group><Form.Label>Category name (English) <span className="required-star">*</span></Form.Label><Form.Control required value={category.category || ""} onChange={(event) => updateCategory(categoryIndex, "category", event.target.value)} placeholder="Enter category name" /></Form.Group></Col>
                    <Col md={6}><Form.Group><Form.Label>श्रेणी का नाम (हिन्दी) <span className="required-star">*</span></Form.Label><Form.Control required value={category.category_hindi || ""} onChange={(event) => updateCategory(categoryIndex, "category_hindi", event.target.value)} placeholder="श्रेणी का नाम दर्ज करें" /></Form.Group></Col>
                  </Row>
                  <div className="schemes-editor-area">
                    <div className="schemes-editor-heading"><div><strong>Schemes</strong><small>Manage schemes under this category</small></div><Button type="button" variant="outline-secondary" size="sm" className="add-scheme-btn" onClick={() => addScheme(categoryIndex)}><FaPlus /> Add Scheme</Button></div>
                    {(category.schemes || []).length === 0 ? <div className="no-schemes-note">No schemes added to this category yet.</div> : (category.schemes || []).map((scheme, schemeIndex) => (
                      <Row className="g-2 align-items-end scheme-editor-row" key={scheme.id || `new-scheme-${categoryIndex}-${schemeIndex}`}>
                        <Col md={5}><Form.Group><Form.Label>Scheme name (English) <span className="required-star">*</span></Form.Label><Form.Control required value={scheme.scheme || ""} onChange={(event) => updateScheme(categoryIndex, schemeIndex, "scheme", event.target.value)} placeholder="Enter scheme name" /></Form.Group></Col>
                        <Col md={5}><Form.Group><Form.Label>योजना का नाम (हिन्दी) <span className="required-star">*</span></Form.Label><Form.Control required value={scheme.scheme_hindi || ""} onChange={(event) => updateScheme(categoryIndex, schemeIndex, "scheme_hindi", event.target.value)} placeholder="योजना का नाम दर्ज करें" /></Form.Group></Col>
                        <Col md={2} className="scheme-remove-col"><Button type="button" variant="light" className="scheme-remove-btn" onClick={() => removeScheme(categoryIndex, schemeIndex)} aria-label="Remove scheme"><FaTrash /> Remove</Button></Col>
                      </Row>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </Modal.Body>
          <Modal.Footer>
            <Button type="button" variant="light" className="modal-cancel-btn" onClick={closeFormModal} disabled={saving}><FaTimes /> Cancel</Button>
            <Button type="submit" className="department-primary-btn" disabled={saving}>{saving ? <><Spinner size="sm" animation="border" /> Saving...</> : <><FaSave /> {formMode === "add" ? "Create Department" : "Save Changes"}</>}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Department Modal */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} centered size="lg" scrollable className="department-modal">
        <Modal.Header closeButton><div><div className="modal-eyebrow">DEPARTMENT OVERVIEW</div><Modal.Title>{viewDept?.department || "Department details"}</Modal.Title><div className="modal-subtitle">{viewDept?.department_hindi || ""}</div></div></Modal.Header>
        <Modal.Body>
          {(viewDept?.categories || []).length === 0 ? <div className="nested-empty-state">No categories or schemes are available.</div> : (viewDept?.categories || []).map((category) => (
            <div className="view-category-card" key={category.id}>
              <div className="view-category-title"><div><h3>{category.category}</h3><p>{category.category_hindi}</p></div><Badge bg="light" text="dark">{(category.schemes || []).length} schemes</Badge></div>
              {(category.schemes || []).length > 0 ? <div className="view-scheme-list">{category.schemes.map((scheme) => <div className="view-scheme-item" key={scheme.id}><span className="scheme-dot" /><div><strong>{scheme.scheme}</strong><small>{scheme.scheme_hindi}</small></div></div>)}</div> : <div className="no-schemes-note">No schemes in this category.</div>}
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer><Button variant="light" className="modal-cancel-btn" onClick={() => setShowViewModal(false)}>Close</Button>{viewDept && <Button className="department-primary-btn" onClick={() => { setShowViewModal(false); openEditForm(viewDept); }}><FaEdit /> Edit Department</Button>}</Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={Boolean(confirmDelete)} onHide={() => !deleting && setConfirmDelete(null)} centered className="department-modal delete-confirm-modal">
        <Modal.Header closeButton><div><div className="modal-eyebrow">CONFIRM ACTION</div><Modal.Title>Delete {confirmDelete?.type || "record"}?</Modal.Title></div></Modal.Header>
        <Modal.Body><div className="delete-warning-icon"><FaTrash /></div><p>Are you sure you want to delete <strong>{confirmDelete?.label || "this record"}</strong>?</p><small>{confirmDelete?.type === "department" ? "This will also permanently delete all categories and schemes under this department." : confirmDelete?.type === "category" ? "All schemes under this category will also be deleted." : "This scheme will be permanently deleted."}</small></Modal.Body>
        <Modal.Footer><Button variant="light" className="modal-cancel-btn" onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</Button><Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? <><Spinner size="sm" animation="border" /> Deleting...</> : <><FaTrash /> Delete permanently</>}</Button></Modal.Footer>
      </Modal>
    </div>
  );
};

const FaListIcon = FaLayerGroup;

export default StateDepartmentManage;
