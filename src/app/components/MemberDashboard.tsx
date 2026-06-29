import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BASE_URL, { getHeaders } from '../services/api';
import { getAssignmentsByUser } from '../services/assignmentService';
import { getCategoriesByTeam } from '../services/categoryService';
import { getTasksByTeam, TaskResource } from '../services/taskService';

const CARD_BG = '#141C2B';
const ACCENT = '#5B8DEF';
const PURPLE = '#7C6FE8';

const urgencyColor: Record<string, string> = {
  'Baja': '#10B981',
  'Media': '#F59E0B',
  'Alta': '#EF4444',
  'Crítica': '#EC4899',
};

interface MemberTask {
  id: number;
  title: string;
  category: string;
  status: 'Pendiente' | 'En progreso' | 'Completada' | 'Cancelada';
  urgency: 'Baja' | 'Media' | 'Alta';
  dueDate?: string;
}

interface NotificationItem {
  id: number;
  message: string;
  channel?: string;
}

const toDateInputValue = (iso?: string) => iso ? iso.slice(0, 10) : '';

const statusToUi = (status: TaskResource['status']): MemberTask['status'] => {
  if (status === 'IN_PROGRESS') return 'En progreso';
  if (status === 'DONE') return 'Completada';
  if (status === 'CANCELLED') return 'Cancelada';
  return 'Pendiente';
};

const priorityToUi = (priority: TaskResource['priority']): MemberTask['urgency'] => {
  if (priority === 'LOW') return 'Baja';
  if (priority === 'HIGH') return 'Alta';
  return 'Media';
};

const getUserNotifications = async (userId: number): Promise<NotificationItem[]> => {
  const response = await fetch(`${BASE_URL}/notifications/users/${userId}`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Error al obtener notificaciones');
  return data;
};

function ActivityIcon({ muted }: { muted?: boolean }) {
  return (
    <div style={{
      width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
      backgroundColor: muted ? 'rgba(75,85,104,0.12)' : `${ACCENT}15`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={muted ? '#4B5563' : ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    </div>
  );
}

function StatCard({ label, count, color, icon }: { label: string; count: number; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '20px' }}>
      <div className="flex items-start justify-between mb-3">
        <div style={{ width: '36px', height: '36px', borderRadius: '9px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
        <span style={{ color, fontSize: '24px', fontWeight: '800' }}>{count}</span>
      </div>
      <p style={{ color: '#6B7280', fontSize: '12px', fontWeight: '500' }}>{label}</p>
    </div>
  );
}

export function MemberDashboard() {
  const { user } = useAuth();
  const [memberTasks, setMemberTasks] = useState<MemberTask[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?.id || !user?.teamId) {
        setLoading(false);
        setError('No se encontró un usuario o equipo asociado.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [assignments, teamTasks, teamCategories, userNotifications] = await Promise.all([
          getAssignmentsByUser(user.id),
          getTasksByTeam(user.teamId),
          getCategoriesByTeam(user.teamId),
          getUserNotifications(user.id).catch(() => []),
        ]);

        const assignedTaskIds = new Set(assignments.map(assignment => assignment.taskId));
        const categoryNames = teamCategories.reduce<Record<number, string>>((acc: Record<number, string>, category: any) => {
          acc[category.id] = category.name;
          return acc;
        }, {});

        const tasks = teamTasks
          .filter(task => assignedTaskIds.has(task.id))
          .map(task => ({
            id: task.id,
            title: task.title,
            category: categoryNames[task.categoryId] ?? `Categoría ${task.categoryId}`,
            status: statusToUi(task.status),
            urgency: priorityToUi(task.priority),
            dueDate: toDateInputValue(task.limitDate),
          }));

        setMemberTasks(tasks);
        setNotifications(userNotifications);
      } catch {
        setError('No se pudo cargar el dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user?.id, user?.teamId]);

  const pendiente = memberTasks.filter(t => t.status === 'Pendiente').length;
  const enProgreso = memberTasks.filter(t => t.status === 'En progreso').length;
  const completada = memberTasks.filter(t => t.status === 'Completada').length;

  if (loading) {
    return <div className="p-6" style={{ color: '#6B7280', fontSize: '13px' }}>Cargando dashboard...</div>;
  }

  return (
    <div className="p-6">
      {/* Greeting */}
      <div className="flex items-center gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '800' }}>Hola, {user?.name ?? 'Miembro'}</h1>
            <span style={{ backgroundColor: `${PURPLE}20`, color: PURPLE, fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', border: `1px solid ${PURPLE}30` }}>
              Miembro
            </span>
          </div>
          <p style={{ color: '#4B5563', fontSize: '13px' }}>Aquí tienes un resumen de tus tareas y la actividad del equipo.</p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '16px', padding: '10px 12px', borderRadius: '9px', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', fontSize: '12px' }}>
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        <StatCard
          label="Mis Pendientes"
          count={pendiente}
          color="#F59E0B"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
        />
        <StatCard
          label="En Progreso"
          count={enProgreso}
          color={ACCENT}
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>}
        />
        <StatCard
          label="Completadas"
          count={completada}
          color="#10B981"
          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
        />
      </div>

      {/* Mis tareas recientes */}
      <div style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '700' }}>Mis tareas recientes</span>
          <span style={{ color: '#4B5563', fontSize: '12px' }}>{memberTasks.length} tareas asignadas</span>
        </div>
        <div>
          {memberTasks.length === 0 ? (
            <div style={{ padding: '26px 20px', textAlign: 'center' }}>
              <p style={{ color: '#4B5563', fontSize: '13px' }}>No tienes tareas asignadas.</p>
            </div>
          ) : memberTasks.map((task, i) => (
            <div
              key={task.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 20px',
                borderBottom: i < memberTasks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: urgencyColor[task.urgency] ?? '#6B7280', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: 'white', fontSize: '13px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                <p style={{ color: '#4B5563', fontSize: '11px', marginTop: '1px' }}>{task.category}</p>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '6px',
                backgroundColor: task.status === 'Completada' ? 'rgba(16,185,129,0.12)' : task.status === 'En progreso' ? `${ACCENT}18` : 'rgba(245,158,11,0.12)',
                color: task.status === 'Completada' ? '#10B981' : task.status === 'En progreso' ? ACCENT : '#F59E0B',
              }}>
                {task.status}
              </span>
              {task.dueDate && (
                <span style={{ color: '#4B5563', fontSize: '11px', whiteSpace: 'nowrap' }}>
                  {new Date(task.dueDate + 'T00:00:00') < new Date() && task.status !== 'Completada'
                    ? <span style={{ color: '#EF4444' }}>{task.dueDate}</span>
                    : task.dueDate}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ color: 'white', fontSize: '14px', fontWeight: '700' }}>Actividad del equipo</span>
        </div>
        <div>
          {notifications.length === 0 ? (
            <div style={{ padding: '26px 20px', textAlign: 'center' }}>
              <p style={{ color: '#4B5563', fontSize: '13px' }}>No hay actividad reciente.</p>
            </div>
          ) : notifications.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '12px 20px',
                  borderBottom: i < notifications.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                <ActivityIcon />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: 'white', fontSize: '12px', fontWeight: '500', lineHeight: '1.5' }}>
                    {item.message}
                  </p>
                  {item.channel && <span style={{ color: ACCENT, fontSize: '10px', fontWeight: '600' }}>{item.channel}</span>}
                </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}
