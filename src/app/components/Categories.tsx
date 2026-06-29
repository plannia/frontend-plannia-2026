import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCategoriesByTeam, createCategory, updateCategory, addMemberToCategory, removeMemberFromCategory } from '../services/categoryService';
import { getTeamById } from '../services/teamService';
import { getTasksByTeam, TaskResource } from '../services/taskService';

const ACCENT = '#5B8DEF';
const CARD_BG = '#141C2B';
const INPUT_BG = '#1A2235';
const PALETTE = ['#5B8DEF', '#7C6FE8', '#10B981', '#F59E0B', '#EC4899', '#EF4444', '#14B8A6', '#F97316'];

type CategoryStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE';

interface UICategory {
  id: number;
  name: string;
  color: string;
  taskCount: number;
  progress: number;
  status: CategoryStatus;
  dueDate: string; // ISO completo del backend
  memberIds: number[];
}

interface UIMember {
  id: number;
  name: string;
  email: string;
  position: string;
  color: string;
  initials: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  'TO_DO': { bg: 'rgba(91,141,239,0.15)', text: '#5B8DEF' },
  'IN_PROGRESS': { bg: 'rgba(124,111,232,0.15)', text: '#7C6FE8' },
  'DONE': { bg: 'rgba(16,185,129,0.15)', text: '#10B981' },
};

const taskStatusLabel: Record<string, string> = {
  'TO_DO': 'Pendiente', 'IN_PROGRESS': 'En progreso', 'DONE': 'Completada', 'CANCELLED': 'Cancelada',
};

const catStatusLabels: Record<CategoryStatus, { label: string; bg: string; text: string }> = {
  'TO_DO': { label: 'To Do', bg: 'rgba(91,141,239,0.12)', text: '#5B8DEF' },
  'IN_PROGRESS': { label: 'In Progress', bg: 'rgba(124,111,232,0.12)', text: '#7C6FE8' },
  'DONE': { label: 'Done', bg: 'rgba(16,185,129,0.12)', text: '#10B981' },
};

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

function getCategoryLabel(cat: UICategory): { label: string; color: string } {
  const now = new Date();
  const due = new Date(cat.dueDate);
  if (cat.status === 'DONE') return { label: 'Completada', color: '#10B981' };
  if (due < now) return { label: 'Vencida', color: '#EF4444' };
  return { label: 'Activa', color: '#F59E0B' };
}

const isExpired = (dueDateISO: string) => new Date(dueDateISO) < new Date();
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
const toDateInputValue = (iso: string) => iso ? iso.slice(0, 10) : '';
const toLimitDateISO = (dateInput: string) => `${dateInput}T23:59:59`;

const FIELD_STYLE: React.CSSProperties = {
  width: '100%', backgroundColor: '#0D1520', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px', padding: '9px 12px', color: 'white', outline: 'none',
  fontSize: '13px', boxSizing: 'border-box'
};

