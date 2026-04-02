# Pro Life-OS (Personal Resource Planner) & Agents Tracking

This document preserves the current design philosophy, roadmap, and desired capabilities for the AI assistants (Agents) managing the safiulalom_bot system.

## Philosophy
This is not a generic "tracking app." It is a **Pro Life-OS** (Personal Resource Planner) connecting a static Next.js dashboard with the complex logic of real-life:
1. **The Smart Core**: NLP-driven ingestion (Gemini) that categorizes natural text into structured dynamic schemas.
2. **Multi-Entity System**: Tracking people, family (wives, children), offices, and shops universally as flexible entities linked by relationships and groupings (e.g., "House 1").
3. **Advanced Ledger**: Using metadata to track itemized groceries, fuel usage (mileage), and third-party escrow (tax-token).

## Structural Requirements
To transform this into the Life-OS, the following architectural gaps are being addressed sequentially:

1. **The "Validation" Gap (COMPLETED)**
   - **Need**: A pending database to handle the friction of "busy" developer mode (Telegram on the go).
   - **Feature**: "Draft & Confirm". Telegram data lands in `pending_entries`. Dashboard UI presents a Red Badge to review AI interpretation before moving it to the canonical ledger.

2. **The "Entity" & Schema Gap (IN PROGRESS)**
   - **Need**: Move beyond simple "Lenden". Support robust Profiles (Wife, Child, Shop) with Relationships and Groupings.
   - **Feature**: A unified `entities` collection. Updating the `ledger_entries` schema to support JSONB-style flexible `metadata` (e.g., odometer readings, itemized Grocery lists) and specific `accountId` logic. 
   - **Feature**: Handling third-party liabilities (Tax token scenario: IN 2400 mapped to Person A; OUT 2334.5 mapped back to Person A's escrow balance). 

3. **The "Smart Logic" Gap**
   - **Need**: Reconfigure the Gemini AI Prompt.
   - **Feature**: AI Auto-Tagging and Metadata Extraction. Converting unstructured text ("Ammu k bajar dilam 500") into structured JSON bound to the new Entity Schema.

4. **The UI/UX & Reporting Gap**
   - **Need**: Granular and dynamic Dashboard querying.
   - **Feature**: Filtering reports natively in Next.js (e.g., "House 2 Expenses Last 3 Months", "Hujyfa Medicine All Time").

5. **The Multi-User Gap**
   - **Need**: Team and Roles abstraction via `familyGroupId` or `organizationId`.
   - **Feature**: Granular permissions (Owner, Editor, Viewer). Allows Family to check generic ledgers.

*Last updated during Entity Schema Migration phase.*
