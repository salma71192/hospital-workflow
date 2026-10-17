const adminMenuConfig = [
  {
    key: "user_management",
    label: "User Management",
    icon: "users",
    children: [
      {
        key: "create",
        label: "Create New User",
      },
      {
        key: "manage",
        label: "Manage Users",
      },
    ],
  },
  {
    key: "reception_management",
    label: "Reception Management",
    icon: "clipboard-list",
    children: [
      {
        key: "register_patient",
        label: "Assign a Patient",
      },
      {
        key: "open_file",
        label: "Register New Patient",
      },
      {
        key: "registration_tracker",
        label: "Registration History",
      },
    ],
  },
  {
    key: "rehab_management",
    label: "Rehab Management",
    icon: "activity",
    defaultOpen: true,
    children: [
      {
        key: "statistics",
        label: "Rehab Statistics",
      },
      {
        key: "evaluation_tracker",
        label: "Evaluation Tracker",
      },
    ],
  },
];
export default adminMenuConfig;