import { useState } from 'react';
import { signUp, signIn } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { createMemberProfile } from '../services/profileService';

const BG = '#0F1419';
const ACCENT = '#5B8DEF';
const PURPLE = '#7C6FE8';

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

function InputField({ label, type = 'text', placeholder, value, onChange, accentColor }: {
  label: string; type?: string; placeholder: string; value: string; onChange: (v: string) => void; accentColor?: string;
}) {
  const [focused, setFocused] = useState(false);
  const color = accentColor ?? ACCENT;
  return (
    <div>
      <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '7px' }}>{label}</label>
      <input
        type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', backgroundColor: '#1A2235',
          border: `1px solid ${focused ? color : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '10px', padding: '11px 14px', color: 'white', outline: 'none',
          fontSize: '14px', boxSizing: 'border-box', transition: 'border-color 0.18s',
          boxShadow: focused ? `0 0 0 3px ${color}18` : 'none'
        }}
      />
    </div>
  );
}

export function JoinTeamScreen({ onSuccess, onBack }: Props) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: '', code: '' });
  const [codeFocused, setCodeFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password || !form.role || !form.code) {
      setError('Por favor completa todos los campos');
      return;
    }
    try {
      setLoading(true);
      setError('');

      // 1. Registrar al member (esto NO devuelve token, solo el usuario)
      await signUp(form.name, form.email, form.password, form.role, form.code);

      // 2. Hacer sign-in real para obtener el token y los datos completos
      const authData = await signIn(form.email, form.password);
      await login(authData.user, authData.token);

      // 3. Leer el usuario completo (con teamId) que login() ya guardó en localStorage
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

      // 4. Crear su member-profile vacío para que después pueda editar sin error
      if (savedUser?.id && savedUser?.teamId) {
        try {
          await createMemberProfile({
            userId: savedUser.id,
            teamId: savedUser.teamId,
            maxHours: 0,
            abilities: [],
            interests: [],
          });
        } catch {
          console.error('No se pudo crear el member-profile del nuevo miembro');
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error al unirse al equipo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BG, backgroundImage: 'radial-gradient(ellipse at 60% 0%, rgba(124,111,232,0.06) 0%, transparent 60%)' }}>
      <div className="w-full max-w-md px-4 py-8">
        <button onClick={onBack} style={{ color: '#4B5563', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          Volver al inicio
        </button>

        <div className="flex items-center gap-2.5 mb-7">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${PURPLE}, #A78BFA)` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <span style={{ color: 'white', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>Plannia</span>
        </div>

        <div className="rounded-2xl p-8" style={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 32px 64px rgba(0,0,0,0.4)' }}>
          <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>Únete a tu equipo</h2>
          <p style={{ color: '#4B5563', fontSize: '13px', marginBottom: '24px' }}>Ingresa tus datos y el código provisto por tu líder.</p>

          <div className="space-y-4">
            <InputField label="Nombre completo" placeholder="Ej: Carlos Rodríguez" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
            <InputField label="Correo electrónico" type="email" placeholder="tu@empresa.com" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} />
            <InputField label="Contraseña" type="password" placeholder="••••••••" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} />
            <InputField label="Posición o cargo laboral" placeholder="Ej: Desarrollador Frontend" value={form.role} onChange={v => setForm(f => ({ ...f, role: v }))} />

            <div>
              <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '7px' }}>
                Código del equipo <span style={{ color: PURPLE }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={codeFocused ? PURPLE : '#4B5563'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', transition: 'stroke 0.18s' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input type="text" placeholder="Ej: PLA640007" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  onFocus={() => setCodeFocused(true)} onBlur={() => setCodeFocused(false)}
                  style={{
                    width: '100%', backgroundColor: '#1A2235',
                    border: `1.5px solid ${codeFocused ? PURPLE : 'rgba(124,111,232,0.3)'}`,
                    borderRadius: '10px', padding: '11px 14px 11px 40px',
                    color: 'white', outline: 'none', fontSize: '14px',
                    boxSizing: 'border-box', letterSpacing: '3px', fontWeight: '700',
                    transition: 'all 0.18s',
                    boxShadow: codeFocused ? `0 0 0 3px ${PURPLE}15` : 'none'
                  }}
                />
              </div>
              <p style={{ color: '#374151', fontSize: '11px', marginTop: '5px' }}>Este código es proporcionado por el líder del equipo.</p>
            </div>

            {error && (
              <p style={{ color: '#F87171', fontSize: '13px', textAlign: 'center' }}>{error}</p>
            )}

            <div style={{ paddingTop: '4px' }}>
              <button onClick={handleSubmit} disabled={loading}
                style={{
                  width: '100%', background: `linear-gradient(135deg, ${PURPLE}, #A78BFA)`,
                  color: 'white', borderRadius: '10px', padding: '12px', border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px', fontWeight: '700', opacity: loading ? 0.7 : 1,
                  boxShadow: `0 4px 18px ${PURPLE}30`, transition: 'opacity 0.18s'
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {loading ? 'Uniéndose al equipo...' : 'Unirse al equipo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}