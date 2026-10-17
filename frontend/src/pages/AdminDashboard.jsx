
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import AdminCreateSection from "../components/admin/AdminCreateSection";
import AdminManageSection from "../components/admin/AdminManageSection";
import AdminStatisticsSection from "../components/admin/AdminStatisticsSection";
import AdminRegistrationTrackerSection from "../components/admin/AdminRegistrationTrackerSection";
import EvaluationTrackerSection from "../components/assignments/EvaluationTrackerSection";
import PatientAssignmentForm from "../components/patients/PatientAssignmentForm";
import UnifiedPatientSearch from "../components/patients/UnifiedPatientSearch";
import OpenNewFile from "../components/patients/OpenNewFile";

const emptyAssignmentForm = {
  patient_id: "",
  therapist_id: "",
  category: "appointment",
  visit_number: "",
  referring_physician: "",
  notes: "",
};

function getApiError(err, fallback) {
  const data = err?.response?.data;

  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;

  if (data && typeof data === "object") {
    const details = Object.entries(data)
      .map(([field, value]) => {
        const text = Array.isArray(value)
          ? value.join(", ")
          : typeof value === "string"
          ? value
          : JSON.stringify(value);

        return `${field}: ${text}`;
      })
      .join(" | ");

    if (details) return details;
  }

  return err?.message
    ? `${fallback}: ${err.message}`
    : fallback;
}

