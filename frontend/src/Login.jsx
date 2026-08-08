import { useState } from 'react';
import axios from 'axios';

const API_URL = 'https://projectgampangtoko-production-4798.up.railway.app/api';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/login`, { username, password });
      if (res.data.success) {
        localStorage.setItem('adminToken', res.data.token);
        onLoginSuccess();
      }
    } catch (err) {
      setError('Username atau password salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <form onSubmit={handleLogin} style={{
        background: 'white', padding: '40px', borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)', width: '350px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>
          🔐 Login Admin
        </h2>
        
        {error && (
          <div style={{
            background: '#fee', color: '#c33', padding: '10px',
            borderRadius: '6px', marginBottom: '15px', textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{
            width: '100%', padding: '12px', marginBottom: '15px',
            border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box'
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%', padding: '12px', marginBottom: '20px',
            border: '1px solid #ddd', borderRadius: '6px', boxSizing: 'border-box'
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '12px', background: '#667eea',
            color: 'white', border: 'none', borderRadius: '6px',
            fontSize: '16px', cursor: 'pointer'
          }}
        >
          {loading ? 'Memproses...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default Login;