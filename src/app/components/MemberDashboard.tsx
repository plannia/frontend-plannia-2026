import React from 'react';
import { tasks, categories } from './mockData';

const BG = '#0F1419';
const CARD_BG = '#141C2B';
const ACCENT = '#5B8DEF';
const PURPLE = '#7C6FE8';

const MEMBER_NAME = 'Ana García';
const MEMBER_CATEGORIES = categories
  .filter(c => c.memberIds.includes(1))
  .map(c => c.name); // ['Diseño UI', 'Frontend']

const anaTasks = tasks.filter(t => t.assignedTo === MEMBER_NAME);

const activityFeed = [
  { id: 1, category: 'Diseño UI', isPrivate: false, title: '"Rediseño pantalla de login"', detail: 'fue actualizada a En Progreso', time: 'hace 10 min', actor: 'Tú' },
  { id: 2, category: 'Backend', isPrivate: true, time: 'hace 1 hora', actor: 'Carlos López', taskName: 'Integración de pagos Stripe' },
  { id: 3, category: 'Backend', isPrivate: true, time: 'hace 2 horas', actor: 'IA', taskName: 'Optimización de queries BD' },
  { id: 4, category: null, isPrivate: false, title: 'Laura Sánchez', detail: 'se unió al equipo con código PL-2026', time: 'hace 5 horas', actor: 'Sistema' },
  { id: 5, category: 'Infraestructura', isPrivate: true, time: 'ayer', actor: 'Diego Martínez', taskName: 'Configuración de servidores' },
  { id: 6, category: 'Frontend', isPrivate: false, title: '"Corrección de estilos en dashboard"', detail: 'fue marcada como Completada', time: 'ayer', actor: 'Tú' },
];

const urgencyColor: Record<string, string> = {
  'Baja': '#10B981',
  'Media': '#F59E0B',
  'Alta': '#EF4444',
  'Crítica': '#EC4899',
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
  const pendiente = anaTasks.filter(t => t.status === 'Pendiente').length;
  const enProgreso = anaTasks.filter(t => t.status === 'En progreso').length;
  const completada = anaTasks.filter(t => t.status === 'Completada').length;

  return (
    <div className="p-6">
      {/* Greeting */}
      <div className="flex items-center gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '800' }}>Hola, Ana García</h1>
            <span style={{ backgroundColor: `${PURPLE}20`, color: PURPLE, fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', border: `1px solid ${PURPLE}30` }}>
              Miembro
            </span>
          </div>
          <p style={{ color: '#4B5563', fontSize: '13px' }}>Aquí tienes un resumen de tus tareas y la actividad del equipo.</p>
        </div>
      </div>

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
          <span style={{ color: '#4B5563', fontSize: '12px' }}>{anaTasks.length} tareas asignadas</span>
        </div>
        <div>
          {anaTasks.map((task, i) => (
            <div
              key={task.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 20px',
                borderBottom: i < anaTasks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
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
          {activityFeed.map((item, i) => {
            const isInMemberCategory = item.category === null || MEMBER_CATEGORIES.includes(item.category);
            const show = !item.isPrivate && isInMemberCategory;

            return (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  padding: '12px 20px',
                  borderBottom: i < activityFeed.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                {show ? (
                  <>
                    <ActivityIcon />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'white', fontSize: '12px', fontWeight: '500', lineHeight: '1.5' }}>
                        {item.title && <span style={{ fontWeight: '700' }}>{item.title} </span>}
                        <span style={{ color: '#9CA3AF' }}>{item.detail}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {item.category && (
                          <span style={{ color: ACCENT, fontSize: '10px', fontWeight: '600' }}>{item.category}</span>
                        )}
                        <span style={{ color: '#374151', fontSize: '10px' }}>·</span>
                        <span style={{ color: '#4B5563', fontSize: '10px' }}>{item.time}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <ActivityIcon muted />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#6B7280', fontSize: '12px', lineHeight: '1.5' }}>
                        <span style={{ color: '#9CA3AF', fontWeight: '600' }}>{item.actor}</span>
                        {' '}
                        <span>actualizó </span>
                        <span style={{ color: '#6B7280', fontWeight: '500' }}>"{item.taskName}"</span>
                      </p>
                      <span style={{ color: '#374151', fontSize: '10px' }}>{item.time}</span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
