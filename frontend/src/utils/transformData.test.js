import { describe, it, expect } from 'vitest';
import { toChartData, toGridRows } from './transformData';

const MOCK_DATA = [
  { date: '2024-01-02', base: 'EUR', rates: { USD: 1.5, CAD: 2.0 } },
  { date: '2024-01-03', base: 'EUR', rates: { USD: 1.6, CAD: 2.1 } },
  { date: '2024-01-04', base: 'EUR', rates: { USD: 1.55, CAD: 2.05 } },
];

describe('toChartData', () => {
  it('handles null/empty input', () => {
    expect(toChartData(null, ['USD'])).toEqual({ labels: [], datasets: [] });
    expect(toChartData([], ['USD'])).toEqual({ labels: [], datasets: [] });
  });

  it('extracts dates as labels', () => {
    const result = toChartData(MOCK_DATA, ['USD']);
    expect(result.labels).toEqual(['2024-01-02', '2024-01-03', '2024-01-04']);
  });

  it('makes forward + reverse datasets per currency', () => {
    const result = toChartData(MOCK_DATA, ['USD']);
    expect(result.datasets).toHaveLength(2);
    expect(result.datasets[0].label).toBe('EUR/USD');
    expect(result.datasets[1].label).toBe('USD/EUR');
  });

  it('2 currencies = 4 datasets', () => {
    const result = toChartData(MOCK_DATA, ['USD', 'CAD']);
    expect(result.datasets).toHaveLength(4);

    const labels = result.datasets.map(d => d.label);
    expect(labels).toEqual(['EUR/USD', 'USD/EUR', 'EUR/CAD', 'CAD/EUR']);
  });

  it('maps forward rates correctly', () => {
    const result = toChartData(MOCK_DATA, ['USD']);
    expect(result.datasets[0].data).toEqual([1.5, 1.6, 1.55]);
  });

  it('reverse rates are 1/rate', () => {
    const result = toChartData(MOCK_DATA, ['USD']);
    const reverseData = result.datasets[1].data;
    expect(reverseData[0]).toBeCloseTo(1 / 1.5, 10);
    expect(reverseData[1]).toBeCloseTo(1 / 1.6, 10);
  });

  it('uses distinct colors', () => {
    const result = toChartData(MOCK_DATA, ['USD', 'CAD']);
    const colors = result.datasets.map(d => d.borderColor);
    expect(new Set(colors).size).toBe(4);
  });

  it('empty currencies = no datasets', () => {
    const result = toChartData(MOCK_DATA, []);
    expect(result.labels).toHaveLength(3);
    expect(result.datasets).toEqual([]);
  });
});

describe('toGridRows', () => {
  it('handles null/empty', () => {
    expect(toGridRows(null)).toEqual([]);
    expect(toGridRows([])).toEqual([]);
  });

  it('one row per date', () => {
    const rows = toGridRows(MOCK_DATA);
    expect(rows).toHaveLength(3);
  });

  it('has date field', () => {
    const rows = toGridRows(MOCK_DATA);
    expect(rows[0].date).toBe('2024-01-02');
  });

  it('has forward rate columns', () => {
    const rows = toGridRows(MOCK_DATA);
    expect(rows[0].EUR_USD).toBe(1.5);
    expect(rows[0].EUR_CAD).toBe(2.0);
  });

  it('has reverse rate columns', () => {
    const rows = toGridRows(MOCK_DATA);
    expect(rows[0].USD_EUR).toBeCloseTo(1 / 1.5, 6);
    expect(rows[0].CAD_EUR).toBeCloseTo(1 / 2.0, 6);
  });

  it('rounds to 6 decimals', () => {
    const rows = toGridRows(MOCK_DATA);
    const decimals = rows[0].USD_EUR.toString().split('.')[1]?.length || 0;
    expect(decimals).toBeLessThanOrEqual(6);
  });
});
