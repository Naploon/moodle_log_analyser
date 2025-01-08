import React from 'react';
import Navbar from '../components/Navbar'; // Adjust the path as necessary
import './UserPage.css'; // Optional: Create a separate CSS file for UserPage styles

function UserPage() {
  return (
    <div className="user-page">
      <Navbar />
      <div className="main-content">
        <h1 className="page-title">User Page</h1>
        {/* Add more content specific to the User Page here */}
      </div>
    </div>
  );
}

export default UserPage;