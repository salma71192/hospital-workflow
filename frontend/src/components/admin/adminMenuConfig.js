
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
        key: "add_patient",
        label: "Add New Patient",
      },
      {
        key: "register_patient",
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
    children: [
      {
        key: "statistics",
        label: "Rehab Statistics",
      },
      {
        key: "evaluations",
        label: "Evaluations",
      },
    ],
  },
];

export default adminMenuConfig;
