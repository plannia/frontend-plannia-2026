import { useEffect, useState } from 'react';
import { Task, TaskStatus, TaskUrgency } from './mockData';
import { useAuth } from '../context/AuthContext';
import { getAssignmentsByUser } from '../services/assignmentService';
import { getCategoriesByTeam } from '../services/categoryService';
import { getTasksByTeam, TaskResource, updateTask } from '../services/taskService';

const CARD_BG = '#141C2B';
const ACCENT = '#5B8DEF';
const PURPLE = '#7C6FE8';

const urgencyColor: Record<string, string> = {
  'Baja': '#10B981',
  'Media': '#F59E0B',
  'Alta': '#EF4444',
  'Crítica': '#EC4899',
};

const urgencyBg: Record<string, string> = {
  'Baja': 'rgba(16,185,129,0.12)',
  'Media': 'rgba(245,158,11,0.12)',
  'Alta': 'rgba(239,68,68,0.12)',
  'Crítica': 'rgba(236,72,153,0.12)',
};

const statusOptions: TaskStatus[] = ['Pendiente', 'En progreso', 'Completada'];
const COMPLETED_TASK_LOCKED_MESSAGE = 'Las tareas completadas no pueden cambiar de estado.';

const statusColors: Record<TaskStatus, { color: string; bg: string }> = {
  'Pendiente': { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  'En progreso': { color: ACCENT, bg: `${ACCENT}18` },
  'Completada': { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  'Cancelada': { color: '#9CA3AF', bg: 'rgba(107,114,128,0.12)' },
};

const toDateInputValue = (iso?: string) => iso ? iso.slice(0, 10) : '';
const toLimitDateISO = (dateInput: string) => `${dateInput}T23:59:59`;

const priorityToUi = (priority: TaskResource['priority']): TaskUrgency => {
  if (priority === 'LOW') return 'Baja';
  if (priority === 'HIGH') return 'Alta';
  return 'Media';
};

const difficultyToUi = (difficulty: TaskResource['difficulty']) => {
  if (difficulty === 'EASY') return 'Fácil';
  if (difficulty === 'HARD') return 'Difícil';
  return 'Media';
};

const statusToUi = (status: TaskResource['status']): TaskStatus => {
  if (status === 'IN_PROGRESS') return 'En progreso';
  if (status === 'DONE') return 'Completada';
  if (status === 'CANCELLED') return 'Cancelada';
  return 'Pendiente';
};

const statusToApi = (status: TaskStatus): 'TO_DO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' => {
  if (status === 'En progreso') return 'IN_PROGRESS';
  if (status === 'Completada') return 'DONE';
  if (status === 'Cancelada') return 'CANCELLED';
  return 'TO_DO';
};

const taskToUi = (task: TaskResource, categoryName: string): Task => ({
  id: task.id,
  title: task.title,
  category: categoryName,
  status: statusToUi(task.status),
  assignedTo: '',
  estimatedTime: `${task.hours ?? 0}h`,
  urgency: priorityToUi(task.priority),
  description: task.description,
  difficulty: difficultyToUi(task.difficulty),
  dueDate: toDateInputValue(task.limitDate),
  tools: task.tools?.join(', ') ?? '',
  knowledge: task.knowledge?.join(', ') ?? '',
});

function DetailSidebar({ task, saving, onClose, onSave }: { task: Task; saving: boolean; onClose: () => void; onSave: (id: number, status: TaskStatus) => void }) {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>(task.status);
  const isCompleted = task.status === 'Completada';
  const hasChange = selectedStatus !== task.status;
  const canSave = hasChange && !saving && !isCompleted;

  return (
    <>
      <style>{`@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>
      <div
        style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 40,
        }}
        onClick={onClose}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px',
        backgroundColor: '#0D1520',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.22s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{task.category}</p>
            <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '700', lineHeight: '1.4' }}>{task.title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: '2px', flexShrink: 0, marginTop: '2px' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
            {[
              { label: 'Prioridad', value: task.urgency, color: urgencyColor[task.urgency] },
              { label: 'Tiempo est.', value: task.estimatedTime, color: '#9CA3AF' },
              { label: 'Dificultad', value: task.difficulty ?? '—', color: '#9CA3AF' },
              { label: 'Entrega', value: task.dueDate ?? '—', color: '#9CA3AF' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ backgroundColor: '#111827', borderRadius: '10px', padding: '12px' }}>
                <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>{label}</p>
                <p style={{ color, fontSize: '13px', fontWeight: '600' }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {task.description && (
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#4B5563', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '8px' }}>Descripción</p>
              <p style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: '1.6', backgroundColor: '#111827', borderRadius: '10px', padding: '12px' }}>
                {task.description}
              </p>
            </div>
          )}

          {/* Tools & knowledge read-only */}
          {(task.tools || task.knowledge) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {task.tools && (
                <div>
                  <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>Herramientas</p>
                  <p style={{ color: '#6B7280', fontSize: '12px' }}>{task.tools}</p>
                </div>
              )}
              {task.knowledge && (
                <div>
                  <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>Conocimiento</p>
                  <p style={{ color: '#6B7280', fontSize: '12px' }}>{task.knowledge}</p>
                </div>
              )}
            </div>
          )}

          {/* Status toggle */}
          <div>
            <p style={{ color: '#4B5563', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '10px' }}>Actualizar estado</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {statusOptions.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    if (!isCompleted) setSelectedStatus(s);
                  }}
                  disabled={isCompleted}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: '9px', border: 'none', cursor: isCompleted ? 'not-allowed' : 'pointer',
                    backgroundColor: selectedStatus === s ? statusColors[s].bg : 'rgba(255,255,255,0.03)',
                    opacity: isCompleted && selectedStatus !== s ? 0.45 : 1,
                    transition: 'all 0.15s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (!isCompleted && selectedStatus !== s) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (!isCompleted && selectedStatus !== s) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'; }}
                >
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: `2px solid ${selectedStatus === s ? statusColors[s].color : '#374151'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    transition: 'all 0.15s',
                  }}>
                    {selectedStatus === s && <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: statusColors[s].color }} />}
                  </div>
                  <span style={{ color: selectedStatus === s ? statusColors[s].color : '#6B7280', fontSize: '13px', fontWeight: selectedStatus === s ? '600' : '400' }}>{s}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer — Guardar cambios only */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => onSave(task.id, selectedStatus)}
            disabled={!canSave}
            style={{
              width: '100%',
              background: canSave ? `linear-gradient(135deg, ${ACCENT}, ${PURPLE})` : 'rgba(255,255,255,0.05)',
              color: canSave ? 'white' : '#374151',
              borderRadius: '9px', padding: '11px', border: 'none',
              cursor: canSave ? 'pointer' : 'not-allowed',
              fontSize: '13px', fontWeight: '700',
              boxShadow: canSave ? `0 4px 14px ${ACCENT}30` : 'none',
              transition: 'all 0.18s',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </>
  );
}

export function MisTareas() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskResources, setTaskResources] = useState<TaskResource[]>([]);
  const [selected, setSelected] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    if (!user?.id || !user?.teamId) {
      setLoading(false);
      setError('No se encontró un usuario o equipo asociado.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [assignments, teamTasks, categories] = await Promise.all([
        getAssignmentsByUser(user.id),
        getTasksByTeam(user.teamId),
        getCategoriesByTeam(user.teamId),
      ]);
      const assignedTaskIds = new Set(assignments.map(assignment => assignment.taskId));
      const categoryNames = categories.reduce<Record<number, string>>((acc: Record<number, string>, category: any) => {
        acc[category.id] = category.name;
        return acc;
      }, {});
      const myTaskResources = teamTasks.filter(task => assignedTaskIds.has(task.id));
      setTaskResources(myTaskResources);
      setTasks(myTaskResources.map(task => taskToUi(task, categoryNames[task.categoryId] ?? `Categoría ${task.categoryId}`)));
    } catch {
      setError('No se pudieron cargar tus tareas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [user?.id, user?.teamId]);

  const handleSave = async (id: number, status: TaskStatus) => {
    const currentResource = taskResources.find(task => task.id === id);
    if (!currentResource) return;
    if (currentResource.status === 'DONE' && statusToApi(status) !== 'DONE') {
      setError(COMPLETED_TASK_LOCKED_MESSAGE);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateTask(id, {
        status: statusToApi(status),
        limitDate: toLimitDateISO(toDateInputValue(currentResource.limitDate)),
      });
      const nextResource = updated ?? { ...currentResource, status: statusToApi(status) };
      setTaskResources(prev => prev.map(task => task.id === id ? nextResource : task));
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
      setSelected(prev => prev?.id === id ? { ...prev, status } : prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la tarea.');
    } finally {
      setSaving(false);
    }
  };

  const q = search.toLowerCase();
  const filtered = tasks.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.status.toLowerCase().includes(q) ||
    (t.dueDate ?? '').includes(q) ||
    t.category.toLowerCase().includes(q)
  );

  if (loading) {
    return <div className="p-6" style={{ color: '#6B7280', fontSize: '13px' }}>Cargando mis tareas...</div>;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700', marginBottom: '3px' }}>Mis Tareas</h1>
          <p style={{ color: '#4B5563', fontSize: '13px' }}>Tus tareas asignadas. Actualiza el estado cuando avances.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Buscar tarea, estado, fecha..."
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
          <div style={{ backgroundColor: `${ACCENT}15`, border: `1px solid ${ACCENT}25`, borderRadius: '9px', padding: '6px 14px' }}>
            <span style={{ color: ACCENT, fontSize: '12px', fontWeight: '700' }}>{filtered.length} tareas</span>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '9px', backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B', fontSize: '12px' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 110px 100px', padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          {['Tarea', 'Categoría', 'Prioridad', 'Estado', 'Entrega'].map(h => (
            <span key={h} style={{ color: '#4B5563', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ color: '#374151', fontSize: '14px', fontStyle: 'italic' }}>
              {search ? 'No se encontraron tareas con ese criterio.' : 'No tienes tareas asignadas.'}
            </p>
          </div>
        ) : filtered.map((task, i) => (
          <div
            key={task.id}
            onClick={() => setSelected(task)}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 90px 110px 100px',
              padding: '14px 20px',
              borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              cursor: 'pointer', transition: 'background 0.12s',
              backgroundColor: selected?.id === task.id ? 'rgba(91,141,239,0.06)' : 'transparent',
            }}
            onMouseEnter={e => { if (selected?.id !== task.id) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
            onMouseLeave={e => { if (selected?.id !== task.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {/* Tarea */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: urgencyColor[task.urgency] ?? '#6B7280', flexShrink: 0 }} />
              <span style={{ color: 'white', fontSize: '13px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</span>
            </div>

            {/* Categoría */}
            <span style={{ color: '#6B7280', fontSize: '12px', alignSelf: 'center' }}>{task.category}</span>

            {/* Prioridad */}
            <div style={{ alignSelf: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', backgroundColor: urgencyBg[task.urgency], color: urgencyColor[task.urgency] }}>
                {task.urgency}
              </span>
            </div>

            {/* Estado */}
            <div style={{ alignSelf: 'center' }}>
              <span style={{
                fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px',
                backgroundColor: statusColors[task.status].bg, color: statusColors[task.status].color,
              }}>
                {task.status}
              </span>
            </div>

            {/* Entrega */}
            <span style={{
              color: task.dueDate && new Date(task.dueDate + 'T00:00:00') < new Date() && task.status !== 'Completada' ? '#EF4444' : '#6B7280',
              fontSize: '12px', alignSelf: 'center',
            }}>
              {task.dueDate ?? '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Detail sidebar */}
      {selected && (
        <DetailSidebar
          task={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  );
}
