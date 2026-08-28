export type LanguageMode = 'en' | 'pt' | 'bilingual'
export type DocumentType = 'pocket_guide' | 'exam_review'
/** Accent palette of the generated document. Derived from the topic, never asked. */
export type Theme = 'violet' | 'teal' | 'cyan' | 'crimson'

/** Where the source text came from. */
export type SourceKind = 'upload' | 'web'
export type Status =
  | 'pending' | 'researching' | 'extracting' | 'planning' | 'generating'
  | 'rendering' | 'validating' | 'done' | 'failed'

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
