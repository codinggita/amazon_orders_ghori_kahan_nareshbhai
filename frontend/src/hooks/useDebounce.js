import { useState, useEffect } from 'react';

/**
 * useDebounce — Delays updating a value until after a specified wait period.
 * Prevents excessive API calls during rapid input (search, filters).
 *
 * @param {*} value - The value to debounce
 * @param {number} delay - Milliseconds to wait (default: 500ms)
 * @returns {*} The debounced value
 *
 * @example
 * const debouncedSearch = useDebounce(searchInput, 600);
 * useEffect(() => { fetchData(debouncedSearch); }, [debouncedSearch]);
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
