import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

interface AuthProps {
  onAuthenticated: () => void;
}

export function Auth({ onAuthenticated }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        onAuthenticated();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        onAuthenticated();
      }
    });

    return () => subscription.unsubscribe();
  }, [onAuthenticated]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Registrierung erfolgreich! Bitte überprüfe deine E-Mail.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // onAuthenticated will be called by the auth state change listener
      }
    } catch (error: any) {
      setMessage(error.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  // Simple dev bypass for testing without auth
  const handleDevBypass = () => {
    console.log('⚠️ DEV MODE: Bypassing authentication');
    onAuthenticated();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TaskFlow</h1>
          <p className="text-gray-600">
            {isSignUp ? 'Erstelle einen Account' : 'Melde dich an'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="deine@email.de"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('erfolgreich') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Lädt...' : isSignUp ? 'Registrieren' : 'Anmelden'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-600 hover:text-blue-800"
            disabled={loading}
          >
            {isSignUp ? 'Bereits registriert? Anmelden' : 'Noch kein Account? Registrieren'}
          </button>
        </div>

        {/* Dev Mode Bypass - Remove in production! */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={handleDevBypass}
            className="w-full bg-yellow-100 text-yellow-800 py-2 px-4 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
          >
            ⚠️ Dev Mode: Ohne Auth fortfahren
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Nur für Entwicklung! In Produktion entfernen.
          </p>
        </div>
      </div>
    </div>
  );
}
