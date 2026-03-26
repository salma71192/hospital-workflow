import React, { useState } from "react";

export default function SearchPatient() {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    // Replace alert with API call to search patient
    alert(`Searching patient with File Number: ${query}`);
  };

  return (
    <div>
      <h3>Search Patient</h3>
      <form onSubmit={handleSearch}>
        <input
          placeholder="File Number"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <button type="submit" style={{ marginLeft: "10px" }}>
          Search
        </button>
      </form>
    </div>
  );
}