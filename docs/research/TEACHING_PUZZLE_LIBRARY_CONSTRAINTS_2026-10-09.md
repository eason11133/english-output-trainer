# Teaching Puzzle Library — research constraints (2026-10-09)

This note is not a claim that the first puzzle library is pedagogically complete. It records the external evidence that constrains the first implementation so later UI/UX work does not silently turn the library into generic cards or scripted lesson flows.

## Constraints adopted

1. **Worked examples are useful for initial cognitive-skill acquisition, but they must transition toward learner problem solving.**
   - The worked-example literature treats examples as support for understanding solution rationale, followed by learner problem solving and later efficiency practice.
   - EOT consequence: `worked-transformation` is answer-exposing, therefore its evidence ceiling is `EXPOSURE_ONLY`; it cannot itself prove independent ability. It must eventually hand control back to the learner and support must be removable.
   - Source: Waldeyer et al. (2024), Educational Psychology Review, https://doi.org/10.1007/s10648-024-09944-4

2. **Comparison can support conceptual distinction, but comparison must target the relevant structural difference.**
   - Case-comparison research supports comparison as a way to acquire conceptual knowledge when the learner is directed to meaningful commonalities/differences.
   - EOT consequence: `contrast-boundary` keeps alternatives simultaneously visible and requires learner comparison/selection rather than two disconnected explanations.
   - Source: Kienzler, Voss & Wittwer (2023), Instructional Science, https://doi.org/10.1007/s11251-023-09627-7

3. **Self-explanation is not a universal mandatory move.**
   - Self-explanation can help in some contexts, especially around worked examples, but effects depend on task and support; research also documents contexts where explanation prompts are not beneficial.
   - EOT consequence: `EXPLAIN` is optional in the first puzzles, never the universal primary interaction. Teacher/UI should not force “explain why” after every step.
   - Sources:
     - Renkl (2002), Learning and Instruction, https://doi.org/10.1016/S0959-4752(01)00030-5
     - Kuhn & Katz (2009), Journal of Experimental Child Psychology, https://doi.org/10.1016/j.jecp.2009.03.003

4. **Formulaic language should be treated as learnable multiword units, not only isolated word knowledge.**
   - SLA reviews support instructional attention to formulaic sequences and distinguish noticing, lookup/corpus work, and committing useful sequences to memory.
   - EOT consequence: `chunk-build` treats chunks/collocational partners as structured production resources and includes match/recall/construct actions rather than a flat vocabulary list.
   - Sources:
     - Meunier (2012), Annual Review of Applied Linguistics, https://doi.org/10.1017/S0267190512000128
     - Boers & Lindstromberg (2012), Annual Review of Applied Linguistics, https://doi.org/10.1017/S0267190512000050

5. **Visual relation maps are representations, not evidence of mastery.**
   - Concept-map research supports relation mapping as a learning aid, but a completed map does not by itself establish independent target-language performance.
   - EOT consequence: `relation-map` and `evidence-bridge` generate structured teaching observations only; their puzzle interactions cannot directly write capability evidence.
   - Source: 2024 meta-analysis in Heliyon, https://doi.org/10.1016/j.heliyon.2023.e23290

## Product guardrail

These findings justify a **small repertoire of materially different representations/interactions**, not a fixed lesson sequence.

The Teacher remains responsible for:
- whether intervention is needed;
- which puzzle is appropriate now;
- what support level is justified;
- whether the learner response warrants keeping, fading, replacing, or stopping the current approach.

The puzzle library does **not** encode `grammar problem -> fixed puzzle`, and UI/UX does not infer pedagogy from renderer identity.
