import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCategoriesByTeam } from '../services/categoryService';
import { getTeamById } from '../services/teamService';
import { createTask, getTasksByTeam, updateTask, TaskResource } from '../services/taskService';
import { confirmRecommendation, getAssignmentsByUser, getTopCandidates, CandidateProfileResource } from '../services/assignmentService';
import { TaskStatus, TaskUrgency } from './mockData';

const ACCENT = '#5B8DEF';
const PURPLE = '#7C6FE8';
const CARD_BG = '#141C2B';
const INPUT_BG = '#1A2235';
const DRAWER_BG = '#0D1520';

type ApiStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
type BackendCategory = { id: number; name: string; status?: string; limitDate?: string; memberIds?: number[] };
type BackendUser = { id: number; name: string; email: string; position?: string; role?: string };
type MemberProfile = { userId: number; maxHours: number; activeHours: number; abilities?: string; interests?: string };

interface MemberView {
  id: number;
  name: string;
  initials: string;
  email: string;
  role: string;
  hoursUsed: number;
  hoursMax: number;
  skills: string[];
  color: string;
}

interface TaskView {
  id: number;
  categoryId: number;
  title: string;
  category: string;
  status: TaskStatus;
  apiStatus: ApiStatus | string;
  assignedTo: string;
  assignedUserId?: number;
  estimatedTime: string;
  hours: number;
  urgency: TaskUrgency;
  apiPriority: string;
  description?: string;
  difficulty?: string;
  apiDifficulty?: string;
  dueDate?: string;
  tools?: string;
  knowledge?: string;
}

const COLORS = [ACCENT, PURPLE, '#10B981', '#F59E0B', '#EC4899', '#EF4444'];

const statusColors: Record<string, { bg: string; text: string }> = {
  'Pendiente': { bg: 'rgba(91,141,239,0.15)', text: '#5B8DEF' },
  'En progreso': { bg: 'rgba(124,111,232,0.15)', text: '#7C6FE8' },
  'Completada': { bg: 'rgba(16,185,129,0.15)', text: '#10B981' },
};

