export type LanguageMode = 'en' | 'pt' | 'bilingual'
export type DocumentType = 'pocket_guide' | 'exam_review'
/** Accent palette of the generated document. Derived from the topic, never asked. */
export type Theme = 'violet' | 'teal' | 'cyan' | 'crimson'

/** Where the source text came from. */
export type SourceKind = 'upload' | 'web'
export type Status =
  | 'pending' | 'researching' | 'extracting' | 'planning' | 'generating'
  | 'rendering' | 'validating' | 'done' | 'failed'

/** Background work the in-process worker picks off the `jobs` table. */
export type JobKind = 'generate' | 'derive'

export interface Source {
  title: string
  url: string
}

export interface GenerationRequest {
  topic: string
  description: string
  language: LanguageMode
  documentType: DocumentType
  theme: Theme
  /** Plain text: extracted from the uploaded PDF, or researched from the web. */
  sourceText: string
  sourceKind: SourceKind
  /** Set when sourceKind is 'web' — disclosed on the cover and checked for. */
  sources?: Source[]
  /** Optional question bank or answer key, plain text. */
  questionBank?: string
}

export interface PlanPart {
  title: string
  /** Concepts this part must cover, in order. */
  concepts: string[]
  /** How many numbered sections (Type A) or questions (Type B) to emit. */
  units: number
}

export interface Plan {
  title: string
  subtitle: string
  source: string
  parts: PlanPart[]
}

export interface GeneratedPart {
  index: number
  title: string
  html: string
  inputTokens: number
  outputTokens: number
  cachedTokens: number
}

export interface ValidationResult {
  ok: boolean
  checks: { name: string; ok: boolean; detail: string }[]
  /** Set by validatePdf — the rendered page count, surfaced in the dashboard. */
  pages?: number
}

/** Where a material's derived study set stands. */
export type DerivativesStatus = 'none' | 'generating' | 'ready' | 'failed'

/* The model returns these; the DB rows add ids and a material_id. */
export interface FlashcardDraft {
  front: string
  back: string
  /** 1–3 word tag; shared with the matching quiz questions so misses can weight the deck. */
  concept: string
}
export interface QuizDraft {
  question: string
  answer: string
  explanation: string
  /** Named wrong answer + why, or '' when there is no classic trap. */
  trap?: string
  concept: string
  is_multi_select?: boolean
}
export interface ProjectDraft {
  title: string
  brief: string
  concepts: string[]
}
export interface StudySet {
  flashcards: FlashcardDraft[]
  quiz: QuizDraft[]
  projects: ProjectDraft[]
}
