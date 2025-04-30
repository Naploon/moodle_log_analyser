import React, { useRef } from 'react';
import ChartMenu from './ChartMenu';
import { Chart } from 'chart.js';
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import '../pages/SharedStyles.css'; // for .chart-container, .unified-box, etc.

// register core elements and a white-background plugin just once
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);
Chart.register({
  id: 'whiteBackground',
  beforeDraw: chart => {
    const ctx = chart.ctx;
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
});

function ChartWithMenu({
  ChartComponent,  // e.g. Line, Bar, Pie
  data,
  options = {},
  filename,        // base name for exports
  title            // chart title
}) {
  const ref = useRef(null);

  return (
    <div className="chart-container unified-box">
      <h2 className="chart-title">{title}</h2>
      <ChartMenu chartRef={ref} data={data} filename={filename} />
      <ChartComponent ref={ref} data={data} options={options} />
    </div>
  );
}

export default ChartWithMenu; 