# Pro Life-OS (Personal AI Assistant) & Agents Tracking

This document preserves the current design philosophy, roadmap, and desired capabilities for the AI assistants (Agents) managing the safiulalom_bot system.

## 🚀 The Life-OS Philosophy
This is not a generic "tracking app." It is a **Pro Life-OS** (Personal AI Assistant) connecting a static dashboard with the complex logic of real-life. It stands apart from regular expense trackers by integrating three core pillars:
1. **The Smart Ledger**: A high-precision accounting system that handles messy, real-world money flows.
2. **The Relationship Graph**: A multi-entity system tracking people, family, offices, and shops universally.
3. **The AI Decision Engine**: An NLP-driven core (Gemini) that categorizes natural text into structured dynamic schemas and proactively asks clarifying questions.

---

## 🧠 Transaction Classification (Master Core)
Life-OS simplifies every possible financial interaction into **6 Core Master Types**:

1.  **IN (Income):** Salary, Freelance, Gifts, Bonus, Interest, Refunds.
2.  **OUT (Expense):** Bajar, Food, Rent, Bills, Medical, Travel.
3.  **TRANSFER:** Internal movement (Cash → bKash, Bank → Cash).
4.  **DEBT_GIVEN (Loan Given):** You are the creditor (e.g., "Hasif ke 1000 dilam").
5.  **DEBT_TAKEN (Loan Taken):** You are the debtor (e.g., "Ammu theke 2000 nilam").
6.  **SETTLEMENT (Loan Clear):** Settling an existing debt (e.g., "Hasif debt ferot dise").

---

## 🌍 Multi-Domain Scenarios
The system is designed to handle life across multiple contexts seamlessly:

### 🏠 1. Personal Life
- **Lending/Borrowing:** Dynamic tracking of "Who owes whom".
- **Internal Transfers:** Keeping account balances (bKash, Bank, Cash) perfectly synced.
- **Special Cases:** Gifts, Zakat, Charity, and Donations.

### 👨‍👩‍👧 2. Family & Social
- **Support:** Monthly expenses for family members (Ammu, Wife, Children).
- **Social:** Biye/Dawat khoroch, relative loans, and Eidi tracking.

### 💼 3. Work & Professional
- **Income:** Overtime, Commission, and Bonuses.
- **Expenses:** Office transport, lunch, software subscriptions.
- **Liabilities:** Colleague loans, Office advances.

### 🏢 4. Business Transactions
- **Revenue:** Product sales, service income, subscriptions.
- **Operations:** Purchase (inventory), Employee salary, Marketing, Rent.
- **Lending:** Vendor payables, Customer receivables.
- **Inventory:** Stock adjustments and product buy/sell cycles.

### 🏦 5. Financial System Scenarios
- **Payments:** Card payments, EMI logic, and Loan Installments.
- **Adjustments:** Balance corrections, write-offs, and loss/damage logging.

---

## ⚠️ AI Edge Case Handling (Intelligence Layer)
The AI Agent must follow these strict rules for messy inputs:

1.  **Unknown Source:** "500 dilam" -> **ASK:** "From which account (Cash/Bank)?"
2.  **Unknown Entity:** "Rahim ke dilam" -> **ACTION:** Auto-create person entity "Rahim".
3.  **Insufficient Balance:** Balance 100, spend 500 -> **ASK:** "Is this a loan or should I force it?"
4.  **Mixed Scenarios:** "Hasif ke 500 dilam bkash diye" -> **ACTION:** Map Entity (Hasif) + Account (bKash) + Transaction Type (DEBT_GIVEN).

---

## 🛠 Structural Roadmap

### 1. The "Precision Parsing" Gap (COMPLETED)
- **Feature**: Instant AI interpretation with structured JSON output and proactive clarifying questions.

### 2. The "Deterministic Context" Gap (COMPLETED)
- **Feature**: Pre-AI database lookups. Fetching last fuel, last odo, and last person records *before* calling the LLM to save tokens and improve accuracy.

