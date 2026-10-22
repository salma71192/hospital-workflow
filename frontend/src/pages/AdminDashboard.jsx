<<<<<<< HEAD
=======

>>>>>>> origin/admin-patient-managment
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import DashboardLayout from "../components/DashboardLayout";
import DashboardNotice from "../components/common/DashboardNotice";
import AdminCreateSection from "../components/admin/AdminCreateSection";
import AdminManageSection from "../components/admin/AdminManageSection";
import AdminStatisticsSection from "../components/admin/AdminStatisticsSection";
import AdminRegistrationTrackerSection from "../components/admin/AdminRegistrationTrackerSection";
import AdminPatientFilesSection from "../components/admin/AdminPatientFilesSection";
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
  speciality: "",
  notes: "",
  assignment_date: "",
  with_another_therapist: false,
  additional_therapist_ids: [],
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
<<<<<<< HEAD
          ? value
          : JSON.stringify(value);
=======
            ? value
            : JSON.stringify(value);

>>>>>>> origin/admin-patient-managment
        return `${field}: ${text}`;
      })
      .join(" | ");
    if (details) return details;
  }
<<<<<<< HEAD
  return err?.message ? `${fallback}: ${err.message}` : fallback;
=======

  return err?.message
    ? `${fallback}: ${err.message}`
    : fallback;
