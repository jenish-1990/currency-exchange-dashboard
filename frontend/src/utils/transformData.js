export const formatDisplayDate = (iso) => {
  const [y, m, d] = iso.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const LINE_COLORS = ['#3b82f6', '#10b981', '#d946ef', '#f59e0b'];

export const toChartData = (apiData, selectedCurrencies) => {
  if (!apiData || !apiData.length) {
    return { labels: [], datasets: [] };
  }

  const base = apiData[0].base;
  const labels = apiData.map(entry => entry.date);
  const datasets = [];
  let colorIdx = 0;

  for (const currency of selectedCurrencies) {
    datasets.push({
      label: `${base}/${currency}`,
      data: apiData.map(entry => entry.rates[currency] ?? null),
      borderColor: LINE_COLORS[colorIdx % LINE_COLORS.length],
      tension: 0.3,
    });
    colorIdx++;

    datasets.push({
      label: `${currency}/${base}`,
      data: apiData.map(entry => {
        const rate = entry.rates[currency];
        return rate ? 1 / rate : null;
      }),
      borderColor: LINE_COLORS[colorIdx % LINE_COLORS.length],
      tension: 0.3,
    });
    colorIdx++;
  }

  return { labels, datasets };
};

export const toGridRows = (apiData) => {
  if (!apiData || !apiData.length) return [];

  const base = apiData[0].base;

  return apiData.map(entry => {
    const row = { date: entry.date };

    for (const [currency, rate] of Object.entries(entry.rates)) {
      row[`${base}_${currency}`] = Number(rate.toFixed(6));
      row[`${currency}_${base}`] = Number((1 / rate).toFixed(6));
    }

    return row;
  });
};
