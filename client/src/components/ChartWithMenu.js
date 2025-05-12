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
import '../pages/SharedStyles.css';


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
  ChartComponent,  
  data,
  options = {},
  filename,        
  title           
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