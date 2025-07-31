import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

function AuthPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegister ? 'register' : 'login';

    try {
      const res = await fetch(`http://localhost:3001/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const contentType = res.headers.get('Content-Type') || '';
      const isJson = contentType.includes('application/json');

      const rawText = await res.text();
      const data = isJson ? JSON.parse(rawText) : null;

      if (!res.ok) {
        const message = (data && (data.error || data.message)) || 'Unknown server error';
        throw new Error(message);
      }

      if (!data || !data.token) {
        throw new Error('Invalid response from server');
      }

      login(data.token, data.username || form.username);
      navigate('/my-team');
    } catch (err) {
      console.error('❌ Auth error:', err.message);
      setError(err.message);
    }
  };

  const handleGuestLogin = () => {
    login('guest-token', 'Guest');
    navigate('/my-team');
  };

  return (
    <div className="auth-form">
      <h2>{isRegister ? 'Register' : 'Sign In'}</h2>
      {error && <p className="error-msg">❌ {error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
      </form>

      <p style={{ marginTop: '10px' }}>
        {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          className="link-btn"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? 'Sign In' : 'Register'}
        </button>
      </p>

      <p style={{ marginTop: '15px' }}>
        <button
          type="button"
          className="link-btn"
          onClick={handleGuestLogin}
        >
          🚀 Continue as Guest
        </button>
      </p>
    </div>
  );
}

export default AuthPage;
