import React, { useState } from 'react';
import './ChartMenu.css';

function TableMenu({ tableData, filenameBase }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(o => !o);

  const exportCSV = () => {
    if (!tableData || tableData.length === 0) return;

    const headers = ['User Name', 'Last Activity Timestamp'];
    const csvRows = [
      headers.join(','), 
      ...tableData.map(user =>
  
        `"${user.name.replace(/"/g, '""')}","${user.lastTimestamp}"`
      )
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);

    const filename = `${filenameBase.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-zero-interaction-users.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div className="chart-menu">
      <button className="kebab-button" onClick={toggle}>⋮</button>
      {open && (
        <ul className="kebab-dropdown">
          <li onClick={exportCSV}>Download CSV</li>
        </ul>
      )}
    </div>
  );
}

export default TableMenu; 