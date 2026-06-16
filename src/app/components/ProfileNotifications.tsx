import { useState } from 'react';
import { notifications, userProfile as initialProfile } from './mockData';

const ACCENT = '#5B8DEF';
const PURPLE = '#7C6FE8';
const CARD_BG = '#141C2B';
const INPUT_BG = '#1A2235';

interface Props {
  initialTab?: 'profile' | 'notifications';
}

// ─── Pill component ───────────────────────────────────────────────────────────

function Pill({ label, color, onRemove }: { label: string; color: string; onRemove?: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        backgroundColor: hovered ? `${color}18` : `${color}10`,
        border: `1px solid ${hovered ? `${color}50` : `${color}28`}`,
        color, fontSize: '12px', fontWeight: '500',
        padding: onRemove ? '4px 8px 4px 11px' : '4px 11px',
        borderRadius: '999px', transition: 'all 0.15s', cursor: onRemove ? 'default' : 'default'
      }}
    >
      {label}
      {onRemove && (
        <button onClick={onRemove}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color, lineHeight: 1, fontSize: '14px', padding: 0, display: 'flex', alignItems: 'center', opacity: hovered ? 1 : 0.6, transition: 'opacity 0.15s' }}>
          ×
        </button>
      )}
    </div>
  );
}

// ─── Chip input ───────────────────────────────────────────────────────────────

