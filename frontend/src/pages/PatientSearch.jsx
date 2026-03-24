import React, { useState } from "react";
import api from "../api/api";

export default function SearchPatient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await api.get(`patients/search/?q=${query}`);
      setResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Search Patient</h2>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name or File Number"
        />
        <button type="submit">Search</button>
      </form>
      <ul>
        {results.map((p) => (
          <li key={p.id}>{p.full_name} ({p.file_number})</li>
        ))}
      </ul>
    </div>
  );
}