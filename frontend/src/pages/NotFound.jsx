/**
 * pages/NotFound.jsx – 404 page
 */

import { useNavigate } from 'react-router-dom';
import { Home, Zap } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md animate-slide-up">
        <div className="text-8xl font-black gradient-text mb-4">404</div>
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center mx-auto mb-6 shadow-glow-md">
          <Zap size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-dark-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button variant="primary" icon={Home} onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
