# Pro Life-OS (Personal Resource Planner) & Agents Tracking

This document preserves the current design philosophy, roadmap, and desired capabilities for the AI assistants (Agents) managing the safiulalom_bot system.

## 🚀 The Life-OS Philosophy
This is not a generic "tracking app." It is a **Pro Life-OS** (Personal Resource Planner) connecting a static dashboard with the complex logic of real-life. It stands apart from regular expense trackers by integrating three core pillars:
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

### 1. The "Validation" Gap (COMPLETED)
- **Feature**: "Draft & Confirm". Instant AI interpretation with a UI review step before final ledger entry.

### 2. The "Deterministic Context" Gap (COMPLETED)
- **Feature**: Pre-AI database lookups. Fetching last fuel, last odo, and last person records *before* calling the LLM to save tokens and improve accuracy.

### 3. The "Entity & Relationship" Gap (IN PROGRESS)
- **Need**: Robust Profiles with sub-types (Wife, Child, Shop, Vendor).
- **Feature**: JSONB-style flexible metadata for entity-specific logic (e.g., mileage for bikes, shelf-life for inventory).

### 4. The "AI Decision Engine" Gap (PLANNING)
- **Need**: Move beyond simple parsing to actual advice.
- **Feature**: "Should I buy this?" logic based on budget and goals.

### 5. Multi-User & Organization Gap (PLANNING)
- **Need**: Shared family buckets and separate business ledgers.
- **Feature**: Granular permissions (Owner, Editor, Viewer).

*Last updated during AI Intelligence and Token Optimization phase.*
