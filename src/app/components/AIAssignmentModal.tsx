import { useState } from 'react';
import { teamMembers } from './mockData';

const ACCENT = '#5B8DEF';
const PURPLE = '#7C6FE8';
const CARD_BG = '#141C2B';
const INPUT_BG = '#1A2235';

interface Props {
  taskTitle: string;
  onClose: () => void;
  onConfirm: (memberName: string) => void;
}

function CircularProgress({ percent, color, label }: { percent: number; color: string; label: string }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
        <circle
          cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeDasharray={`${circ}`} strokeDashoffset={`${offset}`}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '44px 44px', transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="44" y="49" textAnchor="middle" fill="white" fontSize="16" fontWeight="700">{percent}%</text>
      </svg>
      <span style={{ color: '#9CA3AF', fontSize: '11px', textAlign: 'center', maxWidth: '80px', lineHeight: '1.3' }}>{label}</span>
    </div>
  );
}

const candidates = [
  { memberId: 1, match: 94, skillMatch: 92, expMatch: 88, interestMatch: 96, totalScore: 94 },
  { memberId: 3, match: 78, skillMatch: 75, expMatch: 82, interestMatch: 70, totalScore: 78 },
  { memberId: 2, match: 65, skillMatch: 60, expMatch: 70, interestMatch: 68, totalScore: 65 },
];

export function AIAssignmentModal({ taskTitle, onClose, onConfirm }: Props) {
  const [step, setStep] = useState<'candidates' | 'confirm'>('candidates');
  const [selectedCandidate, setSelectedCandidate] = useState<typeof candidates[0] | null>(null);

  const getMember = (id: number) => teamMembers.find(m => m.id === id)!;

  const handleSelect = (c: typeof candidates[0]) => {
    setSelectedCandidate(c);
    setStep('confirm');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
      <div className="w-full mx-4" style={{ maxWidth: '480px', backgroundColor: '#0D1520', borderRadius: '20px', border: '1px solid rgba(91,141,239,0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '18px' }}>✨</span>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>
                {step === 'candidates' ? 'Recomendación IA para la Tarea' : 'Métricas de Coincidencia'}
              </h3>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: '4px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <p style={{ color: '#6B7280', fontSize: '12px' }}>
            <span style={{ color: '#9CA3AF' }}>Tarea:</span> {taskTitle}
          </p>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {step === 'candidates' && (
            <div className="space-y-3">
              <p style={{ color: '#9CA3AF', fontSize: '12px', marginBottom: '12px' }}>Los 3 mejores candidatos según habilidades, experiencia y carga actual:</p>
              {candidates.map((c, idx) => {
                const member = getMember(c.memberId);
                const isTop = idx === 0;
                return (
                  <div
                    key={c.memberId}
                    style={{
                      backgroundColor: isTop ? 'rgba(91,141,239,0.08)' : INPUT_BG,
                      border: `1px solid ${isTop ? 'rgba(91,141,239,0.3)' : 'rgba(255,255,255,0.06)'}`,
                      borderRadius: '12px', padding: '14px 16px'
                    }}
                  >
                    {isTop && (
                      <div className="flex items-center gap-1 mb-2">
                        <span style={{ backgroundColor: ACCENT, color: 'white', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px' }}>
                          ⭐ Recomendado #1
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${member.color}25` }}>
                          <span style={{ color: member.color, fontSize: '12px', fontWeight: '700' }}>{member.initials}</span>
                        </div>
                        <div>
                          <p style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{member.name}</p>
                          <p style={{ color: '#6B7280', fontSize: '11px' }}>{member.role}</p>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ color: isTop ? ACCENT : '#9CA3AF', fontSize: '18px', fontWeight: '700' }}>{c.match}%</p>
                        <p style={{ color: '#4B5563', fontSize: '10px' }}>coincidencia</p>
                      </div>
                    </div>
                    {/* Hours bar */}
                    <div style={{ marginTop: '10px' }}>
                      <div className="flex justify-between mb-1">
                        <span style={{ color: '#6B7280', fontSize: '11px' }}>Horas disponibles</span>
                        <span style={{ color: '#9CA3AF', fontSize: '11px' }}>{member.hoursMax - member.hoursUsed} / {member.hoursMax} hrs</span>
                      </div>
                      <div style={{ height: '5px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${((member.hoursMax - member.hoursUsed) / member.hoursMax) * 100}%`, backgroundColor: member.color, borderRadius: '999px' }} />
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelect(c)}
                      style={{
                        marginTop: '10px', width: '100%', padding: '8px',
                        backgroundColor: isTop ? ACCENT : 'rgba(255,255,255,0.06)',
                        color: isTop ? 'white' : '#9CA3AF',
                        border: 'none', borderRadius: '8px', cursor: 'pointer',
                        fontSize: '13px', fontWeight: '600'
                      }}
                    >
                      Seleccionar
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {step === 'confirm' && selectedCandidate && (() => {
            const member = getMember(selectedCandidate.memberId);
            return (
              <div>
                <div className="flex items-center gap-3 mb-5 p-3 rounded-xl" style={{ backgroundColor: INPUT_BG }}>
                  <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: `${member.color}25` }}>
                    <span style={{ color: member.color, fontSize: '14px', fontWeight: '700' }}>{member.initials}</span>
                  </div>
                  <div>
                    <p style={{ color: 'white', fontSize: '15px', fontWeight: '700' }}>{member.name}</p>
                    <p style={{ color: '#6B7280', fontSize: '12px' }}>{member.role}</p>
                  </div>
                  <div className="ml-auto">
                    <span style={{ backgroundColor: 'rgba(91,141,239,0.15)', color: ACCENT, fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px' }}>
                      {selectedCandidate.totalScore}% idóneo
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5" style={{ justifyItems: 'center' }}>
                  <CircularProgress percent={selectedCandidate.skillMatch} color={ACCENT} label="Coincidencia de Habilidades" />
                  <CircularProgress percent={selectedCandidate.expMatch} color={PURPLE} label="Coincidencia de Experiencia" />
                  <CircularProgress percent={selectedCandidate.interestMatch} color="#10B981" label="Coincidencia de Intereses" />
                  <CircularProgress percent={selectedCandidate.totalScore} color="#F59E0B" label="Puntuación Total de Idoneidad" />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('candidates')}
                    style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#9CA3AF', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                  >
                    ← Volver
                  </button>
                  <button
                    onClick={() => { onConfirm(member.name); onClose(); }}
                    style={{ flex: 2, padding: '10px', backgroundColor: ACCENT, color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                  >
                    Confirmar asignación de tarea
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
