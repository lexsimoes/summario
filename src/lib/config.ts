import path from 'node:path'

const env = (k: string, fallback: string) => process.env[k]?.trim() || fallback

export const config = {
  apiKey: process.env.ANTHROPIC_API_KEY ?? '',
  googleApiKey: process.env.GOOGLE_API_KEY ?? '',
  openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  // Read lazily, so `npm run generate -- --model X` can override at runtime.
  models: {
    /** Default for CLI runs and paid guides researched from the web. */
    get guide() { return env('ESTUDO_MODEL_GUIDE', 'gpt-5.6-terra') },
    /** Free guides are web-only and use the strongest cost-efficient Flash tier. */
    get freeGuide() { return env('ESTUDO_MODEL_FREE_GUIDE', 'gemini-3.8-flash') },
    /** Paid PDF guides do not need a separate web-research model. */
    get paidUploadGuide() { return env('ESTUDO_MODEL_PAID_UPLOAD_GUIDE', 'gemini-3.8-flash') },
    /** Paid web guides get the deeper research tier. */
    get paidWebGuide() { return env('ESTUDO_MODEL_PAID_WEB_GUIDE', 'gpt-5.6-terra') },
    /**
     * Defaults to the guide model on purpose. Outlining is structured enough for
     * a cheaper tier, but the prompt cache is per-model: pointing the planner at
     * a different model forces a SECOND cache write of the whole source extract,
     * which costs more than the tier saves. Only override this if the extract is
     * small enough that the duplicated write does not matter.
     */
    get planner() { return env('ESTUDO_MODEL_PLANNER', this.guide) },
    /** Free study sets stay inexpensive without losing structured-output quality. */
    get freeDerivative() { return env('ESTUDO_MODEL_FREE_DERIVATIVE', 'gpt-4o-mini') },
    /** Plus study sets use the same Flash tier as PDF-backed guides. */
    get paidDerivative() { return env('ESTUDO_MODEL_PAID_DERIVATIVE', 'gemini-3.8-flash') },
  },
  /**
   * Optional domain profile from prompts/profiles/. Carries the analogy
   * registry, cross-links and practitioner badge for one field. Unset means the
   * blueprint's universal rules apply alone — the right default for a subject
   * that has no profile yet.
   */
  profile: env('ESTUDO_PROFILE', ''),
  maxOutputTokens: Number(env('ESTUDO_MAX_OUTPUT_TOKENS', '16000')),
  /**
   * Hard ceiling on a single API call. The SDK's own default is generous and a
   * stalled call used to leave a job stuck on "writing" forever, holding the
   * user's credit. Failing loudly is better: the job runner refunds on failure.
   */
  requestTimeoutMs: Number(env('ESTUDO_REQUEST_TIMEOUT_MS', String(8 * 60 * 1000))),
  /** Retries are per call and multiply the wall clock — keep them low. */
  maxRetries: Number(env('ESTUDO_MAX_RETRIES', '2')),
  dataDir: path.resolve(process.cwd(), env('ESTUDO_DATA_DIR', './data')),
  promptsDir: path.resolve(process.cwd(), 'prompts'),
  /** Optional path to a Chromium binary; empty means Playwright's own. */
  chromiumPath: env('ESTUDO_CHROMIUM_PATH', ''),
  vendorDir: path.resolve(process.cwd(), 'public/vendor'),
}

export function assertApiKey() {
  if (!config.apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Copy .env.example to .env and fill it in.')
  }
}
