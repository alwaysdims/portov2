import { SKILLS } from './combatConfig.js';
import { keyHint } from './combatInput.js';

const names = { prison: 'Penjara Ompreng', ultimate: 'Pukulan Ompreng' };
const feedback = {
  COOLDOWN: 'Skill belum siap.', BUSY: 'Selesaikan aksi saat ini.', NO_TARGET: 'Hadapkan Owi ke target dalam 5 m.',
  OUT_OF_RANGE: 'Target terlalu jauh.', DEAD_TARGET: 'Target sudah tumbang.', INVALID_TARGET: 'Target tidak valid.',
  STUNNED: 'Owi sedang terkena stun.', TARGET_STUNNED: 'Target sudah terkurung.', RESISTED: 'Target menahan stun.',
  BLOCKED: 'Skill terkunci.', MISSED: 'Skill meleset.', INTERRUPTED: 'Cast terputus; cooldown tetap berjalan.',
};

export default function SkillHUD({ combat, disabled }) {
  const notice = combat.skillFeedback;
  const reason = typeof notice === 'string' ? notice.split(':').at(-1).replaceAll('-', '_').toUpperCase() : notice?.reason;
  return <section className="kopdes-skills" aria-label="Skill Owi">
    {Object.entries(names).map(([kind, name]) => {
      const cooldown = combat.skills?.[kind]?.cooldown ?? 0;
      const casting = combat.cast?.kind === kind;
      const status = disabled ? 'TERKUNCI' : casting ? 'CAST' : cooldown > 0 ? `${(cooldown / 60).toFixed(1)} s` : 'READY';
      return <div className={`kopdes-skill${kind === 'ultimate' ? ' kopdes-ultimate' : ''}`} key={kind}>
        <span className="kopdes-skill-icon" aria-hidden="true">{kind === 'prison' ? '▥' : '◎'}</span>
        <span><b>{name}</b><small><kbd>{keyHint(kind)}</kbd> · {status}</small></span>
        <progress max={SKILLS[kind].cooldown} value={Math.max(0, SKILLS[kind].cooldown - cooldown)} aria-label={`Kesiapan ${name}`} />
      </div>;
    })}
    {reason && reason !== 'ACCEPTED' && <p role="status">{feedback[reason] ?? `Skill ditolak: ${reason}`}</p>}
  </section>;
}
