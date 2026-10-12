import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { actors, amend, audit, createBook, injectScenario, transition, validateTx, calculate, projection } from "./engine";
import type { REBook, REEnvironment, RERole, REStatus, RETx } from "./engine";

interface REState {
  mode: REEnvironment; role: RERole; books: Record<REEnvironment, REBook>; attempts: number;
  setMode: (mode: REEnvironment) => void; setRole: (role: RERole) => void;
  amend: (id: string, changes: Partial<RETx>) => void;
  add: (tx: RETx) => void; transition: (id: string, status: REStatus) => void;
  importRows: (rows: RETx[]) => void;
  change: (action: string, record: string, reason: string, mutate: (book: REBook) => void) => void;
  inject: (id: string) => void; reset: () => void; release: () => void;
}
export const useREStore = create<REState>()(persist((set, get) => {
  const replace = (book: REBook) => set(s => ({ books: { ...s.books, [s.mode]: book } }));
  const checked = (fn: () => void) => { try { fn(); } catch (error) { set(s => ({ attempts: s.attempts + 1 })); throw error; } };
  return {
    mode: "Sandbox", role: "Analyst", books: { "Live Mode": createBook(), Sandbox: createBook() }, attempts: 0,
    setMode: mode => set({ mode }),
    setRole: role => set({ role }),
    amend: (id, changes) => checked(() => { const s = get(); replace(amend(s.books[s.mode], id, changes, s.role)); }),
    add: tx => checked(() => {
      const s = get(); const book = structuredClone(s.books[s.mode]);
      if (book.transactions.some(t => t.id === tx.id)) throw new Error("Duplicate transaction ID rejected.");
      const draft = { ...tx, maker: actors[s.role], status: "Draft" as const };
      const errors = validateTx(book, draft); if (errors.length) throw new Error(errors.join(" "));
      book.transactions.push(draft); audit(book, actors[s.role], "Create proposal", draft.id, null, draft, draft.reason); replace(book);
    }),
    importRows: rows => checked(() => {
      const s = get(); const book = structuredClone(s.books[s.mode]); const seen = new Set(book.transactions.map(t => t.id));
      for (const tx of rows) {
        if (seen.has(tx.id)) throw new Error(`Duplicate source ID ${tx.id}; whole import rejected.`);
        const issues = validateTx(book, tx); if (issues.length) throw new Error(issues.join(" "));
        book.transactions.push({ ...tx, maker: actors[s.role], status: "Draft" }); seen.add(tx.id);
      }
      const errors = projection(book).errors; if (errors.length) throw new Error(`Whole import rejected: ${errors.join(" ")}`);
      audit(book, actors[s.role], "Import validated batch", "Transactions", null, rows.map(t => t.id), "Validated source file; no posting"); replace(book);
    }),
    transition: (id, status) => checked(() => { const s = get(); replace(transition(s.books[s.mode], id, status, s.role)); }),
    change: (action, record, reason, mutate) => checked(() => {
      const s = get(); if (!reason.trim()) throw new Error("Change reason is required.");
      if (action === "Reopen period" && s.role !== "Controller") throw new Error("Controller authority is required to reopen a period.");
      if (s.books[s.mode].closed && action !== "Reopen period") throw new Error("Period is closed.");
      if (s.mode === "Live Mode" && s.role !== "Controller") throw new Error("Controller role required for Live reference-data maintenance.");
      const book = structuredClone(s.books[s.mode]); const previous = structuredClone({ fx: book.fx, bank: book.bank, closed: book.closed, finding: book.finding });
      mutate(book); audit(book, actors[s.role], action, record, previous, { fx: book.fx, bank: book.bank, closed: book.closed, finding: book.finding }, reason); replace(book);
    }),
    inject: id => checked(() => { const s = get(); if (s.mode !== "Sandbox") throw new Error("Scenario injection is Sandbox-only."); if (s.books.Sandbox.scenario || s.books.Sandbox.transactions.some(t => t.status !== "Posted")) throw new Error("Reset the current session before injecting another incident."); replace(injectScenario(id)); }),
    reset: () => checked(() => { const s = get(); if (s.mode !== "Sandbox") throw new Error("Live reset is prohibited."); const book = createBook(); audit(book, actors[s.role], "Reset Sandbox", "Session", "Prior session", "Clean baseline", "User confirmed reset"); replace(book); set({ attempts: 0 }); }),
    release: () => checked(() => { const s = get(); if (s.role !== "Controller") throw new Error("Controller signoff required."); const book = structuredClone(s.books[s.mode]); if (!calculate(book).ready) throw new Error("NAV release blocked by unresolved controls."); book.closed = true; audit(book, actors[s.role], "Publish demonstration NAV", "Close", false, true, "All controls passed; simulated release"); book.published = true; replace(book); }),
  };
}, { name: "fundops-real-estate-books-v1", storage: createJSONStorage(() => localStorage), partialize: s => ({ mode: s.mode, role: s.role, books: s.books, attempts: s.attempts }) }));
