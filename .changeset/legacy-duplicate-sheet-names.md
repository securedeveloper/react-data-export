---
"react-data-export": patch
---

`react-data-export/legacy`: two `<ExcelSheet>` elements with the same name (compared case-insensitively) no longer fail the export; the later ones are written as `name (2)`, `name (3)`... with a development warning. 0.x wrote such files as given, and Excel offered to repair them (#94).
