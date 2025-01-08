import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Optional: Create a separate CSS file for Navbar styles

function Navbar() {
  return (
    <nav className="sidebar">
      <ul>
        <li><Link to="/dashboard">Dashboard Overview</Link></li>
        <li><Link to="/user">User Page</Link></li>
        <li><Link to="/event-analysis">Event Analysis</Link></li>
        <li><Link to="/material-analysis">Material Analysis</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;