const urgencyColors: Record<string, { bg: string; text: string }> = {
  'Baja': { bg: 'rgba(107,114,128,0.18)', text: '#9CA3AF' },
  'Media': { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  'Alta': { bg: 'rgba(249,115,22,0.15)', text: '#F97316' },
  'Crítica': { bg: 'rgba(239,68,68,0.18)', text: '#EF4444' },
};

const FIELD_STYLE: React.CSSProperties = {
  width: '100%', backgroundColor: INPUT_BG, border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '8px', padding: '9px 12px', color: 'white', outline: 'none',
  fontSize: '13px', boxSizing: 'border-box', transition: 'border-color 0.15s'
};

const apiStatusToUi = (status: string): TaskStatus => {
  if (status === 'IN_PROGRESS') return 'En progreso';
  if (status === 'DONE') return 'Completada';
  return 'Pendiente';
};

const uiStatusToApi = (status: TaskStatus): ApiStatus => {
  if (status === 'En progreso') return 'IN_PROGRESS';
  if (status === 'Completada') return 'DONE';
  return 'TO_DO';
};

const apiPriorityToUi = (priority: string): TaskUrgency => {
  if (priority === 'HIGH') return 'Alta';
  if (priority === 'LOW') return 'Baja';
  return 'Media';
};

const uiPriorityToApi = (priority: TaskUrgency) => {
  if (priority === 'Baja') return 'LOW';
  if (priority === 'Alta' || priority === 'Crítica') return 'HIGH';
  return 'MEDIUM';
};

const apiDifficultyToUi = (difficulty?: string) => {
  if (difficulty === 'EASY') return 'Fácil';
  if (difficulty === 'HARD') return 'Difícil';
  return 'Media';
};

const uiDifficultyToApi = (difficulty: string) => {
  if (difficulty === 'Fácil') return 'EASY';
  if (difficulty === 'Difícil') return 'HARD';
  return 'MEDIUM';
};

const formatApiDate = (date?: string) => date ? date.slice(0, 10) : '';
const dateInputToApi = (date: string) => `${date}T23:59:00.000Z`;
const splitCsv = (value: string) => value.split(',').map(v => v.trim()).filter(Boolean);
const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
const getColor = (index: number) => COLORS[index % COLORS.length];

function buildTaskView(task: TaskResource, categories: BackendCategory[], members: MemberView[], assignmentByTask: Map<number, number>): TaskView {
  const category = categories.find(c => c.id === task.categoryId);
  const assignedUserId = assignmentByTask.get(task.id);
  const assignedMember = members.find(m => m.id === assignedUserId);

  return {
    id: task.id,
    categoryId: task.categoryId,
    title: task.title,
    category: category?.name ?? `Categoría ${task.categoryId}`,
    status: apiStatusToUi(task.status),
    apiStatus: task.status,
    assignedTo: assignedMember?.name ?? '',
    assignedUserId,
    estimatedTime: `${task.hours ?? 0}h`,
    hours: task.hours ?? 0,
    urgency: apiPriorityToUi(task.priority),
    apiPriority: task.priority,
    description: task.description,
    difficulty: apiDifficultyToUi(task.difficulty),
    apiDifficulty: task.difficulty,
    dueDate: formatApiDate(task.limitDate),
    tools: task.tools?.join(', ') ?? '',
    knowledge: task.knowledge?.join(', ') ?? '',
  };
}

async function buildAssignmentMap(members: MemberView[]) {
  const entries = await Promise.all(
    members.map(async member => {
      const assignments = await getAssignmentsByUser(member.id);
      return assignments.map(a => [a.taskId, a.userId] as const);
    })
  );
  return new Map(entries.flat());
}

function AssignMemberModal({
  task,
  teamId,
  members,
  onClose,
  onAssigned,
}: {
  task: TaskView;
  teamId: number;
  members: MemberView[];
  onClose: () => void;
  onAssigned: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<CandidateProfileResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getTopCandidates(task.id, teamId);
        setCandidates(data);
        setSelected(data[0]?.userId ?? null);
      } catch (err: any) {
        setError(err.message || 'No se pudo obtener la recomendación IA');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [task.id, teamId]);

  const candidatesByUser = new Map(candidates.map((c, i) => [c.userId, { ...c, rank: i + 1 }]));
  const orderedMembers = [...members].sort((a, b) => {
    const ar = candidatesByUser.get(a.id)?.rank ?? 999;
    const br = candidatesByUser.get(b.id)?.rank ?? 999;
    return ar - br || (b.hoursMax - b.hoursUsed) - (a.hoursMax - a.hoursUsed);
  });

  const handleConfirm = async () => {
    if (selected === null || saving) return;
    try {
      setSaving(true);
      setError('');
      await confirmRecommendation(task.id, selected);
      await onAssigned();
      onClose();
    } catch (err: any) {
      setError(err.message || 'No se pudo confirmar la asignación');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div style={{ backgroundColor: '#0D1520', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: '520px', margin: '16px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '700', marginBottom: '3px' }}>Asignar tarea con IA</h3>
            <p style={{ color: '#4B5563', fontSize: '12px', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '2px', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '16px 22px', flex: 1 }}>
          {loading ? (
            <p style={{ color: '#6B7280', fontSize: '13px', textAlign: 'center', padding: '28px 0' }}>Calculando mejores candidatos...</p>
          ) : orderedMembers.length === 0 ? (
            <p style={{ color: '#6B7280', fontSize: '13px', textAlign: 'center', padding: '28px 0' }}>No hay miembros disponibles en el equipo.</p>
          ) : (
            <div className="space-y-2">
              {orderedMembers.map(member => {
                const candidate = candidatesByUser.get(member.id);
                const isSelected = selected === member.id;
                const available = candidate?.availableHours ?? Math.max(member.hoursMax - member.hoursUsed, 0);
                const score = candidate ? Math.max(0, Math.round((available / Math.max(candidate.maxHours, 1)) * 100)) : 0;
                const statusColor = available > 10 ? '#10B981' : available > 4 ? '#F59E0B' : '#EF4444';

                return (
                  <button
                    key={member.id}
                    onClick={() => setSelected(isSelected ? null : member.id)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: '11px',
                      border: `1px solid ${isSelected ? `${member.color}70` : 'rgba(255,255,255,0.06)'}`,
                      backgroundColor: isSelected ? `${member.color}0D` : CARD_BG,
                      cursor: 'pointer', transition: 'all 0.15s', position: 'relative'
                    }}
                  >
                    {candidate?.rank === 1 && (
                      <span style={{ position: 'absolute', top: '10px', right: '10px', background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, color: 'white', fontSize: '9px', fontWeight: '800', padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase' }}>
                        Mejor opción
                      </span>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${member.color}40, ${member.color}20)`, border: `1.5px solid ${member.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: member.color, fontSize: '12px', fontWeight: '800' }}>{member.initials}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{member.name}</p>
                        <p style={{ color: '#6B7280', fontSize: '11px' }}>{member.role}</p>
                      </div>
                    </div>
                    <div className="mb-2.5">
                      <div className="flex justify-between mb-1">
                        <span style={{ color: '#6B7280', fontSize: '10px' }}>{candidate ? 'Disponibilidad recomendada por IA' : 'Disponibilidad'}</span>
                        <span style={{ color: member.color, fontSize: '10px', fontWeight: '700' }}>{score}%</span>
                      </div>
                      <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${score}%`, background: `linear-gradient(90deg, ${member.color}CC, ${member.color})`, borderRadius: '999px' }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#6B7280', fontSize: '11px' }}>Horas disponibles</span>
                      <span style={{ color: statusColor, fontSize: '11px', fontWeight: '600' }}>{available}h libres</span>
                    </div>
                    {member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {member.skills.slice(0, 3).map(skill => (
                          <span key={skill} style={{ backgroundColor: `${member.color}12`, border: `1px solid ${member.color}28`, color: member.color, fontSize: '10px', padding: '1px 7px', borderRadius: '999px' }}>{skill}</span>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {error && <p style={{ color: '#F87171', fontSize: '12px', textAlign: 'center', marginTop: '12px' }}>{error}</p>}
        </div>

        <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', color: '#9CA3AF', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected === null || saving}
            style={{
              flex: 2, padding: '10px', backgroundColor: selected !== null && !saving ? ACCENT : '#1A2235',
              color: selected !== null && !saving ? 'white' : '#4B5563', border: 'none', borderRadius: '9px',
              cursor: selected !== null && !saving ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '700'
            }}
          >
            {saving ? 'Confirmando...' : 'Confirmar asignación'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTaskModal({ task, onClose, onSave }: {
  task: TaskView;
  onClose: () => void;
  onSave: (id: number, status: TaskStatus, dueDate: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div style={{ backgroundColor: '#0D1520', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', width: '100%', maxWidth: '480px', margin: '16px', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '700' }}>Editar tarea</h3>
            <p style={{ color: '#4B5563', fontSize: '12px', marginTop: '2px' }}>{task.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div style={{ padding: '18px 22px' }} className="space-y-4">
          <div>
            <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Estado</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['Pendiente', 'En progreso', 'Completada'] as TaskStatus[]).map(s => {
                const sc = statusColors[s];
                const active = status === s;
                return (
                  <button key={s} onClick={() => setStatus(s)}
                    style={{ flex: 1, padding: '8px 4px', borderRadius: '8px', border: `1px solid ${active ? sc.text + '60' : 'rgba(255,255,255,0.07)'}`, backgroundColor: active ? sc.bg : 'transparent', color: active ? sc.text : '#4B5563', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                  >{s}</button>
                );
              })}
            </div>
          </div>
          <div>
            <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Fecha límite</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              style={{ ...FIELD_STYLE, colorScheme: 'dark', borderColor: 'rgba(255,255,255,0.07)' }} />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              Cancelar
            </button>
            <button
              onClick={async () => { setSaving(true); await onSave(task.id, status, dueDate); setSaving(false); onClose(); }}
              disabled={saving}
              style={{ flex: 2, padding: '10px', background: saving ? '#1A2235' : `linear-gradient(135deg, ${ACCENT}, #7C6FE8)`, color: saving ? '#4B5563' : 'white', border: 'none', borderRadius: '9px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '700' }}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskDetailDrawer({ task, onClose, onStatusChange, onAssignClick, onEditClick }: {
  task: TaskView;
  onClose: () => void;
  onStatusChange: (id: number, s: TaskStatus) => void;
  onAssignClick: () => void;
  onEditClick: () => void;
}) {
  const uc = urgencyColors[task.urgency] ?? urgencyColors['Media'];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 40 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px', backgroundColor: DRAWER_BG, borderLeft: '1px solid rgba(255,255,255,0.07)', zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 60px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: ACCENT, flexShrink: 0 }} />
              <span style={{ color: '#6B7280', fontSize: '11px', fontWeight: '500' }}>{task.category}</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: '2px', flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '700', lineHeight: '1.35', marginBottom: '12px' }}>{task.title}</h2>
          <div className="flex gap-1.5">
            {(['Pendiente', 'En progreso', 'Completada'] as TaskStatus[]).map(s => {
              const sc = statusColors[s];
              const active = task.status === s;
              return (
                <button key={s} onClick={() => onStatusChange(task.id, s)}
                  style={{ flex: 1, padding: '6px 4px', borderRadius: '7px', border: `1px solid ${active ? sc.text + '60' : 'rgba(255,255,255,0.07)'}`, backgroundColor: active ? sc.bg : 'transparent', color: active ? sc.text : '#4B5563', fontSize: '10px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {s === 'Pendiente' ? 'To Do' : s === 'En progreso' ? 'En curso' : 'Completada'}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {task.description && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '7px' }}>Descripción</p>
              <p style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: '1.65', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '9px', padding: '11px 13px', border: '1px solid rgba(255,255,255,0.05)' }}>{task.description}</p>
            </div>
          )}
          <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Detalles</p>
          <div className="grid grid-cols-2 gap-2" style={{ marginBottom: '16px' }}>
            {[
              ['Dificultad', task.difficulty ?? '-'],
              ['Tiempo estimado', task.estimatedTime],
              ['Asignado a', task.assignedTo || 'Sin asignar'],
              ['Fecha límite', task.dueDate || '-'],
            ].map(([label, value]) => (
              <div key={label} style={{ backgroundColor: '#141C2B', borderRadius: '10px', padding: '11px 13px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>{label}</p>
                <p style={{ color: '#D1D5DB', fontSize: '13px', fontWeight: '600' }}>{value}</p>
              </div>
            ))}
            <div style={{ backgroundColor: '#141C2B', borderRadius: '10px', padding: '11px 13px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Prioridad</p>
              <span style={{ backgroundColor: uc.bg, color: uc.text, fontSize: '11px', fontWeight: '700', padding: '2px 9px', borderRadius: '999px' }}>{task.urgency}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px', flexShrink: 0, backgroundColor: DRAWER_BG }}>
          <button onClick={onEditClick} style={{ flex: 1, padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', color: '#9CA3AF', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Editar
          </button>
          <button onClick={onAssignClick} style={{ flex: 2, padding: '9px 12px', background: `linear-gradient(135deg, ${ACCENT}, #7C6FE8)`, border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
            Asignar con IA
          </button>
        </div>
      </div>
    </>
  );
}

export function TaskManagement() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [members, setMembers] = useState<MemberView[]>([]);
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', categoryId: '', hours: '',
    priority: 'Media' as TaskUrgency, difficulty: 'Media', tools: '', knowledge: '', dueDate: ''
  });

  const teamId = user?.teamId;

  const loadData = async () => {
    if (!teamId) {
      setLoading(false);
      setError('No se encontró el equipo del usuario. Vuelve a iniciar sesión.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const [categoryData, teamData] = await Promise.all([
        getCategoriesByTeam(teamId),
        getTeamById(teamId),
      ]);

      const teamMembers: MemberView[] = (teamData.members ?? []).map((member: BackendUser, index: number) => ({
        id: member.id,
        name: member.name,
        initials: getInitials(member.name),
        email: member.email,
        role: member.position || member.role || 'Miembro',
        hoursUsed: 0,
        hoursMax: 40,
        skills: [],
        color: getColor(index),
      }));

      let profileData: MemberProfile[] = [];
      try {
        const { getMemberProfiles } = await import('../services/dashboardService');
        profileData = await getMemberProfiles(teamId);
      } catch {
        profileData = [];
      }

      const membersWithProfiles = teamMembers.map(member => {
        const profile = profileData.find(p => p.userId === member.id);
        return {
          ...member,
          hoursUsed: profile?.activeHours ?? 0,
          hoursMax: profile?.maxHours ?? 40,
          skills: splitCsv([profile?.abilities, profile?.interests].filter(Boolean).join(',')),
        };
      });

      const [taskData, assignmentByTask] = await Promise.all([
        getTasksByTeam(teamId),
        buildAssignmentMap(membersWithProfiles),
      ]);

      setCategories(categoryData);
      setMembers(membersWithProfiles);
      setTasks(taskData.map(task => buildTaskView(task, categoryData, membersWithProfiles, assignmentByTask)));
    } catch (err: any) {
      setError(err.message || 'No se pudo cargar la gestión de tareas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teamId]);

  const filtered = useMemo(() => tasks.filter(t => {
    const q = search.toLowerCase();
    return (
      (!search || t.title.toLowerCase().includes(q) || t.assignedTo.toLowerCase().includes(q)) &&
      (!filterCategory || t.category === filterCategory) &&
      (!filterStatus || t.status === filterStatus)
    );
  }), [tasks, search, filterCategory, filterStatus]);

  const selectedTask = selectedTaskId != null ? tasks.find(t => t.id === selectedTaskId) : null;
  const getMember = (name: string) => members.find(m => m.name === name);

  const handleStatusChange = async (id: number, status: TaskStatus) => {
    const current = tasks.find(t => t.id === id);
    if (!current) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status, apiStatus: uiStatusToApi(status) } : t));
    try {
      await updateTask(id, uiStatusToApi(status), current.dueDate ? dateInputToApi(current.dueDate) : undefined);
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar el estado');
      await loadData();
    }
  };

  const handleAddTask = async () => {
    if (!form.title || !form.categoryId || !form.dueDate || !teamId) return;
    try {
      setError('');
      await createTask({
        categoryId: Number(form.categoryId),
        title: form.title,
        description: form.description,
        hours: Number(form.hours) || 1,
        priority: uiPriorityToApi(form.priority),
        difficulty: uiDifficultyToApi(form.difficulty),
        limitDate: dateInputToApi(form.dueDate),
        tools: splitCsv(form.tools),
        knowledge: splitCsv(form.knowledge),
      });
      setForm({ title: '', description: '', categoryId: '', hours: '', priority: 'Media', difficulty: 'Media', tools: '', knowledge: '', dueDate: '' });
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'No se pudo crear la tarea');
    }
  };

  const handleEditSave = async (id: number, status: TaskStatus, dueDate: string) => {
    try {
      await updateTask(id, uiStatusToApi(status), dueDate ? dateInputToApi(dueDate) : undefined);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'No se pudo guardar la tarea');
    }
  };

  const handleBulkAI = async () => {
    if (!teamId || aiLoading) return;
    const unassigned = tasks.filter(t => !t.assignedUserId && t.apiStatus !== 'DONE' && t.apiStatus !== 'CANCELLED');
    if (unassigned.length === 0) {
      setNotice('No hay tareas sin asignar.');
      return;
    }

    setAiLoading(true);
    setError('');
    setNotice(`Asignando 0/${unassigned.length} tareas...`);

    let assigned = 0;
    let failed = 0;

    for (const task of unassigned) {
      try {
        const candidates = await getTopCandidates(task.id, teamId);
        const userId = candidates[0]?.userId;
        if (!userId) {
          failed += 1;
          continue;
        }
        await confirmRecommendation(task.id, userId);
        assigned += 1;
        setNotice(`Asignando ${assigned}/${unassigned.length} tareas...`);
      } catch {
        failed += 1;
      }
    }

    await loadData();
    setAiLoading(false);
    setNotice(failed ? `Asignadas ${assigned} tareas. ${failed} no pudieron asignarse.` : `Asignadas ${assigned} tareas con IA.`);
  };

  const fieldStyle = (name: string): React.CSSProperties => ({
    ...FIELD_STYLE,
    borderColor: focusedField === name ? ACCENT : 'rgba(255,255,255,0.07)'
  });

  if (loading) {
    return <div className="p-6" style={{ color: '#6B7280' }}>Cargando gestión de tareas...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700' }}>Gestión de Tareas</h1>
          <span style={{ backgroundColor: 'rgba(91,141,239,0.1)', color: ACCENT, fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', border: '1px solid rgba(91,141,239,0.2)' }}>
            {tasks.filter(t => t.status !== 'Completada').length} activas
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleBulkAI} disabled={aiLoading || !teamId}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: aiLoading ? 'rgba(124,111,232,0.05)' : 'rgba(124,111,232,0.1)', border: '1px solid rgba(124,111,232,0.25)', borderRadius: '9px', color: aiLoading ? '#4B5563' : PURPLE, fontSize: '13px', fontWeight: '600', cursor: aiLoading ? 'not-allowed' : 'pointer' }}
          >
            {aiLoading ? 'Asignando...' : 'Asignación IA'}
          </button>
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: `linear-gradient(135deg, ${ACCENT}, #7C6FE8)`, border: 'none', borderRadius: '9px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: `0 4px 14px ${ACCENT}30` }}>
            + Agregar Tarea
          </button>
        </div>
      </div>

      {(error || notice) && (
        <div style={{ marginBottom: '14px', color: error ? '#F87171' : '#9CA3AF', fontSize: '13px' }}>
          {error || notice}
        </div>
      )}

      <div className="flex gap-2.5 mb-5">
        <div style={{ flex: 1, position: 'relative' }}>
          <input type="text" placeholder="Buscar tareas o miembros..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...FIELD_STYLE, borderColor: 'rgba(255,255,255,0.07)' }} />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          style={{ ...FIELD_STYLE, width: 'auto', cursor: 'pointer', borderColor: 'rgba(255,255,255,0.07)' }}>
          <option value="">Todas las categorías</option>
          {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ ...FIELD_STYLE, width: 'auto', cursor: 'pointer', borderColor: 'rgba(255,255,255,0.07)' }}>
          <option value="">Todos los estados</option>
          {['Pendiente', 'En progreso', 'Completada'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['Tarea', 'Categoría', 'Estado', 'Asignado a', 'Tiempo', 'Prioridad'].map(col => (
                <th key={col} style={{ padding: '11px 16px', textAlign: 'left', color: '#4B5563', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((task, i) => {
              const sc = statusColors[task.status] ?? statusColors['Pendiente'];
              const uc = urgencyColors[task.urgency] ?? urgencyColors['Media'];
              const member = getMember(task.assignedTo);
              const isSelected = selectedTaskId === task.id;
              return (
                <tr key={task.id}
                  onClick={() => setSelectedTaskId(isSelected ? null : task.id)}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: 'pointer', backgroundColor: isSelected ? 'rgba(91,141,239,0.06)' : 'transparent', borderLeft: `3px solid ${isSelected ? ACCENT : 'transparent'}` }}
                >
                  <td style={{ padding: '12px 16px', maxWidth: '220px' }}>
                    <p style={{ color: 'white', fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>{task.title}</p>
                    {task.description && <p style={{ color: '#4B5563', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{task.description}</p>}
                  </td>
                  <td style={{ padding: '12px 16px' }}><span style={{ color: '#6B7280', fontSize: '12px' }}>{task.category}</span></td>
                  <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: sc.bg, color: sc.text, padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: '600' }}>{task.status}</span></td>
                  <td style={{ padding: '12px 16px' }}>
                    {member ? (
                      <div className="flex items-center gap-2">
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: `${member.color}20`, border: `1px solid ${member.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ color: member.color, fontSize: '8px', fontWeight: '800' }}>{member.initials}</span>
                        </div>
                        <span style={{ color: '#C9D1D9', fontSize: '12px' }}>{task.assignedTo}</span>
                      </div>
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); setSelectedTaskId(task.id); setShowAssign(true); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', border: '1px dashed rgba(91,141,239,0.3)', backgroundColor: 'rgba(91,141,239,0.04)', color: '#5B8DEF', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Asignar
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}><span style={{ color: '#6B7280', fontSize: '12px' }}>{task.estimatedTime}</span></td>
                  <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: uc.bg, color: uc.text, padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: '600' }}>{task.urgency}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#374151' }}>
            <p style={{ fontSize: '14px' }}>No se encontraron tareas con los filtros actuales.</p>
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
          onStatusChange={handleStatusChange}
          onAssignClick={() => setShowAssign(true)}
          onEditClick={() => setShowEdit(true)}
        />
      )}

      {showAssign && selectedTask && teamId && (
        <AssignMemberModal task={selectedTask} teamId={teamId} members={members} onClose={() => setShowAssign(false)} onAssigned={loadData} />
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: '#0D1520', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', margin: '16px', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>Nueva Tarea</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div style={{ padding: '18px 22px' }} className="space-y-4">
              <div>
                <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Título de la tarea *</label>
                <input type="text" placeholder="Ej: Implementar módulo de pagos" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  onFocus={() => setFocusedField('title')} onBlur={() => setFocusedField('')}
                  style={fieldStyle('title')} />
              </div>
              <div>
                <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Descripción</label>
                <textarea placeholder="Describe en detalle la tarea a realizar..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  onFocus={() => setFocusedField('desc')} onBlur={() => setFocusedField('')}
                  style={{ ...fieldStyle('desc'), height: '72px', resize: 'vertical' as const }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Categoría *</label>
                  <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                    style={{ ...FIELD_STYLE, cursor: 'pointer', borderColor: 'rgba(255,255,255,0.07)' }}>
                    <option value="">Seleccionar...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Horas estimadas</label>
                  <input type="number" placeholder="Ej: 8" value={form.hours}
                    onChange={e => setForm(f => ({ ...f, hours: e.target.value }))}
                    onFocus={() => setFocusedField('hours')} onBlur={() => setFocusedField('')}
                    style={fieldStyle('hours')} min="1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Fecha límite *</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    style={{ ...FIELD_STYLE, colorScheme: 'dark', borderColor: 'rgba(255,255,255,0.07)' }} />
                </div>
                <div>
                  <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Prioridad</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskUrgency }))}
                    style={{ ...FIELD_STYLE, cursor: 'pointer', borderColor: 'rgba(255,255,255,0.07)' }}>
                    {['Baja', 'Media', 'Alta', 'Crítica'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Dificultad</label>
                  <select value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}
                    style={{ ...FIELD_STYLE, cursor: 'pointer', borderColor: 'rgba(255,255,255,0.07)' }}>
                    {['Fácil', 'Media', 'Difícil'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Herramientas requeridas</label>
                <input type="text" placeholder="Ej: React, TypeScript, Figma" value={form.tools}
                  onChange={e => setForm(f => ({ ...f, tools: e.target.value }))}
                  onFocus={() => setFocusedField('tools')} onBlur={() => setFocusedField('')}
                  style={fieldStyle('tools')} />
              </div>
              <div>
                <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Conocimientos técnicos requeridos</label>
                <input type="text" placeholder="Ej: REST APIs, autenticación JWT" value={form.knowledge}
                  onChange={e => setForm(f => ({ ...f, knowledge: e.target.value }))}
                  onFocus={() => setFocusedField('knowledge')} onBlur={() => setFocusedField('')}
                  style={fieldStyle('knowledge')} />
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  Cancelar
                </button>
                <button onClick={handleAddTask} disabled={!form.title || !form.categoryId || !form.dueDate}
                  style={{ flex: 2, padding: '10px', background: (!form.title || !form.categoryId || !form.dueDate) ? undefined : `linear-gradient(135deg, ${ACCENT}, #7C6FE8)`, backgroundColor: (!form.title || !form.categoryId || !form.dueDate) ? '#1A2235' : undefined, color: (!form.title || !form.categoryId || !form.dueDate) ? '#4B5563' : 'white', border: 'none', borderRadius: '9px', cursor: (!form.title || !form.categoryId || !form.dueDate) ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '700' }}>
                  Crear Tarea
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEdit && selectedTask && (
        <EditTaskModal task={selectedTask} onClose={() => setShowEdit(false)} onSave={handleEditSave} />
      )}
    </div>
  );
}
