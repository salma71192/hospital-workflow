
import React from "react";

import DashboardNotice from "../common/DashboardNotice";
import PatientRegisterForm from "../patients/PatientRegisterForm";
import PatientAssignmentForm from "../patients/PatientAssignmentForm";
import UnifiedPatientSearch from "../patients/UnifiedPatientSearch";

export default function ReceptionPatientRegistration({
  activeSection,
  selectedPatient,
  patientForm,
  setPatientForm,
  assignmentForm,
  setAssignmentForm,
  therapists = [],
  physicians = [],
  specialities = [],
  editingAssignmentId = null,
  savingAssignment = false,
  assignmentRef,
  creatingPatient,
  onSelectPatient,
  onCreatePatient,
  onSubmitAssignment,
  onCancelEdit,
  setMessage,
  setError,
  setActiveSection,
}) {
  const isEditing = Boolean(editingAssignmentId);

  const handleRegisterNew = () => {
    setMessage("");
    setError("");

    if (isEditing && onCancelEdit) {
      onCancelEdit();
    }

    setPatientForm({
      name: "",
      patient_id: "",
    });

    setActiveSection("open_file");
  };

  // Patient search and assignment section
  if (activeSection === "register") {
    return (
      <div style={styles.stack}>
        <UnifiedPatientSearch
          title={isEditing ? "Edit Assignment" : "Assign a Patient"}
          placeholder="Search patient name or ID"
          actionLabel={isEditing ? "Update Assignment" : "Assign to Physio"}
          onSelectPatient={onSelectPatient}
          emptyText="Start typing to search patients."
          noResultsText="No patients found. Register a new patient if needed."
          onRegisterNew={handleRegisterNew}
          registerButtonLabel="Register New Patient"
        />

        {selectedPatient ? (
          <div ref={assignmentRef}>
            <PatientAssignmentForm
              selectedPatient={selectedPatient}
              assignmentForm={assignmentForm}
              setAssignmentForm={setAssignmentForm}
              therapists={therapists}
              physicians={physicians}
              specialities={specialities}
              editingAssignmentId={editingAssignmentId}
              loading={savingAssignment}
              onSubmit={onSubmitAssignment}
              onCancelEdit={onCancelEdit}
            />
          </div>
        ) : (
          <div style={styles.helperCard}>
            <strong>Patient Assignment</strong>

            <p style={styles.helperText}>
              Search for a patient above and select the correct patient to
              continue with physiotherapist assignment.
            </p>

            <p style={styles.helperText}>
              If the patient is not found, select{" "}
              <strong>Register New Patient</strong> to create a patient file
              first.
            </p>
          </div>
        )}
      </div>
    );
  }

  // New patient registration section
  if (activeSection === "open_file") {
    return (
      <div style={styles.stack}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.heading}>Register New Patient</h2>

            <p style={styles.subtitle}>
              Create a patient file before assigning the patient to a
              physiotherapist.
            </p>
          </div>

          <button
            type="button"
            style={styles.backButton}
            onClick={() => setActiveSection("register")}
          >
            Back to Assignment
          </button>
        </div>

        <PatientRegisterForm
          patientForm={patientForm}
          setPatientForm={setPatientForm}
          onSubmit={onCreatePatient}
        />

        {creatingPatient && (
          <DashboardNotice type="success">
            Creating patient file...
          </DashboardNotice>
        )}
      </div>
    );
  }

  return null;
}

const styles = {
  stack: {
    display: "grid",
    gap: "16px",
    width: "100%",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
  },

  heading: {
    margin: 0,
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: 700,
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  backButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "9px 13px",
    background: "#ffffff",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },

  helperCard: {
    color: "#64748b",
    fontSize: "14px",
    fontWeight: 500,
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    borderRadius: "12px",
    padding: "16px",
    lineHeight: 1.6,
  },

  helperText: {
    margin: "8px 0 0",
  },
};