function MemberMultiSelect({ members, selected, onChange }: { members: UIMember[]; selected: number[]; onChange: (ids: number[]) => void }) {
  const toggle = (id: number) => onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {selected.map(id => {
          const m = members.find(x => x.id === id);
          if (!m) return null;
          return (
            <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: `${m.color}15`, border: `1px solid ${m.color}40`, color: m.color, fontSize: '11px', padding: '3px 8px', borderRadius: '999px' }}>
              {m.initials} · {m.name.split(' ')[0]}
              <button onClick={() => toggle(id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: m.color, lineHeight: 1, fontSize: '13px', padding: 0 }}>×</button>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {members.map(m => {
          const active = selected.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px',
                borderRadius: '7px', border: `1px solid ${active ? `${m.color}50` : 'rgba(255,255,255,0.06)'}`,
                backgroundColor: active ? `${m.color}12` : 'transparent',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s'
              }}
            >
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: `${m.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: m.color, fontSize: '9px', fontWeight: '700' }}>{m.initials}</span>
              </div>
              <span style={{ color: active ? m.color : '#9CA3AF', fontSize: '11px', fontWeight: active ? '600' : '400' }}>{m.name.split(' ')[0]}</span>
              {active && <svg style={{ marginLeft: 'auto' }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CategoryModal({ mode, initial, members, onClose, onSubmit }: {
  mode: 'create' | 'edit';
  initial?: Partial<UICategory>;
  members: UIMember[];
  onClose: () => void;
  onSubmit: (data: { name: string; dueDate: string; memberIds: number[]; color: string }) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [dueDate, setDueDate] = useState(initial?.dueDate ? toDateInputValue(initial.dueDate) : '');
  const [memberIds, setMemberIds] = useState<number[]>(initial?.memberIds ?? []);
  const [color, setColor] = useState(initial?.color ?? '#5B8DEF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges = mode === 'create'
    ? name.trim().length > 0
    : (name !== initial?.name || dueDate !== toDateInputValue(initial?.dueDate ?? '') || JSON.stringify(memberIds) !== JSON.stringify(initial?.memberIds));

  const handleClose = () => {
    if (hasChanges) {
      if (!confirm('¿Descartar los cambios sin guardar?')) return;
    }
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim() || !dueDate) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit({ name: name.trim(), dueDate: toLimitDateISO(dueDate), memberIds, color });
      onClose();
    } catch {
      setError('No se pudo guardar la categoría.');
    } finally {
      setLoading(false);
    }
  };

  const canSave = mode === 'create' ? (name.trim() && dueDate) : hasChanges && name.trim() && dueDate;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div style={{ backgroundColor: '#0D1520', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: '460px', margin: '16px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>
            {mode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
          </h3>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div style={{ padding: '18px 22px' }} className="space-y-4">
          <div>
            <label style={{ color: '#9CA3AF', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Nombre de la categoría *</label>
            <input type="text" placeholder="Ej: Diseño UI" value={name} onChange={e => setName(e.target.value)} style={FIELD_STYLE} />
          </div>
          <div>
            <label style={{ color: '#9CA3AF', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Fecha límite *</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...FIELD_STYLE, colorScheme: 'dark' }} />
          </div>
          {mode === 'create' && (
            <div>
              <label style={{ color: '#9CA3AF', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Color (solo visual)</label>
              <div className="flex items-center gap-3">
                {PALETTE.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c, border: color === c ? '2.5px solid white' : '2px solid transparent', cursor: 'pointer', transition: 'border 0.15s' }} />
                ))}
                <input type="color" value={color} onChange={e => setColor(e.target.value)} title="Color personalizado"
                  style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', backgroundColor: 'transparent', padding: 0 }} />
              </div>
            </div>
          )}
          <div>
            <label style={{ color: '#9CA3AF', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
              Miembros <span style={{ color: '#4B5563' }}>(opcional)</span>
            </label>
            <MemberMultiSelect members={members} selected={memberIds} onChange={setMemberIds} />
          </div>
          {error && <p style={{ color: '#F59E0B', fontSize: '12px', textAlign: 'center' }}>{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={handleClose} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSave || loading}
              style={{
                flex: 2, padding: '10px', backgroundColor: canSave && !loading ? ACCENT : '#1A2235',
                color: canSave && !loading ? 'white' : '#4B5563',
                border: 'none', borderRadius: '9px', cursor: canSave && !loading ? 'pointer' : 'not-allowed',
                fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              {loading ? (
                <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
                  <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
                  Guardando...</>
              ) : mode === 'create' ? 'Crear Categoría' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Categories() {
  const { user } = useAuth();
  const [members, setMembers] = useState<UIMember[]>([]);
  const [cats, setCats] = useState<UICategory[]>([]);
  const [allTasks, setAllTasks] = useState<TaskResource[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = () => {
    if (!user?.teamId) return;
    setLoading(true);
    Promise.all([
      getTeamById(user.teamId),
      getCategoriesByTeam(user.teamId),
      getTasksByTeam(user.teamId),
    ])
      .then(([team, categoriesData, tasksData]) => {
        const uiMembers: UIMember[] = team.members.map((m: any, idx: number) => ({
          id: m.id, name: m.name, email: m.email, position: m.position,
          color: PALETTE[idx % PALETTE.length], initials: getInitials(m.name),
        }));
        setMembers(uiMembers);

        const uiCats: UICategory[] = categoriesData.map((c: any, idx: number) => {
          const catTasks = tasksData.filter((t: TaskResource) => t.categoryId === c.id);
          const done = catTasks.filter(t => t.status === 'DONE').length;
          return {
            id: c.id, name: c.name, color: PALETTE[idx % PALETTE.length],
            taskCount: catTasks.length,
            progress: catTasks.length > 0 ? Math.round((done / catTasks.length) * 100) : 0,
            status: c.status, dueDate: c.limitDate, memberIds: c.memberIds ?? [],
          };
        });
        setCats(uiCats);
        setAllTasks(tasksData);
        setSelectedId(prev => prev ?? (uiCats[0]?.id ?? null));
        setError(null);
      })
      .catch(() => setError('No se pudieron cargar las categorías.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAll(); }, [user]);

  const currentSelected = cats.find(c => c.id === selectedId) ?? cats[0];
  const categoryTasks = currentSelected ? allTasks.filter(t => t.categoryId === currentSelected.id) : [];

  const handleCreate = async (data: { name: string; dueDate: string; memberIds: number[]; color: string }) => {
    if (!user?.teamId) return;
    const created = await createCategory(user.teamId, data.name, data.dueDate);
    for (const userId of data.memberIds) {
      await addMemberToCategory(created.id, userId);
    }
    setSelectedId(created.id);
    loadAll();
  };

  const handleEdit = async (data: { name: string; dueDate: string; memberIds: number[]; color: string }) => {
    if (!currentSelected) return;
    await updateCategory(currentSelected.id, data.name, currentSelected.status, data.dueDate);

    const toAdd = data.memberIds.filter(id => !currentSelected.memberIds.includes(id));
    const toRemove = currentSelected.memberIds.filter(id => !data.memberIds.includes(id));
    for (const id of toAdd) await addMemberToCategory(currentSelected.id, id);
    for (const id of toRemove) await removeMemberFromCategory(currentSelected.id, id);

    loadAll();
  };

  if (loading) return <div className="p-6" style={{ color: '#6B7280', fontSize: '13px' }}>Cargando categorías...</div>;
  if (error) return <div className="p-6" style={{ color: '#F59E0B', fontSize: '13px' }}>{error}</div>;
  if (!currentSelected) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ color: 'white', fontSize: '17px', fontWeight: '700' }}>Categorías</h2>
          <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 11px', backgroundColor: ACCENT, border: 'none', borderRadius: '7px', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>+ Nueva</button>
        </div>
        <p style={{ color: '#4B5563', fontSize: '13px' }}>Aún no hay categorías. Crea la primera.</p>
        {showCreate && <CategoryModal mode="create" members={members} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />}
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>
      <div style={{ width: '300px', minWidth: '300px', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: '20px 14px' }}>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 style={{ color: 'white', fontSize: '17px', fontWeight: '700' }}>Categorías</h2>
          <button
            onClick={() => setShowCreate(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 11px', backgroundColor: ACCENT, border: 'none', borderRadius: '7px', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            + Nueva
          </button>
        </div>

        <div className="space-y-2">
          {cats.map(cat => {
            const isActive = currentSelected.id === cat.id;
            const expired = isExpired(cat.dueDate) && cat.status !== 'DONE';
            return (
              <div
                key={cat.id}
                onClick={() => setSelectedId(cat.id)}
                style={{
                  backgroundColor: isActive ? `${cat.color}12` : CARD_BG,
                  border: `1px solid ${isActive ? `${cat.color}40` : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '11px', padding: '12px 13px', cursor: 'pointer', transition: 'all 0.15s'
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: cat.color, flexShrink: 0 }} />
                    <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{cat.name}</span>
                  </div>
                  {expired && <span style={{ color: '#EF4444', fontSize: '9px', fontWeight: '700', backgroundColor: 'rgba(239,68,68,0.1)', padding: '1px 6px', borderRadius: '4px' }}>VENCIDA</span>}
                </div>
                <div className="flex justify-between mb-1.5">
                  <span style={{ color: '#6B7280', fontSize: '11px' }}>{cat.taskCount} tareas</span>
                  <span style={{ color: '#6B7280', fontSize: '11px' }}>{cat.progress}%</span>
                </div>
                <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${cat.progress}%`, backgroundColor: cat.color, borderRadius: '999px' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div style={{ width: '13px', height: '13px', borderRadius: '50%', backgroundColor: currentSelected.color }} />
            <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>{currentSelected.name}</h2>
            {(() => { const s = catStatusLabels[currentSelected.status]; return <span style={{ backgroundColor: s.bg, color: s.text, fontSize: '11px', fontWeight: '700', padding: '2px 9px', borderRadius: '999px' }}>{s.label}</span>; })()}
            {(() => {
              const fl = getCategoryLabel(currentSelected);
              return <span style={{ color: fl.color, fontSize: '11px', fontWeight: '600' }}>{fl.label}</span>;
            })()}
          </div>
          <button
            onClick={() => setShowEdit(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#9CA3AF', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Editar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="rounded-xl p-4" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Fecha límite</p>
            <p style={{ color: isExpired(currentSelected.dueDate) && currentSelected.status !== 'DONE' ? '#EF4444' : '#D1D5DB', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isExpired(currentSelected.dueDate) && currentSelected.status !== 'DONE' && <span>⚠</span>}
              {formatDate(currentSelected.dueDate)}
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Progreso</p>
            <div className="flex items-center gap-2">
              <div style={{ flex: 1, height: '6px', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${currentSelected.progress}%`, backgroundColor: currentSelected.color, borderRadius: '999px' }} />
              </div>
              <span style={{ color: currentSelected.color, fontSize: '14px', fontWeight: '700' }}>{currentSelected.progress}%</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Miembros</p>
          {currentSelected.memberIds.length === 0 ? (
            <p style={{ color: '#4B5563', fontSize: '13px', fontStyle: 'italic' }}>No assigned members</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentSelected.memberIds.map(id => {
                const m = members.find(x => x.id === id);
                if (!m) return null;
                return (
                  <div key={id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: INPUT_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: `${m.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: m.color, fontSize: '9px', fontWeight: '700' }}>{m.initials}</span>
                    </div>
                    <span style={{ color: '#D1D5DB', fontSize: '12px' }}>{m.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <h3 style={{ color: '#6B7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
          Tareas relacionadas
        </h3>
        {categoryTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#4B5563', fontSize: '14px' }}>No hay tareas en esta categoría todavía.</div>
        ) : (
          <div className="space-y-2">
            {categoryTasks.map(task => {
              const sc = statusColors[task.status] ?? statusColors['TO_DO'];
              return (
                <div key={task.id} className="rounded-xl p-4" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '3px' }}>{task.title}</p>
                      {task.description && <p style={{ color: '#4B5563', fontSize: '11px', marginBottom: '7px' }}>{task.description}</p>}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ backgroundColor: sc.bg, color: sc.text, padding: '2px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: '600' }}>{taskStatusLabel[task.status] ?? task.status}</span>
                        <span style={{ color: '#4B5563', fontSize: '11px' }}>{task.hours}h</span>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <span style={{ color: task.priority === 'HIGH' ? '#EF4444' : task.priority === 'MEDIUM' ? '#F97316' : '#9CA3AF', fontSize: '11px', fontWeight: '600' }}>{task.priority}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && (
        <CategoryModal mode="create" members={members} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      )}
      {showEdit && currentSelected && (
        <CategoryModal mode="edit" initial={currentSelected} members={members} onClose={() => setShowEdit(false)} onSubmit={handleEdit} />
      )}
    </div>
  );
}