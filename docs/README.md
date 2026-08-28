# docs

- **`MASTER_BLUEPRINT.md`** — the full blueprint, v1.0. Project context and source of
  truth: what the app does, why, the content rules, the design system, the pipeline,
  cost, architecture, build order, the study method, and the open decisions.

`prompts/blueprint.md` is the generation-facing subset: Parts 1–5 rewritten as
instructions to the model, plus the HTML contract the renderer expects. That file is the
one the app actually reads. When the content rules change, change both — the master
document explains the reasoning, the prompt file enforces it.
