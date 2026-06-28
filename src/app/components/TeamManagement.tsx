import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMemberProfiles } from '../services/dashboardService';
import { getTeamById } from '../services/teamService';

const ACCENT = '#5B8DEF';
const CARD_BG = '#141C2B';
const COLORS = ['#5B8DEF', '#7C6FE8', '#10B981', '#F59E0B', '#EC4899', '#EF4444'];

const getInitials = (name: string) => name.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2) || 'US';
const splitTags = (value?: string) => (value ?? '').split(',').map(tag => tag.trim()).filter(Boolean);

export function TeamManagement() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [team, setTeam] = useState<any | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const teamCode = team?.code ?? 'Sin codigo';

  useEffect(() => {
    const loadTeam = async () => {
      if (!user?.teamId) {
        setError('No se encontro el equipo del usuario.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const [teamData, profileData] = await Promise.all([
          getTeamById(user.teamId),
          getMemberProfiles(user.teamId),
        ]);
        setTeam(teamData);
        setProfiles(profileData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar equipo');
      } finally {
        setLoading(false);
      }
    };
    loadTeam();
  }, [user?.teamId]);

  const members = useMemo(() => (team?.members ?? []).map((member: any, index: number) => {
    const profile = profiles.find(p => p.userId === member.id);
    const color = COLORS[index % COLORS.length];
    return {
      ...member,
      color,
      initials: getInitials(member.name),
      hoursUsed: profile?.activeHours ?? 0,
      hoursMax: profile?.maxHours ?? 0,
      skills: splitTags(profile?.abilities),
      interests: splitTags(profile?.interests),
    };
  }), [team, profiles]);

  const handleCopy = () => {
    navigator.clipboard.writeText(teamCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="p-6" style={{ color: '#6B7280' }}>Cargando equipo...</div>;

  return (
    <div className="p-6">
      {error && (
        <div style={{ marginBottom: '14px', padding: '10px 12px', borderRadius: '9px', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#FCA5A5', fontSize: '13px' }}>
          {error}
        </div>
      )}
      {/* Header */}
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
              letterSpacing: '1px'
            }}
          >
            {copied ? (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg> ¡Copiado!</>
            ) : (
              <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg> {teamCode}</>
            )}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#6B7280', fontSize: '13px' }}>{members.length} miembros activos</span>
        </div>
      </div>

      {/* Member Grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {members.map((member: any) => {
          const saturation = member.hoursMax > 0 ? member.hoursUsed / member.hoursMax : 0;
          return (
            <div
              key={member.id}
              className="rounded-xl p-5"
              style={{ backgroundColor: CARD_BG, border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${member.color}40`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
            >
              {/* Avatar + Info */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${member.color}20`, border: `2px solid ${member.color}40` }}>
                  <span style={{ color: member.color, fontSize: '18px', fontWeight: '800' }}>{member.initials}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ color: 'white', fontSize: '15px', fontWeight: '700', marginBottom: '2px' }}>{member.name}</h3>
                  <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '2px' }}>{member.position}</p>
                  <p style={{ color: '#4B5563', fontSize: '12px' }}>{member.email}</p>
                </div>
              </div>

              {/* Hours Usage */}
              <div style={{ marginBottom: '14px' }}>
                <div className="flex justify-between mb-1.5">
                  <span style={{ color: '#6B7280', fontSize: '12px' }}>Horas de trabajo utilizadas</span>
                  <span style={{
                    color: saturation > 0.85 ? '#EF4444' : saturation > 0.6 ? '#F59E0B' : '#10B981',
                    fontSize: '12px', fontWeight: '700'
                  }}>{member.hoursUsed}/{member.hoursMax || '-'}h</span>
                </div>
                <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${saturation * 100}%`,
                    backgroundColor: saturation > 0.85 ? '#EF4444' : saturation > 0.6 ? '#F59E0B' : member.color,
                    borderRadius: '999px', transition: 'width 0.5s ease'
                  }} />
                </div>
                {saturation > 0.85 && (
                  <p style={{ color: '#EF4444', fontSize: '10px', marginTop: '4px' }}>⚠ Cerca del límite de horas</p>
                )}
              </div>

              {/* Skills */}
              <div>
                <p style={{ color: '#4B5563', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Habilidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {(member.skills.length > 0 ? member.skills : ['Sin habilidades']).map((skill: string) => (
                    <span
                      key={skill}
                      style={{
                        backgroundColor: `${member.color}12`,
                        border: `1px solid ${member.color}30`,
                        color: member.color, fontSize: '11px', fontWeight: '500',
                        padding: '3px 9px', borderRadius: '999px'
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
