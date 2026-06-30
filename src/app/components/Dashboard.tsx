import { useState, useEffect, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardTasks, getMemberProfiles, type DashboardTask, type DashboardMemberProfile } from '../services/dashboardService';
import { getTeamById } from '../services/teamService';

const ACCENT = '#5B8DEF';
const PURPLE = '#7C6FE8';
const CARD_BG = '#141C2B';

const statusColors: Record<string, { bg: string; text: string }> = {
  'TO_DO':       { bg: 'rgba(91,141,239,0.15)',  text: '#5B8DEF' },
  'IN_PROGRESS': { bg: 'rgba(124,111,232,0.15)', text: '#7C6FE8' },
  'DONE':        { bg: 'rgba(16,185,129,0.15)',  text: '#10B981' },
};

const statusLabel: Record<string, string> = {
  'TO_DO':       'Pendiente',
  'IN_PROGRESS': 'En progreso',
  'DONE':        'Completada',
};

const COLORS = [ACCENT, PURPLE, '#10B981', '#F59E0B', '#F97316', '#EF4444'];

function getColor(index: number) {
  return COLORS[index % COLORS.length];
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function StatCard({ title, value, subtitle, icon, color }: { title: string; value: number; subtitle: string; icon: ReactNode; color: string }) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)', flex: 1 }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '4px' }}>{title}</p>
          <p style={{ color: 'white', fontSize: '32px', fontWeight: '700', lineHeight: '1' }}>{value}</p>
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <p style={{ color: '#4B5563', fontSize: '12px' }}>{subtitle}</p>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [profiles, setProfiles] = useState<DashboardMemberProfile[]>([]);
  const [memberNames, setMemberNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.teamId) return;
    const load = async () => {
      try {
        const [t, p, team] = await Promise.all([
          getDashboardTasks(user.teamId!),
          getMemberProfiles(user.teamId!),
          getTeamById(user.teamId!),
        ]);
        setTasks(t);
        setProfiles(p);
        const names: Record<number, string> = {};
        for (const member of team.members ?? []) {
          names[member.id] = member.name;
        }
        setMemberNames(names);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const total = tasks.length;
  const inProgress = tasks.filter(t => t.taskStatus === 'IN_PROGRESS').length;
  const done = tasks.filter(t => t.taskStatus === 'DONE').length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center" style={{ color: '#6B7280' }}>
        Cargando dashboard...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
            Hola, {user?.name?.split(' ')[0] ?? 'Líder'} 👋
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px' }}>
            Aquí tienes un resumen del estado de tu equipo hoy.
          </p>
        </div>
        <div className="rounded-lg px-3 py-1.5" style={{ backgroundColor: 'rgba(91,141,239,0.12)', border: '1px solid rgba(91,141,239,0.2)' }}>
          <span style={{ color: ACCENT, fontSize: '12px', fontWeight: '600' }}>Rol: {user?.role === 'LEADER' ? 'Líder' : 'Miembro'}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="flex gap-4">
        <StatCard title="Total de Tareas" value={total} subtitle={`${done} completadas · ${total - done} pendientes`} color={ACCENT}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
        />
        <StatCard title="En Progreso" value={inProgress} subtitle="Activas en este momento" color={PURPLE}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
        />
        <StatCard title="Completadas" value={done} subtitle={total > 0 ? `${Math.round((done / total) * 100)}% del total completado` : 'Sin tareas aún'} color="#10B981"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
        />
      </div>

      {/* Active Tasks Table */}
      <div className="rounded-xl" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '600' }}>Tareas en progreso del equipo</h3>
          <span style={{ color: '#6B7280', fontSize: '12px' }}>{tasks.length} tareas activas</span>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center" style={{ color: '#4B5563' }}>No hay tareas en progreso aún.</div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {['Miembro', 'Tarea', 'Categoría', 'Estado', 'Horas Est.'].map(col => (
                    <th key={col} style={{ padding: '10px 16px', textAlign: 'left', color: '#6B7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, i) => {
                  const sc = statusColors[task.taskStatus] ?? statusColors['TO_DO'];
                  const color = getColor(i);
                  return (
                    <tr key={task.taskId} style={{ borderBottom: i < tasks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '13px 16px' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}25` }}>
                            <span style={{ color, fontSize: '11px', fontWeight: '700' }}>{getInitials(task.userName)}</span>
                          </div>
                          <span style={{ color: '#D1D5DB', fontSize: '13px' }}>{task.userName.split(' ')[0]}</span>
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>{task.taskName}</span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ color: '#9CA3AF', fontSize: '13px' }}>{task.taskCategoryName}</span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ backgroundColor: sc.bg, color: sc.text, padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '500' }}>
                          {statusLabel[task.taskStatus] ?? task.taskStatus}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ color: '#9CA3AF', fontSize: '13px' }}>{task.taskHours}h</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Team Workload */}
      <div className="rounded-xl p-5" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '600', marginBottom: '16px' }}>Carga de trabajo del equipo</h3>
        {profiles.length === 0 ? (
          <p style={{ color: '#4B5563', fontSize: '13px' }}>No hay miembros con perfil aún.</p>
        ) : (
          <div className="space-y-3">
            {profiles.map((m, i) => {
              const color = getColor(i);
              const pct = m.maxHours > 0 ? (m.activeHours / m.maxHours) * 100 : 0;
              const memberName = memberNames[m.userId] ?? `Usuario ${m.userId}`;
              return (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}25` }}>
                    <span style={{ color, fontSize: '11px', fontWeight: '700' }}>{getInitials(memberName)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex justify-between mb-1">
                      <span style={{ color: '#D1D5DB', fontSize: '13px' }}>{memberName}</span>
                      <span style={{ color: '#6B7280', fontSize: '12px' }}>{m.activeHours}/{m.maxHours}h</span>
                    </div>
                    <div style={{ height: '5px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct > 85 ? '#EF4444' : color, borderRadius: '999px' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}