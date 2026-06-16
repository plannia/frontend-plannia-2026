import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createTeam, signIn } from '../services/authService';

const BG = '#0F1419';
const ACCENT = '#5B8DEF';
const PURPLE = '#7C6FE8';

interface Props {
  onSuccess: () => void;
  onBack: () => void;
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

export function CreateTeamScreen({ onSuccess, onBack }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ team: '', name: '', email: '', password: '' });
  const [teamCode, setTeamCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!form.team || !form.name || !form.email || !form.password) {
      setError('Por favor completa todos los campos');
      return;
    } 
    try {
      setLoading(true);
      setError('');
      // 1. Crear el equipo
      const teamData = await createTeam(form.team, form.email, form.name, form.password);
      setTeamCode(teamData.code);

      // 2. Hacer sign-in para obtener el token
      const authData = await signIn(form.email, form.password);
      login(authData.user, authData.token);

      setShowModal(true);
  }   catch (err: any) {
      setError(err.message || 'Error al crear el equipo');
  }   finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG, backgroundImage: 'radial-gradient(ellipse at 60% 0%, rgba(91,141,239,0.06) 0%, transparent 60%)' }}>
      <div className="w-full max-w-md px-4 py-8">
        <button onClick={onBack} style={{ color: '#4B5563', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Volver al inicio
        </button>

        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <span style={{ color: 'white', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Plannia</span>
        </div>

        <div className="rounded-2xl p-8" style={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>Crea tu equipo</h2>
          <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '24px' }}>
            Configura tu espacio de trabajo. Serás registrado como <span style={{ color: ACCENT, fontWeight: '600' }}>Líder</span>.
          </p>

          <div className="space-y-4">
            <InputField label="Nombre del equipo o empresa" placeholder="Ej: Agencia Creativa XYZ" value={form.team} onChange={v => setForm(f => ({ ...f, team: v }))} />
            <InputField label="Tu nombre completo" placeholder="Ej: María González" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <InputField label="Correo electrónico" type="email" placeholder="tu@empresa.com" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
            <InputField label="Contraseña" type="password" placeholder="••••••••" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} />

            {error && (
              <p style={{ color: '#F87171', fontSize: '13px', textAlign: 'center' }}>{error}</p>
            )}

            <div style={{ paddingTop: '4px' }}>
              <button onClick={handleSubmit} disabled={loading}
                style={{
                  width: '100%', background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`,
                  color: 'white', borderRadius: '10px', padding: '12px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: '700', opacity: loading ? 0.7 : 1,
                  boxShadow: `0 4px 18px ${ACCENT}30`, transition: 'opacity 0.18s'
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {loading ? 'Creando equipo...' : 'Registrar y Crear Equipo'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm mx-4 rounded-2xl p-8 text-center" style={{ backgroundColor: '#111827', border: '1px solid rgba(91,141,239,0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `linear-gradient(135deg, ${ACCENT}20, ${PURPLE}20)`, border: `1px solid ${ACCENT}30` }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
              </svg>
            </div>
            <h3 style={{ color: 'white', fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>¡Equipo creado con éxito!</h3>
            <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '20px' }}>Comparte el código con tus miembros para que puedan unirse.</p>

            <div className="rounded-xl p-4 mb-5" style={{ background: `linear-gradient(135deg, ${ACCENT}10, ${PURPLE}10)`, border: '1px solid rgba(91,141,239,0.25)' }}>
              <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px' }}>Código de acceso</p>
              <span style={{ background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '36px', fontWeight: '900', letterSpacing: '5px' }}>{teamCode}</span>
            </div>

            <button onClick={onSuccess}
              style={{
                width: '100%', background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`,
                color: 'white', borderRadius: '10px', padding: '12px', border: 'none',
                cursor: 'pointer', fontSize: '14px', fontWeight: '700',
                boxShadow: `0 4px 16px ${ACCENT}30`
              }}
            >
              Ir al Dashboard del Líder →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}