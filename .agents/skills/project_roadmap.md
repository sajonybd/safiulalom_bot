---
name: Project Roadmap
description: Provides the context and architectural goals for the safiulalom_bot Pro Life-OS.
---

# Project Roadmap & AI Guidelines

When working on the `safiulalom_bot` repository, the AI must keep the following "Pro Life-OS" goals in mind:

1. **The Validation Gap (COMPLETED):** All complex, quickly entered data (like from Telegram) goes through a "Pending Database" (`pending_entries`) before being added to the official transaction ledger. The Dashboard acts as the validation hub.
2. **The Entity & Schema Gap (PRIORITY 1):** The Lenden isn't just basic assets/liabilities. We manage multiple profiles (Wife, Child, Office, Shops) universally in an `entities` collection. The ledger must link to these `entities` and track Third-Party funds (e.g. Escrow). The Ledger schema must support a `metadata` JSON object to track unique micro-metrics like "Odometer reading" and "Grocery item prices".
3. **The Smart Logic Gap (PRIORITY 2):** Charting, parsing, and reporting rely on the Gemini API. The AI should use deep metadata structures to parse inputs ("Ammu k bajar dilam") into the structured Entity and Metadata schemas.
4. **The UI/UX Gap (PRIORITY 3):** The Next.js dashboard needs dynamic deep-dive reports. (e.g. "Total spent on House 2 last month" or "Total given to Pharmacy this year").
5. **The Multi-User Gap (FUTURE):** Granular roles (Owner, Editor, Viewer).

Always check `/agents.md` in the root directory for the latest overarching status updates. When implementing a new feature, verify which gap it falls under and ensure it correctly updates the corresponding logic pipeline.
