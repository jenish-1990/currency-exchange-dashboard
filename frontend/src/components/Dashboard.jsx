import { useState, useMemo, useRef } from 'react';
import useExchangeRates from '../hooks/useExchangeRates';
import { toChartData, toGridRows } from '../utils/transformData';
import RateChart from './RateChart';
import RateTable from './RateTable';
import './Dashboard.css';

const formatDate = (date) => date.toISOString().split('T')[0];

const getStartDate = (range) => {
  const start = new Date();
  if (range === '6m') start.setMonth(start.getMonth() - 6);
  else if (range === '1y') start.setFullYear(start.getFullYear() - 1);
  else {
    start.setFullYear(start.getFullYear() - 2);
    start.setDate(start.getDate() + 1);
  }
  return formatDate(start);
};

const DATE_RANGES = [
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
  { label: '2Y', value: '2y' },
];

const CURRENCY_OPTIONS = [
  { key: 'EUR_USD', label: 'EUR/USD', color: '#3b82f6' },
  { key: 'USD_EUR', label: 'USD/EUR', color: '#10b981' },
  { key: 'EUR_CAD', label: 'EUR/CAD', color: '#d946ef' },
  { key: 'CAD_EUR', label: 'CAD/EUR', color: '#f59e0b' },
];

const ALL_CURRENCY_KEYS = ['EUR_USD', 'USD_EUR', 'EUR_CAD', 'CAD_EUR'];

const getSavedRange = () => {
  try {
    const saved = localStorage.getItem('dateRange');
    return ['6m', '1y', '2y'].includes(saved) ? saved : '1y';
  } catch {
    return '1y';
  }
};

const getSavedCurrencies = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('selectedCurrencies'));
    if (Array.isArray(saved) && saved.every((k) => ALL_CURRENCY_KEYS.includes(k))) {
      return saved;
    }
  } catch { /* ignore */ }
  return ALL_CURRENCY_KEYS;
};

const Dashboard = () => {
  const [dateRange, setDateRange] = useState(getSavedRange);
  const [selectedCurrencies, setSelectedCurrencies] = useState(getSavedCurrencies);
  const [hasFilters, setHasFilters] = useState(false);
  const gridRef = useRef(null);

  const clearFilters = () => {
    gridRef.current?.api?.setFilterModel(null);
  };

  const endDate = formatDate(new Date());
  const startDate = getStartDate(dateRange);

  const { rates, loading, error } = useExchangeRates({
    base: 'EUR',
    symbols: 'USD,CAD',
    startDate,
    endDate,
  });

  const chartData = useMemo(() => {
    if (!rates) return { labels: [], datasets: [] };
    const all = toChartData(rates, ['USD', 'CAD']);
    return {
      ...all,
      datasets: all.datasets.filter((ds) =>
        selectedCurrencies.includes(ds.label.replace('/', '_'))
      ),
    };
  }, [rates, selectedCurrencies]);

  const gridRows = useMemo(() => {
    return rates ? toGridRows(rates) : [];
  }, [rates]);

  const stats = useMemo(() => {
    if (!rates?.length) return null;
    const latest = rates[rates.length - 1];
    const first = rates[0];

    const pairs = [
      { key: 'EUR_USD', rate: latest.rates.USD, start: first.rates.USD },
      { key: 'USD_EUR', rate: 1 / latest.rates.USD, start: 1 / first.rates.USD },
      { key: 'EUR_CAD', rate: latest.rates.CAD, start: first.rates.CAD },
      { key: 'CAD_EUR', rate: 1 / latest.rates.CAD, start: 1 / first.rates.CAD },
    ];

    return pairs.map(p => ({
      ...p,
      label: p.key.replace('_', ' / '),
      change: ((p.rate - p.start) / p.start) * 100,
    }));
  }, [rates]);

  const handleRangeChange = (value) => {
    setDateRange(value);
    localStorage.setItem('dateRange', value);
  };

  const handleCurrencyToggle = (key) => {
    setSelectedCurrencies((prev) => {
      const next = prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key];
      localStorage.setItem('selectedCurrencies', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="dash-outer">
      <div className="dash-header">
        <div className="dash-brand">
          <img src="/logo.svg" alt="" className="dash-logo" />
          <div>
            <h1 className="dash-title">Currency Dashboard</h1>
            <p className="dash-subtitle">Track exchange rates in real time</p>
          </div>
        </div>
        <div className="range-group">
          {DATE_RANGES.map(({ label, value }) => (
            <button
              key={value}
              className={`range-btn ${dateRange === value ? 'range-btn-active' : ''}`}
              onClick={() => handleRangeChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="dash-error">
          {error}
        </div>
      )}

      <div className="dash-pills">
        {CURRENCY_OPTIONS.map(({ key, label, color }) => {
          const active = selectedCurrencies.includes(key);
          return (
            <button
              key={key}
              className={`currency-pill ${active ? 'currency-pill-active' : ''}`}
              onClick={() => handleCurrencyToggle(key)}
            >
              <span className="pill-dot" style={{ backgroundColor: color }} />
              {label}
            </button>
          );
        })}
      </div>

      <div className={`dash-content ${loading ? 'dash-loading' : ''}`}>
        {stats && (
          <div className="stat-grid">
            {stats.map(({ key, label, rate, change }, i) => (
              <div key={key} className="stat-card" style={{ animationDelay: `${i * 0.05}s` }}>
                <span className="stat-label">{label}</span>
                <span className="stat-value">{rate.toFixed(4)}</span>
                <span className={`stat-change ${change >= 0 ? 'positive' : 'negative'}`}>
                  {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="dash-card">
          <div className="card-header">
            <h2 className="card-heading">Exchange Rates</h2>
          </div>
          <div className="card-body">
            <RateChart data={chartData} loading={loading} />
          </div>
        </div>

        <div className="dash-card" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <h2 className="card-heading">Historical Data</h2>
            <div className="card-header-actions">
              {hasFilters && (
                <button className="clear-filter-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
              {gridRows.length > 0 && (
                <span className="card-meta">{gridRows.length} data points</span>
              )}
            </div>
          </div>
          <div className="card-body card-body-table">
            <RateTable
              rowData={gridRows}
              loading={loading}
              gridRef={gridRef}
              onFilterChange={setHasFilters}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
