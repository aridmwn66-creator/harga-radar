// Minimal imperative handle shared by the bottom-sheet components and their web
// fallbacks. On native the methods drive a @gorhom/bottom-sheet instance; on web
// they toggle a plain modal overlay. Screens only ever call open/close, so this
// is the whole contract, and it keeps both platforms strictly typed without
// leaking @gorhom/bottom-sheet's native-only ref type into web code.
export type SheetHandle = {
  /** Open the sheet (native: expand to its snap point; web: show the modal). */
  expand: () => void;
  /** Close/dismiss the sheet. */
  close: () => void;
};
