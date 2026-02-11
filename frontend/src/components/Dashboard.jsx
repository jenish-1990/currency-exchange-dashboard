import { useState, useMemo, useRef, useCallback } from "react";
import useExchangeRates from "../hooks/useExchangeRates";
import { toChartData, toGridRows } from "../utils/transformData";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import RateChart from "./RateChart";
import RateTable from "./RateTable";
import "./Dashboard.css";

const formatDate = (date) => date.toLocaleDateString("en-CA");

const getStartDate = (range) => {
  const start = new Date();
  if (range === "6m") start.setMonth(start.getMonth() - 6);
  else if (range === "1y") start.setFullYear(start.getFullYear() - 1);
  else {
    start.setFullYear(start.getFullYear() - 2);
    start.setDate(start.getDate() + 1);
  }
  return formatDate(start);
};

const DATE_RANGES = [
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
  { label: "2Y", value: "2y" },
];

const CURRENCY_OPTIONS = [
  { key: "EUR_USD", label: "EUR/USD", color: "#3b82f6" },
  { key: "USD_EUR", label: "USD/EUR", color: "#10b981" },
  { key: "EUR_CAD", label: "EUR/CAD", color: "#d946ef" },
  { key: "CAD_EUR", label: "CAD/EUR", color: "#f59e0b" },
];

const ALL_CURRENCY_KEYS = CURRENCY_OPTIONS.map((c) => c.key);

const getSavedRange = () => {
  const saved = localStorage.getItem("dateRange");
  return ["6m", "1y", "2y"].includes(saved) ? saved : "1y";
};

const getSavedCurrencies = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("selectedCurrencies"));
    if (Array.isArray(saved) && saved.every((k) => ALL_CURRENCY_KEYS.includes(k))) {
      return saved;
    }
  } catch {}
  return ALL_CURRENCY_KEYS;
};

const Dashboard = () => {
  const [dateRange, setDateRange] = useState(getSavedRange);
  const [selectedCurrencies, setSelectedCurrencies] =
    useState(getSavedCurrencies);
  const [filteredCount, setFilteredCount] = useState(null);
  const gridRef = useRef(null);

  const clearFilters = () => {
    gridRef.current?.api?.setFilterModel(null);
  };

  const handleFilterChange = useCallback((isFiltered, count) => {
    setFilteredCount(isFiltered ? count : null);
  }, []);

  const exportCsv = () => {
    gridRef.current?.api?.exportDataAsCsv({
      fileName: `exchange-rates-${dateRange}`,
      processCellCallback: (p) =>
        p.column.getColId() === "date" ? p.node.data.date : p.value,
    });
  };

  const exportPdf = () => {
    const api = gridRef.current?.api;
    if (!api) return;

    const rows = [];
    api.forEachNodeAfterFilterAndSort((n) => rows.push(n.data));
    if (!rows.length) return;

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Exchange Rates", 14, 18);
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      `Exported ${new Date().toLocaleDateString()}  |  ${rows.length} records`,
      14,
      25,
    );

    autoTable(doc, {
      head: [["Date", "EUR/USD", "USD/EUR", "EUR/CAD", "CAD/EUR"]],
      body: rows.map((r) => [
        r.date,
        r.EUR_USD,
        r.USD_EUR,
        r.EUR_CAD,
        r.CAD_EUR,
      ]),
      startY: 30,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 41, 59] },
    });

    doc.save(`exchange-rates-${dateRange}.pdf`);
  };

  const endDate = formatDate(new Date());
  const startDate = getStartDate(dateRange);

  const { rates, loading, error } = useExchangeRates({
    base: "EUR",
    symbols: "USD,CAD",
    startDate,
    endDate,
  });

  const chartData = useMemo(() => {
    if (!rates) return { labels: [], datasets: [] };
    const all = toChartData(rates, ["USD", "CAD"]);
    return {
      ...all,
      datasets: all.datasets.filter((ds) =>
        selectedCurrencies.includes(ds.label.replace("/", "_")),
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

    const pct = (now, then) => ((now - then) / then) * 100;
    const eurUsd = latest.rates.USD;
    const eurCad = latest.rates.CAD;

    return [
      {
        key: "EUR_USD",
        label: "EUR / USD",
        rate: eurUsd,
        change: pct(eurUsd, first.rates.USD),
      },
      {
        key: "USD_EUR",
        label: "USD / EUR",
        rate: 1 / eurUsd,
        change: pct(1 / eurUsd, 1 / first.rates.USD),
      },
      {
        key: "EUR_CAD",
        label: "EUR / CAD",
        rate: eurCad,
        change: pct(eurCad, first.rates.CAD),
      },
      {
        key: "CAD_EUR",
        label: "CAD / EUR",
        rate: 1 / eurCad,
        change: pct(1 / eurCad, 1 / first.rates.CAD),
      },
    ];
  }, [rates]);

  const handleRangeChange = (value) => {
    setDateRange(value);
    localStorage.setItem("dateRange", value);
  };

  const handleCurrencyToggle = (key) => {
    setSelectedCurrencies((prev) => {
      const next = prev.includes(key)
        ? prev.filter((c) => c !== key)
        : [...prev, key];
      localStorage.setItem("selectedCurrencies", JSON.stringify(next));
      return next;
    });
  };

  const handleReset = () => {
    handleRangeChange("1y");
    setSelectedCurrencies(ALL_CURRENCY_KEYS);
    localStorage.setItem(
      "selectedCurrencies",
      JSON.stringify(ALL_CURRENCY_KEYS),
    );
  };

  const isDefault =
    dateRange === "1y" &&
    selectedCurrencies.length === ALL_CURRENCY_KEYS.length;

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
              className={`range-btn ${dateRange === value ? "range-btn-active" : ""}`}
              onClick={() => handleRangeChange(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="dash-error">{error}</div>}

      <div className="dash-pills">
        {CURRENCY_OPTIONS.map(({ key, label, color }) => {
          const active = selectedCurrencies.includes(key);
          return (
            <button
              key={key}
              className={`currency-pill ${active ? "currency-pill-active" : ""}`}
              onClick={() => handleCurrencyToggle(key)}
            >
              <span className="pill-dot" style={{ backgroundColor: color }} />
              {label}
            </button>
          );
        })}
        {!isDefault && (
          <button className="reset-btn" onClick={handleReset}>
            Reset
          </button>
        )}
      </div>

      <div className={`dash-content ${loading ? "dash-loading" : ""}`}>
        {stats && (
          <div className="stat-grid">
            {stats.map(({ key, label, rate, change }, i) => (
              <div
                key={key}
                className="stat-card"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="stat-label">{label}</span>
                <span className="stat-value">{rate.toFixed(4)}</span>
                <span
                  className={`stat-change ${change >= 0 ? "positive" : "negative"}`}
                >
                  {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(2)}%
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

        <div className="dash-card" style={{ animationDelay: "0.1s" }}>
          <div className="card-header">
            <h2 className="card-heading">Historical Data</h2>
            <div className="card-header-actions">
              {filteredCount !== null && (
                <button className="clear-filter-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
              {gridRows.length > 0 && (
                <>
                  <span className="card-meta">
                    {filteredCount !== null
                      ? `${filteredCount} of ${gridRows.length}`
                      : gridRows.length}{" "}
                    data points
                  </span>
                  <div className="export-group">
                    <button className="export-btn" onClick={exportCsv}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      CSV
                    </button>
                    <button className="export-btn" onClick={exportPdf}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="card-body card-body-table">
            <RateTable
              rowData={gridRows}
              gridRef={gridRef}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
