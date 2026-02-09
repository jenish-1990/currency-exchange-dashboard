import './Controls.css';

const DATE_RANGES = [
  { label: '6 Months', value: '6m' },
  { label: '1 Year', value: '1y' },
  { label: '2 Years', value: '2y' },
];

const CURRENCY_OPTIONS = [
  { key: 'USD', label: 'EUR/USD', color: '#2563eb' },
  { key: 'CAD', label: 'EUR/CAD', color: '#16a34a' },
];

const Controls = ({ selectedCurrencies, onCurrencyToggle, dateRange, onDateRangeChange }) => {
  return (
    <div className="controls-bar">
      <div className="controls-group">
        <span className="controls-label">Period:</span>
        {DATE_RANGES.map(({ label, value }) => (
          <button
            key={value}
            className={`range-btn ${dateRange === value ? 'active' : ''}`}
            onClick={() => onDateRangeChange(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="controls-group">
        <span className="controls-label">Currencies:</span>
        {CURRENCY_OPTIONS.map(({ key, label, color }) => (
          <label key={key} className="currency-toggle">
            <input
              type="checkbox"
              checked={selectedCurrencies.includes(key)}
              onChange={() => onCurrencyToggle(key)}
            />
            <span className="color-dot" style={{ backgroundColor: color }} />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
};

export default Controls;
