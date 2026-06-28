import React, { useState, useRef, useEffect } from 'react';
import { MemberDashboard } from './MemberDashboard';
import { MisTareas } from './MisTareas';
import { TeamPlanner } from './TeamPlanner';
import { MemberProfilePage } from './MemberProfilePage';
import { useAuth } from '../context/AuthContext';
import { notifications as initialNotifs, categories } from './mockData';

const BG = '#0F1419';
const SIDEBAR_BG = '#1A2235';
const ACCENT = '#5B8DEF';
const PURPLE = '#7C6FE8';
const NAVBAR_BG = '#111827';

type MemberPage = 'dashboard' | 'mis-tareas' | 'planner' | 'notifications' | 'profile';

interface Props {
  onLogout: () => void;
}

const navItems: { page: MemberPage; label: string; icon: React.ReactNode }[] = [
  {
    page: 'dashboard', label: 'Dashboard',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
  },
  {
    page: 'mis-tareas', label: 'Mis Tareas',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
  },
  {
    page: 'planner', label: 'Planificador de Equipo',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  },
  {
    page: 'notifications', label: 'Notificaciones',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
  },
  {
    page: 'profile', label: 'Mi Perfil',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
  },
];

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

function NotifIcon({ read }: { read: boolean }) {
  return (
    <div style={{
      width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
      backgroundColor: read ? 'rgba(75,85,104,0.12)' : `${ACCENT}15`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={read ? '#4B5563' : ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    </div>
  );
}

function NotificationsPage({ notifs, onMarkRead }: { notifs: typeof initialNotifs; onMarkRead: (id: number) => void }) {
  const [search, setSearch] = useState('');
  const q = search.toLowerCase();
  const filtered = notifs.filter(n => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));

  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', marginBottom: '3px' }}>Notificaciones</h1>
          <p style={{ color: '#4B5563', fontSize: '13px' }}>Actualizaciones del equipo y actividad reciente.</p>
        </div>
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar notificaciones..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              paddingLeft: '32px', paddingRight: '12px', paddingTop: '7px', paddingBottom: '7px',
              backgroundColor: '#141C2B', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '9px', color: 'white', outline: 'none', fontSize: '12px',
              width: '220px', transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = `${ACCENT}50`)}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          />
        </div>
      </div>
      <div style={{ backgroundColor: '#141C2B', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#374151', fontSize: '14px', fontStyle: 'italic' }}>No se encontraron notificaciones.</p>
          </div>
        ) : filtered.map((n, i) => (
          <div
            key={n.id}
            onClick={() => onMarkRead(n.id)}
            style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start',
              padding: '14px 18px',
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              backgroundColor: n.read ? 'transparent' : 'rgba(91,141,239,0.04)',
              cursor: 'pointer', transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = n.read ? 'transparent' : 'rgba(91,141,239,0.04)')}
          >
            <NotifIcon read={n.read} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: n.read ? '#9CA3AF' : 'white', fontSize: '13px', fontWeight: n.read ? '400' : '600', marginBottom: '2px' }}>{n.title}</p>
              <p style={{ color: '#4B5563', fontSize: '12px', lineHeight: '1.5' }}>{n.message}</p>
              <p style={{ color: '#374151', fontSize: '11px', marginTop: '4px' }}>{n.time}</p>
            </div>
            {!n.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: ACCENT, flexShrink: 0, marginTop: '5px' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MemberAppLayout({ onLogout }: Props) {
  const { user } = useAuth();
  const memberName = user?.name ?? '';
  const memberInitials = memberName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
  const memberCategoryNames = categories
    .filter(c => user && c.memberIds.includes(user.id))
    .map(c => c.name);

  const [page, setPage] = useState<MemberPage>('dashboard');
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState(initialNotifs);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  const unreadCount = notifs.filter(n => !n.read).length;
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  const markOneRead = (id: number) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <MemberDashboard />;
      case 'mis-tareas': return <MisTareas />;
      case 'planner': return <TeamPlanner isReadOnly memberCategoryNames={memberCategoryNames} />;
      case 'notifications': return <NotificationsPage notifs={notifs} onMarkRead={markOneRead} />;
      case 'profile': return <MemberProfilePage />;
      default: return <MemberDashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: BG }}>
      {/* Sidebar */}
      <aside className="flex flex-col" style={{ width: '240px', minWidth: '240px', backgroundColor: SIDEBAR_BG, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ color: 'white', fontSize: '19px', fontWeight: '800', letterSpacing: '-0.5px' }}>Plannia</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ page: p, label, icon }) => {
            const active = page === p;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
                  padding: '8px 11px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  backgroundColor: active ? `${PURPLE}18` : 'transparent',
                  color: active ? PURPLE : '#6B7280',
                  fontSize: '13px', fontWeight: active ? '600' : '400',
                  transition: 'all 0.13s', textAlign: 'left', position: 'relative',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#D1D5DB'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6B7280'; } }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: '6px', bottom: '6px', width: '3px', backgroundColor: PURPLE, borderRadius: '0 3px 3px 0' }} />}
                <span style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
                {label}
                {p === 'notifications' && unreadCount > 0 && (
                  <span className="ml-auto rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: '#EF4444', fontSize: '10px', fontWeight: '700', minWidth: '18px', height: '18px', padding: '0 4px' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
              padding: '8px 11px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: 'transparent', color: '#6B7280', fontSize: '13px', transition: 'all 0.13s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6B7280'; }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header style={{
          backgroundColor: NAVBAR_BG, borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '0 20px', height: '58px', display: 'flex', alignItems: 'center',
          gap: '12px', flexShrink: 0, zIndex: 30,
        }}>
          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
                style={{
                  position: 'relative', background: 'none',
                  border: `1px solid ${notifOpen ? `${PURPLE}60` : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '8px', cursor: 'pointer', padding: '6px',
                  color: notifOpen ? PURPLE : '#6B7280', transition: 'all 0.15s',
                  backgroundColor: notifOpen ? `${PURPLE}10` : 'transparent',
                }}
                onMouseEnter={e => { if (!notifOpen) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#9CA3AF'; } }}
                onMouseLeave={e => { if (!notifOpen) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#6B7280'; } }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '3px', right: '3px', width: '7px', height: '7px', backgroundColor: '#EF4444', borderRadius: '50%', border: '1.5px solid #111827' }} />
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: '340px', backgroundColor: '#0D1520',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 100,
                  overflow: 'hidden', animation: 'fadeSlideDown 0.15s ease',
                }}>
                  <style>{`@keyframes fadeSlideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>Notificaciones</span>
                      {unreadCount > 0 && <span style={{ backgroundColor: '#EF4444', color: 'white', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '999px' }}>{unreadCount}</span>}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PURPLE, fontSize: '11px', fontWeight: '500' }}>
                        Marcar como leídas
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {notifs.slice(0, 5).map((n, i) => (
                      <div
                        key={n.id}
                        onClick={() => { markOneRead(n.id); }}
                        style={{
                          padding: '11px 16px', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          display: 'flex', gap: '10px', alignItems: 'flex-start',
                          backgroundColor: n.read ? 'transparent' : `${PURPLE}08`,
                          cursor: 'pointer', transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = n.read ? 'transparent' : `${PURPLE}08`)}
                      >
                        <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>{n.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: n.read ? '#9CA3AF' : 'white', fontSize: '12px', fontWeight: n.read ? '400' : '600', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                          <p style={{ color: '#4B5563', fontSize: '11px' }}>{n.time}</p>
                        </div>
                        {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: PURPLE, flexShrink: 0, marginTop: '4px' }} />}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      onClick={() => { setPage('notifications'); setNotifOpen(false); }}
                      style={{ width: '100%', padding: '7px', backgroundColor: `${PURPLE}10`, border: `1px solid ${PURPLE}25`, borderRadius: '8px', color: PURPLE, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Ver todas las notificaciones
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }} ref={profileRef}>
              <button
                onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '5px 10px 5px 6px',
                  border: `1px solid ${profileOpen ? `${PURPLE}60` : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '9px', cursor: 'pointer',
                  backgroundColor: profileOpen ? `${PURPLE}08` : 'transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!profileOpen) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { if (!profileOpen) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})` }}>
                  <span style={{ color: 'white', fontSize: '10px', fontWeight: '800' }}>{memberInitials}</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: 'white', fontSize: '12px', fontWeight: '600', lineHeight: '1.2' }}>{memberName}</p>
                  <p style={{ color: PURPLE, fontSize: '10px', lineHeight: '1.2' }}>Miembro</p>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '2px' }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {profileOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: '200px', backgroundColor: '#0D1520',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 100,
                  overflow: 'hidden', animation: 'fadeSlideDown 0.15s ease',
                }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})` }}>
                        <span style={{ color: 'white', fontSize: '11px', fontWeight: '800' }}>{memberInitials}</span>
                      </div>
                      <div>
                        <p style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>{memberName}</p>
                        <p style={{ color: '#6B7280', fontSize: '11px' }}>Miembro · Plannia</p>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: '6px' }}>
                    <button
                      onClick={() => { setPage('profile'); setProfileOpen(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: '#D1D5DB', fontSize: '13px', transition: 'all 0.12s', textAlign: 'left' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#D1D5DB'; }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                      Mi perfil
                    </button>
                    <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                    <button
                      onClick={onLogout}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '7px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent', color: '#EF4444', fontSize: '13px', transition: 'all 0.12s', textAlign: 'left' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto" style={{ backgroundColor: BG }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}