function ChipInput({ chips, onChange, placeholder, color }: { chips: string[]; onChange: (v: string[]) => void; placeholder: string; color: string }) {
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const add = () => { const v = input.trim(); if (v && !chips.includes(v)) onChange([...chips, v]); setInput(''); };
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[28px]">
        {chips.map(chip => <Pill key={chip} label={chip} color={color} onRemove={() => onChange(chips.filter(c => c !== chip))} />)}
        {chips.length === 0 && <span style={{ color: '#374151', fontSize: '12px', fontStyle: 'italic', lineHeight: '28px' }}>Sin registrar</span>}
      </div>
      <div className="flex gap-2">
        <input type="text" placeholder={placeholder} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex: 1, backgroundColor: INPUT_BG,
            border: `1px solid ${focused ? color : 'rgba(255,255,255,0.07)'}`,
            borderRadius: '8px', padding: '7px 11px', color: 'white', fontSize: '12px', outline: 'none',
            boxSizing: 'border-box' as const, transition: 'border-color 0.18s',
            boxShadow: focused ? `0 0 0 3px ${color}15` : 'none'
          }}
        />
        <button onClick={add}
          style={{ padding: '7px 14px', backgroundColor: color, border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'opacity 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >+</button>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '9px', border: '1px dashed rgba(255,255,255,0.07)', textAlign: 'center' }}>
      <p style={{ color: '#374151', fontSize: '12px', fontStyle: 'italic' }}>{message}</p>
    </div>
  );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

function EditProfileModal({ profile, onClose, onSave }: {
  profile: typeof initialProfile;
  onClose: () => void;
  onSave: (p: { abilities: string[]; interests: string[]; maxHours: number }) => void;
}) {
  const [abilities, setAbilities] = useState<string[]>([...profile.abilities]);
  const [interests, setInterests] = useState<string[]>([...profile.interests]);
  const [maxHours, setMaxHours] = useState(profile.maxHours);
  const [loading, setLoading] = useState(false);
  const [hoursFocused, setHoursFocused] = useState(false);

  const hasChanges = JSON.stringify(abilities) !== JSON.stringify(profile.abilities)
    || JSON.stringify(interests) !== JSON.stringify(profile.interests)
    || maxHours !== profile.maxHours;

  const handleClose = () => {
    if (hasChanges && !confirm('¿Descartar los cambios sin guardar?')) return;
    onClose();
  };

  const handleSave = () => {
    if (!hasChanges) return;
    setLoading(true);
    setTimeout(() => { onSave({ abilities, interests, maxHours }); setLoading(false); onClose(); }, 900);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div style={{ backgroundColor: '#0D1520', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.07)', width: '100%', maxWidth: '460px', margin: '16px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>Editar Perfil</h3>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ padding: '20px 22px' }} className="space-y-5">
          {/* Non-editable info */}
          <div className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ color: '#374151', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>Información no editable</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Nombre', value: profile.name },
                { label: 'Email', value: profile.email },
                { label: 'Posición', value: profile.position },
                { label: 'Rol', value: profile.role },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ color: '#374151', fontSize: '10px', marginBottom: '2px', fontWeight: '500' }}>{label}</p>
                  <p style={{ color: '#4B5563', fontSize: '13px' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />

          {/* Max hours */}
          <div>
            <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '7px' }}>Horas máximas disponibles</label>
            <div className="flex items-center gap-3">
              <input type="number" min={1} max={60} value={maxHours}
                onChange={e => setMaxHours(Math.max(1, Math.min(60, Number(e.target.value))))}
                onFocus={() => setHoursFocused(true)} onBlur={() => setHoursFocused(false)}
                style={{
                  width: '90px', backgroundColor: INPUT_BG,
                  border: `1px solid ${hoursFocused ? ACCENT : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '14px',
                  fontWeight: '700', outline: 'none', boxSizing: 'border-box' as const,
                  transition: 'border-color 0.18s'
                }}
              />
              <span style={{ color: '#4B5563', fontSize: '12px' }}>horas · rango sugerido: 1 – 60</span>
            </div>
          </div>

          {/* Abilities */}
          <div>
            <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Habilidades</label>
            <ChipInput chips={abilities} onChange={setAbilities} placeholder="Agregar habilidad..." color={ACCENT} />
          </div>

          {/* Interests */}
          <div>
            <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Intereses</label>
            <ChipInput chips={interests} onChange={setInterests} placeholder="Agregar interés..." color={PURPLE} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={handleClose}
              style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#9CA3AF'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#6B7280'; }}
            >
              Cancelar
            </button>
            <button onClick={handleSave} disabled={!hasChanges || loading}
              style={{
                flex: 2, padding: '10px',
                background: hasChanges && !loading ? `linear-gradient(135deg, ${ACCENT}, ${PURPLE})` : undefined,
                backgroundColor: hasChanges && !loading ? undefined : '#1A2235',
                color: hasChanges && !loading ? 'white' : '#4B5563',
                border: 'none', borderRadius: '9px',
                cursor: hasChanges && !loading ? 'pointer' : 'not-allowed',
                fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                boxShadow: hasChanges && !loading ? `0 4px 14px ${ACCENT}25` : 'none',
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                  <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                  Guardando...</>
              ) : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generic notification icon
function NotifIcon({ read }: { read: boolean }) {
  return (
    <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: read ? 'rgba(75,85,104,0.15)' : 'rgba(91,141,239,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={read ? '#4B5563' : ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ProfileNotifications({ initialTab = 'profile' }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [showEdit, setShowEdit] = useState(false);
  const [notifList, setNotifList] = useState(notifications);
  const [notifSearch, setNotifSearch] = useState('');

  const unread = notifList.filter(n => !n.read).length;
  const markAllRead = () => setNotifList(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifList(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const handleSave = (data: { abilities: string[]; interests: string[]; maxHours: number }) => setProfile(p => ({ ...p, ...data }));

  const saturation = profile.activeHours / profile.maxHours;
  const isOverload = saturation > 0.8;
  const { toDoCount, inProgressCount, doneCount } = profile.taskStatusCounts;

  const filteredNotifs = notifList.filter(n =>
    !notifSearch || n.title.toLowerCase().includes(notifSearch.toLowerCase()) || n.message.toLowerCase().includes(notifSearch.toLowerCase())
  );

  if (initialTab === 'notifications') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700' }}>Notificaciones</h1>
            {unread > 0 && <span style={{ backgroundColor: '#EF4444', color: 'white', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px' }}>{unread} nuevas</span>}
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ color: ACCENT, fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
              Marcar todas como leídas
            </button>
          )}
        </div>

        {/* Search bar */}
        <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '380px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Buscar notificaciones..." value={notifSearch} onChange={e => setNotifSearch(e.target.value)}
            style={{ width: '100%', backgroundColor: INPUT_BG, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', padding: '7px 12px 7px 32px', color: 'white', outline: 'none', fontSize: '12px', boxSizing: 'border-box' as const }}
            onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
          />
        </div>

        <div className="space-y-2">
          {filteredNotifs.map(notif => (
            <div key={notif.id} onClick={() => markRead(notif.id)}
              style={{
                backgroundColor: notif.read ? CARD_BG : 'rgba(91,141,239,0.05)',
                border: `1px solid ${notif.read ? 'rgba(255,255,255,0.05)' : 'rgba(91,141,239,0.15)'}`,
                borderRadius: '12px', padding: '13px 16px',
                cursor: notif.read ? 'default' : 'pointer', transition: 'all 0.18s',
                display: 'flex', alignItems: 'flex-start', gap: '12px',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(91,141,239,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = notif.read ? CARD_BG : 'rgba(91,141,239,0.05)'; }}
            >
              <NotifIcon read={notif.read} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 mb-1">
                  <p style={{ color: notif.read ? '#9CA3AF' : 'white', fontSize: '13px', fontWeight: notif.read ? '400' : '600' }}>{notif.title}</p>
                  {!notif.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: ACCENT, flexShrink: 0 }} />}
                </div>
                <p style={{ color: '#4B5563', fontSize: '12px', lineHeight: '1.5' }}>{notif.message}</p>
              </div>
              <span style={{ color: '#374151', fontSize: '11px', flexShrink: 0, marginTop: '1px' }}>{notif.time}</span>
            </div>
          ))}
          {filteredNotifs.length === 0 && (
            <p style={{ color: '#374151', fontSize: '13px', fontStyle: 'italic', textAlign: 'center', padding: '32px 0' }}>No se encontraron notificaciones.</p>
          )}
        </div>
      </div>
    );
  }

  // Profile view (no tabs)
  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-5">
        <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700' }}>Mi Perfil</h1>
      </div>

      <div className="space-y-5">
        {/* Profile info card */}
        <div className="rounded-xl p-5" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: `linear-gradient(135deg, ${ACCENT}30, ${PURPLE}20)`, border: `2px solid ${ACCENT}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: ACCENT, fontSize: '20px', fontWeight: '900' }}>{profile.initials}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 style={{ color: 'white', fontSize: '18px', fontWeight: '800' }}>{profile.name}</h2>
                  <span style={{ backgroundColor: 'rgba(91,141,239,0.1)', color: ACCENT, fontSize: '11px', fontWeight: '700', padding: '2px 9px', borderRadius: '999px', border: '1px solid rgba(91,141,239,0.2)' }}>{profile.role}</span>
                </div>
                <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '2px' }}>{profile.email}</p>
                <p style={{ color: '#4B5563', fontSize: '12px' }}>{profile.position}</p>
              </div>
            </div>
            <button onClick={() => setShowEdit(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#6B7280', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#9CA3AF'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#6B7280'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Editar perfil
            </button>
          </div>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {/* Availability */}
          <div className="rounded-xl p-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${isOverload ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.06)'}` }}>
            <div className="flex items-center justify-between mb-2">
              <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>Disponibilidad</h3>
              {isOverload && <span style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '5px', border: '1px solid rgba(245,158,11,0.2)' }}>Alta carga</span>}
            </div>
            <p style={{ color: '#4B5563', fontSize: '12px', marginBottom: '10px' }}>{profile.maxHours}h máximo · {profile.activeHours}h ocupadas</p>
            <div style={{ height: '7px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
              <div style={{ height: '100%', width: `${saturation * 100}%`, backgroundColor: isOverload ? '#F59E0B' : ACCENT, borderRadius: '999px', transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ color: isOverload ? '#F59E0B' : ACCENT, fontSize: '16px', fontWeight: '800' }}>{profile.activeHours} / {profile.maxHours}h</p>
          </div>

          {/* Task summary */}
          <div className="rounded-xl p-5" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>Resumen de tareas</h3>
            <div className="space-y-3">
              {[
                { label: 'Pendientes', count: toDoCount, color: ACCENT },
                { label: 'En progreso', count: inProgressCount, color: PURPLE },
                { label: 'Completadas', count: doneCount, color: '#10B981' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: color }} />
                    <span style={{ color: '#6B7280', fontSize: '13px' }}>{label}</span>
                  </div>
                  <span style={{ color, fontSize: '18px', fontWeight: '800' }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Abilities */}
        <div className="rounded-xl p-5" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Habilidades</h3>
          {profile.abilities.length === 0 ? (
            <EmptyState message="No hay habilidades registradas. Edita tu perfil para agregar." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.abilities.map(a => <Pill key={a} label={a} color={ACCENT} />)}
            </div>
          )}
        </div>

        {/* Interests */}
        <div className="rounded-xl p-5" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Intereses</h3>
          {profile.interests.length === 0 ? (
            <EmptyState message="No hay intereses registrados. Edita tu perfil para agregar." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {profile.interests.map(i => <Pill key={i} label={i} color={PURPLE} />)}
            </div>
          )}
        </div>
      </div>

      {showEdit && <EditProfileModal profile={profile} onClose={() => setShowEdit(false)} onSave={handleSave} />}
    </div>
  );
}
