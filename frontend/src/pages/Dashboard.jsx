import React, { useEffect, useState } from "react";
import api from "../api/api";

export default function Dashboard() {
  const [patientsToday, setPatientsToday] = useState(0);
  const [patientsMonth, setPatientsMonth] = useState(0);

  useEffect(() => {
    api.get("patients/stats/")
      .then(res => {
        setPatientsToday(res.data.today);
        setPatientsMonth(res.data.month);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Patients today: {patientsToday}</p>
      <p>Patients this month: {patientsMonth}</p>
    </div>
  );
}