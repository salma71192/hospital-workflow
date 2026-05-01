import React from "react";
import ReceptionBookingWorkspace from "./ReceptionBookingWorkspace";

export default function PhysioBookingWorkspace(props) {
  return <ReceptionBookingWorkspace {...props} isPhysio={true}
  leaderboardScope="physio"   // ✅ ADD THIS
   />;
}