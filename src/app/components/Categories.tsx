import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCategoriesByTeam, createCategory, updateCategory, addMemberToCategory, removeMemberFromCategory } from '../services/categoryService';
import { getTeamById } from '../services/teamService';

const ACCENT = '#5B8DEF';
const CARD_BG = '#141C2B';

type CategoryStatus = 'TO_DO' | 'IN_PROGRESS' | 'DONE';

interface Category {
  id: number;
  teamId: number;
  name: string;
  limitDate: string;
  status: CategoryStatus;
  memberIds: number[];
}

const catStatusLabels: Record<CategoryStatus, { label: string; bg: string; text: string }> = {
  'TO_DO':       { label: 'To Do',       bg: 'rgba(91,141,239,0.12)',  text: '#5B8DEF' },
  'IN_PROGRESS': { label: 'In Progress', bg: 'rgba(124,111,232,0.12)', text: '#7C6FE8' },
  'DONE':        { label: 'Done',        bg: 'rgba(16,185,129,0.12)',  text: '#10B981' },
};

const COLORS = ['#5B8DEF', '#7C6FE8', '#10B981', '#F59E0B', '#EC4899', '#EF4444'];
const getColor = (index: number) => COLORS[index % COLORS.length];

const FIELD_STYLE: React.CSSProperties = {
  width: '100%', backgroundColor: '#0D1520', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px', padding: '9px 12px', color: 'white', outline: 'none',
  fontSize: '13px', boxSizing: 'border-box'
};

