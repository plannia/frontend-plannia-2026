import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserDetail, updateMemberProfile } from '../services/profileService';

const CARD_BG = '#141C2B';
const ACCENT = '#5B8DEF';
const PURPLE = '#7C6FE8';

interface Profile {
  id: number;
  role: string;
  name: string;
  email: string;
  position: string;
  initials: string;
  maxHours: number;
  activeHours: number;
  abilities: string[];
  interests: string[];
  taskStatusCounts: { toDoCount: number; inProgressCount: number; doneCount: number };
}

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

function Pill({ text, color, onRemove }: { text: string; color: string; onRemove?: () => void }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      backgroundColor: `${color}15`, color, border: `1px solid ${color}25`,
      fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '999px',
    }}>
      {text}
      {onRemove && (
        <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color, padding: 0, lineHeight: 1, opacity: 0.6, fontSize: '13px' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
        >×</button>
      )}
    </span>
  );
}

function ChipInput({ value, onChange, color, placeholder }: { value: string[]; onChange: (v: string[]) => void; color: string; placeholder: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const t = input.trim();
    if (t && !value.includes(t)) { onChange([...value, t]); setInput(''); }
  };
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
        {value.map(v => <Pill key={v} text={v} color={color} onRemove={() => onChange(value.filter(x => x !== v))} />)}
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => e.key === 'Enter' && add()}
          style={{
            flex: 1, backgroundColor: '#1A2235', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px', padding: '8px 11px', color: 'white', outline: 'none',
            fontSize: '12px', boxSizing: 'border-box',
          }}
        />
        <button onClick={add} style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30`, borderRadius: '8px', padding: '8px 12px', color, fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
          + Añadir
        </button>
      </div>
    </div>
  );
}

function EditModal({ profile, onClose, onSave }: {
  profile: Profile;
  onClose: () => void;
  onSave: (data: { maxHours: number; abilities: string[]; interests: string[] }) => void;
}) {
  const [maxHours, setMaxHours] = useState(profile.maxHours);
  const [abilities, setAbilities] = useState<string[]>([...profile.abilities]);
  const [interests, setInterests] = useState<string[]>([...profile.interests]);

  return (
    <>
      <style>{`@keyframes fadeSlideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#0D1520', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'fadeSlideDown 0.18s ease' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'white', fontSize: '15px', fontWeight: '700' }}>Editar perfil</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ backgroundColor: '#111827', borderRadius: '10px', padding: '14px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontSize: '13px', fontWeight: '800' }}>{profile.initials}</span>
              </div>
              <div>
                <p style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{profile.name}</p>
                <p style={{ color: '#4B5563', fontSize: '11px' }}>{profile.position} · {profile.email}</p>
              </div>
            </div>
            <p style={{ color: '#374151', fontSize: '11px', textAlign: 'center', marginTop: '-10px' }}>Nombre, cargo y email solo pueden ser modificados por el líder del equipo.</p>

            <div>
              <label style={{ color: '#6B7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '7px' }}>Horas máximas semanales</label>
              <input
                type="number" min="1" max="80" value={maxHours} onChange={e => setMaxHours(Number(e.target.value))}
                style={{ width: '100%', backgroundColor: '#1A2235', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', padding: '10px 13px', color: 'white', outline: 'none', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ color: '#6B7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '7px' }}>Habilidades</label>
              <ChipInput value={abilities} onChange={setAbilities} color={ACCENT} placeholder="Ej: React, TypeScript..." />
            </div>

            <div>
              <label style={{ color: '#6B7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '7px' }}>Intereses</label>
              <ChipInput value={interests} onChange={setInterests} color={PURPLE} placeholder="Ej: UX Research, IA..." />
            </div>
          </div>

          <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'transparent', color: '#6B7280', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button
              onClick={() => { onSave({ maxHours, abilities, interests }); onClose(); }}
              style={{ padding: '9px 18px', borderRadius: '9px', border: 'none', background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: `0 4px 14px ${ACCENT}30` }}
            >
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function MemberProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getUserDetail(user.id)
      .then(data => {
        setProfile({
          id: data.id,
          role: data.role,
          name: data.name,
          email: data.email,
          position: data.position,
          initials: getInitials(data.name),
          maxHours: data.profile.maxHours,
          activeHours: data.profile.activeHours,
          abilities: data.profile.abilities,
          interests: data.profile.interests,
          taskStatusCounts: data.taskStatusCounts,
        });
        setError(null);
      })
      .catch(() => setError('No se pudo cargar el perfil.'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async ({ maxHours, abilities, interests }: { maxHours: number; abilities: string[]; interests: string[] }) => {
    if (!profile) return;
    try {
      await updateMemberProfile(profile.id, { maxHours, abilities, interests });
      setProfile(p => p ? { ...p, maxHours, abilities, interests } : p);
    } catch {
      setError('No se pudo guardar el perfil.');
    }
  };

  if (loading) {
    return <div className="p-6" style={{ color: '#6B7280', fontSize: '13px' }}>Cargando perfil...</div>;
  }

  if (error) {
    return <div className="p-6" style={{ color: '#F59E0B', fontSize: '13px' }}>{error}</div>;
  }

  if (!profile) return null;

  const hoursPercent = Math.min(100, Math.round((profile.activeHours / profile.maxHours) * 100));
  const hoursColor = hoursPercent > 80 ? '#F59E0B' : ACCENT;
  const { toDoCount, inProgressCount, doneCount } = profile.taskStatusCounts;

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', marginBottom: '3px' }}>Mi Perfil</h1>
          <p style={{ color: '#4B5563', fontSize: '13px' }}>Gestiona tus habilidades e intereses.</p>
        </div>
        <button
          onClick={() => setEditOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '9px', border: `1px solid rgba(91,141,239,0.3)`,
            backgroundColor: `${ACCENT}10`, color: ACCENT, fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${ACCENT}18`; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${ACCENT}10`; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          Editar perfil
        </button>
      </div>

      <div style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '24px', marginBottom: '16px' }}>
        <div className="flex items-center gap-4 mb-5">
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontSize: '18px', fontWeight: '800' }}>{profile.initials}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '700' }}>{profile.name}</h2>
              <span style={{ backgroundColor: `${PURPLE}20`, color: PURPLE, fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', border: `1px solid ${PURPLE}30` }}>
  {profile.role === 'LEADER' ? 'Líder' : 'Miembro'} · {profile.position}
</span>
            </div>
            <p style={{ color: '#374151', fontSize: '12px', marginTop: '2px' }}>{profile.email}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: '#4B5563', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Disponibilidad semanal</span>
              <span style={{ color: hoursColor, fontSize: '12px', fontWeight: '700' }}>{profile.activeHours}h / {profile.maxHours}h</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${hoursPercent}%`, backgroundColor: hoursColor, borderRadius: '999px', transition: 'width 0.4s ease' }} />
            </div>
            <p style={{ color: '#374151', fontSize: '11px', marginTop: '5px' }}>{profile.maxHours - profile.activeHours}h disponibles esta semana</p>
          </div>

          <div>
            <span style={{ color: '#4B5563', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '8px' }}>Resumen de tareas</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { label: 'Pendiente', count: toDoCount, color: '#F59E0B' },
                { label: 'En progreso', count: inProgressCount, color: ACCENT },
                { label: 'Completada', count: doneCount, color: '#10B981' },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ flex: 1, backgroundColor: `${color}10`, border: `1px solid ${color}20`, borderRadius: '9px', padding: '8px 10px', textAlign: 'center' }}>
                  <p style={{ color, fontSize: '18px', fontWeight: '800', lineHeight: 1 }}>{count}</p>
                  <p style={{ color: '#6B7280', fontSize: '10px', marginTop: '3px', lineHeight: 1.2 }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>
          <p style={{ color: '#4B5563', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '12px' }}>Habilidades</p>
          {profile.abilities.length === 0 ? (
            <p style={{ color: '#374151', fontSize: '12px', fontStyle: 'italic' }}>Sin habilidades registradas.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {profile.abilities.map(a => <Pill key={a} text={a} color={ACCENT} />)}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>
          <p style={{ color: '#4B5563', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '12px' }}>Intereses</p>
          {profile.interests.length === 0 ? (
            <p style={{ color: '#374151', fontSize: '12px', fontStyle: 'italic' }}>Sin intereses registrados.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {profile.interests.map(i => <Pill key={i} text={i} color={PURPLE} />)}
            </div>
          )}
        </div>
      </div>

      {editOpen && (
        <EditModal
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}