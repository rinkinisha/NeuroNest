import { createContext, useContext, useState, useCallback } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const ReflectionContext = createContext(null);

export const ReflectionProvider = ({ children }) => {
  const [reflections, setReflections] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all reflections for the user
  const fetchReflections = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/reflections');
      setReflections(data.data || []);
      return data.data || [];
    } catch (err) {
      toast.error('Failed to load reflections');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch daily summary for a specific date (defaults to today)
  const fetchDailySummary = useCallback(async (date) => {
    setLoading(true);
    try {
      const dateStr = date || new Date().toISOString().split('T')[0];
      const { data } = await API.get(`/reflections/daily?date=${dateStr}`);
      setDailySummary(data);
      return data;
    } catch (err) {
      toast.error('Failed to load daily summary');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new reflection
  const addReflection = useCallback(async (content, topicsToRevise, goal) => {
    setLoading(true);
    try {
      const { data } = await API.post('/reflections', {
        content,
        topicsToRevise,
        goal
      });
      toast.success('Reflection submitted successfully! 🌟');
      // Refresh list of reflections
      await fetchReflections();
      return { success: true, data: data.data };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to submit reflection';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [fetchReflections]);

  const value = {
    reflections,
    dailySummary,
    loading,
    fetchReflections,
    fetchDailySummary,
    addReflection
  };

  return (
    <ReflectionContext.Provider value={value}>
      {children}
    </ReflectionContext.Provider>
  );
};

// Custom hook to consume the reflection context
export const useReflection = () => {
  const context = useContext(ReflectionContext);
  if (!context) {
    throw new Error('useReflection must be used within a ReflectionProvider');
  }
  return context;
};

export default ReflectionContext;
