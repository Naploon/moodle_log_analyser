import React, { useState } from 'react';
import './ChartMenu.css';

function ChartMenu({ chartRef, data, filename }) {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(o => !o);

  const exportPNG = () => {
    if (!chartRef.current) return;
    const url = chartRef.current.toBase64Image();
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.png`;
    a.click();
    setOpen(false);
  };

  const exportCSV = () => {
    if (!data.labels || !data.datasets) return;
    const headers = ['Label', ...data.datasets.map(ds => ds.label)];
    const rows = data.labels.map((lab,i) =>
      [lab, ...data.datasets.map(ds => ds.data[i])]
    );
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <div className="chart-menu">
      <button className="kebab-button" onClick={toggle}>⋮</button>
      {open && (
        <ul className="kebab-dropdown">
          <li onClick={exportPNG}>Download PNG</li>
          <li onClick={exportCSV}>Download CSV</li>
        </ul>
      )}
    </div>
  );
}

export default ChartMenu;