import { type FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/authService';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'CLIENT' as 'CLIENT' | 'ADMIN' | 'TECHNICIEN',
    telephone: '',
    raison_sociale: '',
    specialite: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'role') {
      setForm({
        ...form,
        role: value as 'CLIENT' | 'ADMIN' | 'TECHNICIEN',
        raison_sociale: '',
        specialite: '',
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      username: form.username,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      password: form.password,
      role: form.role,
      telephone: form.telephone,
      ...(form.role === 'CLIENT' && { raison_sociale: form.raison_sociale }),
      ...(form.role === 'TECHNICIEN' && { specialite: form.specialite }),
    };

    try {
      await register(payload);
      navigate('/login');
    } catch (err: any) {
      const data = err?.response?.data;
      if (data) {
        const firstError = Object.values(data)[0];
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        setError("Erreur lors de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">Créer un compte</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input
              name="first_name"
              placeholder="Prénom"
              value={form.first_name}
              onChange={handleChange}
              required
              pattern="[A-Za-zÀ-ÿ\s\-]+"
              title="Lettres uniquement"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              name="last_name"
              placeholder="Nom"
              value={form.last_name}
              onChange={handleChange}
              required
              pattern="[A-Za-zÀ-ÿ\s\-]+"
              title="Lettres uniquement"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <input
            name="username"
            placeholder="Nom d'utilisateur (pour se connecter)"
            value={form.username}
            onChange={handleChange}
            required
            pattern="[a-zA-Z0-9_]+"
            title="Lettres, chiffres et underscores uniquement"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />

          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />

          <input
            name="password"
            type="password"
            placeholder="Mot de passe (6 caractères minimum)"
            value={form.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Je suis :
            </label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="CLIENT">Client</option>
              <option value="TECHNICIEN">Technicien</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <input
            name="telephone"
            placeholder="Téléphone (ex: 0341234567)"
            value={form.telephone}
            onChange={handleChange}
            pattern="[0-9+\s]+"
            title="Chiffres uniquement"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />

          {form.role === 'CLIENT' && (
            <input
              name="raison_sociale"
              placeholder="Raison sociale"
              value={form.raison_sociale}
              onChange={handleChange}
              pattern="[A-Za-zÀ-ÿ\s]+"
              title="Lettres uniquement"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          )}

          {form.role === 'TECHNICIEN' && (
            <input
              name="specialite"
              placeholder="Spécialité (ex: Réseaux et vidéosurveillance)"
              value={form.specialite}
              onChange={handleChange}
              pattern="[A-Za-zÀ-ÿ\s]+"
              title="Lettres uniquement"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer le compte'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}