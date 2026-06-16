import { useState } from 'react';
import { signIn } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const BG = '#0F1419';
const ACCENT = '#5B8DEF';
const PURPLE = '#7C6FE8';

interface Props {
  onLogin: (role: 'leader' | 'member') => void;
  onCreateTeam: () => void;
  onJoinTeam: () => void;
}

function InputField({ label, type = 'text', placeholder, value, onChange }: {
  label: string; type?: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '7px' }}>{label}</label>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', backgroundColor: '#1A2235',
          border: `1px solid ${focused ? ACCENT : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '10px', padding: '11px 14px', color: 'white', outline: 'none',
          fontSize: '14px', boxSizing: 'border-box', transition: 'border-color 0.18s',
          boxShadow: focused ? `0 0 0 3px ${ACCENT}18` : 'none'
        }}
      />
    </div>
  );
}

export function LoginScreen({ onLogin, onCreateTeam, onJoinTeam }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'leader' | 'member'>('leader');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor completa todos los campos');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const data = await signIn(email, password);
      await login(data.user, data.token);
      const userRole = data.user.role === 'LEADER' ? 'leader' : 'member';
      onLogin(userRole);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG, backgroundImage: 'radial-gradient(ellipse at 60% 0%, rgba(91,141,239,0.07) 0%, transparent 60%)' }}>
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <span style={{ color: 'white', fontSize: '36px', fontWeight: '800', letterSpacing: '-1px' }}>Plannia</span>
          </div>
          <p style={{ color: '#4B5563', fontSize: '13px' }}>Gestión inteligente de equipos con IA</p>
        </div>

        <div className="rounded-2xl p-8" style={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>

          <div style={{ display: 'flex', backgroundColor: '#0F1419', borderRadius: '10px', padding: '3px', marginBottom: '22px', gap: '3px' }}>
            {(['leader', 'member'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  flex: 1, padding: '9px 8px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: '700', transition: 'all 0.18s',
                  backgroundColor: role === r ? (r === 'leader' ? ACCENT : PURPLE) : 'transparent',
                  color: role === r ? 'white' : '#4B5563',
                  boxShadow: role === r ? `0 2px 10px ${r === 'leader' ? ACCENT : PURPLE}35` : 'none',
                }}
              >
                {r === 'leader' ? 'Iniciar como Líder' : 'Iniciar como Miembro'}
              </button>
            ))}
          </div>

          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>Accede a tu cuenta</h2>
          <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '24px' }}>
            {role === 'leader' ? 'Bienvenido de vuelta, líder del equipo' : 'Bienvenido de vuelta al equipo'}
          </p>

          <div className="space-y-4">
            <InputField label="Correo electrónico" type="email" placeholder="tu@empresa.com" value={email} onChange={setEmail} />
            <InputField label="Contraseña" type="password" placeholder="••••••••" value={password} onChange={setPassword} />

            {/* Mensaje de error */}
            {error && (
              <p style={{ color: '#F87171', fontSize: '13px', textAlign: 'center' }}>{error}</p>
            )}

            <div style={{ paddingTop: '4px' }}>
              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  width: '100%',
                  background: role === 'leader'
                    ? `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`
                    : `linear-gradient(135deg, ${PURPLE}, #A78BFA)`,
                  color: 'white', borderRadius: '10px', padding: '12px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: '700',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: `0 4px 18px ${role === 'leader' ? ACCENT : PURPLE}35`,
                  transition: 'opacity 0.18s'
                }}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 my-6">
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
            <span style={{ color: '#374151', fontSize: '11px' }}>o continúa con</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
          </div>

          <div className="flex flex-col gap-2.5">
            <button
              onClick={onCreateTeam}
              style={{
                width: '100%', backgroundColor: 'transparent',
                border: '1px solid rgba(91,141,239,0.25)',
                borderRadius: '10px', padding: '11px', color: ACCENT, cursor: 'pointer',
                fontSize: '13px', fontWeight: '600', transition: 'all 0.18s'
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(91,141,239,0.07)'; e.currentTarget.style.borderColor = 'rgba(91,141,239,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(91,141,239,0.25)'; }}
            >
              🚀 ¿Nuevo líder? Crea tu equipo aquí
            </button>
            <button
              onClick={onJoinTeam}
              style={{
                width: '100%', backgroundColor: 'transparent',
                border: '1px solid rgba(124,111,232,0.25)',
                borderRadius: '10px', padding: '11px', color: PURPLE, cursor: 'pointer',
                fontSize: '13px', fontWeight: '600', transition: 'all 0.18s'
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(124,111,232,0.07)'; e.currentTarget.style.borderColor = 'rgba(124,111,232,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(124,111,232,0.25)'; }}
            >
              🤝 ¿Tienes un código? Únete a un equipo
            </button>
          </div>
        </div>

        <p style={{ color: '#1F2937', fontSize: '12px', textAlign: 'center', marginTop: '28px' }}>
          © 2026 Plannia. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}

