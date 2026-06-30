import { useState, useRef, useEffect } from 'react';
import { Dashboard } from './Dashboard';
import { TaskManagement } from './TaskManagement';
import { Categories } from './Categories';
import { TeamPlanner } from './TeamPlanner';
import { TeamManagement } from './TeamManagement';
import { ProfileNotifications } from './ProfileNotifications';
import { MemberProfilePage } from './MemberProfilePage';
import { useAuth } from '../context/AuthContext';
import { getUiNotificationsByUser, UiNotification } from '../services/notificationService';

const BG = '#0F1419';
const SIDEBAR_BG = '#1A2235';
const ACCENT = '#5B8DEF';
const NAVBAR_BG = '#111827';

export type Page = 'dashboard' | 'tasks' | 'categories' | 'planner' | 'team' | 'notifications' | 'profile';

interface Props {
  onLogout: () => void;
}

const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  {
    page: 'dashboard', label: 'Dashboard',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
  },
  {
    page: 'tasks', label: 'Gestión de Tareas',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>
  },
  {
    page: 'categories', label: 'Categorías',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" /></svg>
  },
  {
    page: 'planner', label: 'Planificador',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
  },
  {
    page: 'team', label: 'Equipo',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
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

export function AppLayout({ onLogout }: Props) {
  const [page, setPage] = useState<Page>('dashboard');
  const { user } = useAuth();
  const userName = user?.name ?? '';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
const userRoleLabel = user?.role === 'LEADER' ? 'Líder' : 'Miembro';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifs, setNotifs] = useState<UiNotification[]>([]);

  // Notificaciones REALES del backend (antes usaba initialNotifs mock).
  useEffect(() => {
    if (!user) return;
    getUiNotificationsByUser(user.id).then(setNotifs).catch(() => setNotifs([]));
  }, [user]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useClickOutside(notifRef, () => setNotifOpen(false));
  useClickOutside(profileRef, () => setProfileOpen(false));

  const unreadCount = notifs.filter(n => !n.read).length;
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'tasks': return <TaskManagement />;
      case 'categories': return <Categories />;
      case 'planner': return <TeamPlanner />;
      case 'team': return <TeamManagement />;
      case 'notifications': return <ProfileNotifications initialTab="notifications" />;
      case 'profile': return <MemberProfilePage/>;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: BG }}>
      {/* Sidebar */}
      <aside className="flex flex-col" style={{ width: '240px', minWidth: '240px', backgroundColor: SIDEBAR_BG, borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Logo — typographic wordmark */}
        <div className="flex items-center px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ color: 'white', fontSize: '19px', fontWeight: '800', letterSpacing: '-0.5px' }}>Plannia</span>
        </div>

        {/* Nav items */}
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
                  backgroundColor: active ? 'rgba(91,141,239,0.13)' : 'transparent',
                  color: active ? ACCENT : '#6B7280',
                  fontSize: '13px', fontWeight: active ? '600' : '400',
                  transition: 'all 0.13s', textAlign: 'left', position: 'relative'
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#D1D5DB'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6B7280'; } }}
              >
                {active && <div style={{ position: 'absolute', left: 0, top: '6px', bottom: '6px', width: '3px', backgroundColor: ACCENT, borderRadius: '0 3px 3px 0' }} />}
                <span style={{ opacity: active ? 1 : 0.7 }}>{icon}</span>
                {label}
                {p === 'notifications' && unreadCount > 0 && (
                  <span className="ml-auto rounded-full flex items-center justify-center text-white" style={{ backgroundColor: '#EF4444', fontSize: '10px', fontWeight: '700', minWidth: '18px', height: '18px', padding: '0 4px' }}>{unreadCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '9px',
              padding: '8px 11px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: 'transparent', color: '#6B7280', fontSize: '13px', transition: 'all 0.13s'
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

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header style={{
          backgroundColor: NAVBAR_BG, borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '0 20px', height: '58px', display: 'flex', alignItems: 'center',
          gap: '12px', flexShrink: 0, zIndex: 30
        }}>
          {/* Search bar */}
          <div style={{ flex: 1, maxWidth: '420px', position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={searchFocused ? ACCENT : '#4B5563'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', transition: 'stroke 0.15s' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar tareas, miembros..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: '100%', backgroundColor: searchFocused ? '#0F1419' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${searchFocused ? ACCENT : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '9px', padding: '7px 12px 7px 34px', color: 'white', outline: 'none',
                fontSize: '13px', boxSizing: 'border-box', transition: 'all 0.18s'
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: 0, lineHeight: 1, fontSize: '16px' }}>
                ×
              </button>
            )}
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Notifications */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }}
                style={{
                  position: 'relative', background: 'none',
                  border: `1px solid ${notifOpen ? 'rgba(91,141,239,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '8px', cursor: 'pointer', padding: '6px',
                  color: notifOpen ? ACCENT : '#6B7280', transition: 'all 0.15s',
                  backgroundColor: notifOpen ? 'rgba(91,141,239,0.08)' : 'transparent'
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

              {/* Notifications dropdown */}
              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: '340px', backgroundColor: '#0D1520',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 100,
                  overflow: 'hidden', animation: 'fadeSlideDown 0.15s ease'
                }}>
                  <style>{`@keyframes fadeSlideDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
                  {/* Header */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>Notificaciones</span>
                      {unreadCount > 0 && <span style={{ backgroundColor: '#EF4444', color: 'white', fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '999px' }}>{unreadCount}</span>}
                    </div>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ACCENT, fontSize: '11px', fontWeight: '500' }}>
                        Marcar como leídas
                      </button>
                    )}
                  </div>
                  {/* Items */}
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {notifs.slice(0, 5).map((n, i) => (
                      <div
                        key={n.id}
                        onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                        style={{
                          padding: '11px 16px',
                          borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                          display: 'flex', gap: '10px', alignItems: 'flex-start',
                          backgroundColor: n.read ? 'transparent' : 'rgba(91,141,239,0.04)',
                          cursor: 'pointer', transition: 'background 0.12s'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = n.read ? 'transparent' : 'rgba(91,141,239,0.04)')}
                      >
                        <span style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0, marginTop: '1px' }}>{n.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: n.read ? '#9CA3AF' : 'white', fontSize: '12px', fontWeight: n.read ? '400' : '600', marginBottom: '2px', lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
                          <p style={{ color: '#4B5563', fontSize: '11px', lineHeight: '1.4' }}>{n.time}</p>
                        </div>
                        {!n.read && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: ACCENT, flexShrink: 0, marginTop: '4px' }} />}
                      </div>
                    ))}
                  </div>
                  {/* Footer */}
                  <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      onClick={() => { setPage('notifications'); setNotifOpen(false); }}
                      style={{ width: '100%', padding: '7px', backgroundColor: 'rgba(91,141,239,0.08)', border: '1px solid rgba(91,141,239,0.2)', borderRadius: '8px', color: ACCENT, fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(91,141,239,0.13)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(91,141,239,0.08)')}
                    >
                      Ver todas las notificaciones
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button
                onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '5px 10px 5px 6px',
                  border: `1px solid ${profileOpen ? 'rgba(91,141,239,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '9px', cursor: 'pointer',
                  backgroundColor: profileOpen ? 'rgba(91,141,239,0.06)' : 'transparent',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if (!profileOpen) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { if (!profileOpen) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${ACCENT}, #7C6FE8)` }}>
                  <span style={{ color: 'white', fontSize: '10px', fontWeight: '800' }}>{userInitials}</span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ color: 'white', fontSize: '12px', fontWeight: '600', lineHeight: '1.2' }}>{userName}</p>
                  <p style={{ color: ACCENT, fontSize: '10px', lineHeight: '1.2' }}>{userRoleLabel}</p>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: profileOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginLeft: '2px' }}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Profile dropdown */}
              {profileOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: '200px', backgroundColor: '#0D1520',
                  border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 100,
                  overflow: 'hidden', animation: 'fadeSlideDown 0.15s ease'
                }}>
                  {/* User info row */}
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${ACCENT}, #7C6FE8)` }}>
                        <span style={{ color: 'white', fontSize: '11px', fontWeight: '800' }}>{userInitials}</span>
                      </div>
                      <div>
                        <p style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>{userName}</p>
                        <p style={{ color: '#6B7280', fontSize: '11px' }}>{userRoleLabel} · Plannia</p>
                      </div>
                    </div>
                  </div>
                  {/* Options */}
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

        {/* Page content */}
        <main className="flex-1 overflow-auto" style={{ backgroundColor: BG }}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
