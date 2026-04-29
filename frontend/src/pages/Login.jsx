import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, Loader } from 'lucide-react';
import api from '../api/axios';

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm]         = useState({ identifiant: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  function handleChange(e) {
    setError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Basic validation
    if (!form.identifiant.trim() || !form.password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/login', form);

      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user_role', response.data.role ?? response.data.user?.role ?? '');
      localStorage.setItem('auth_user', JSON.stringify(response.data.user ?? null));

      const role = response.data.role ?? response.data.user?.role;
      navigate(role === 'technician' ? '/pannes' : '/dashboard');

    } catch (err) {
      if (err.response?.status === 401) {
        setError('Identifiant ou mot de passe incorrect.');
      } else {
        setError('Erreur de connexion. Vérifiez votre serveur Laravel.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl mb-4">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-800">RADEE-TA</h1>
          <p className="text-sm text-gray-400 mt-1">Gestion de Secteur</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">

          <h2 className="text-base font-semibold text-gray-800 mb-1">
            Connexion
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            Entrez vos identifiants pour accéder au tableau de bord.
          </p>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-600 text-xs rounded-lg px-3 py-2.5 mb-5">
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Identifiant field */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Identifiant
              </label>
              <input
                type="text"
                name="identifiant"
                value={form.identifiant}
                onChange={handleChange}
                placeholder="Votre identifiant"
                autoComplete="username"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-200 rounded-lg text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition"
                >
                  {showPass
                    ? <EyeOff size={15} />
                    : <Eye size={15} />
                  }
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium py-2.5 rounded-lg transition-colors duration-150 mt-2"
            >
              {loading ? (
                <>
                  <Loader size={15} className="animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  Se connecter
                </>
              )}
            </button>

          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 mt-6">
          RADEE-TA © {new Date().getFullYear()}
        </p>

      </div>
    </div>
  );
}
