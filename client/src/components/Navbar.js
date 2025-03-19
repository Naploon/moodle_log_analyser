import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  const [includeTeachers, setIncludeTeachers] = useState(false);

  const handleCheckboxChange = () => {
    setIncludeTeachers(!includeTeachers);
    // Placeholder for logic to include/exclude teachers
    console.log('Include Teachers:', !includeTeachers);
  };

  return (
    <div className="navbar">
      <ul>
        <li><Link to="/dashboard">Dashboard Overview</Link></li>
        <li><Link to="/user">User Page</Link></li>
        <li><Link to="/event-analysis">Event Analysis</Link></li>
        <li><Link to="/material-analysis">Material Analysis</Link></li>
      </ul>
      <div className="checkbox-container">
        <label>
          <input
            type="checkbox"
            checked={includeTeachers}
            onChange={handleCheckboxChange}
          />
          Include Teachers
        </label>
      </div>
    </div>
  );
}

export default Navbar;
