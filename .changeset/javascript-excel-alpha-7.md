---
"react-data-export": patch
---

Depend on javascript-excel `^2.0.0-alpha.7`. Its writer returns to the event loop about every 16 ms, so a large `.xlsx` export on the main thread no longer freezes the page, and `signal`/`abort()` take effect while it runs.