### 3. Master Shortcuts & Intelligence
To manage Life-OS properly, use these "Pro" shortcuts in chat:
- **@Entity**: Use `@Name` to link a person or specific shop (e.g., `@Hasif ke 500 dilam`).
- **#Account**: Use `#AccountName` to specify source/destination (e.g., `#bKash theke recharge`).
- **Date Queries**: Use "Kobe", "Last", or "Agey" to search history (e.g., `@Motaher vi ke kobe tk disi?`).
- **Bajar Lists**: Use lists like "Aloo 2kg 50, Murgi 1kg 200" for automatic item extraction.

---

## 💡 Practical Setup Examples

### 💼 Scenario: Office Manager
Keep office funds completely separate from personal money.
1. **Setup:** "Add account #Office_Fund"
2. **Receive Fund:** "Boss theke 20,000 pelam #Office_Fund e"
3. **Spend Fund:** "#Office_Fund theke 500 tk stationary khoroch"
4. **Report:** "Office funder summary daw"

### 🎓 Scenario: Bachelor Mess
Track shared bazar and daily meals effortlessly.
1. **Setup:** "Add account #Mess_Fund" and "Add @Rahim, @Karim as Roommates"
2. **Bajar:** "Mess fund theke 1200 bajar: Murgi, Dim, Tel"
3. **Meal Log:** "Meal log: Ami-2, Rahim-1, Karim-2" (AI records counts in metadata)
4. **Settle:** "Mess summary koto?" (Calculates based on total bazar and total meals)

---

### 3. The "Multi-Platform Connector" (COMPLETED)
- **Feature**: Unified experience across **Telegram** and **WhatsApp** (via WaAPI). Both platforms share the same intelligence core and credit ledger.

### 4. The "Entity & Relationship" Gap (COMPLETED)
- **Feature**: Robust Profiles with sub-types (Wife, Child, Shop, Vendor).
- **Status**: JSONB-style flexible metadata for entity-specific logic (e.g., mileage for bikes, shelf-life for inventory).

### 5. The "Admin Decision Engine" (COMPLETED)
- **Feature**: Resource management (Credit Limits) & Governance.
- **Status**: Daily 50 AI bits limit implemented. Admin dashboard for users management (Suspend/Activate), credit resets, and comprehensive system audit logs.

### 6. The "Precision Team" Gap (COMPLETED)
- **Feature**: Role-Based Access Control (RBAC).
- **Status**: 'OWNER', 'EDITOR', and 'VIEWER' roles implemented. Owners manage members and roles, while Viewers have read-only access to sensitive financial data.

---

## 📱 Multi-Platform Ecosystem
Life-OS operates seamlessly across:
1.  **Telegram Bot**: Primary interface for advanced commands and reports.
2.  **WhatsApp Bot**: Secondary interface for quick natural language entries.
3.  **Next.js Dashboard**: The visual brain for deep-dive analysis, settlement, and entity management.

### 🛂 Account Sync (Universal ID)
Users can link their **Google Account**, **Telegram ID**, and **WhatsApp Number** to a single unified ledger. Use the `/login` command on any platform to synchronize.

---

## 💎 AI Bits & Credit System
To ensure fair usage and maintain server costs, Life-OS uses a **Credit System**:
- **Daily Default**: 50 AI Bits per user.
- **Consumption**: 1 Bit per AI natural language request. (Utility commands like `/balance` or `/summary` are FREE).
- **Manual Upgrades**: Users can send support to `01967550181` (bKash/Nagad/Rocket) and submit screenshots to `@safiulalom` on Telegram.
- **Admin Processing**: Admins verify the proof and upgrade the `daily_credit_limit` via the Admin Panel.

---

## 🛡 Security & Administration
- **Suspension**: Admins can block/unblock users directly from the Admin Panel.
- **Audit Logs**: Every administrative action (team invites, role changes, name updates) is persisted in `action_logs` for transparency.
- **Privacy**: The bot only responds in Private Chats to ensure financial confidentiality.
- **Legal Compliance**: Dedicated [Terms of Service](/terms) and [Privacy Policy](/privacy) pages define user data rights and platform responsibilities.

*Last updated during Team Management and Admin Panel phase.*
