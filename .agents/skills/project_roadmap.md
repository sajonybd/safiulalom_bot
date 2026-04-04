---
name: Project Roadmap
description: Provides the context and architectural goals for the safiulalom_bot Pro Life-OS.
---

# Project Roadmap & AI Guidelines

When working on the `safiulalom_bot` repository, the AI must keep the following "Pro Life-OS" goals in mind:

1. **The Validation Gap (COMPLETED):** All complex, quickly entered data (like from Telegram/WhatsApp) goes through a "Pending Database" (`pending_entries`) before being added to the official transaction ledger. The Dashboard acts as the validation hub.
2. **The Multi-Platform Gap (COMPLETED):** Support for Telegram and WhatsApp (via WaAPI) unified under a single user identity and ledger.
3. **The Resource Gap (COMPLETED - Phase 1):** Credit system (50 AI Bits/day) and administrative suspension/top-ups.
4. **The Entity & Schema Gap (IN PROGRESS):** The Lenden isn't just basic assets/liabilities. We manage multiple profiles (Wife, Child, Office, Shops) universally in an `entities` collection. The ledger must link to these `entities` and track Third-Party funds. Metadata schemas support micro-metrics (e.g. Odometer, Grocery items).
5. **The UI/UX Gap (PRIORITY):** The Next.js dashboard needs dynamic deep-dive reports (e.g. "Total spent on House 2 last month").
6. **The Logic Gap (FUTURE):** AI decision engine for advice "Should I buy this?".

Always check `/agents.md` in the root directory for the latest overarching status updates and philosophy.
