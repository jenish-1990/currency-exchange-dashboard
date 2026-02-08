import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export const fetchRates = async (base, symbols, startDate, endDate) => {
  const response = await api.get('/rates/', {
    params: {
      base,
      symbols,
      start_date: startDate,
      end_date: endDate,
    },
  });
  return response.data;
};

export const fetchCurrencies = async () => {
  const response = await api.get('/currencies/');
  return response.data;
};