>>>>>>> origin/admin-patient-managment
}
function hasAdminPermissions(user) {
  return Boolean(
    user &&
      (user.is_superuser ||
        String(user.role || "").trim().toLowerCase() === "admin")
  );
}
<<<<<<< HEAD
export default function AdminDashboard({ user, onLogout, onActAsUser }) {
=======

export default function AdminDashboard({
  user,
  onLogout,
  onActAsUser,
}) {
>>>>>>> origin/admin-patient-managment
  const navigate = useNavigate();
  const assignmentRef = useRef(null);
  const isAdmin = hasAdminPermissions(user);
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
  const [physicians, setPhysicians] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState({
    ...emptyAssignmentForm,
  });
  const [newlyCreatedPatient, setNewlyCreatedPatient] = useState(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [activeCategory, setActiveCategory] = useState(() => {
    try {
      const savedCategory = localStorage.getItem("activeCategory");

      if (
        savedCategory === "visitor" ||
        savedCategory === "visitor_ceo" ||
        savedCategory === "doctor"
      ) {
        return savedCategory === "doctor" ? "physician" : "admin";
      }

      return savedCategory || "admin";
    } catch {
      return "admin";
    }
  });
<<<<<<< HEAD
  // Static role options. Rehab Manager is included as a physiotherapy role.
=======

  // Roles available for creating and managing users.
>>>>>>> origin/admin-patient-managment
  const roles = [
    "admin",
    "administration",
    "approvals",
    "physio",
    "rehab_manager",
    "reception",
    "reception_supervisor",
    "ceo",
    "physician",
    "rehab_manager",
    "rcm",
    "callcenter",
    "callcenter_supervisor",
  ];
  const roleLabels = {
    admin: "Admin",
    administration: "Administration",
    approvals: "Approvals",
    physio: "Physio",
    rehab_manager: "Rehab Manager",
    reception: "Reception",
    reception_supervisor: "Reception Supervisor",
    ceo: "CEO",
    physician: "Physicians",
    rehab_manager: "Rehab Manager",
    rcm: "RCM",
    callcenter: "Call Center",
    callcenter_supervisor: "Call Center Supervisor",
    no_role: "No Role",
  };
  // Rehab Manager currently shares the physiotherapy dashboard route.
  const roleRoutes = {
    admin: "/admin",
    administration: "/administration",
    approvals: "/approvals",
    physio: "/physio",
    rehab_manager: "/physio",
    reception: "/reception",
    reception_supervisor: "/reception-supervisor",
    ceo: "/ceo",
    physician: "/doctor",
    rehab_manager: "/rehab-manager",
    rcm: "/rcm",
    callcenter: "/callcenter",
    callcenter_supervisor: "/callcenter-supervisor",
  };
  const sidebarItems = [
    { key: "create", label: "Create New User" },
    { key: "manage", label: "Manage Users" },
    { key: "statistics", label: "Rehab Statistics" },
    {
      key: "registration_tracker",
      label: "Registration History",
    },
    {
      key: "evaluation_tracker",
      label: "Evaluation Tracker",
    },
    {
      key: "reception_management",
      label: "Reception Management",
      icon: "clipboard-list",
      defaultOpen: false,
      children: [
        { key: "open_file", label: "Open New File" },
        { key: "register_patient", label: "Assign a Patient" },
      ],
    },
    {
      key: "patient_management",
      label: "Patient Management",
      icon: "users",
      defaultOpen: false,
      children: [
        {
          key: "patients_file",
          label: "Patients File",
        },
      ],
    },
    { key: "evaluations", label: "Evaluations" },
  ];
  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("users/list-users/");
      const fetchedUsers = Array.isArray(res.data?.users)
        ? res.data.users
        : [];

      const normalizedUsers = fetchedUsers.map((item) => ({
        ...item,
        role: item.role === "doctor" ? "physician" : item.role,
      }));

      setUsers(normalizedUsers);
      setError("");
    } catch (err) {
      console.error("Failed to load users:", err);
      setError(getApiError(err, "Failed to load users."));
    }
  }, []);
  const loadTherapists = useCallback(async () => {
    try {
      const res = await api.get("reception/therapists/");
      setTherapists(
        Array.isArray(res.data?.therapists)
          ? res.data.therapists
          : []
      );
    } catch (err) {
      console.error("Failed to load therapists:", err);
      setTherapists([]);
      setError(
        getApiError(err, "Failed to load physiotherapists.")
      );
    }
  }, []);
  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);
  useEffect(() => {
    if (
      activeSection === "register_patient" ||
      activeSection === "open_file"
    ) {
      loadTherapists();
    }
  }, [activeSection, loadTherapists]);
  const groupedUsers = useMemo(() => {
    const groups = {
      admin: [],
      administration: [],
      approvals: [],
      reception: [],
      reception_supervisor: [],
      physio: [],
<<<<<<< HEAD
      rehab_manager: [],
      doctor: [],
=======
      ceo: [],
      physician: [],
      rehab_manager: [],
>>>>>>> origin/admin-patient-managment
      rcm: [],
      callcenter: [],
      callcenter_supervisor: [],
      no_role: [],
    };
    users.forEach((item) => {
<<<<<<< HEAD
      const role = String(item?.role || "").trim().toLowerCase();
      if (groups[role]) {
        groups[role].push(item);
=======
      const normalizedRole =
        item.role === "doctor" ? "physician" : item.role;

      if (groups[normalizedRole]) {
        groups[normalizedRole].push(item);
>>>>>>> origin/admin-patient-managment
      } else {
        groups.no_role.push(item);
      }
    });
    return groups;
  }, [users]);
  const categoryOrder = [
    "admin",
    "administration",
    "approvals",
    "reception",
    "reception_supervisor",
    "physio",
<<<<<<< HEAD
    "rehab_manager",
    "doctor",
=======
    "ceo",
    "physician",
    "rehab_manager",
>>>>>>> origin/admin-patient-managment
    "rcm",
    "callcenter",
    "callcenter_supervisor",
    "no_role",
  ];
  const handleCategoryChange = (category) => {
<<<<<<< HEAD
    setActiveCategory(category);
=======
    const allowedCategories = [...roles, "no_role"];

    const normalizedCategory =
      category === "doctor" ? "physician" : category;

    if (!allowedCategories.includes(normalizedCategory)) {
      setActiveCategory("admin");

      try {
        localStorage.setItem("activeCategory", "admin");
      } catch (storageError) {
        console.warn(
          "Could not save active category:",
          storageError
        );
      }

      return;
    }

    setActiveCategory(normalizedCategory);

>>>>>>> origin/admin-patient-managment
    try {
      localStorage.setItem(
        "activeCategory",
        normalizedCategory
      );
    } catch (storageError) {
      console.warn(
        "Could not save active category:",
        storageError
      );
    }
  };
  const resetAssignmentEditor = () => {
    setEditingAssignmentId(null);
    setSelectedPatient(null);
    setAssignmentForm({ ...emptyAssignmentForm });
  };
  const handleSectionChange = (section) => {
    if (
      editingAssignmentId &&
      section !== "register_patient"
    ) {
      const confirmed = window.confirm(
        "Leave the assignment edit without saving your changes?"
      );
      if (!confirmed) return;
      resetAssignmentEditor();
    }
    setActiveSection(section);
    setMessage("");
    setError("");
    if (section === "open_file") {
      setNewlyCreatedPatient(null);
      setSelectedPatient(null);
      setEditingAssignmentId(null);
      setAssignmentForm({ ...emptyAssignmentForm });
    }
<<<<<<< HEAD
    if (section === "register_patient" && !editingAssignmentId) {
=======

    if (
      section === "register_patient" &&
      !editingAssignmentId
    ) {
>>>>>>> origin/admin-patient-managment
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
<<<<<<< HEAD
      const res = await api.post("users/create-user/", formData);
      setMessage(res.data?.message || "User created successfully.");
=======
      const res = await api.post(
        "users/create-user/",
        formData
      );

      setMessage(
        res.data?.message || "User created successfully."
      );

>>>>>>> origin/admin-patient-managment
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
      setError(getApiError(err, "Failed to create user."));
      setMessage("");
    }
  };
  const handleActAsUser = (selectedUser) => {
    if (!isAdmin || !onActAsUser) return;
    onActAsUser(selectedUser);
<<<<<<< HEAD
=======

    const normalizedRole =
      selectedUser.role === "doctor"
        ? "physician"
        : selectedUser.role;

>>>>>>> origin/admin-patient-managment
    navigate(
      selectedUser.is_superuser
        ? "/admin"
        : roleRoutes[normalizedRole] || "/admin"
    );
  };
<<<<<<< HEAD
  const handleRoleUpdate = async (userId, newRole, newIsSuperuser) => {
=======

  const handleRoleUpdate = async (
    userId,
    newRole,
    newIsSuperuser
  ) => {
>>>>>>> origin/admin-patient-managment
    if (!isAdmin) {
      setError("Administrator permissions are required.");
      return false;
    }
    setMessage("");
    setError("");
<<<<<<< HEAD
    try {
      const res = await api.put(`users/update-user/${userId}/`, {
        role: newRole,
        is_superuser: newIsSuperuser,
      });
      setMessage(res.data?.message || "User updated successfully.");
=======

    const normalizedRole =
      newRole === "doctor" ? "physician" : newRole;

    try {
      const res = await api.put(
        `users/update-user/${userId}/`,
        {
          role: normalizedRole,
          is_superuser: newIsSuperuser,
        }
      );

      setMessage(
        res.data?.message || "User updated successfully."
      );

>>>>>>> origin/admin-patient-managment
      await fetchUsers();
      return true;
    } catch (err) {
      setError(getApiError(err, "Failed to update user."));
      setMessage("");
      return false;
    }
  };
  const handleEditUser = async (userId, updates) => {
    if (!isAdmin) {
      setError("Administrator permissions are required.");
      return false;
    }
    if (!userId || !updates || typeof updates !== "object") {
      setError("A valid user and update data are required.");
      return false;
    }
    setMessage("");
    setError("");
<<<<<<< HEAD
    try {
      const res = await api.put(`users/update-user/${userId}/`, updates);
      setMessage(res.data?.message || "User details saved successfully.");
=======

    const normalizedUpdates = { ...updates };

    if (normalizedUpdates.role === "doctor") {
      normalizedUpdates.role = "physician";
    }

    try {
      const res = await api.put(
        `users/update-user/${userId}/`,
        normalizedUpdates
      );

      setMessage(
        res.data?.message ||
          "User details saved successfully."
      );

>>>>>>> origin/admin-patient-managment
      await fetchUsers();
      return true;
    } catch (err) {
      console.error("Failed to save user details:", err);
      setError(
        getApiError(err, "Failed to save user details.")
      );
      setMessage("");
      return false;
    }
  };
  const handleSetUserActive = async (userId, isActive) => {
    if (!isAdmin) {
      setError("Administrator permissions are required.");
      return false;
    }
    setMessage("");
    setError("");
    try {
<<<<<<< HEAD
      const res = await api.put(`users/update-user/${userId}/`, {
        is_active: Boolean(isActive),
      });
=======
      const res = await api.put(
        `users/update-user/${userId}/`,
        { is_active: Boolean(isActive) }
      );

>>>>>>> origin/admin-patient-managment
      setMessage(
        res.data?.message ||
          (isActive
            ? "User activated successfully."
            : "User deactivated successfully.")
      );
      await fetchUsers();
      return true;
    } catch (err) {
      console.error("Failed to update user status:", err);
      setError(
        getApiError(err, "Failed to update user status.")
      );
      setMessage("");
      return false;
    }
  };
<<<<<<< HEAD
  const handleChangeUserPassword = async (userId, newPassword) => {
=======

  const handleChangeUserPassword = async (
    userId,
    newPassword
  ) => {
>>>>>>> origin/admin-patient-managment
    if (!isAdmin) {
      setError("Administrator permissions are required.");
      return false;
    }
    if (!userId || !String(newPassword || "").trim()) {
      setError("Select a user and enter a new password.");
      return false;
    }
    setMessage("");
    setError("");
    try {
<<<<<<< HEAD
      const res = await api.post(`users/change-password/${userId}/`, {
        new_password: newPassword,
      });
=======
      const res = await api.post(
        `users/change-password/${userId}/`,
        { new_password: newPassword }
      );

>>>>>>> origin/admin-patient-managment
      setMessage(
        res.data?.message ||
          "User password updated successfully."
      );

      return true;
    } catch (err) {
      console.error("Failed to change user password:", err);
      setError(
        getApiError(err, "Failed to change user password.")
      );
      setMessage("");
      return false;
    }
  };
  const handleDeleteUser = async (userId, username) => {
    if (!isAdmin) {
      setError("Administrator permissions are required.");
      return;
    }
    const confirmed = window.confirm(
      `Deactivate user "${username}"? Their existing records should be preserved.`
    );
    if (!confirmed) return;
    setMessage("");
    setError("");
    try {
<<<<<<< HEAD
      const res = await api.delete(`users/delete-user/${userId}/`);
      setMessage(res.data?.message || "User deactivated successfully.");
=======
      const res = await api.delete(
        `users/delete-user/${userId}/`
      );

      setMessage(
        res.data?.message || "User deactivated successfully."
      );

>>>>>>> origin/admin-patient-managment
      await fetchUsers();
    } catch (err) {
      console.error("Failed to deactivate user:", err);
      setError(
        getApiError(err, "Failed to deactivate user.")
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
    setEditingAssignmentId(null);
    setSelectedPatient(patient);
    setAssignmentForm({
      ...emptyAssignmentForm,
      patient_id: patient.id,
    });
    window.setTimeout(() => {
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
    setEditingAssignmentId(null);
    setAssignmentForm({
      ...emptyAssignmentForm,
      patient_id: patient.id,
    });
    setMessage(
      `Patient file created for ${
        patient.name || "the new patient"
      }. You can now assign the patient.`
    );
    setError("");
    setActiveSection("register_patient");
  };
  const handleCreateOrUpdateAssignment = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      setError("Administrator permissions are required.");
      return;
    }
    if (savingAssignment) return;
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
    const additionalTherapistIds = Array.isArray(
      assignmentForm.additional_therapist_ids
    )
      ? assignmentForm.additional_therapist_ids
          .map(String)
          .filter(
            (id) => id && id !== String(assignmentForm.therapist_id)
          )
          .slice(0, 1)
      : [];
    const payload = {
      ...assignmentForm,
      patient_id: assignmentForm.patient_id,
      therapist_id: assignmentForm.therapist_id,
      category: assignmentForm.category || "appointment",
      visit_number: assignmentForm.visit_number,
      referring_physician:
        assignmentForm.category === "initial_evaluation"
          ? assignmentForm.referring_physician || ""
          : "",
      speciality: assignmentForm.speciality || "",
      notes: assignmentForm.notes || "",
      additional_therapist_ids: additionalTherapistIds,
      with_another_therapist:
        additionalTherapistIds.length > 0,
    };
    if (assignmentForm.assignment_date) {
      payload.assignment_date =
        assignmentForm.assignment_date;
    } else {
      delete payload.assignment_date;
    }
    setSavingAssignment(true);
    try {
      const res = editingAssignmentId
        ? await api.put(
            `reception/assignments/${editingAssignmentId}/`,
            payload
          )
<<<<<<< HEAD
        : await api.post("reception/assignments/", payload);
=======
        : await api.post(
            "reception/assignments/",
            payload
          );

>>>>>>> origin/admin-patient-managment
      setMessage(
        res.data?.message ||
          (editingAssignmentId
            ? "Assignment updated successfully."
            : "Patient assigned successfully.")
      );
      resetAssignmentEditor();
      setNewlyCreatedPatient(null);
      setActiveSection("registration_tracker");
    } catch (err) {
      console.error(
        "Failed to save assignment:",
        err?.response?.data || err
      );
      setError(
        getApiError(
          err,
          editingAssignmentId
            ? "Failed to update assignment."
            : "Failed to assign patient."
        )
      );

      setMessage("");
    } finally {
      setSavingAssignment(false);
    }
  };
  const handleEditRegistration = async (assignment) => {
    if (!isAdmin) {
      setError("Administrator permissions are required.");
      setMessage("");
      return;
    }
    if (!assignment?.id || !assignment.patient_id) {
      setError(
        "The registration is missing its assignment ID or patient ID."
      );
      setMessage("");
      return;
    }
    setMessage("");
    setError("");
    const additionalTherapistIds = Array.isArray(
      assignment.additional_therapist_ids
    )
      ? assignment.additional_therapist_ids.map(String).slice(0, 1)
      : [];
    setEditingAssignmentId(assignment.id);
    setSelectedPatient({
      id: assignment.patient_id,
      name: assignment.patient_name || "",
      patient_id: assignment.patient_file_id || "",
    });
    setAssignmentForm({
      ...emptyAssignmentForm,
      patient_id: String(assignment.patient_id),
      therapist_id: String(assignment.therapist_id || ""),
      category: assignment.category || "appointment",
      visit_number: assignment.visit_number ?? "",
      referring_physician:
        assignment.referring_physician || "",
      speciality:
        assignment.speciality || assignment.specialty || "",
      notes: assignment.notes || "",
      assignment_date: assignment.assignment_date || "",
      additional_therapist_ids: additionalTherapistIds,
      with_another_therapist:
        additionalTherapistIds.length > 0,
    });
    setActiveSection("register_patient");
    window.setTimeout(() => {
      assignmentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);
  };
  const handleCancelRegistration = async (assignment) => {
    if (!isAdmin) {
      setError("Administrator permissions are required.");
      setMessage("");
      return;
    }
    if (!assignment?.id) {
      setError("Could not identify the registration to delete.");
      setMessage("");
      return;
    }
    const confirmed = window.confirm(
      `Delete the registration for ${
        assignment.patient_name || "this patient"
      }${
        assignment.assignment_date
          ? ` dated ${assignment.assignment_date}`
          : ""
      }?`
    );
    if (!confirmed) return;
    setMessage("");
    setError("");
    try {
      const res = await api.delete(
        `reception/assignments/${assignment.id}/`
      );
      setMessage(
        res.data?.message ||
          "Registration deleted successfully."
      );
    } catch (err) {
      console.error("Failed to delete registration:", err);
<<<<<<< HEAD
      setError(getApiError(err, "Failed to delete registration."));
=======

      setError(
        getApiError(err, "Failed to delete registration.")
      );

>>>>>>> origin/admin-patient-managment
      setMessage("");
    }
  };
  const renderPlaceholder = (heading, description) => (
    <section style={styles.card}>
      <h2 style={styles.heading}>{heading}</h2>
      <p style={styles.description}>{description}</p>
      <p style={styles.helperText}>
        This section still needs to be connected to its existing
        page or backend functionality.
      </p>
    </section>
  );
  if (!isAdmin) {
    return (
      <section style={styles.permissionPage}>
        <h2>Access denied</h2>
        <p>
          An administrator account is required to view this page.
        </p>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={() =>
            navigate("/login", { replace: true })
          }
        >
          Return to Login
        </button>
      </section>
    );
  }
  return (
    <DashboardLayout
      title="Admin Dashboard"
      subtitle={`Welcome, ${
        user?.display_name ||
        user?.name ||
        user?.full_name ||
        user?.username ||
        "Admin"
      }`}
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
            onEditUser={handleEditUser}
            onSetUserActive={handleSetUserActive}
            onChangeUserPassword={handleChangeUserPassword}
          />
        )}
        {activeSection === "statistics" && (
          <AdminStatisticsSection />
        )}
        {activeSection === "registration_tracker" && (
          <AdminRegistrationTrackerSection
            user={user}
            currentUser={user}
            userRole="admin"
            isAdmin={isAdmin}
            isReception={false}
            currentUserId={user?.id}
            onEditAssignment={handleEditRegistration}
            onEditRegistration={handleEditRegistration}
            onCancelAssignment={handleCancelRegistration}
            onDeleteAssignment={handleCancelRegistration}
          />
        )}
        {activeSection === "evaluation_tracker" && (
          <EvaluationTrackerSection user={user} />
        )}
<<<<<<< HEAD
=======

        {activeSection === "patients_file" && (
          <AdminPatientFilesSection />
        )}

>>>>>>> origin/admin-patient-managment
        {activeSection === "open_file" && (
          <div style={styles.stack}>
            <section style={styles.card}>
              <h2 style={styles.heading}>Open New Patient File</h2>
              <p style={styles.description}>
                Create a new patient record. After creation,
                you can continue to assign the patient to a
                physiotherapist.
              </p>
<<<<<<< HEAD
              <OpenNewFile onPatientCreated={handlePatientCreated} />
=======

              <OpenNewFile
                onPatientCreated={handlePatientCreated}
              />

>>>>>>> origin/admin-patient-managment
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
            {!editingAssignmentId && (
              <section style={styles.card}>
                <h2 style={styles.heading}>Assign a Patient</h2>
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
            )}
            {selectedPatient && (
              <section ref={assignmentRef} style={styles.card}>
                <h2 style={styles.heading}>
                  {editingAssignmentId
                    ? "Edit Patient Assignment"
                    : "Assign Patient to Physiotherapist"}
                </h2>
                <p style={styles.description}>
                  Selected patient:{" "}
                  <strong>{selectedPatient.name}</strong>
                  {selectedPatient.patient_id
                    ? ` (${selectedPatient.patient_id})`
                    : ""}
                </p>
                <PatientAssignmentForm
                  selectedPatient={selectedPatient}
                  assignmentForm={assignmentForm}
                  setAssignmentForm={setAssignmentForm}
                  therapists={therapists}
                  physicians={physicians}
                  specialities={specialities}
                  editingAssignmentId={editingAssignmentId}
                  savingAssignment={savingAssignment}
                  onSubmit={handleCreateOrUpdateAssignment}
                  onCancelEdit={resetAssignmentEditor}
                  userRole="admin"
                  isAdmin={isAdmin}
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
  permissionPage: {
    padding: "32px",
    maxWidth: "600px",
    margin: "40px auto",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
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