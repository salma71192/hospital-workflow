import React from "react";
import AlertPanel from "../common/AlertPanel";

export default function ReceptionAlerts({ alerts = [] }) {
  if (!alerts.length) return null;

  return (
    <AlertPanel
      title="Reception Alerts"
      items={alerts}
      emptyText="No reception alerts right now."
    />
  );
}