import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, Loader2 } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, fullName);
    } catch (err: unknown) {
      setError(
        isRegistrationError(err)
          ? err.response?.data?.detail ?? 'Registration failed. Please try again.'
          : err instanceof Error
          ? err.message
          : 'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div
        className="w-full max-w-md p-8"
        style={{
          background: 'rgba(20, 20, 20, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <BrainCircuit size={40} style={{ color: '#6366f1' }} className="mb-3" />
          <h1 className="text-2xl font-light tracking-tight text-[#e2e2e2]">InsightPulse</h1>
          <p className="text-sm text-[#5a5a5a] mt-1">Create your account</p>
        </div>

        {error && (
          <div
            className="mb-4 p-3 rounded-lg text-sm"
            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[#5a5a5a] mb-1.5 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="ip-input"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-[#5a5a5a] mb-1.5 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ip-input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-[#5a5a5a] mb-1.5 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="ip-input"
              placeholder="Min 6 characters"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-[#5a5a5a] mb-1.5 uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="ip-input"
              placeholder="Repeat your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="ip-btn w-full flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-[#5a5a5a] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#e2e2e2] hover:text-white transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
