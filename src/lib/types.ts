export type LanguageMode = 'en' | 'pt' | 'bilingual'
export type DocumentType = 'pocket_guide' | 'exam_review'
export type Family = 'supervised' | 'deep_learning' | 'unsupervised' | 'foundations'
export type Status =
  | 'pending' | 'extracting' | 'planning' | 'generating' | 'rendering' | 'validating' | 'done' | 'failed'

export interface GenerationRequest {
  topic: string
  description: string
  language: LanguageMode
  documentType: DocumentType
  family: Family
  /** Plain text extracted from the textbook / source PDF. */
  sourceText: string
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