function CategoryModal({ mode, initial, onClose, onSubmit, loading }: {
  mode: 'create' | 'edit';
  initial?: Partial<Category>;
  onClose: () => void;
  onSubmit: (data: { name: string; limitDate: string; status: string }) => void;
  loading: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [limitDate, setLimitDate] = useState(initial?.limitDate?.split('T')[0] ?? '');
  const [status, setStatus] = useState<string>(initial?.status ?? 'TO_DO');

  const canSave = name.trim() && limitDate;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div style={{ backgroundColor: '#0D1520', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: '460px', margin: '16px' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>
            {mode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>✕</button>
        </div>
        <div style={{ padding: '18px 22px' }} className="space-y-4">
          <div>
            <label style={{ color: '#9CA3AF', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Nombre *</label>
            <input type="text" placeholder="Ej: Diseño UI" value={name} onChange={e => setName(e.target.value)} style={FIELD_STYLE} />
          </div>
          <div>
            <label style={{ color: '#9CA3AF', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Fecha límite *</label>
            <input type="date" value={limitDate} onChange={e => setLimitDate(e.target.value)} style={{ ...FIELD_STYLE, colorScheme: 'dark' }} />
          </div>
          {mode === 'edit' && (
            <div>
              <label style={{ color: '#9CA3AF', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Estado</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...FIELD_STYLE, cursor: 'pointer' }}>
                <option value="TO_DO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              Cancelar
            </button>
            <button
              onClick={() => onSubmit({ name: name.trim(), limitDate: new Date(limitDate).toISOString(), status })}
              disabled={!canSave || loading}
              style={{
                flex: 2, padding: '10px', backgroundColor: canSave && !loading ? ACCENT : '#1A2235',
                color: canSave && !loading ? 'white' : '#4B5563',
                border: 'none', borderRadius: '9px', cursor: canSave && !loading ? 'pointer' : 'not-allowed',
                fontSize: '13px', fontWeight: '600', transition: 'all 0.2s'
              }}
            >
              {loading ? 'Guardando...' : mode === 'create' ? 'Crear Categoría' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Categories() {
  const { user } = useAuth();
  const [cats, setCats] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.teamId) return;
    const load = async () => {
      try {
        const [data, team] = await Promise.all([
          getCategoriesByTeam(user.teamId!),
          getTeamById(user.teamId!),
        ]);
        setCats(data);
        if (data.length > 0) setSelected(data[0]);
        setTeamMembers(team.members ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleCreate = async ({ name, limitDate }: { name: string; limitDate: string; status: string }) => {
    if (!user?.teamId) return;
    try {
      setSaving(true);
      const newCat = await createCategory(user.teamId, name, limitDate);
      setCats(prev => [...prev, newCat]);
      setSelected(newCat);
      setShowCreate(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async ({ name, limitDate, status }: { name: string; limitDate: string; status: string }) => {
    if (!selected) return;
    try {
      setSaving(true);
      const updated = await updateCategory(selected.id, name, status, limitDate);
      setCats(prev => prev.map(c => c.id === updated.id ? updated : c));
      setSelected(updated);
      setShowEdit(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // --- NUEVAS FUNCIONES PARA MIEMBROS ---
  const handleAddMember = async (memberId: number) => {
    if (!selected) return;
    try {
      await addMemberToCategory(selected.id, memberId);
      const newMemberIds = [...(selected.memberIds || []), memberId];
      const updatedCat = { ...selected, memberIds: newMemberIds };
      setSelected(updatedCat);
      setCats(prev => prev.map(c => c.id === selected.id ? updatedCat : c));
    } catch (err) {
      console.error("Error al agregar miembro", err);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!selected) return;
    try {
      await removeMemberFromCategory(selected.id, memberId);
      const newMemberIds = (selected.memberIds || []).filter(id => id !== memberId);
      const updatedCat = { ...selected, memberIds: newMemberIds };
      setSelected(updatedCat);
      setCats(prev => prev.map(c => c.id === selected.id ? updatedCat : c));
    } catch (err) {
      console.error("Error al remover miembro", err);
    }
  };

  const isExpired = (date: string) => new Date(date) < new Date();
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Calcular miembros que aún no están asignados para el dropdown
  const unassignedMembers = teamMembers.filter(m => !(selected?.memberIds ?? []).includes(m.id));

  if (loading) return <div className="p-6" style={{ color: '#6B7280' }}>Cargando categorías...</div>;

  return (
    <div className="flex h-full" style={{ minHeight: 0 }}>
      {/* Left Panel */}
      <div style={{ width: '300px', minWidth: '300px', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', padding: '20px 14px' }}>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 style={{ color: 'white', fontSize: '17px', fontWeight: '700' }}>Categorías</h2>
          <button onClick={() => setShowCreate(true)} style={{ padding: '5px 11px', backgroundColor: ACCENT, border: 'none', borderRadius: '7px', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
            + Nueva
          </button>
        </div>

        {cats.length === 0 ? (
          <p style={{ color: '#4B5563', fontSize: '13px', textAlign: 'center', marginTop: '20px' }}>No hay categorías aún.</p>
        ) : (
          <div className="space-y-2">
            {cats.map((cat, i) => {
              const color = getColor(i);
              const isActive = selected?.id === cat.id;
              const expired = isExpired(cat.limitDate) && cat.status !== 'DONE';
              return (
                <div key={cat.id} onClick={() => setSelected(cat)}
                  style={{
                    backgroundColor: isActive ? `${color}12` : CARD_BG,
                    border: `1px solid ${isActive ? `${color}40` : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: '11px', padding: '12px 13px', cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                      <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{cat.name}</span>
                    </div>
                    {expired && <span style={{ color: '#EF4444', fontSize: '9px', fontWeight: '700', backgroundColor: 'rgba(239,68,68,0.1)', padding: '1px 6px', borderRadius: '4px' }}>VENCIDA</span>}
                  </div>
                  <span style={{ color: '#6B7280', fontSize: '11px' }}>{(cat.memberIds ?? []).length} miembros</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Panel */}
      {selected ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div style={{ width: '13px', height: '13px', borderRadius: '50%', backgroundColor: getColor(cats.findIndex(c => c.id === selected?.id)) }} />
              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>{selected.name}</h2>
              {(() => { const s = catStatusLabels[selected.status]; return <span style={{ backgroundColor: s.bg, color: s.text, fontSize: '11px', fontWeight: '700', padding: '2px 9px', borderRadius: '999px' }}>{s.label}</span>; })()}
            </div>
            <button onClick={() => setShowEdit(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 13px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#9CA3AF', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
              ✏️ Editar
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="rounded-xl p-4" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px' }}>Fecha límite</p>
              <p style={{ color: isExpired(selected.limitDate) && selected.status !== 'DONE' ? '#EF4444' : '#D1D5DB', fontSize: '14px', fontWeight: '600' }}>
                {isExpired(selected.limitDate) && selected.status !== 'DONE' && '⚠ '}{formatDate(selected.limitDate)}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px' }}>Miembros asignados</p>
              <p style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>{(selected.memberIds ?? []).length}</p>
            </div>
          </div>

          {/* --- AQUÍ SE INTEGRÓ TU CÓDIGO CON LÓGICA DE AGREGAR/QUITAR --- */}
          <div className="rounded-xl p-4" style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ color: '#6B7280', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '10px' }}>Miembros</p>
            
            {(selected.memberIds ?? []).length === 0 ? (
              <p style={{ color: '#4B5563', fontSize: '13px', fontStyle: 'italic', marginBottom: '15px' }}>No hay miembros asignados.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-4">
                {(selected.memberIds ?? []).map((id, i) => {
                  const member = teamMembers.find(m => m.id === id);
                  const color = COLORS[i % COLORS.length];
                  return (
                    <div key={id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ backgroundColor: '#1A2235', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: `${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ color, fontSize: '9px', fontWeight: '700' }}>
                          {member ? member.name.split(' ').map((n: string) => n[0]).join('') : id}
                        </span>
                      </div>
                      <span style={{ color: '#D1D5DB', fontSize: '12px' }}>{member ? member.name : `Usuario ${id}`}</span>
                      
                      {/* Botón para remover miembro */}
                      <button 
                        onClick={() => handleRemoveMember(id)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '12px', marginLeft: '4px' }}
                        title="Remover miembro"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dropdown para agregar nuevos miembros */}
            {unassignedMembers.length > 0 && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <select 
                  onChange={(e) => {
                    if (e.target.value) handleAddMember(Number(e.target.value));
                    e.target.value = ""; // Resetear select después de agregar
                  }} 
                  style={{ ...FIELD_STYLE, width: 'auto', minWidth: '200px', cursor: 'pointer' }}
                  defaultValue=""
                >
                  <option value="" disabled>+ Asignar nuevo miembro...</option>
                  {unassignedMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {/* --- FIN DEL BLOQUE DE MIEMBROS --- */}

        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center" style={{ color: '#4B5563' }}>
          Selecciona una categoría
        </div>
      )}

      {showCreate && <CategoryModal mode="create" onClose={() => setShowCreate(false)} onSubmit={handleCreate} loading={saving} />}
      {showEdit && selected && <CategoryModal mode="edit" initial={selected} onClose={() => setShowEdit(false)} onSubmit={handleEdit} loading={saving} />}
    </div>
  );
}