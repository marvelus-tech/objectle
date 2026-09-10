import React from 'react';
import { useGameStore } from '../lib/store';
import { useTheaterStore } from '../lib/theater';

const facetLabels = {
  category: 'Category',
  material: 'Material',
  scale: 'Scale',
} as const;

export default function HypothesisBoard() {
  const guesses = useGameStore(state => state.guesses);
  const latestStatus = useTheaterStore(state =>
    state.events
      .slice()
      .reverse()
      .find(event => event.kind === 'status'),
  );

  const evidence = guesses.flatMap(guess =>
    guess.facets
      ? Object.entries(guess.facets).map(([facet, detail]) => ({
          facet: facet as keyof typeof facetLabels,
          ...detail,
        }))
      : [],
  );
  const known = evidence.filter(item => item.match);
  const ruledOut = evidence.filter(item => !item.match);
  const candidates = latestStatus?.kind === 'status' ? latestStatus.candidates ?? [] : [];

  return (
    <section style={styles.container} aria-labelledby="theory-title">
      <div style={styles.header}>
        <div>
          <span style={styles.eyebrow}>Evidence room</span>
          <h2 id="theory-title" style={styles.title}>Working theory</h2>
        </div>
        <span style={styles.confidence}>
          {latestStatus?.kind === 'status' && latestStatus.confidence
            ? `${latestStatus.confidence} confidence`
            : 'Gathering clues'}
        </span>
      </div>

      {candidates.length > 0 ? (
        <div style={styles.candidates}>
          {candidates.map((candidate, index) => (
            <article key={candidate.name} style={styles.candidate}>
              <span style={styles.rank}>{String(index + 1).padStart(2, '0')}</span>
              <div style={styles.candidateCopy}>
                <strong style={styles.candidateName}>{candidate.name}</strong>
                {candidate.evidence && (
                  <span style={styles.candidateEvidence}>{candidate.evidence}</span>
                )}
              </div>
              {typeof candidate.confidence === 'number' && (
                <span style={styles.percent}>{candidate.confidence}%</span>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p style={styles.empty}>
          Candidates will appear when the agent shares its working theory.
        </p>
      )}

      <div style={styles.evidenceGrid}>
        <EvidenceGroup title="Confirmed" items={known} match />
        <EvidenceGroup title="Ruled out" items={ruledOut} match={false} />
      </div>

      {latestStatus?.kind === 'status' && latestStatus.next && (
        <div style={styles.nextStep}>
          <span style={styles.nextLabel}>Next move</span>
          <span>{latestStatus.next}</span>
        </div>
      )}
    </section>
  );
}

function EvidenceGroup({
  title,
  items,
  match,
}: {
  title: string;
  items: Array<{ facet: keyof typeof facetLabels; value: string }>;
  match: boolean;
}) {
  return (
    <div>
      <span style={styles.groupTitle}>{title}</span>
      <div style={styles.chips}>
        {items.length === 0 ? (
          <span style={styles.noEvidence}>None yet</span>
        ) : (
          items.map((item, index) => (
            <span
              key={`${item.facet}-${item.value}-${index}`}
              style={{
                ...styles.chip,
                color: match ? 'var(--success)' : 'var(--ink-secondary)',
                background: match ? 'var(--success-bg)' : 'var(--info-bg)',
              }}
            >
              {facetLabels[item.facet]}: {item.value}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 'var(--space-5)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-xl)',
    background: 'var(--surface)',
    boxShadow: 'var(--shadow-sm)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 'var(--space-4)',
    marginBottom: 'var(--space-4)',
  },
  eyebrow: {
    color: 'var(--neon-b-ink)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  title: {
    margin: 0,
    color: 'var(--ink)',
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-xl)',
    fontWeight: 600,
  },
  confidence: {
    padding: '5px 8px',
    borderRadius: '999px',
    background: 'var(--neon-b-wash)',
    color: 'var(--neon-b-ink)',
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  candidates: {
    display: 'grid',
    gap: 'var(--space-2)',
    marginBottom: 'var(--space-5)',
  },
  candidate: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    minHeight: '54px',
    padding: 'var(--space-3)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--surface-subtle)',
    boxShadow: 'inset 0 0 0 1px var(--border-subtle)',
    animation: 'candidateEnter 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both',
  },
  rank: {
    color: 'var(--neon-b-ink)',
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-lg)',
    fontWeight: 600,
  },
  candidateCopy: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
  },
  candidateName: {
    color: 'var(--ink)',
    fontSize: 'var(--text-sm)',
    textTransform: 'capitalize',
  },
  candidateEvidence: {
    color: 'var(--ink-tertiary)',
    fontSize: '11px',
  },
  percent: {
    color: 'var(--ink-secondary)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  empty: {
    marginBottom: 'var(--space-5)',
    color: 'var(--ink-tertiary)',
    fontFamily: 'var(--font-display)',
    fontSize: 'var(--text-sm)',
    fontStyle: 'italic',
  },
  evidenceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--space-4)',
  },
  groupTitle: {
    display: 'block',
    marginBottom: 'var(--space-2)',
    color: 'var(--ink-tertiary)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'var(--space-1)',
  },
  chip: {
    padding: '4px 7px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '10px',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  noEvidence: {
    color: 'var(--ink-muted)',
    fontSize: '11px',
  },
  nextStep: {
    display: 'grid',
    gap: '2px',
    marginTop: 'var(--space-4)',
    paddingTop: 'var(--space-4)',
    borderTop: '1px solid var(--border-subtle)',
    color: 'var(--ink-secondary)',
    fontSize: 'var(--text-xs)',
  },
  nextLabel: {
    color: 'var(--neon-a-ink)',
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
};
