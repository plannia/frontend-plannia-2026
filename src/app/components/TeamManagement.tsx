import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTeamById } from '../services/teamService';
import { getTeamProfiles } from '../services/profileService';
import { deleteUser, updateUser } from '../services/userService';

const ACCENT = '#5B8DEF';
const CARD_BG = '#141C2B';
const INPUT_BG = '#1A2235';

const COLORS = ['#5B8DEF', '#7C6FE8', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#F97316', '#8B5CF6'];

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

const FIELD_STYLE: CSSProperties = {
  width: '100%', backgroundColor: INPUT_BG, border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px', padding: '9px 12px', color: 'white', outline: 'none',
  fontSize: '13px', boxSizing: 'border-box',
};

interface DisplayMember {
  id: number;
  name: string;
  email: string;
  role: string;
  systemRole: 'LEADER' | 'MEMBER';
  position: string;
  initials: string;
  color: string;
  hoursUsed: number;
  hoursMax: number;
  skills: string[];
}

function EditMemberModal({
  member,
  onClose,
  onSave,
}: {
  member: DisplayMember;
  onClose: () => void;
  onSave: (data: { name: string; email: string; position: string; password: string }) => Promise<void>;
}) {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [position, setPosition] = useState(member.position);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !position.trim()) {
      setError('Nombre, correo y cargo son obligatorios.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        position: position.trim(),
        password: password.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div style={{ backgroundColor: '#0D1520', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', width: '100%', maxWidth: '440px', margin: '16px' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>Editar miembro</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}>×</button>
        </div>
        <div style={{ padding: '18px 22px' }} className="space-y-3">
          <div>
            <label style={{ color: '#9CA3AF', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Nombre *</label>
            <input value={name} onChange={e => setName(e.target.value)} style={FIELD_STYLE} />
          </div>
          <div>
            <label style={{ color: '#9CA3AF', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Correo *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={FIELD_STYLE} />
          </div>
          <div>
            <label style={{ color: '#9CA3AF', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Cargo *</label>
            <input value={position} onChange={e => setPosition(e.target.value)} style={FIELD_STYLE} />
          </div>
          <div>
            <label style={{ color: '#9CA3AF', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Nueva contraseña (opcional)</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Dejar vacío para no cambiar" style={FIELD_STYLE} />
          </div>
          {error && <p style={{ color: '#F87171', fontSize: '12px' }}>{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ flex: 2, padding: '10px', backgroundColor: loading ? '#1A2235' : ACCENT, color: loading ? '#4B5563' : 'white', border: 'none', borderRadius: '9px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '600' }}
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TeamManagement() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [teamCode, setTeamCode] = useState('');
  const [members, setMembers] = useState<DisplayMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<DisplayMember | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadMembers = useCallback(() => {
    if (!user?.teamId) return;
    setLoading(true);
    Promise.all([getTeamById(user.teamId), getTeamProfiles(user.teamId)])
      .then(([team, profiles]) => {
        setTeamCode(team.code);
        const merged: DisplayMember[] = (team.members ?? []).map((m: any, idx: number) => {
          const profile = profiles.find(p => p.userId === m.id);
          return {
            id: m.id,
            name: m.name,
            email: m.email,
            position: m.position ?? '',
            systemRole: m.role === 'LEADER' ? 'LEADER' : 'MEMBER',
            role: m.role === 'LEADER' ? 'Team Leader' : (m.position || 'Miembro'),
            initials: getInitials(m.name),
            color: COLORS[idx % COLORS.length],
            hoursUsed: profile?.activeHours ?? 0,
            hoursMax: profile?.maxHours ?? 0,
            skills: profile?.abilities ?? [],
          };
        });
        setMembers(merged);
        setError(null);
      })
      .catch(() => setError('No se pudo cargar el equipo.'))
      .finally(() => setLoading(false));
  }, [user?.teamId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleCopy = () => {
    navigator.clipboard.writeText(teamCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canManageMember = (member: DisplayMember) =>
    member.systemRole === 'MEMBER' && member.id !== user?.id;

  const handleSaveMember = async (memberId: number, data: { name: string; email: string; position: string; password: string }) => {
    setActionError(null);
    const payload: { name: string; email: string; position: string; password?: string } = {
      name: data.name,
      email: data.email,
      position: data.position,
    };
    if (data.password) payload.password = data.password;
    await updateUser(memberId, payload);
    loadMembers();
  };

  const handleDeleteMember = async (member: DisplayMember) => {
    if (!canManageMember(member)) return;
    const confirmed = confirm(
      `¿Eliminar a ${member.name} del equipo?\n\nSe desactivarán sus asignaciones y se eliminará su perfil.`
    );
    if (!confirmed) return;
    setDeletingId(member.id);
    setActionError(null);
    try {
      await deleteUser(member.id);
      loadMembers();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo eliminar al miembro.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="p-6" style={{ color: '#6B7280', fontSize: '13px' }}>Cargando equipo...</div>;
  if (error) return <div className="p-6" style={{ color: '#F59E0B', fontSize: '13px' }}>{error}</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: '700' }}>Equipo</h1>
          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              backgroundColor: copied ? 'rgba(16,185,129,0.12)' : 'rgba(91,141,239,0.12)',
              border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'rgba(91,141,239,0.3)'}`,
              borderRadius: '8px', padding: '5px 12px', color: copied ? '#10B981' : ACCENT,
              fontSize: '13px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
              letterSpacing: '1px',
            }}
          >
            {copied ? '¡Copiado!' : teamCode}
          </button>
        </div>
        <span style={{ color: '#6B7280', fontSize: '13px' }}>{members.length} miembros activos</span>
      </div>

      {actionError && (
        <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '9px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171', fontSize: '12px' }}>
          {actionError}
        </div>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {members.map(member => {
          const saturation = member.hoursMax > 0 ? member.hoursUsed / member.hoursMax : 0;
          const manageable = canManageMember(member);
          return (
            <div
              key={member.id}
              className="rounded-xl p-5"
              style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${member.color}40`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${member.color}20`, border: `2px solid ${member.color}40` }}>
                  <span style={{ color: member.color, fontSize: '18px', fontWeight: '800' }}>{member.initials}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '700', marginBottom: '2px' }}>{member.name}</h3>
                  <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '2px' }}>{member.role}</p>
                  <p style={{ color: '#4B5563', fontSize: '12px' }}>{member.email}</p>
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <div className="flex justify-between mb-1.5">
                  <span style={{ color: '#6B7280', fontSize: '12px' }}>Horas de trabajo utilizadas</span>
                  <span style={{
                    color: saturation > 0.85 ? '#EF4444' : saturation > 0.6 ? '#F59E0B' : '#10B981',
                    fontSize: '12px', fontWeight: '700',
                  }}>{member.hoursUsed}/{member.hoursMax}h</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${saturation * 100}%`,
                    backgroundColor: saturation > 0.85 ? '#EF4444' : saturation > 0.6 ? '#F59E0B' : member.color,
                    borderRadius: '999px', transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              <div style={{ marginBottom: manageable ? '14px' : 0 }}>
                <p style={{ color: '#4B5563', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Habilidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {member.skills.length === 0 ? (
                    <span style={{ color: '#374151', fontSize: '11px', fontStyle: 'italic' }}>Sin registrar</span>
                  ) : (
                    member.skills.map(skill => (
                      <span
                        key={skill}
                        style={{
                          backgroundColor: `${member.color}12`,
                          border: `1px solid ${member.color}30`,
                          color: member.color, fontSize: '11px', fontWeight: '500',
                          padding: '3px 9px', borderRadius: '999px',
                        }}
                      >
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {manageable && (
                <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => setEditingMember(member)}
                    style={{
                      flex: 1, padding: '8px', backgroundColor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                      color: '#D1D5DB', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    }}
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member)}
                    disabled={deletingId === member.id}
                    style={{
                      flex: 1, padding: '8px', backgroundColor: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px',
                      color: '#F87171', fontSize: '12px', fontWeight: '600',
                      cursor: deletingId === member.id ? 'not-allowed' : 'pointer',
                      opacity: deletingId === member.id ? 0.6 : 1,
                    }}
                  >
                    {deletingId === member.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={data => handleSaveMember(editingMember.id, data)}
        />
      )}
    </div>
  );
}
