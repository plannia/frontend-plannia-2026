import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCategoriesByTeam } from '../services/categoryService';
import { getDashboardTasks, getMemberProfiles, type DashboardTask } from '../services/dashboardService';
import { getTeamById } from '../services/teamService';

const CARD_BG = '#141C2B';
const INPUT_BG = '#1A2235';
const HEADER_BG = '#0F1723';
const ACCENT = '#5B8DEF';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7am – 7pm
const COL_WIDTH = 82;
const LEFT_WIDTH = 230;
const TIMELINE_WIDTH = HOURS.length * COL_WIDTH;
const PALETTE = ['#5B8DEF', '#7C6FE8', '#10B981', '#F59E0B', '#EC4899', '#EF4444', '#14B8A6', '#F97316'];

interface TeamPlannerProps {
  isReadOnly?: boolean;
  memberCategoryNames?: string[];
}

interface PlannerMember {
  id: number;
  name: string;
  initials: string;
  role: string;
  hoursUsed: number;
  hoursMax: number;
  color: string;
}

interface PlannerTask {
  id: number;
  memberId: number;
  title: string;
  category: string;
  color: string;
  startHour: number;
  endHour: number;
  dateKey: string;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + days); return d;
}

function formatDateLabel(date: Date): string {
  return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function getWorkloadState(used: number, max: number): { label: string; color: string } {
  const s = max > 0 ? used / max : 0;
  if (s < 0.5) return { label: 'Baja carga', color: '#10B981' };
  if (s < 0.85) return { label: 'Carga media', color: '#F59E0B' };
  return { label: 'Alta carga', color: '#EF4444' };
}

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getHourFromDate = (date: Date, fallback = 9) => {
  if (Number.isNaN(date.getTime())) return fallback;
  return date.getHours() + date.getMinutes() / 60;
};

const dashboardTaskToPlanner = (
  task: DashboardTask,
  color: string
): PlannerTask => {
  const start = task.taskStartTime ? new Date(task.taskStartTime) : new Date();
  const startHour = getHourFromDate(start);
  const duration = Math.max(1, Math.min(task.taskHours || 1, 4));
  const clampedStart = Math.max(HOURS[0], Math.min(startHour, HOURS[HOURS.length - 1]));
  return {
    id: task.taskId,
    memberId: task.userId,
    title: task.taskName,
    category: task.taskCategoryName,
    color,
    startHour: clampedStart,
    endHour: Math.max(clampedStart + 1, Math.min(clampedStart + duration, HOURS[HOURS.length - 1] + 1)),
    dateKey: dateKey(start),
  };
};

export function TeamPlanner({ isReadOnly = false, memberCategoryNames = [] }: TeamPlannerProps = {}) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [members, setMembers] = useState<PlannerMember[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<{ memberId: number; hour: number } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canEditSchedule = false;

  const selectedDateKey = dateKey(selectedDate);
  const visibleTasks = tasks.filter(task => task.dateKey === selectedDateKey);
  const getTaskLeft = (task: PlannerTask) => (task.startHour - HOURS[0]) * COL_WIDTH;
  const getTaskWidth = (task: PlannerTask) => Math.max(40, (task.endHour - task.startHour) * COL_WIDTH - 6);
  const getMemberTasks = (memberId: number) => tasks.filter(t => t.memberId === memberId);

  useEffect(() => {
    const loadPlanner = async () => {
      if (!user?.teamId) {
        setLoading(false);
        setError('No se encontró un equipo asociado.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [team, profiles, categoriesData, dashboardTasks] = await Promise.all([
          getTeamById(user.teamId),
          getMemberProfiles(user.teamId).catch(() => []),
          getCategoriesByTeam(user.teamId),
          getDashboardTasks(user.teamId),
        ]);

        const profileByUser = profiles.reduce<Record<number, any>>((acc: Record<number, any>, profile: any) => {
          acc[profile.userId] = profile;
          return acc;
        }, {});

        const uiMembers: PlannerMember[] = (team.members ?? []).map((member: any, index: number) => {
          const profile = profileByUser[member.id];
          return {
            id: member.id,
            name: member.name,
            initials: getInitials(member.name),
            role: member.position ?? member.role ?? 'Miembro',
            hoursUsed: profile?.activeHours ?? 0,
            hoursMax: profile?.maxHours ?? 0,
            color: PALETTE[index % PALETTE.length],
          };
        });

        const categoryColorById = categoriesData.reduce<Record<number, string>>((acc: Record<number, string>, category: any, index: number) => {
          acc[category.id] = PALETTE[index % PALETTE.length];
          return acc;
        }, {});

        const plannerTasks = dashboardTasks
          .filter(task => task.taskStatus === 'IN_PROGRESS')
          .map(task => dashboardTaskToPlanner(task, categoryColorById[task.taskCategoryId] ?? ACCENT));

        setMembers(uiMembers);
        setTasks(plannerTasks);
      } catch {
        setError('No se pudo cargar el planificador.');
      } finally {
        setLoading(false);
      }
    };

    loadPlanner();
  }, [user?.teamId]);

  const handleDrop = (memberId: number, hour: number) => {
    if (isReadOnly || !canEditSchedule || dragging === null) return;
    const task = tasks.find(t => t.id === dragging);
    if (!task) return;
    const duration = task.endHour - task.startHour;
    const newStart = Math.max(HOURS[0], Math.min(hour, HOURS[HOURS.length - 1] - duration));
    setTasks(prev => prev.map(t => t.id === dragging ? { ...t, memberId, startHour: newStart, endHour: newStart + duration } : t));
    setDragging(null); setDragOver(null);
  };

  const navigate = (dir: -1 | 1) => setSelectedDate(prev => addDays(prev, dir));
  const goToday = () => setSelectedDate(new Date());
  const isToday = new Date().toDateString() === selectedDate.toDateString();
  const dateLabel = formatDateLabel(selectedDate);

  // Filter: show member row if name matches OR any task title matches
  const q = search.toLowerCase();
  const visibleMembers = members.filter(m => {
    if (!q) return true;
    if (m.name.toLowerCase().includes(q)) return true;
    return getMemberTasks(m.id).some(t => t.dateKey === selectedDateKey && t.title.toLowerCase().includes(q));
  });

  const taskMatchesSearch = (task: PlannerTask) => {
    if (!q) return true;
    return task.title.toLowerCase().includes(q) || members.find(m => m.id === task.memberId)?.name.toLowerCase().includes(q);
  };

  if (loading) {
    return <div className="p-6" style={{ color: '#6B7280', fontSize: '13px' }}>Cargando planificador...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', marginBottom: '3px' }}>Planificador de Equipo</h1>
          <p style={{ color: '#4B5563', fontSize: '13px' }}>
            {isReadOnly
              ? 'Vista de solo lectura. Las tareas de otras categorías se muestran como privadas.'
              : 'Visualiza las tareas en progreso del equipo según el día en que se iniciaron.'}
          </p>
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 justify-end">
          {Array.from(new Map(tasks.map(task => [task.category, { color: task.color, label: task.category }])).values()).map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div style={{ width: '8px', height: '8px', borderRadius: '3px', backgroundColor: color }} />
              <span style={{ color: '#4B5563', fontSize: '11px' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '9px', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', fontSize: '12px' }}>
          {error}
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center justify-between mb-5 gap-3">
        {/* Search bar */}
        <div style={{ position: 'relative', maxWidth: '260px', flex: 1 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Buscar miembro o tarea..." value={search} onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', backgroundColor: INPUT_BG, border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '9px', padding: '7px 12px 7px 32px', color: 'white', outline: 'none',
              fontSize: '12px', boxSizing: 'border-box', transition: 'border-color 0.15s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = ACCENT)}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
          />
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)}
            style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: INPUT_BG, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#6B7280', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT + '60'; e.currentTarget.style.color = ACCENT; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#6B7280'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>

          <button onClick={goToday}
            style={{
              padding: '6px 14px', height: '34px',
              backgroundColor: isToday ? 'rgba(91,141,239,0.1)' : INPUT_BG,
              border: `1px solid ${isToday ? 'rgba(91,141,239,0.35)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '8px', color: isToday ? ACCENT : '#6B7280',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >Hoy</button>

          <button onClick={() => navigate(1)}
            style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: INPUT_BG, border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#6B7280', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT + '60'; e.currentTarget.style.color = ACCENT; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#6B7280'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>

          <span style={{ color: 'white', fontSize: '13px', fontWeight: '600', marginLeft: '8px', textTransform: 'capitalize' }}>{dateLabel}</span>
        </div>
      </div>

      {/* Planner grid — single horizontal scroll container */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.25)' }}>
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <div style={{ minWidth: `${LEFT_WIDTH + TIMELINE_WIDTH}px` }}>

            {/* Sticky timeline header */}
            <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 20, backgroundColor: HEADER_BG, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {/* Corner cell — sticky left */}
              <div style={{ width: LEFT_WIDTH, minWidth: LEFT_WIDTH, position: 'sticky', left: 0, zIndex: 21, backgroundColor: HEADER_BG, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '11px 16px' }}>
                <span style={{ color: '#4B5563', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Miembro del equipo</span>
              </div>
              {/* Hour labels */}
              <div style={{ display: 'flex' }}>
                {HOURS.map((h, i) => (
                  <div key={h} style={{ width: COL_WIDTH, minWidth: COL_WIDTH, padding: '11px 0', textAlign: 'center', borderRight: i < HOURS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ color: '#4B5563', fontSize: '11px', fontWeight: '500' }}>{h < 10 ? `0${h}` : h}:00</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Member rows */}
            {visibleMembers.map((member, memberIdx) => {
              const memberTasks = visibleTasks.filter(t => t.memberId === member.id).filter(taskMatchesSearch);
              const wl = getWorkloadState(member.hoursUsed, member.hoursMax);
              const saturation = member.hoursMax > 0 ? member.hoursUsed / member.hoursMax : 0;

              return (
                <div key={member.id} style={{ display: 'flex', borderBottom: memberIdx < visibleMembers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', minHeight: '80px' }}>
                  {/* Sticky member info panel */}
                  <div style={{
                    width: LEFT_WIDTH, minWidth: LEFT_WIDTH,
                    position: 'sticky', left: 0, zIndex: 10,
                    backgroundColor: memberIdx % 2 === 0 ? CARD_BG : 'rgba(255,255,255,0.007)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                    padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '6px',
                  }}>
                    <div className="flex items-center gap-2.5">
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `linear-gradient(135deg, ${member.color}30, ${member.color}18)`, border: `1.5px solid ${member.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: member.color, fontSize: '10px', fontWeight: '800' }}>{member.initials}</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: 'white', fontSize: '12px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.name}</p>
                        <p style={{ color: '#4B5563', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.role}</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1">
                          <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: wl.color }} />
                          <span style={{ color: wl.color, fontSize: '9px', fontWeight: '600' }}>{wl.label}</span>
                        </div>
                        <span style={{ color: '#4B5563', fontSize: '9px' }}>{member.hoursUsed}/{member.hoursMax}h</span>
                      </div>
                      <div style={{ height: '3px', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${saturation * 100}%`, backgroundColor: wl.color, borderRadius: '999px' }} />
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div style={{ position: 'relative', width: TIMELINE_WIDTH, minWidth: TIMELINE_WIDTH, backgroundColor: memberIdx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.005)' }}>
                    {/* Drop zones */}
                    <div style={{ display: 'flex', height: '80px' }}>
                      {HOURS.map((h, i) => (
                        <div key={h}
                          style={{
                            width: COL_WIDTH, minWidth: COL_WIDTH, height: '80px',
                            borderRight: i < HOURS.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                            backgroundColor: dragOver?.memberId === member.id && dragOver?.hour === h ? 'rgba(91,141,239,0.07)' : 'transparent',
                            transition: 'background 0.1s',
                          }}
                          onDragOver={e => { if (!isReadOnly && canEditSchedule) { e.preventDefault(); setDragOver({ memberId: member.id, hour: h }); } }}
                          onDrop={() => { if (!isReadOnly && canEditSchedule) handleDrop(member.id, h); }}
                          onDragLeave={() => { if (!isReadOnly && canEditSchedule) setDragOver(null); }}
                        />
                      ))}
                    </div>

                    {/* Task blocks */}
                    <div style={{ position: 'absolute', top: '12px', left: 0, pointerEvents: 'none', width: '100%' }}>
                      {memberTasks.map(task => {
                        const isPrivate = isReadOnly && memberCategoryNames.length > 0 && !memberCategoryNames.includes(task.category);

                        if (isPrivate) {
                          return (
                            <div key={task.id} style={{
                              position: 'absolute', top: 0,
                              left: `${getTaskLeft(task) + 3}px`, width: `${getTaskWidth(task)}px`,
                              height: '56px',
                              backgroundColor: 'rgba(55,65,81,0.2)',
                              border: '1px solid rgba(75,85,104,0.3)',
                              borderLeft: '3px solid #374151',
                              borderRadius: '8px', padding: '7px 9px', overflow: 'hidden',
                            }}>
                              <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '600', fontStyle: 'italic' }}>Tarea Privada</p>
                              <p style={{ color: '#2D3748', fontSize: '9px' }}>{task.startHour < 10 ? `0${task.startHour}` : task.startHour}:00 – {task.endHour < 10 ? `0${task.endHour}` : task.endHour}:00</p>
                            </div>
                          );
                        }

                        return (
                          <div key={task.id}
                            draggable={!isReadOnly && canEditSchedule}
                            onDragStart={e => { if (isReadOnly || !canEditSchedule) return; e.stopPropagation(); setDragging(task.id); }}
                            onDragEnd={() => { setDragging(null); setDragOver(null); }}
                            style={{
                              position: 'absolute', top: 0,
                              left: `${getTaskLeft(task) + 3}px`, width: `${getTaskWidth(task)}px`,
                              height: '56px', pointerEvents: 'all',
                              background: `linear-gradient(135deg, ${task.color}22, ${task.color}14)`,
                              border: `1px solid ${task.color}50`,
                              borderLeft: `3px solid ${task.color}`,
                              borderRadius: '8px', padding: '7px 9px',
                              cursor: isReadOnly || !canEditSchedule ? 'default' : 'grab',
                              overflow: 'hidden',
                              opacity: dragging === task.id ? 0.4 : 1,
                              boxShadow: dragging === task.id ? 'none' : '0 2px 8px rgba(0,0,0,0.25)',
                              transition: 'opacity 0.15s, box-shadow 0.15s',
                            }}
                            onMouseEnter={e => { if (!isReadOnly && canEditSchedule) e.currentTarget.style.boxShadow = `0 4px 16px ${task.color}30, 0 0 0 1px ${task.color}60`; }}
                            onMouseLeave={e => { if (!isReadOnly && canEditSchedule) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)'; }}
                          >
                            <p style={{ color: task.color, fontSize: '10px', fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '2px' }}>{task.title}</p>
                            <p style={{ color: `${task.color}80`, fontSize: '9px', fontWeight: '500' }}>{task.startHour < 10 ? `0${task.startHour}` : task.startHour}:00 – {task.endHour < 10 ? `0${task.endHour}` : task.endHour}:00</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}

            {visibleMembers.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#374151', fontSize: '13px', fontStyle: 'italic' }}>
                {search ? `No se encontraron miembros o tareas con "${search}".` : 'No hay miembros o tareas asignadas para esta fecha.'}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isReadOnly && !canEditSchedule && (
        <p style={{ color: '#374151', fontSize: '11px', marginTop: '10px', textAlign: 'center' }}>
          Vista conectada a backend. La edición de horarios estará disponible cuando exista un endpoint para guardar startTime/endTime.
        </p>
      )}
    </div>
  );
}
