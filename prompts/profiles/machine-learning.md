# DOMAIN PROFILE — MACHINE LEARNING & DEEP LEARNING

A domain profile carries what is specific to one field: the analogies that have
already proved themselves, the connections worth making across topics, and any
badge that marks material as job-relevant. The blueprint carries the format; this
carries the subject.

Load a profile with `ESTUDO_PROFILE=machine-learning`. With no profile set, the
blueprint's universal rules apply on their own — which is the right default for
history, law, medicine or anything else.

## Analogy registry

Reuse these when the concept comes up; consistency across documents is the point.
Each entry gives the analogy's *idea*, not its wording — write it fresh in the
target language every time, and never translate one across languages.

| Concept | Analogy |
|---|---|
| Bias vs. variance | Marksman: crooked sights (bias) vs. shaky hands (variance) |
| Training vs. test error | Old exam papers you studied vs. the real entrance exam |
| Ridge (L2) | Progressive tax — everyone pays, nobody is fired |
| Lasso (L1) | Summary dismissal — useless variables get fired (set to exactly 0) |
| Regularization | A mathematical handbrake |
| Bootstrap | "Pulling yourself up by your bootstraps" — parallel universes of your table |
| Cross-validation (k-fold) | Splitting the class into groups; each takes a turn being the test |
| LOOCV | Leaving one card out of the deck at a time |
| Decision tree | A game of 20 questions |
| Pruning | Bonsai gardening — grow big, then trim back |
| Bagging | A committee of jurors voting |
| Random Forest | Forcing jurors to look at different clues (decorrelation) |
| Boosting | A student who studies only their mistakes, in series |
| Gradient descent | Blindfolded on a hill, feeling the slope, stepping downhill |
| Learning rate | Step size — tiny steps crawl, huge steps overshoot the valley |
| Epoch | One full read of the textbook; a batch is reading 10 pages |
| Weights | Volume knobs for each feature |
| Bias term (b) | The starting point / floor of the calculation |
| Loss function | An error thermometer |
| Dropout | A team where random players are missing each game |
| Attention (Q/K/V) | A soft database lookup |
| Convolution | A sliding sieve over the image |
| Fixed context vector (RNN bottleneck) | Summarizing a whole book onto one index card |

## Established cross-links

Aim for at least three per document; extend the list as the material warrants.

- Ridge (statistics) = weight decay (deep learning) — one mechanism, two names
- Tree pruning α ≈ Lasso λ — the same "tax on complexity" idea
- OOB error ≈ LOOCV — a free test-error estimate
- CNN weight sharing ↔ RNN weight sharing — same principle, space vs. time
- ResNet skip connections ↔ Transformer residual connections — same fix for depth
- CNN fine-tuning ↔ BERT fine-tuning ↔ LLM fine-tuning — identical pattern
- K-means ↔ EM — K-means is EM with hard assignment
- Matrix completion ↔ recommender systems — same low-rank logic
- Double descent ↔ scaling laws — why bigger models can generalize better

## Practitioner badge — `AI ENGINEER`

Mark concepts the reader will use on the job, not just on the exam. A badged
concept gains one extra sentence opening with `On the job:` connecting it to
building AI products.

Earns it: embeddings, vector search, shared embedding spaces (CLIP); tokenization
(→ context windows and API cost); attention Q/K/V (→ RAG and semantic search);
autoregressive generation (→ latency and streaming); fine-tuning vs. feature
extraction vs. prompting; scaling laws; instruction tuning and alignment;
dimensionality reduction (→ vector-DB cost); t-SNE / UMAP (→ inspecting embedding
spaces); anomaly detection (→ out-of-distribution inputs); generative models
(→ why LLMs hallucinate); the learning-rate tuning workflow (→ fine-tuning in
practice).

Does **not** earn it: convergence proofs, derivations, exotic architectures, pure
theory. Keep those at intuition level. This reader is not pursuing an
ML-Research-Engineer track.

## Deep-dive calibration

Concepts that genuinely warrant the deep-dive box in this field:

- why stacking linear layers collapses (affine ∘ affine = affine)
- why weight decay is called *decay* (the (1−ηλ) factor)
- why dropout divides by (1−p) (expectation matching)
- why the residual connection solves degradation (identity becomes g(x)=0)
- why two 3×3 convolutions beat one 5×5 (fewer params + an extra ReLU)
- why the √d scaling exists in attention (softmax saturation)
- why training uses so much memory (backprop reuses forward activations)
