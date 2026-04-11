import { lazy } from "react";

const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));

const ReceptionSupervisorDashboard = lazy(() =>
  import("../pages/ReceptionSupervisorDashboard")
);

// ================= PHYSIO =================
const PhysioHome = lazy(() => import("../pages/PhysioHome"));
const PhysioBookingWorkspace = lazy(() =>
  import("../pages/PhysioBookingWorkspace")
);
const PhysioFollowupWorkspace = lazy(() =>
  import("../pages/PhysioFollowupWorkspace")
);

// ================= DOCTOR / RCM =================
const DoctorDashboard = lazy(() => import("../pages/DoctorDashboard"));
const RcmDashboard = lazy(() => import("../pages/RcmDashboard"));

// ================= CALL CENTER =================
const CallCenterHome = lazy(() => import("../pages/CallCenterHome"));
const CallCenterBookingWorkspace = lazy(() =>
  import("../pages/CallCenterBookingWorkspace")
);
const CallCenterAlertsWorkspace = lazy(() =>
  import("../pages/CallCenterAlertsWorkspace")
);

// ================= APPROVALS =================
const ApprovalsHome = lazy(() => import("../pages/ApprovalsHome"));
const ApprovalsWorkspace = lazy(() =>
  import("../pages/ApprovalsWorkspace")
);
const ApprovalsAlertsWorkspace = lazy(() =>
  import("../pages/ApprovalsAlertsWorkspace")
);

// ================= OTHERS =================
const CallCenterSupervisorDashboard = lazy(() =>
  import("../pages/CallCenterSupervisorDashboard")
);
const VisitorsDashboard = lazy(() => import("../pages/VisitorsDashboard"));
const VisitorCeoDashboard = lazy(() =>
  import("../pages/VisitorCeoDashboard")
);

export const dashboardRoutes = [
  // ================= ADMIN =================
  { path: "/admin", component: AdminDashboard, adminOnly: true },

  // ================= APPROVALS =================
  { path: "/approvals", component: ApprovalsHome, roles: ["approvals"] },
  {
    path: "/approvals/workspace",
    component: ApprovalsWorkspace,
    roles: ["approvals"],
  },
  {
    path: "/approvals/alerts",
    component: ApprovalsAlertsWorkspace,
    roles: ["approvals"],
  },

  // ================= RECEPTION SUPERVISOR =================
  {
    path: "/reception-supervisor",
    component: ReceptionSupervisorDashboard,
    roles: ["reception_supervisor"],
  },

  // ================= PHYSIO =================
  { path: "/physio", component: PhysioHome, roles: ["physio"] },
  {
    path: "/physio/booking",
    component: PhysioBookingWorkspace,
    roles: ["physio"],
  },
  {
    path: "/physio/followup",
    component: PhysioFollowupWorkspace,
    roles: ["physio"],
  },

  // ================= DOCTOR / RCM =================
  { path: "/doctor", component: DoctorDashboard, roles: ["doctor"] },
  { path: "/rcm", component: RcmDashboard, roles: ["rcm"] },

  // ================= CALL CENTER =================
  { path: "/callcenter", component: CallCenterHome, roles: ["callcenter"] },
  {
    path: "/callcenter/booking",
    component: CallCenterBookingWorkspace,
    roles: ["callcenter"],
  },
  {
    path: "/callcenter/alerts",
    component: CallCenterAlertsWorkspace,
    roles: ["callcenter"],
  },

  // ================= SUPERVISOR =================
  {
    path: "/callcenter-supervisor",
    component: CallCenterSupervisorDashboard,
    roles: ["callcenter_supervisor"],
  },

  // ================= VISITORS =================
  { path: "/visitors", component: VisitorsDashboard, roles: ["visitor"] },
  {
    path: "/visitor-ceo",
    component: VisitorCeoDashboard,
    roles: ["visitor_ceo"],
  },
];