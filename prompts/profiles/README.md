# Domain profiles

The blueprint describes the *format* — the boxes, their rules, the checks. It is
subject-agnostic on purpose: the same structure works for deep learning, Roman
law or pharmacology.

A profile carries what is specific to one field:

- an **analogy registry**, so the same concept gets the same image across every
  document you generate
- **established cross-links** worth making between topics
- an optional **practitioner badge** marking what matters on the job
- **deep-dive calibration** — which concepts in this field genuinely warrant the
  box, so it keeps its signal value

Select one with `ESTUDO_PROFILE=machine-learning`. Leave it unset and only the
blueprint's universal rules apply, which is the right default for a subject that
does not have a profile yet.

Adding one is copying `machine-learning.md` and replacing its contents. Nothing
in the code needs to change.
