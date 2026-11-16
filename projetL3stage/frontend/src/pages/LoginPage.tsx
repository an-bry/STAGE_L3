import { type FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { login, getProfil } from '../api/authService';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login({ username, password });
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      const profil = await getProfil();
      setUser(profil);

      navigate('/dashboard');
    } catch (err) {
      setError('Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 relative overflow-hidden">
      
      {/* Effets de fond décoratifs (optionnels mais jolis) */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary-soft rounded-full blur-3xl opacity-50 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-info-soft rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      {/* Carte principale */}
      <div className="w-full max-w-md bg-card border border-line rounded-2xl shadow-xl p-8 relative z-10">
        
        {/* Logo et Titre */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src="/logo-njcam.png" 
              alt="NjCam Logo" 
              className="h-28 w-auto object-contain drop-shadow-sm" 
            />
          </div>
          <h2 className="text-xl font-bold text-ink">
            Connexion
          </h2>
          <p className="text-sm text-ink-soft mt-1">
            Accédez à votre espace NjCam System Security
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Message d'erreur */}
          {error && (
            <div className="bg-danger-soft border border-danger/30 text-danger text-sm p-3 rounded-md flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Champ Nom d'utilisateur */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Nom d'utilisateur
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-ink-faint" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-line rounded-md text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="Entrez votre nom d'utilisateur"
              />
            </div>
          </div>

          {/* Champ Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-ink-faint" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2.5 bg-surface border border-line rounded-md text-sm text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-faint hover:text-ink transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <Link 
                to="/forgot-password" 
                className="text-xs text-primary hover:underline font-medium"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          {/* Bouton Se connecter */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Connexion en cours…
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Lien d'inscription */}
        <p className="text-center text-sm text-ink-soft mt-6">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary hover:underline font-medium">
            S'inscrire
          </Link>
        </p>

        {/* Footer */}
        <p className="text-center text-[11px] text-ink-faint mt-8 pt-4 border-t border-line">
          © {new Date().getFullYear()} NjCam System Security. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}