import { lazy } from "react";

const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const ReceptionDashboard = lazy(() => import("../pages/ReceptionDashboard"));
const ReceptionSupervisorDashboard = lazy(() =>
  import("../pages/ReceptionSupervisorDashboard")
);
const PhysioDashboard = lazy(() => import("../pages/PhysioDashboard"));
const DoctorDashboard = lazy(() => import("../pages/DoctorDashboard"));
const RcmDashboard = lazy(() => import("../pages/RcmDashboard"));
const CallCenterDashboard = lazy(() => import("../pages/CallCenterDashboard"));
const CallCenterSupervisorDashboard = lazy(() =>
  import("../pages/CallCenterSupervisorDashboard")
);
const VisitorsDashboard = lazy(() => import("../pages/VisitorsDashboard"));
const VisitorCeoDashboard = lazy(() =>
  import("../pages/VisitorCeoDashboard")
);
const ApprovalsDashboard = lazy(() => import("../pages/ApprovalsDashboard"));

export const dashboardRoutes = [
  { path: "/admin", component: AdminDashboard, adminOnly: true },
  { path: "/approvals", component: ApprovalsDashboard, roles: ["approvals"] },
  { path: "/reception", component: ReceptionDashboard, roles: ["reception"] },
  {
    path: "/reception-supervisor",
    component: ReceptionSupervisorDashboard,
    roles: ["reception_supervisor"],
  },
  { path: "/physio", component: PhysioDashboard, roles: ["physio"] },
  { path: "/doctor", component: DoctorDashboard, roles: ["doctor"] },
  { path: "/rcm", component: RcmDashboard, roles: ["rcm"] },
  { path: "/callcenter", component: CallCenterDashboard, roles: ["callcenter"] },
  {
    path: "/callcenter-supervisor",
    component: CallCenterSupervisorDashboard,
    roles: ["callcenter_supervisor"],
  },
  { path: "/visitors", component: VisitorsDashboard, roles: ["visitor"] },
  {
    path: "/visitor-ceo",
    component: VisitorCeoDashboard,
    roles: ["visitor_ceo"],
  },
];