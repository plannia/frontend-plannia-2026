import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCategoriesByTeam } from '../services/categoryService';
import { getDashboardTasks } from '../services/dashboardService';
import { getTeamById } from '../services/teamService';
import { getAssignmentCandidates, confirmAssignmentRecommendation, CandidateProfileResource } from '../services/assignmentService';
import { createTask, getTasksByTeam, TaskResource, updateTask } from '../services/taskService';
import { Task, TaskStatus, TaskUrgency } from './mockData';
import { AIAssignmentModal } from './AIAssignmentModal';

const ACCENT = '#5B8DEF';
const PURPLE = '#7C6FE8';
const CARD_BG = '#141C2B';
const INPUT_BG = '#1A2235';
const DRAWER_BG = '#0D1520';

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

interface CategoryOption {
  id: number;
  name: string;
  color?: string;
}

interface TeamMemberOption {
  id: number;
  name: string;
  email: string;
  position?: string;
  role?: string;
  color: string;
  initials: string;
  hoursUsed: number;
  hoursMax: number;
}

const COLORS = ['#5B8DEF', '#7C6FE8', '#10B981', '#F59E0B', '#EC4899', '#EF4444'];

const getInitials = (name: string) => name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2) || 'US';
const splitList = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);

const statusFromApi = (status: string): TaskStatus => {
  if (status === 'IN_PROGRESS') return 'En progreso';
  if (status === 'DONE') return 'Completada';
  return 'Pendiente';
};

const statusToApi = (status: TaskStatus) => {
  if (status === 'En progreso') return 'IN_PROGRESS';
  if (status === 'Completada') return 'DONE';
  return 'TO_DO';
};

const priorityFromApi = (priority: string): TaskUrgency => {
  if (priority === 'HIGH') return 'Alta';
  if (priority === 'LOW') return 'Baja';
  return 'Media';
};

const priorityToApi = (priority: TaskUrgency) => {
  if (priority === 'Alta' || priority === 'Crítica') return 'HIGH';
  if (priority === 'Baja') return 'LOW';
  return 'MEDIUM';
};

const difficultyFromApi = (difficulty: string) => {
  if (difficulty === 'EASY') return 'Fácil';
  if (difficulty === 'HARD') return 'Difícil';
  return 'Media';
};

const difficultyToApi = (difficulty: string) => {
  if (difficulty === 'Fácil') return 'EASY';
  if (difficulty === 'Difícil') return 'HARD';
  return 'MEDIUM';
};

const toDateInput = (value?: string) => value ? value.split('T')[0] : '';
const toIsoDateTime = (value: string) => new Date(`${value}T23:59:00`).toISOString();

// ─── Assign Member Modal ──────────────────────────────────────────────────────

