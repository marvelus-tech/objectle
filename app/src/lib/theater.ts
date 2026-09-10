import { create } from 'zustand';

export type TheaterSource = 'agent' | 'human' | 'panel' | 'remote';
export type Confidence = 'low' | 'medium' | 'high';

export interface FacetDetail {
  value: string;
  match: boolean;
}

export interface GuessDetail {
  guess: string;
  guessNumber: number;
  correct: boolean;
  remaining: number;
  facets: {
    category: FacetDetail;
    material: FacetDetail;
    scale: FacetDetail;
  };
}

interface TheaterEventBase {
  id: string;
  timestamp: number;
  source: TheaterSource;
}

export interface ToolTheaterEvent extends TheaterEventBase {
  kind: 'tool';
  tool: string;
  phase: 'running' | 'completed';
  args: Record<string, unknown>;
  result?: string;
  success?: boolean;
  durationMs?: number;
  detail?: GuessDetail;
}

export interface Candidate {
  name: string;
  confidence?: number;
  evidence?: string;
}

export interface StatusTheaterEvent extends TheaterEventBase {
  kind: 'status';
  headline: string;
  rationale?: string;
  candidates?: Candidate[];
  next?: string;
  confidence?: Confidence;
}

export type TheaterEvent = ToolTheaterEvent | StatusTheaterEvent;

export interface PublishStatusInput {
  headline: string;
  rationale?: string;
  candidates?: Candidate[];
  next?: string;
  confidence?: Confidence;
}

interface TheaterState {
  events: TheaterEvent[];
  startTool: (
    tool: string,
    args?: Record<string, unknown>,
    source?: TheaterSource,
  ) => string;
  completeTool: (
    id: string,
    result: string,
    success: boolean,
    detail?: GuessDetail,
  ) => void;
  publishStatus: (status: Omit<StatusTheaterEvent, 'id' | 'kind' | 'timestamp'>) => void;
  ingestEvent: (event: TheaterEvent) => void;
  clear: () => void;
}

type EventPublisher = (event: TheaterEvent) => void;

let eventPublisher: EventPublisher | null = null;

export function setTheaterEventPublisher(publisher: EventPublisher | null) {
  eventPublisher = publisher;
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return undefined;
  const text = value.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, maxLength) : undefined;
}

export function sanitizePublishedStatus(input: unknown): PublishStatusInput {
  if (!input || typeof input !== 'object') {
    throw new Error('Status must be an object.');
  }

  const value = input as Record<string, unknown>;
  const headline = cleanText(value.headline, 80);
  if (!headline) throw new Error('A short headline is required.');

  const confidence = ['low', 'medium', 'high'].includes(String(value.confidence))
    ? (value.confidence as Confidence)
    : undefined;
  const rawCandidates = Array.isArray(value.candidates) ? value.candidates : [];
  const candidates = rawCandidates
    .slice(0, 3)
    .map(candidate => {
      const item =
        candidate && typeof candidate === 'object'
          ? (candidate as Record<string, unknown>)
          : {};
      const name = cleanText(item.name, 40);
      if (!name) return null;

      const numericConfidence =
        typeof item.confidence === 'number'
          ? Math.min(100, Math.max(0, Math.round(item.confidence)))
          : undefined;

      return {
        name,
        confidence: numericConfidence,
        evidence: cleanText(item.evidence, 100),
      };
    })
    .filter((candidate): candidate is Candidate => candidate !== null);

  return {
    headline,
    rationale: cleanText(value.rationale, 200),
    candidates: candidates.length ? candidates : undefined,
    next: cleanText(value.next, 100),
    confidence,
  };
}

function createEventId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function appendEvent(events: TheaterEvent[], event: TheaterEvent) {
  return [...events.filter(item => item.id !== event.id), event].slice(-60);
}

function publish(event: TheaterEvent) {
  eventPublisher?.(event);
}

export const useTheaterStore = create<TheaterState>((set, get) => ({
  events: [],

  startTool: (tool, args = {}, source = 'agent') => {
    const event: ToolTheaterEvent = {
      id: createEventId(),
      kind: 'tool',
      timestamp: Date.now(),
      source,
      tool,
      phase: 'running',
      args,
    };

    set(state => ({ events: appendEvent(state.events, event) }));
    publish(event);
    return event.id;
  },

  completeTool: (id, result, success, detail) => {
    const existing = get().events.find(
      (event): event is ToolTheaterEvent => event.id === id && event.kind === 'tool',
    );

    if (!existing) return;

    const event: ToolTheaterEvent = {
      ...existing,
      phase: 'completed',
      result,
      success,
      detail,
      durationMs: Date.now() - existing.timestamp,
    };

    set(state => ({ events: appendEvent(state.events, event) }));
    publish(event);
  },

  publishStatus: status => {
    const event: StatusTheaterEvent = {
      ...status,
      id: createEventId(),
      kind: 'status',
      timestamp: Date.now(),
    };

    set(state => ({ events: appendEvent(state.events, event) }));
    publish(event);
  },

  ingestEvent: event => {
    set(state => ({ events: appendEvent(state.events, event) }));
  },

  clear: () => set({ events: [] }),
}));

export function describeToolAction(tool: string, args: Record<string, unknown>) {
  if (tool === 'rotate_object') {
    const degrees = Number(args.degrees ?? 0);
    const direction = degrees < 0 ? 'left' : 'right';
    return `Turning the object ${direction} to inspect another angle`;
  }

  if (tool === 'zoom') return `Moving closer to inspect the silhouette`;
  if (tool === 'read_view') return `Studying what is visible on the stage`;
  if (tool === 'submit_guess') return `Testing “${String(args.name ?? '')}”`;
  if (tool === 'publish_status') return 'Updating the working theory';
  return `Using ${tool.replace(/_/g, ' ')}`;
}

export function describeToolResult(event: ToolTheaterEvent) {
  if (event.phase === 'running') return describeToolAction(event.tool, event.args);
  if (!event.success) return event.result || 'That action could not be completed';

  if (event.tool === 'rotate_object') return 'A new profile is now on stage';
  if (event.tool === 'zoom') return 'The camera moved to the requested detail level';
  if (event.tool === 'read_view') return 'The latest view has been observed';

  if (event.tool === 'submit_guess' && event.detail) {
    if (event.detail.correct) return `“${event.detail.guess}” is correct`;
    const matches = Object.values(event.detail.facets).filter(facet => facet.match).length;
    return `${matches} of 3 clues matched “${event.detail.guess}”`;
  }

  return event.result || 'Action complete';
}
