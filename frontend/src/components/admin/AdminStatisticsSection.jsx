import React from "react";
import PhysioStatisticsTable from "../booking/PhysioStatisticsTable";

export default function AdminStatisticsSection({ stats }) {
  return (
    <PhysioStatisticsTable
      stats={stats}
      title="Today Physio Statistics"
    />
  );
}