interface AssignModalProps {
  task: Task;
  members: TeamMemberOption[];
  candidates: CandidateProfileResource[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onAssign: (memberId: number) => void;
}

function AssignMemberModal({ task, members, candidates, loading, error, onClose, onAssign }: AssignModalProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const membersWithAffinity = members.map(member => {
    const candidate = candidates.find(c => c.userId === member.id);
    const availability = member.hoursMax > 0 ? Math.max(0, Math.min(1, (candidate?.availableHours ?? (member.hoursMax - member.hoursUsed)) / member.hoursMax)) : 0;
    return { ...member, candidate, affinity: Math.round(availability * 100) };
  }).sort((a, b) => b.affinity - a.affinity);

  const recommended = membersWithAffinity.slice(0, 2);
  const others = membersWithAffinity.slice(2);

  const handleConfirm = () => {
    if (selected === null) return;
    onAssign(selected);
    onClose();
  };

  function MemberCard({ member, isTop }: { member: typeof membersWithAffinity[0]; isTop?: boolean }) {
    const isSelected = selected === member.id;
    const avail = member.hoursMax - member.hoursUsed;
    const saturation = member.hoursUsed / member.hoursMax;
    const statusLabel = saturation < 0.5 ? 'Disponible' : saturation < 0.85 ? 'Parcialmente ocupado' : 'Saturado';
    const statusColor = saturation < 0.5 ? '#10B981' : saturation < 0.85 ? '#F59E0B' : '#EF4444';

    return (
      <button
        onClick={() => setSelected(isSelected ? null : member.id)}
        style={{
          width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: '11px',
          border: `1px solid ${isSelected ? `${member.color}60` : 'rgba(255,255,255,0.06)'}`,
          backgroundColor: isSelected ? `${member.color}0D` : CARD_BG,
          cursor: 'pointer', transition: 'all 0.15s', position: 'relative'
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
      >
        {isTop && (
          <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
            <span style={{ background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, color: 'white', fontSize: '9px', fontWeight: '800', padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              ⭐ Mejor opción
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `linear-gradient(135deg, ${member.color}40, ${member.color}20)`, border: `1.5px solid ${member.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: member.color, fontSize: '12px', fontWeight: '800' }}>{member.initials}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{member.name}</p>
            <div className="flex items-center gap-1.5">
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor, flexShrink: 0 }} />
              <p style={{ color: statusColor, fontSize: '11px' }}>{statusLabel}</p>
            </div>
          </div>
        </div>

        {/* Affinity bar */}
        <div className="mb-2.5">
          <div className="flex justify-between mb-1">
            <span style={{ color: '#6B7280', fontSize: '10px' }}>Afinidad con la tarea</span>
            <span style={{ color: member.color, fontSize: '10px', fontWeight: '700' }}>{member.affinity}%</span>
          </div>
          <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${member.affinity}%`, background: `linear-gradient(90deg, ${member.color}CC, ${member.color})`, borderRadius: '999px', transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {/* Hours */}
        <div className="flex items-center justify-between mb-2.5">
          <span style={{ color: '#6B7280', fontSize: '11px' }}>Horas disponibles</span>
          <span style={{ color: avail > 10 ? '#10B981' : avail > 4 ? '#F59E0B' : '#EF4444', fontSize: '11px', fontWeight: '600' }}>{avail}h libres</span>
        </div>

        {/* Profile */}
        <div className="flex flex-wrap gap-1">
          {[member.position, member.role].filter(Boolean).map(s => (
            <span key={s} style={{ backgroundColor: `${member.color}12`, border: `1px solid ${member.color}28`, color: member.color, fontSize: '10px', padding: '1px 7px', borderRadius: '999px' }}>{s}</span>
          ))}
        </div>

        {isSelected && (
          <div style={{ marginTop: '10px', padding: '6px 10px', backgroundColor: `${member.color}15`, borderRadius: '7px', textAlign: 'center' }}>
            <span style={{ color: member.color, fontSize: '11px', fontWeight: '700' }}>✓ Seleccionado</span>
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div style={{ backgroundColor: '#0D1520', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: '520px', margin: '16px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }}>
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '700', marginBottom: '3px' }}>Asignar tarea</h3>
            <p style={{ color: '#4B5563', fontSize: '12px', maxWidth: '350px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '2px', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ overflowY: 'auto', padding: '16px 22px', flex: 1 }}>
          {loading && <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '12px' }}>Cargando candidatos...</p>}
          {error && <p style={{ color: '#EF4444', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}
          {/* Recommended section */}
          <div style={{ marginBottom: '20px' }}>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: '#4B5563', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Recomendados</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
            </div>
            <div className="space-y-2">
              {recommended.map((m, i) => <MemberCard key={m.id} member={m} isTop={i === 0} />)}
            </div>
          </div>

          {/* Others section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: '#4B5563', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Otros miembros</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
            </div>
            <div className="space-y-2">
              {others.map(m => <MemberCard key={m.id} member={m} />)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', color: '#9CA3AF', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected === null}
            style={{
              flex: 2, padding: '10px', backgroundColor: selected !== null ? ACCENT : '#1A2235',
              color: selected !== null ? 'white' : '#4B5563', border: 'none', borderRadius: '9px',
              cursor: selected !== null ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: '700', transition: 'all 0.2s'
            }}
          >
            Confirmar asignación
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Task Modal (only status + dueDate editable) ────────────────────────

function EditTaskModal({ task, onClose, onSave }: {
  task: Task;
  onClose: () => void;
  onSave: (id: number, status: TaskStatus, dueDate: string) => void;
}) {
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');

  const readOnlyField = (label: string, value: string) => (
    <div>
      <p style={{ color: '#374151', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>{label}</p>
      <p style={{ color: '#4B5563', fontSize: '13px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '7px', padding: '8px 11px', border: '1px solid rgba(255,255,255,0.04)' }}>{value || '—'}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div style={{ backgroundColor: '#0D1520', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto', margin: '16px', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '700' }}>Editar tarea</h3>
            <p style={{ color: '#4B5563', fontSize: '12px', marginTop: '2px' }}>{task.title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div style={{ padding: '18px 22px' }} className="space-y-4">
          {/* Read-only fields */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ color: '#374151', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Campos de solo lectura</p>
            <div className="grid grid-cols-2 gap-3">
              {readOnlyField('Descripción', task.description ?? '')}
              {readOnlyField('Categoría', task.category)}
              {readOnlyField('Dificultad', task.difficulty ?? '')}
              {readOnlyField('Tiempo estimado', task.estimatedTime)}
              {readOnlyField('Urgencia', task.urgency)}
            </div>
          </div>

          {/* Editable: Status */}
          <div>
            <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Estado</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['Pendiente', 'En progreso', 'Completada'] as TaskStatus[]).map(s => {
                const sc = statusColors[s];
                const active = status === s;
                return (
                  <button key={s} onClick={() => setStatus(s)}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: '8px', border: `1px solid ${active ? sc.text + '60' : 'rgba(255,255,255,0.07)'}`,
                      backgroundColor: active ? sc.bg : 'transparent', color: active ? sc.text : '#4B5563',
                      fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >{s}</button>
                );
              })}
            </div>
          </div>

          {/* Editable: Due Date */}
          <div>
            <label style={{ color: '#6B7280', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Fecha límite</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              style={{ ...FIELD_STYLE, colorScheme: 'dark', borderColor: 'rgba(255,255,255,0.07)' }} />
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(255,255,255,0.04)', color: '#6B7280', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              Cancelar
            </button>
            <button onClick={() => { onSave(task.id, status, dueDate); onClose(); }}
              style={{ flex: 2, padding: '10px', background: `linear-gradient(135deg, ${ACCENT}, #7C6FE8)`, color: 'white', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}>
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Task Details Drawer ──────────────────────────────────────────────────────

function TaskDetailDrawer({ task, categories, members, onClose, onStatusChange, onAssignClick, onEditClick }: {
  task: Task;
  categories: CategoryOption[];
  members: TeamMemberOption[];
  onClose: () => void;
  onStatusChange: (id: number, s: TaskStatus) => void;
  onAssignClick: () => void;
  onEditClick: () => void;
}) {
  const cat = categories.find(c => c.name === task.category);
  const member = members.find(m => m.name === task.assignedTo);
  const uc = urgencyColors[task.urgency] ?? urgencyColors['Media'];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 40 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '380px',
        backgroundColor: DRAWER_BG, borderLeft: '1px solid rgba(255,255,255,0.07)',
        zIndex: 50, display: 'flex', flexDirection: 'column',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        animation: 'slideInRight 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}>
        <style>{`@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

        {/* Header */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: cat?.color ?? ACCENT, flexShrink: 0 }} />
              <span style={{ color: '#6B7280', fontSize: '11px', fontWeight: '500' }}>{task.category}</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', padding: '2px', flexShrink: 0, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <h2 style={{ color: 'white', fontSize: '16px', fontWeight: '700', lineHeight: '1.35', marginBottom: '12px' }}>{task.title}</h2>

          {/* Status selector */}
          <div className="flex gap-1.5">
            {(['Pendiente', 'En progreso', 'Completada'] as TaskStatus[]).map(s => {
              const sc = statusColors[s];
              const active = task.status === s;
              return (
                <button key={s} onClick={() => onStatusChange(task.id, s)}
                  style={{
                    flex: 1, padding: '6px 4px', borderRadius: '7px',
                    border: `1px solid ${active ? sc.text + '60' : 'rgba(255,255,255,0.07)'}`,
                    backgroundColor: active ? sc.bg : 'transparent',
                    color: active ? sc.text : '#4B5563',
                    fontSize: '10px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = sc.text + '40'; e.currentTarget.style.color = sc.text; } }}
                  onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#4B5563'; } }}
                >
                  {s === 'Pendiente' ? 'To Do' : s === 'En progreso' ? 'En curso' : 'Completada'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Description */}
          {task.description && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '7px' }}>Descripción</p>
              <p style={{ color: '#9CA3AF', fontSize: '13px', lineHeight: '1.65', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '9px', padding: '11px 13px', border: '1px solid rgba(255,255,255,0.05)' }}>{task.description}</p>
            </div>
          )}

          {/* 2×2 info cards */}
          <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>Detalles</p>
          <div className="grid grid-cols-2 gap-2" style={{ marginBottom: '16px' }}>
            {/* Dificultad */}
            <div style={{ backgroundColor: '#141C2B', borderRadius: '10px', padding: '11px 13px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Dificultad</p>
              <p style={{ color: '#D1D5DB', fontSize: '13px', fontWeight: '600' }}>{task.difficulty ?? '—'}</p>
            </div>
            {/* Urgencia */}
            <div style={{ backgroundColor: '#141C2B', borderRadius: '10px', padding: '11px 13px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Urgencia</p>
              <span style={{ backgroundColor: uc.bg, color: uc.text, fontSize: '11px', fontWeight: '700', padding: '2px 9px', borderRadius: '999px' }}>{task.urgency}</span>
            </div>
            {/* Tiempo estimado */}
            <div style={{ backgroundColor: '#141C2B', borderRadius: '10px', padding: '11px 13px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Tiempo estimado</p>
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                <p style={{ color: '#D1D5DB', fontSize: '13px', fontWeight: '600' }}>{task.estimatedTime}</p>
              </div>
            </div>
            {/* Asignado a */}
            <div style={{ backgroundColor: '#141C2B', borderRadius: '10px', padding: '11px 13px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Asignado a</p>
              {member ? (
                <div className="flex items-center gap-1.5">
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: `${member.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ color: member.color, fontSize: '8px', fontWeight: '800' }}>{member.initials}</span>
                  </div>
                  <p style={{ color: '#D1D5DB', fontSize: '12px', fontWeight: '600' }}>{member.name.split(' ')[0]}</p>
                </div>
              ) : (
                <p style={{ color: '#4B5563', fontSize: '12px', fontStyle: 'italic' }}>Sin asignar</p>
              )}
            </div>
          </div>

          {/* Due date */}
          {task.dueDate && (
            <div style={{ backgroundColor: '#141C2B', borderRadius: '10px', padding: '11px 13px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p style={{ color: '#4B5563', fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Fecha límite</p>
              <div className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                <p style={{ color: '#D1D5DB', fontSize: '13px', fontWeight: '600' }}>
                  {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px', flexShrink: 0, backgroundColor: DRAWER_BG }}>
          <button onClick={onEditClick} style={{
            flex: 1, padding: '9px 12px', backgroundColor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px',
            color: '#9CA3AF', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#9CA3AF'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Editar
          </button>
          <button
            onClick={onAssignClick}
            style={{
              flex: 2, padding: '9px 12px', background: `linear-gradient(135deg, ${ACCENT}, #7C6FE8)`,
              border: 'none', borderRadius: '8px', color: 'white', fontSize: '13px',
              fontWeight: '700', cursor: 'pointer', transition: 'opacity 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            Asignar
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TaskManagement() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [apiTasks, setApiTasks] = useState<TaskResource[]>([]);
  const [dashboardTasks, setDashboardTasks] = useState<any[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignmentCandidates, setAssignmentCandidates] = useState<CandidateProfileResource[]>([]);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', category: '', hours: '',
    priority: 'Media' as TaskUrgency, difficulty: 'Media', tools: '', knowledge: '', dueDate: ''
  });

  const categoryById = useMemo(() => new Map(categories.map(category => [category.id, category])), [categories]);
  const memberById = useMemo(() => new Map(teamMembers.map(member => [member.id, member])), [teamMembers]);

  const mapTask = (task: TaskResource): Task => {
    const dashboardTask = dashboardTasks.find(item => item.taskId === task.id);
    const assignment = (task as any).assignment ?? (task as any).assignedUser ?? null;
    const userId = assignment?.userId ?? (task as any).userId;
    const member = userId ? memberById.get(userId) : undefined;
    return {
      id: task.id,
      title: task.title,
      description: task.description ?? '',
      category: categoryById.get(task.categoryId)?.name ?? `Categoría ${task.categoryId}`,
      status: statusFromApi(task.status),
      assignedTo: dashboardTask?.userName ?? member?.name ?? '',
      estimatedTime: `${task.hours ?? 0}h`,
      urgency: priorityFromApi(task.priority),
      difficulty: difficultyFromApi(task.difficulty),
      tools: task.tools?.join(', ') ?? '',
      knowledge: task.knowledge?.join(', ') ?? '',
      dueDate: toDateInput(task.limitDate),
    };
  };

  const loadData = async () => {
    if (!user?.teamId) {
      setLoading(false);
      setError('No se encontró el equipo del usuario.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [categoryData, team, taskData, dashboardTaskData] = await Promise.all([
        getCategoriesByTeam(user.teamId),
        getTeamById(user.teamId),
        getTasksByTeam(user.teamId),
        getDashboardTasks(user.teamId),
      ]);
      const categoryOptions = categoryData.map((category: any, index: number) => ({
        id: category.id,
        name: category.name,
        color: COLORS[index % COLORS.length],
      }));
      const memberOptions = (team.members ?? []).map((member: any, index: number) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        position: member.position,
        role: member.role,
        color: COLORS[index % COLORS.length],
        initials: getInitials(member.name),
        hoursUsed: 0,
        hoursMax: 40,
      }));
      setCategories(categoryOptions);
      setTeamMembers(memberOptions);
      setApiTasks(taskData);
      setDashboardTasks(dashboardTaskData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tareas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.teamId]);

  useEffect(() => {
    setTasks(apiTasks.map(mapTask));
  }, [apiTasks, dashboardTasks, categoryById, memberById]);

  const filtered = tasks.filter(t => {
    const q = search.toLowerCase();
    return (
      (!search || t.title.toLowerCase().includes(q) || t.assignedTo.toLowerCase().includes(q)) &&
      (!filterCategory || t.category === filterCategory) &&
      (!filterStatus || t.status === filterStatus)
    );
  });

  const getMember = (name: string) => teamMembers.find(m => m.name === name);
  const selectedTask = selectedTaskId != null ? tasks.find(t => t.id === selectedTaskId) : null;

  const loadAssignmentCandidates = async (taskId: number) => {
    if (!user?.teamId) return;
    try {
      setAssignLoading(true);
      setAssignmentError(null);
      const candidates = await getAssignmentCandidates(taskId, user.teamId);
      setAssignmentCandidates(candidates);
      setTeamMembers(prev => prev.map(member => {
        const candidate = candidates.find(c => c.userId === member.id);
        return candidate ? { ...member, hoursUsed: candidate.activeHours, hoursMax: candidate.maxHours } : member;
      }));
    } catch (err) {
      setAssignmentCandidates([]);
      setAssignmentError(err instanceof Error ? err.message : 'Error al cargar candidatos');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: TaskStatus) => {
    const current = tasks.find(task => task.id === id);
    if (!current) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    try {
      const updated = await updateTask(id, { status: statusToApi(status), limitDate: toIsoDateTime(current.dueDate || new Date().toISOString().split('T')[0]) });
      setApiTasks(prev => prev.map(task => task.id === id ? updated : task));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado');
      await loadData();
    }
  };

  const handleAddTask = async () => {
    if (!form.title || !form.category || !form.dueDate) return;
    const category = categories.find(c => c.name === form.category);
    if (!category) return;
    try {
      setSaving(true);
      const newTask = await createTask({
        categoryId: category.id,
        title: form.title.trim(),
        description: form.description.trim(),
        hours: Number(form.hours) || 1,
        priority: priorityToApi(form.priority),
        difficulty: difficultyToApi(form.difficulty),
        limitDate: toIsoDateTime(form.dueDate),
        tools: splitList(form.tools),
        knowledge: splitList(form.knowledge),
      });
      setApiTasks(prev => [newTask, ...prev]);
      setForm({ title: '', description: '', category: '', hours: '', priority: 'Media', difficulty: 'Media', tools: '', knowledge: '', dueDate: '' });
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear tarea');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAI = async () => {
    const unassigned = tasks.filter(t => !t.assignedTo);
    if (unassigned.length === 0 || aiLoading) return;
    try {
      setAiLoading(true);
      setError(null);
      for (const task of unassigned) {
        if (!user?.teamId) break;
        const candidates = await getAssignmentCandidates(task.id, user.teamId);
        const candidate = candidates[0];
        if (candidate) await confirmAssignmentRecommendation(task.id, candidate.userId);
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar tareas con IA');
    } finally {
      setAiLoading(false);
    }
  };

  const handleEditSave = async (id: number, status: TaskStatus, dueDate: string) => {
    try {
      setSaving(true);
      const updated = await updateTask(id, { status: statusToApi(status), limitDate: toIsoDateTime(dueDate) });
      setApiTasks(prev => prev.map(task => task.id === id ? updated : task));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar tarea');
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (memberId: number) => {
    if (selectedTaskId === null) return;
    try {
      setAssignLoading(true);
      await confirmAssignmentRecommendation(selectedTaskId, memberId);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al asignar tarea');
    } finally {
      setAssignLoading(false);
    }
  };

  const fieldStyle = (name: string): React.CSSProperties => ({
    ...FIELD_STYLE,
    borderColor: focusedField === name ? ACCENT : 'rgba(255,255,255,0.07)'
  });

  if (loading) return <div className="p-6" style={{ color: '#6B7280' }}>Cargando tareas...</div>;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700' }}>Gestión de Tareas</h1>
          <span style={{ backgroundColor: 'rgba(91,141,239,0.1)', color: ACCENT, fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px', border: '1px solid rgba(91,141,239,0.2)' }}>
            {tasks.filter(t => t.status !== 'Completada').length} activas
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleBulkAI} disabled={aiLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
              backgroundColor: aiLoading ? 'rgba(124,111,232,0.05)' : 'rgba(124,111,232,0.1)',
              border: '1px solid rgba(124,111,232,0.25)', borderRadius: '9px',
              color: aiLoading ? '#4B5563' : PURPLE, fontSize: '13px', fontWeight: '600',
              cursor: aiLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s'
            }}
          >
            {aiLoading ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                Asignando...</>
            ) : <><span>⚡</span> Asignar con IA</>}
          </button>
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: `linear-gradient(135deg, ${ACCENT}, #7C6FE8)`, border: 'none', borderRadius: '9px', color: 'white', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: `0 4px 14px ${ACCENT}30` }}>
            + Agregar Tarea
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '9px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#FCA5A5', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2.5 mb-5">
        <div style={{ flex: 1, position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Buscar tareas o miembros..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ ...FIELD_STYLE, paddingLeft: '32px', borderColor: 'rgba(255,255,255,0.07)' }} />
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

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['Tarea', 'Categoría', 'Estado', 'Asignado a', 'Tiempo', 'Urgencia'].map(col => (
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
                  style={{
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    cursor: 'pointer', transition: 'background 0.12s',
                    backgroundColor: isSelected ? 'rgba(91,141,239,0.06)' : 'transparent',
                    borderLeft: `3px solid ${isSelected ? ACCENT : 'transparent'}`,
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.018)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <td style={{ padding: '12px 16px', maxWidth: '220px' }}>
                    <p style={{ color: 'white', fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>{task.title}</p>
                    {task.description && <p style={{ color: '#4B5563', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{task.description}</p>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: '#6B7280', fontSize: '12px' }}>{task.category}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ backgroundColor: sc.bg, color: sc.text, padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: '600' }}>{task.status}</span>
                  </td>
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
                        onClick={e => { e.stopPropagation(); setSelectedTaskId(task.id); setShowAssign(true); loadAssignmentCandidates(task.id); }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '4px 10px', borderRadius: '6px',
                          border: '1px dashed rgba(91,141,239,0.3)',
                          backgroundColor: 'rgba(91,141,239,0.04)',
                          color: '#5B8DEF', fontSize: '11px', fontWeight: '600',
                          cursor: 'pointer', transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(91,141,239,0.6)'; e.currentTarget.style.backgroundColor = 'rgba(91,141,239,0.09)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(91,141,239,0.3)'; e.currentTarget.style.backgroundColor = 'rgba(91,141,239,0.04)'; }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                        </svg>
                        Asignar
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: '#6B7280', fontSize: '12px' }}>{task.estimatedTime}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ backgroundColor: uc.bg, color: uc.text, padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: '600' }}>{task.urgency}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#374151' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px', display: 'block' }}><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <p style={{ fontSize: '14px' }}>No se encontraron tareas con los filtros actuales.</p>
          </div>
        )}
      </div>

      {/* Drawer */}
      {selectedTask && (
        <TaskDetailDrawer
          task={selectedTask}
          categories={categories}
          members={teamMembers}
          onClose={() => setSelectedTaskId(null)}
          onStatusChange={handleStatusChange}
          onAssignClick={() => { setShowAssign(true); loadAssignmentCandidates(selectedTask.id); }}
          onEditClick={() => setShowEdit(true)}
        />
      )}

      {/* Assign Modal */}
      {showAssign && selectedTask && (
        <AssignMemberModal
          task={selectedTask}
          members={teamMembers}
          candidates={assignmentCandidates}
          loading={assignLoading}
          error={assignmentError}
          onClose={() => setShowAssign(false)}
          onAssign={handleAssign}
        />
      )}

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div style={{ backgroundColor: '#0D1520', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.07)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', margin: '16px', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>Nueva Tarea</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#9CA3AF')}
                onMouseLeave={e => (e.currentTarget.style.color = '#4B5563')}
              >
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
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    style={{ ...FIELD_STYLE, cursor: 'pointer', borderColor: 'rgba(255,255,255,0.07)' }}>
                    <option value="">Seleccionar...</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
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
                <button onClick={handleAddTask} disabled={!form.title || !form.category || !form.dueDate || saving}
                  style={{
                    flex: 2, padding: '10px',
                    background: (!form.title || !form.category || !form.dueDate) ? undefined : `linear-gradient(135deg, ${ACCENT}, #7C6FE8)`,
                    backgroundColor: (!form.title || !form.category || !form.dueDate) ? '#1A2235' : undefined,
                    color: (!form.title || !form.category || !form.dueDate) ? '#4B5563' : 'white',
                    border: 'none', borderRadius: '9px',
                    cursor: (!form.title || !form.category || !form.dueDate) ? 'not-allowed' : 'pointer',
                    fontSize: '13px', fontWeight: '700', transition: 'opacity 0.2s'
                  }}>
                  {saving ? 'Creando...' : 'Crear Tarea'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEdit && selectedTask && (
        <EditTaskModal task={selectedTask} onClose={() => setShowEdit(false)} onSave={handleEditSave} />
      )}

      {showAI && selectedTask && (
        <AIAssignmentModal
          taskTitle={selectedTask.title}
          candidates={assignmentCandidates}
          members={teamMembers}
          loading={assignLoading}
          error={assignmentError}
          onClose={() => setShowAI(false)}
          onConfirm={handleAssign}
        />
      )}
    </div>
  );
}