export default function AdminDashboard({
  user,
  onLogout,
  onActAsUser,
}) {
  const navigate = useNavigate();
  const assignmentRef = useRef(null);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "admin",
    is_superuser: false,
  });

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("manage");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [therapists, setTherapists] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState({
    ...emptyAssignmentForm,
  });
  const [newlyCreatedPatient, setNewlyCreatedPatient] = useState(null);

  const [activeCategory, setActiveCategory] = useState(() => {
    try {
      return localStorage.getItem("activeCategory") || "admin";
    } catch {
      return "admin";
    }
  });

  const roles = [
    "admin",
    "approvals",
    "physio",
    "reception",
    "reception_supervisor",
    "visitor",
    "visitor_ceo",
    "doctor",
    "rcm",
    "callcenter",
    "callcenter_supervisor",
  ];

  const roleLabels = {
    admin: "Admin",
    approvals: "Approvals",
    physio: "Physio",
    reception: "Reception",
    reception_supervisor: "Reception Supervisor",
    visitor: "Visitors",
    visitor_ceo: "Visitor CEO",
    doctor: "Doctor",
    rcm: "RCM",
    callcenter: "Call Center",
    callcenter_supervisor: "Call Center Supervisor",
    no_role: "No Role",
  };

  const roleRoutes = {
    admin: "/admin",
    approvals: "/approvals",
    physio: "/physio",
    reception: "/reception",
    reception_supervisor: "/reception-supervisor",
    visitor: "/visitors",
    visitor_ceo: "/visitor-ceo",
    doctor: "/doctor",
    rcm: "/rcm",
    callcenter: "/callcenter",
    callcenter_supervisor: "/callcenter-supervisor",
  };

  const sidebarItems = [
    { key: "create", label: "Create New User" },
    { key: "manage", label: "Manage Users" },
    { key: "statistics", label: "Rehab Statistics" },
    { key: "registration_tracker", label: "Registration History" },
    { key: "evaluation_tracker", label: "Evaluation Tracker" },
    {
      key: "reception_management",
      label: "Reception Management",
      icon: "clipboard-list",
      defaultOpen: true,
      children: [
        {
          key: "open_file",
          label: "Open New File",
        },
        {
          key: "register_patient",
          label: "Assign a Patient",
        },
      ],
    },
    { key: "evaluations", label: "Evaluations" },
  ];

  const fetchUsers = async () => {
    try {
      const res = await api.get("users/list-users/");
      setUsers(res.data?.users || []);
      setError("");
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(
        getApiError(err, "Failed to load users.")
      );
    }
  };

  const loadTherapists = async () => {
    try {
      const res = await api.get("reception/therapists/");
      setTherapists(res.data?.therapists || []);
    } catch (err) {
      console.error("Failed to load therapists:", err);
      setTherapists([]);
      setError(
        getApiError(err, "Failed to load physiotherapists.")
      );
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (
      activeSection === "register_patient" ||
      activeSection === "open_file"
    ) {
      loadTherapists();
    }
  }, [activeSection]);

  const groupedUsers = useMemo(() => {
    const groups = {
      admin: [],
      approvals: [],
      reception: [],
      reception_supervisor: [],
      physio: [],
      doctor: [],
      rcm: [],
      callcenter: [],
      callcenter_supervisor: [],
      visitor: [],
      visitor_ceo: [],
      no_role: [],
    };

    users.forEach((item) => {
      if (groups[item.role]) {
        groups[item.role].push(item);
      } else {
        groups.no_role.push(item);
      }
    });

    return groups;
  }, [users]);

  const categoryOrder = [
    "admin",
    "approvals",
    "reception",
    "reception_supervisor",
    "physio",
    "doctor",
    "rcm",
    "callcenter",
    "callcenter_supervisor",
    "visitor",
    "visitor_ceo",
    "no_role",
  ];

  const handleCategoryChange = (category) => {
    setActiveCategory(category);

    try {
      localStorage.setItem("activeCategory", category);
    } catch (storageError) {
      console.warn(
        "Could not save active category:",
        storageError
      );
    }
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setMessage("");
    setError("");

    if (section === "open_file") {
      setNewlyCreatedPatient(null);
      setSelectedPatient(null);
      setAssignmentForm({ ...emptyAssignmentForm });
    }

    if (section === "register_patient") {
      setSelectedPatient(newlyCreatedPatient || null);
      setAssignmentForm({
        ...emptyAssignmentForm,
        patient_id: newlyCreatedPatient?.id || "",
      });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post(
        "users/create-user/",
        formData
      );

      setMessage(
        res.data?.message || "User created successfully."
      );

      const createdRole = formData.role;

      setFormData({
        username: "",
        password: "",
        role: "admin",
        is_superuser: false,
      });

      await fetchUsers();
      setActiveSection("manage");
      handleCategoryChange(createdRole);
    } catch (err) {
      setError(
        getApiError(err, "Failed to create user.")
      );
      setMessage("");
    }
  };

  const handleActAsUser = (selectedUser) => {
    if (!onActAsUser) return;

    onActAsUser(selectedUser);

    navigate(
      selectedUser.is_superuser
        ? "/admin"
        : roleRoutes[selectedUser.role] || "/admin"
    );
  };

  const handleRoleUpdate = async (
    userId,
    newRole,
    newIsSuperuser
  ) => {
    setMessage("");
    setError("");

    try {
      const res = await api.put(
        `users/update-user/${userId}/`,
        {
          role: newRole,
          is_superuser: newIsSuperuser,
        }
      );

      setMessage(
        res.data?.message || "User updated successfully."
      );

      await fetchUsers();
    } catch (err) {
      setError(
        getApiError(err, "Failed to update user.")
      );
      setMessage("");
      throw err;
    }
  };

  const handleDeleteUser = async (userId, username) => {
    const confirmed = window.confirm(
      `Delete user "${username}"?`
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const res = await api.delete(
        `users/delete-user/${userId}/`
      );

      setMessage(
        res.data?.message || "User deleted successfully."
      );

      await fetchUsers();
    } catch (err) {
      setError(
        getApiError(err, "Failed to delete user.")
      );
      setMessage("");
    }
  };

  const handleSelectPatient = (patient) => {
    if (!patient?.id) {
      setError("The selected patient has no valid record ID.");
      return;
    }

    setMessage("");
    setError("");
    setSelectedPatient(patient);

    setAssignmentForm((prev) => ({
      ...prev,
      patient_id: patient.id,
      therapist_id: "",
    }));

    setTimeout(() => {
      assignmentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);
  };

  const handlePatientCreated = (patient) => {
    if (!patient?.id) {
      setMessage(
        "The form submitted, but no patient record ID was returned. Please check the patient list before creating the record again."
      );
      setError("");
      return;
    }

    setNewlyCreatedPatient(patient);
    setSelectedPatient(patient);

    setAssignmentForm({
      ...emptyAssignmentForm,
      patient_id: patient.id,
    });

    setMessage(
      `Patient file created for ${patient.name || "the new patient"}. You can now assign the patient.`
    );

    setError("");
    setActiveSection("register_patient");
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!assignmentForm.patient_id) {
      setError("Please select a patient first.");
      return;
    }

    if (!assignmentForm.therapist_id) {
      setError("Please select a physiotherapist.");
      return;
    }

    try {
      const res = await api.post(
        "reception/assignments/",
        assignmentForm
      );

      setMessage(
        res.data?.message || "Patient assigned successfully."
      );

      setSelectedPatient(null);
      setNewlyCreatedPatient(null);
      setAssignmentForm({ ...emptyAssignmentForm });
      setActiveSection("registration_tracker");
    } catch (err) {
      console.error("Failed to assign patient:", err);

      setError(
        getApiError(err, "Failed to assign patient.")
      );

      setMessage("");
    }
  };

  const renderPlaceholder = (heading, description) => (
    <section style={styles.card}>
      <h2 style={styles.heading}>{heading}</h2>
      <p style={styles.description}>{description}</p>
      <p style={styles.helperText}>
        This section still needs to be connected to its
        existing page or backend functionality.
      </p>
    </section>
  );

  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle={`Welcome, ${user?.username || ""}`}
      accent="#1e3a8a"
      sidebarTitle="Admin Panel"
      sidebarItems={sidebarItems}
      activeSection={activeSection}
      setActiveSection={handleSectionChange}
      onLogout={onLogout}
      useAdminSidebar={true}
    >
      <div style={styles.page}>
        {message && (
          <DashboardNotice type="success">
            {message}
          </DashboardNotice>
        )}

        {error && (
          <DashboardNotice type="error">
            {error}
          </DashboardNotice>
        )}

        {activeSection === "create" && (
          <AdminCreateSection
            formData={formData}
            setFormData={setFormData}
            roles={roles}
            roleLabels={roleLabels}
            onSubmit={handleCreateUser}
          />
        )}

        {activeSection === "manage" && (
          <AdminManageSection
            users={users}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            groupedUsers={groupedUsers}
            categoryOrder={categoryOrder}
            roleLabels={roleLabels}
            roles={roles}
            currentUsername={user?.username}
            onRoleUpdate={handleRoleUpdate}
            onDeleteUser={handleDeleteUser}
            onActAsUser={handleActAsUser}
          />
        )}

        {activeSection === "statistics" && (
          <AdminStatisticsSection />
        )}

        {activeSection === "registration_tracker" && (
          <AdminRegistrationTrackerSection />
        )}

        {activeSection === "evaluation_tracker" && (
          <EvaluationTrackerSection user={user} />
        )}

        {activeSection === "open_file" && (
          <div style={styles.stack}>
            <section style={styles.card}>
              <h2 style={styles.heading}>
                Open New Patient File
              </h2>

              <p style={styles.description}>
                Create a new patient record. After creation,
                you can continue to assign the patient to a
                physiotherapist.
              </p>

              <OpenNewFile
                onPatientCreated={handlePatientCreated}
              />

              {newlyCreatedPatient && (
                <button
                  type="button"
                  style={styles.primaryButton}
                  onClick={() =>
                    handleSectionChange("register_patient")
                  }
                >
                  Continue to Assign Patient
                </button>
              )}
            </section>
          </div>
        )}

        {activeSection === "register_patient" && (
          <div style={styles.stack}>
            <section style={styles.card}>
              <h2 style={styles.heading}>
                Assign a Patient
              </h2>

              <p style={styles.description}>
                Search for an existing patient, select the
                patient, and assign them to a physiotherapist.
              </p>

              <UnifiedPatientSearch
                title="Find Existing Patient"
                placeholder="Search patient name or ID"
                actionLabel="Select Patient"
                onSelectPatient={handleSelectPatient}
                emptyText="Start typing to search patients."
                noResultsText="No patients found. Use Open New File to create a patient record."
                onRegisterNew={() =>
                  handleSectionChange("open_file")
                }
                registerButtonLabel="Open New File"
              />
            </section>

            {selectedPatient && (
              <section
                ref={assignmentRef}
                style={styles.card}
              >
                <h2 style={styles.heading}>
                  Assign Patient to Physiotherapist
                </h2>

                <p style={styles.description}>
                  Selected patient:{" "}
                  <strong>
                    {selectedPatient.name}
                  </strong>
                  {selectedPatient.patient_id
                    ? ` (${selectedPatient.patient_id})`
                    : ""}
                </p>

                <PatientAssignmentForm
                  selectedPatient={selectedPatient}
                  assignmentForm={assignmentForm}
                  setAssignmentForm={setAssignmentForm}
                  therapists={therapists}
                  onSubmit={handleCreateAssignment}
                />
              </section>
            )}
          </div>
        )}

        {activeSection === "evaluations" &&
          renderPlaceholder(
            "Evaluations",
            "This area will provide access to rehabilitation evaluations."
          )}
      </div>
    </DashboardLayout>
  );
}

const styles = {
  page: {
    display: "block",
    width: "100%",
    minWidth: 0,
    margin: 0,
    padding: "24px",
    boxSizing: "border-box",
  },
  stack: {
    display: "grid",
    gap: "16px",
  },
  card: {
    width: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    padding: "24px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
  },
  heading: {
    marginTop: 0,
    marginBottom: "8px",
    color: "#1e3a8a",
  },
  description: {
    color: "#64748b",
    lineHeight: 1.7,
    marginBottom: "20px",
  },
  helperText: {
    color: "#64748b",
    fontSize: "14px",
  },
  primaryButton: {
    marginTop: "16px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#1e3a8a",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
