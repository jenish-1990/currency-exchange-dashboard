import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './RateChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const crosshairPlugin = {
  id: 'crosshair',
  afterDraw: (chart) => {
    if (chart.tooltip?._active?.length) {
      const { ctx } = chart;
      const x = chart.tooltip._active[0].element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.stroke();
      ctx.restore();
    }
  },
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 600, easing: 'easeInOutQuart' },
  transitions: {
    active: { animation: { duration: 200 } },
  },
  plugins: {
    legend: { display: false },
    title: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f1f5f9',
      bodyColor: '#cbd5e1',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: { weight: 600, family: 'DM Sans', size: 14 },
      bodyFont: { family: 'DM Sans', size: 13 },
      boxWidth: 8,
      boxHeight: 8,
      usePointStyle: true,
      boxPadding: 6,
      titleMarginBottom: 6,
      callbacks: {
        title: (items) => {
          const label = items[0]?.label;
          if (!label) return '';
          const [y, m, d] = label.split('-');
          return new Date(y, m - 1, d).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          });
        },
      },
    },
  },
  scales: {
    x: {
      ticks: {
        color: '#64748b',
        font: { size: 11, family: 'DM Sans' },
        maxRotation: 0,
        callback: function(value) {
          const label = this.getLabelForValue(value);
          if (!label) return '';
          const [y, m, d] = label.split('-');
          return new Date(y, m - 1, d).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          });
        },
      },
      grid: { color: 'rgba(255, 255, 255, 0.04)' },
      border: { color: 'rgba(255, 255, 255, 0.06)' },
    },
    y: {
      ticks: { color: '#64748b', font: { size: 11, family: 'DM Sans' } },
      grid: { color: 'rgba(255, 255, 255, 0.04)' },
      border: { display: false },
    },
  },
  elements: {
    line: { borderWidth: 2 },
    point: { radius: 0, hoverRadius: 5, hoverBorderWidth: 2, backgroundColor: '#1e293b' },
  },
  interaction: {
    mode: 'index',
    intersect: false,
  },
};

const RateChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="chart-wrap loading-state">
        <span className="spinner" />
        <span className="loading-text">Loading chart...</span>
      </div>
    );
  }

  if (!data || !data.datasets?.length) {
    return (
      <div className="chart-wrap empty-state">
        No data available
      </div>
    );
  }

  return (
    <div className="chart-wrap">
      <Line data={data} options={chartOptions} plugins={[crosshairPlugin]} />
    </div>
  );
};

export default RateChart;
