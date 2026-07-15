/*
 * Demo-only: /employee/profile mirrors typed input across every input
 * field on the page. A MirrorEvent is one keystroke's broadcast — a fresh
 * object per keystroke so receiving effects re-run even when `value`
 * repeats (e.g. the same text typed in two fields).
 */
export type MirrorEvent = {
  value: string;
  /** Field name that originated the keystroke — skipped when applying, to avoid caret jumps. */
  source: string;
};
