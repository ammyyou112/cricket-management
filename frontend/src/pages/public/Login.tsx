import { useState, FormEvent, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  const errorRef = useRef('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sync error to ref for persistence
  useEffect(() => {
    if (error) {
      errorRef.current = error;
    }
  }, [error]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field errors when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    // Clear general error when user starts typing
    if (error || errorRef.current) {
      setError('');
      errorRef.current = '';
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    setError('');
    setFieldErrors({});

    // Basic validation
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const user = await login({ email: formData.email, password: formData.password });
      toast({
        title: 'Success',
        description: 'Login successful!',
      });
      // Navigate to role-based dashboard
      const dashboardPath = `/${user.role}/dashboard`;
      navigate(dashboardPath);
    } catch (err: any) {
      // Extract error message from multiple possible sources
      let errorMessage = 'Login failed. Please try again.';
      
      // Try to get error message from various sources (in order of priority)
      if (err?.response?.data?.message) {
        errorMessage = String(err.response.data.message);
      } else if (err?.response?.data?.error) {
        errorMessage = String(err.response.data.error);
      } else if (err?.message) {
        errorMessage = String(err.message);
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Ensure error message is not empty
      if (!errorMessage || errorMessage.trim().length === 0) {
        errorMessage = 'Login failed. Please check your credentials and try again.';
      }
      
      // CRITICAL: Set error state immediately and ensure it persists
      const finalErrorMessage = errorMessage.trim();
      
      // Set in ref first (persists immediately)
      errorRef.current = finalErrorMessage;
      
      // Then set in state (triggers re-render)
      setError(finalErrorMessage);
      
      // Also show toast notification as backup (ensures user sees error)
      toast({
        title: 'Login Failed',
        description: finalErrorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Login to your Cricket 360 account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error Message - Display at top of form card - MUST BE VISIBLE */}
          {(error || errorRef.current) && (error || errorRef.current).trim().length > 0 && (
            <div 
              key={`error-${error || errorRef.current}`}
              className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md"
              style={{ display: 'block', visibility: 'visible', opacity: 1 }}
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-800 flex-1">{error || errorRef.current}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  fieldErrors.email 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-green-500'
                }`}
                placeholder="john@example.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors pr-10 ${
                    fieldErrors.password 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 focus:ring-green-500'
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-green-600 hover:text-green-700"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-green-600 hover:text-green-700">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
