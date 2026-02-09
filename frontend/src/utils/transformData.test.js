import { describe, it, expect } from 'vitest';
import { toChartData, toGridRows } from './transformData';

const MOCK_DATA = [
  { date: '2024-01-02', base: 'EUR', rates: { USD: 1.0956, CAD: 1.4567 } },
  { date: '2024-01-03', base: 'EUR', rates: { USD: 1.0978, CAD: 1.4589 } },
  { date: '2024-01-04', base: 'EUR', rates: { USD: 1.0912, CAD: 1.4602 } },
];

describe('toChartData', () => {
  it('returns empty structure for null or empty input', () => {
    expect(toChartData(null, ['USD'])).toEqual({ labels: [], datasets: [] });
    expect(toChartData([], ['USD'])).toEqual({ labels: [], datasets: [] });
  });

  it('extracts dates as labels', () => {
    const result = toChartData(MOCK_DATA, ['USD']);
    expect(result.labels).toEqual(['2024-01-02', '2024-01-03', '2024-01-04']);
  });

  it('creates forward and reverse datasets per currency', () => {
    const result = toChartData(MOCK_DATA, ['USD']);
    expect(result.datasets).toHaveLength(2);
    expect(result.datasets[0].label).toBe('EUR/USD');
    expect(result.datasets[1].label).toBe('USD/EUR');
  });

  it('generates 4 datasets for 2 selected currencies', () => {
    const result = toChartData(MOCK_DATA, ['USD', 'CAD']);
    expect(result.datasets).toHaveLength(4);

    const labels = result.datasets.map(d => d.label);
    expect(labels).toEqual(['EUR/USD', 'USD/EUR', 'EUR/CAD', 'CAD/EUR']);
  });

  it('maps forward rate data correctly', () => {
    const result = toChartData(MOCK_DATA, ['USD']);
    expect(result.datasets[0].data).toEqual([1.0956, 1.0978, 1.0912]);
  });

  it('calculates reverse rates as 1/rate', () => {
    const result = toChartData(MOCK_DATA, ['USD']);
    const reverseData = result.datasets[1].data;

    expect(reverseData[0]).toBeCloseTo(1 / 1.0956, 10);
    expect(reverseData[1]).toBeCloseTo(1 / 1.0978, 10);
    expect(reverseData[2]).toBeCloseTo(1 / 1.0912, 10);
  });

  it('assigns distinct colors to each dataset', () => {
    const result = toChartData(MOCK_DATA, ['USD', 'CAD']);
    const colors = result.datasets.map(d => d.borderColor);
    const unique = new Set(colors);
    expect(unique.size).toBe(4);
  });

  it('sets tension on all datasets', () => {
    const result = toChartData(MOCK_DATA, ['USD', 'CAD']);
    result.datasets.forEach(ds => {
      expect(ds.tension).toBe(0.1);
    });
  });

  it('returns no datasets when selectedCurrencies is empty', () => {
    const result = toChartData(MOCK_DATA, []);
    expect(result.labels).toHaveLength(3);
    expect(result.datasets).toEqual([]);
  });
});

describe('toGridRows', () => {
  it('returns empty array for null or empty input', () => {
    expect(toGridRows(null)).toEqual([]);
    expect(toGridRows([])).toEqual([]);
  });

  it('creates one row per date', () => {
    const rows = toGridRows(MOCK_DATA);
    expect(rows).toHaveLength(3);
  });

  it('includes the date field', () => {
    const rows = toGridRows(MOCK_DATA);
    expect(rows[0].date).toBe('2024-01-02');
    expect(rows[2].date).toBe('2024-01-04');
  });

  it('includes forward rate columns with base_target naming', () => {
    const rows = toGridRows(MOCK_DATA);
    expect(rows[0].EUR_USD).toBe(1.0956);
    expect(rows[0].EUR_CAD).toBe(1.4567);
  });

  it('includes reverse rate columns as 1/rate', () => {
    const rows = toGridRows(MOCK_DATA);
    expect(rows[0].USD_EUR).toBeCloseTo(1 / 1.0956, 6);
    expect(rows[0].CAD_EUR).toBeCloseTo(1 / 1.4567, 6);
  });

  it('rounds values to 6 decimal places', () => {
    const rows = toGridRows(MOCK_DATA);
    const decimalPlaces = (n) => {
      const str = n.toString();
      return str.includes('.') ? str.split('.')[1].length : 0;
    };
    expect(decimalPlaces(rows[0].USD_EUR)).toBeLessThanOrEqual(6);
    expect(decimalPlaces(rows[0].CAD_EUR)).toBeLessThanOrEqual(6);
  });
});
