import { useState, useEffect } from 'react';
import { fetchRates } from '../services/api';

const useExchangeRates = ({ base, symbols, startDate, endDate }) => {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!base || !symbols || !startDate || !endDate) return;

    let cancelled = false;

    const loadRates = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchRates(base, symbols, startDate, endDate);
        if (!cancelled) setRates(data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.error || 'Could not load rates');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRates();

    return () => { cancelled = true; };
  }, [base, symbols, startDate, endDate]);

  return { rates, loading, error };
};

export default useExchangeRates;
