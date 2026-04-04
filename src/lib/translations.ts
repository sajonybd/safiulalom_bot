export const translations: Record<string, Record<string, string>> = {
  en: {
    overview: "Overview",
    entities: "Entities",
    accounts: "Accounts",
    lenden: "Lenden",
    reports: "Reports",
    team: "Team",
    settings: "Settings",
    help_docs: "Help & Docs",
    logout: "Logout",
    dashboard: "Dashboard",

    // Transactions
    add_transaction: "Add Transaction",
    edit_transaction: "Edit Transaction",
    income: "Income",
    expense: "Expense",
    transfer: "Transfer",
    loan_given: "Loan Given",
    loan_taken: "Loan Taken",
    person_in: "Person In",
    person_out: "Person Out",
    settlement_in: "Settlement In",
    settlement_out: "Settlement Out",
    fund_received: "Fund Received",
    subscription: "Subscription",

    amount: "Amount",
    note: "Note",
    person: "Person",
    source_account: "Source Account",
    dest_account: "Dest Account",
    date: "Date",
    type: "Type",
    save_changes: "Save Changes",
    save_transaction: "Save Transaction",

    // Lenden
    receivable: "Receivable",
    payable: "Payable",
    all: "All",
    balance: "Balance",
    net_position: "Net Position",
    actions: "Actions",
    settle: "Settle",
    add_loan_debt: "Add Loan/Debt",
    lenden_desc: "Track debts, loans & settlements",
    net: "Net",

    // Accounts
    total_balance: "Total Balance",
    active_account: "Active Account",
    transfer_btn: "Transfer",
    add_money: "Add Money",
    withdraw: "Withdraw",
    adjust: "Adjust",
    recent_transactions: "Recent Transactions",
    across_accounts: "Across {count} accounts",
    manage_wallets: "Manage wallets & accounts",
    wallets: "Wallets",

    // Dashboard / Overview
    month: "Month",
    month_transactions: "transactions this month",
    pending: "pending",
    no_recent_activity: "No recent activity",
    recent_activity: "Recent Activity",
    entity_explorer: "Entity Explorer",
    all_contacts: "All Contacts",
    all_caught_up: "All caught up! No pending items.",
    entries: "entries",

    // Settings
    profile: "Profile",
    security: "Security",
    notifications: "Notifications",
    appearance: "Appearance",
    language: "Language",
    currency: "Currency",
    manage_account_desc: "Manage your account & preferences",
    profile_info: "Profile Information",
    change_photo: "Change Photo",
    photo_help: "JPG, PNG. Max 2MB.",
    full_name: "Full Name",
    first_name: "First Name",
    last_name: "Last Name",
    display_name: "Display Name",
    email_label: "Email",
    phone_label: "Phone",
    telegram_id: "Telegram ID",
    connected_via: "Connected via Telegram bot",
    update_password: "Update Password",
    current_password: "Current Password",
    new_password: "New Password",
    confirm_password: "Confirm Password",
    two_factor: "Two-Factor Authentication",
    enable_2fa: "Enable 2FA",
    extra_security: "Add extra security to your account",
    active_sessions: "Active Sessions",
    connected_api: "API",
    active_status: "Active",
    notification_prefs: "Notification Preferences",
    telegram_notif: "Telegram Notifications",
    telegram_notif_desc: "Receive confirmations via bot",
    daily_summary: "Daily Summary",
    daily_summary_desc: "Get a daily report at 9 PM",
    pending_reminders: "Pending Reminders",
    pending_reminders_desc: "Remind about unresolved entries",
    lenden_alerts: "Lenden Alerts",
    lenden_alerts_desc: "Notify when receivable is overdue",
    budget_warnings: "Budget Warnings",
    budget_warnings_desc: "Alert when exceeding budget limits",
    dark_mode: "Dark Mode",
    dark_mode_desc: "Switch between light and dark themes",

    // Entity Placeholders
    placeholder_person_name: "e.g. Safiul Alom, Hujyfa",
    placeholder_person_sub: "e.g. Wife, Brother, Friend",
    placeholder_person_grp: "e.g. Family, Work",
    placeholder_org_name: "e.g. Meena Bazar, Pharmacy",
    placeholder_org_sub: "e.g. Groceries, Medicine",
    placeholder_org_grp: "e.g. Sector 4, Market",
    placeholder_acc_name: "e.g. bKash, Cash, City Bank",
    placeholder_acc_sub: "e.g. Wallet, Savings, Business",
    placeholder_acc_grp: "e.g. Personal, Shop 1",
    placeholder_util_name: "e.g. DESCO, WASA, Titas Gas",
    placeholder_util_sub: "e.g. Electricity, Water, Bill",
    placeholder_util_grp: "e.g. House 1, Office",
    placeholder_asset_name: "e.g. Bike FZ-V3, Toyota Corolla",
    placeholder_asset_sub: "e.g. Bike, Car, Gadget",
    placeholder_asset_grp: "e.g. Personal, Business",

    // Help Modal
    help_guide_title: "Transaction Guide & Docs",
    help_guide_desc:
      "Learn how to manage your transactions, accounts, and lending (Lenden) effectively.",
    help_acc_flow: "Account Flow (Source vs Destination)",
    help_source_desc:
      "The wallet or bank account where the money is coming FROM. Use this when you are spending or transferring money.",
    help_dest_desc:
      "The wallet or bank account where the money is going TO. Use this when you are receiving or transferring money.",
    help_example_transfer:
      "Example: Cash (Source) -> Bkash (Dest) = You put cash into your Bkash.",
    help_types_title: "Transaction Types",
    help_income_desc:
      "General money coming in (Salary, Gift, etc.). Increases account balance.",
    help_expense_desc:
      "General money spent (Food, Rent, etc.). Decreases account balance.",
    help_transfer_desc:
      "Moving money between your own accounts. No net change in wealth.",
    help_settle_desc:
      "Paying back a debt or receiving a repayment. Closes a receivable/payable.",
    help_lenden_title: "Receivable & Payable (Lenden)",
    help_receivable_title: "Receivable (Lending Money)",
    help_receivable_desc:
      "You give money to someone. They owe you. This increases your Receivable total.",
    help_receivable_types: "Types: Person Out, Loan Given.",
    help_payable_title: "Payable (Borrowing Money)",
    help_payable_desc:
      "You take money from someone. You owe them. This increases your Payable total.",
    help_payable_types: "Types: Person In, Loan Taken, Fund Received.",

    // Common Actions
    search: "Search",
    search_placeholder: "Search...",
    filter: "Filter",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    confirm: "Confirm",
    loading: "Loading...",
    delete_transaction: "Delete Transaction",
    delete_confirm_generic:
      "Are you sure you want to delete this transaction? This cannot be undone.",

    // Entities
    directory_entities: "Directory & Entities",
    manage_entities_desc: "Manage your People, Assets, and Utilities",
    add_entity: "Add Entity",
    create_new_entity: "Create New Entity",
    edit_entity: "Edit Entity",
    delete_entity: "Delete Entity",
    delete_confirm: "Are you sure you want to delete {name}?",
    no_entities_found: "No entities found.",

    // Entity Types
    type_person: "Person",
    type_organization: "Organization/Shop",
    type_account: "Wallet/Account",
    type_utility: "Utility/Service",
    type_asset: "Asset/Vehicle",

    // Form Labels
    name: "Name",
    sub_type_relation: "Sub-Type / Relation",
    group_house: "Group / House",
    opening_balance: "Opening Balance (Optional)",
    current_balance: "Current Balance",
    select_type: "Select type",
    select_account: "Select account",
    select_person: "Select or enter person",
    select_currency: "Select currency",
    select_language: "Select language",

    // Sidebar
    financial_dashboard: "Financial Dashboard",
    via: "via",

    // Reports
    analytics_desc: "Analytics & financial insights",
    this_month: "This Month",
    category_breakdown: "Category Breakdown",
    net_savings: "Net Savings",
    awaiting_data: "Awaiting data from API...",

    // Team
    my_team: "My Team",
    my_teams_profiles: "My Teams & Profiles",
    my_personal_ledger: "My Personal Ledger",
    manage_team: "Manage Team",
    manage_teams: "Manage Teams & Profiles",
    manage_team_desc: "Manage your family or organization members",
    add_member: "Add Member",
    invite_member: "Invite Member",
    member: "Member",
    role: "Role",
    status: "Status",
    active: "Active",
    pending_status: "Pending",
    pending_invitations: "Pending Invitations",
    invited_as: "Invited as",
    send_invitation: "Send Invitation",
    my_teams: "My Teams",
    owner_desc: "Full access to everything",
    editor_desc: "Can add/edit entries, manage people",
    viewer_desc: "Read-only access to data",
    invite_member_desc_telegram:
      "Enter the Telegram User ID of the person you want to add to your team.",
    telegram_id_help:
      "Users can find their ID by typing /login in the Telegram bot.",
    add_to_team: "Add to Team",
    manage_role: "Manage Role",
    no_members_found: "No team members found.",

    // Login
    welcome_to: "Welcome to Life-OS : Personal AI Assistant",
    login_desc: "Login or create an account to access the Financial Dashboard",
    telegram_login_desc:
      "Check your Telegram bot using /login for your ID and OTP code.",
    continue_with_google: "Continue with Google",
    continue_with_telegram: "Continue with Telegram",
    telegram_user_id: "Telegram User ID",
    login_otp_code: "Login OTP Code",
    verify_and_login: "Verify & Login",
    by_continuing_agree: "By continuing, you agree to our ",
    terms_of_service: "Terms of Service",
    and: " and ",
    privacy_policy: "Privacy Policy",
    login_id_placeholder: "e.g. 123456789",
    login_code_placeholder: "6-digit code",
    login_success: "Successfully logged in!",
    login_failed: "Failed to login",
    verifying_token: "Verifying token...",
    telegram_sync: "Sync with Telegram",
    sync_telegram_desc:
      "Connect your Telegram account to use the bot with this account.",
    sync_success: "Telegram account linked successfully!",
    sync_failed: "Failed to link Telegram account",
    how_to_get_id_code:
      "Type /login in the Telegram bot to get your ID and code.",
    already_synced: "Already synced with Telegram",
    link_now: "Link Now",
    enter_id_code: "Please enter both Telegram ID and the Code.",
    use_custom: "Use",
    no_results: "No results found",

    // Toasts
    entity_created: "Entry created successfully",
    entity_updated: "Entry updated successfully",
    failed_to_save: "Failed to save",
    data: "Backup & Transfer",
    data_management: "Backups & Portability",
    data_desc: "Handle your financial data portability.",
    export_data: "Export Records",
    export_desc:
      "Get a full JSON backup of your current family's ledger and entities.",
    import_data: "Import Records",
    import_desc: "Upload a Life-OS backup file to restore it as a new team.",
    export: "Export",
    import: "Import",
    export_success: "Data exported successfully",
    export_failed: "Export failed",
    import_success: "Data imported! Switch teams to see it.",
    import_failed: "Import failed",
    invalid_json: "The file is not a valid JSON backup",
    safety_tip: "Safety Tip",
    import_merge_tip:
      "Importing creates a new family identity. No existing data will be overwritten.",

    // Chat
    chat_assistant: "Life-OS Assistant",
    ask_anything: "Ask anything about your life or finances...",
    type_message: "Type a message...",
    assistant_typing: "Assistant is thinking...",
    chat_history: "Chat History",
    how_can_i_help: "How can I help you today?",
    save_as_draft: "Save as Draft",
    save_success: "Saved successfully!",
    delete_success: "Deleted successfully",
    clear_history: "Clear History",
    clear_history_confirm:
      "Are you sure you want to clear this team's chat history?",

    // Credits & Limits
    credits: "Credits",
    daily_limit: "Daily Limit",
    out_of_credits: "You are out of credits for today.",
    credit_used: "-1 Credit used",
    remaining: "Remaining",

    // SMS
    send_sms: "Send SMS",
    sms_upcoming: "SMS integration is coming soon!",
    sms_notice: "You will be able to send ledger summaries directly via SMS.",
    // Documentation
    doc_intro_title: "Knowledge Base",
    doc_intro_desc:
      "Everything you need to know about managing your personal resources with the Life-OS system.",
    doc_chat_title: "Chat Assistant",
    doc_chat_desc:
      "Our AI assistant understands natural language. Use '@Name' (Person) and '#Account' (Wallet) for 'Pro' shortcuts. Example: '@MotaherVi dilam 500 #bKash theke'.",
    doc_tg_title: "Telegram Integration",
    doc_tg_desc:
      "Track expenses on the go! Connect your Telegram account to our bot. Simply send a message to the bot, and it will be processed instantly. Use the dashboard to review your history and reports.",
    doc_ledger_title: "Ledger & Entities",
    doc_ledger_desc:
      "Manage your 'Lenden' (receivables and payables) with ease. Track people, family members, shops, and offices as flexible entities. Group them for better organization (e.g., 'House 1 Expenses').",
    doc_reports_title: "Advanced Reporting",
    doc_reports_desc:
      "Get granular insights into your spending habits. Filter reports by person, category, or time period. See your net position across all entities instantly.",
    doc_team_title: "Precision Team Management (RBAC)",
    doc_team_desc:
      "Share your ledger with family or team members using Role-Based Access Control. Assign OWNER, EDITOR, or VIEWER roles to manage permissions and keep everyone in the loop.",
    role_owner: "OWNER",
    role_editor: "EDITOR",
    role_viewer: "VIEWER",
    role_owner_desc: "Full access: Manage team, roles, and all financial data.",
    role_editor_desc:
      "Standard access: Add and edit financial data, but cannot manage team or roles.",
    role_viewer_desc:
      "Read-only: Can see summaries and logs, but cannot add or edit anything.",
    doc_wa_title: "WhatsApp Assistant",
    doc_wa_desc:
      "Coming soon to your favorite messenger! Soon you can track everything via WhatsApp with the same AI intelligence. Stay tuned for the WaAPI integration.",
    doc_security_title: "Privacy & Security",
    doc_security_desc:
      "Your data is yours. We use advanced encryption and secure session management to ensure your financial history stays private and protected.",
    doc_admin_title: "Admin Control Room",
    doc_admin_desc:
      "A centralized hub for platform governance and resource management.",
    admin_feature_audit: "Audit Logs",
    admin_feature_audit_desc:
      "Track every administrative action (invites, role changes, names) for total transparency.",
    admin_feature_users: "User Governance",
    admin_feature_users_desc:
      "Manage user status (Active/Suspended) and manually reset or upgrade AI Bit limits.",
    doc_privacy_title: "Data Privacy Policy",
    doc_privacy_desc:
      "Life-OS is designed with privacy as the core pillar. We only collect what's necessary to maintain your financial ledger across devices.",
    privacy_collected_title: "What We Collect",
    privacy_collected_desc:
      "We only store your platform-specific IDs (Telegram/WhatsApp ID) and the basic name/username you provide to identify your ledger. We never access your contacts, location, or any other personal media.",
    privacy_assurance:
      "Other than your messenger identity, no personal data is shared, viewed, or saved by our systems. Your data is encrypted and secure.",
    quick_tips_title: "Quick Tips",
    tip_1: "Use 'transfer' type to move money between accounts.",
    tip_2: "Add 'openingBalance' in account metadata for accurate totals.",
    tip_3: "Mention person names in chat to automatically link debt entries.",
    tip_4:
      "Use @Name for people and #Account for wallets as 'Pro' shortcuts in chat.",
    new_feature_instant: "New Feature: Instant Transactions",

    // Help Modal (Now in Docs)
    help_acc_flow_title: "Account Flow (Source vs Destination)",
    help_source_long_desc:
      "The wallet or bank account where the money is coming FROM. For example, if you spend 100 TK from your pocket, 'Cash' is the Source.",
    help_dest_long_desc:
      "The wallet or bank account where the money is going TO. For example, if you deposit money into bkash, 'bkash' is the Destination.",
    help_lenden_long_desc:
      "Track who owes you and who you owe. Use 'Person Out' for lending and 'Person In' for borrowing.",

    // Life-OS Philosophy & Master Types
    doc_philosophy_title: "Why Life-OS?",
    doc_philosophy_desc:
      "Life-OS is not just an expense tracker. It combines a High-Precision Ledger, a Relationship Graph for people/places, and an AI Decision Engine to simplify complex real-life money flows.",
    doc_classification_title: "Master Transaction Types",
    doc_classification_desc:
      "We simplify all life interactions into 6 core types. Everything else is just context.",
    doc_in_title: "1. IN (Income)",
    doc_in_desc_long: "Salary, Freelance, Gifts, Bonus, Interest, Refunds.",
    doc_out_title: "2. OUT (Expense)",
    doc_out_desc_long:
      "Bajar, Food, Rent, Bills, Medical, Travel, Mobile Recharge.",
    doc_transfer_title: "3. TRANSFER",
    doc_transfer_desc_long:
      "Internal movement between your own wallets/banks (Cash → bKash).",
    doc_debt_given_title: "4. DEBT_GIVEN (Loan Given)",
    doc_debt_given_desc_long: "You are the creditor. Someone owes you money.",
    doc_debt_taken_title: "5. DEBT_TAKEN (Loan Taken)",
    doc_debt_taken_desc_long: "You are the debtor. You owe someone money.",
    doc_settlement_title: "6. SETTLEMENT (Loan Clear)",
    doc_settlement_desc_long:
      "Paying back or receiving repayment for an existing debt.",

    doc_domains_title: "Multi-Domain Support",
    doc_domain_personal: "Personal: Daily life, savings, and family.",
    doc_domain_work: "Professional: Office costs, lunch, and advances.",
    doc_domain_business: "Business: Inventory, sales, and vendor payables.",

    // Detailed Docs / Shortcuts
    doc_shortcuts_title: "Shortcuts & Magic",
    doc_shortcuts_desc:
      "Use these symbols and keywords to skip long forms and type like a pro.",
    shortcut_entity: "@Name",
    shortcut_entity_desc:
      "Links to a Person, Shop, or Office. Type '@MotaherVi dilam 500' to record debt.",
    shortcut_account: "#Account",
    shortcut_account_desc:
      "Links to a Wallet or Bank. Type '#bKash topup 100' to record fund inflow.",
    shortcut_query: "Kobe / Last",
    shortcut_query_desc:
      "Search history. Type 'Kobe tora katsi?' or 'Gari tel last kobe?' to find records.",

    // Scenarios
    doc_scenarios_title: "Real World Use Cases",
    doc_scenarios_desc:
      "How to apply Life-OS magic to your specific situation.",
    scenario_office_title: "💼 Office Manager",
    scenario_office_desc:
      "Separate your boss's funds from personal cash. Receive funds into #OfficeAccount and spend from it. Use @Boss as the source entity.",
    scenario_mess_title: "🎓 Bachelor Mess",
    scenario_mess_desc:
      "Total bazar tracking and meal logs. Use '@Rahim: 2, @Ami: 1' to record meals. Calculate meal rate at month-end using Bajar Summary / Total Meals.",

    // Detailed Command List
    doc_commands_title: "Command Cheat Sheet",
    doc_commands_desc:
      "Essential commands for both Telegram and Chat Assistant.",
    cmd_acc: "/balance",
    cmd_acc_desc: "View balances across all your wallets & banks.",
    cmd_summary: "/summary",
    cmd_summary_desc: "View current month summary (Income, Expense, Net).",
    cmd_edit: "/edit <id> <new text>",
    cmd_edit_desc: "Correct a wrong entry. Example: '/edit abc125 500 bajar'.",
    cmd_del: "/delete <id>",
    cmd_del_desc: "Delete a specific entry by its short ID.",
    cmd_login: "/login",
    cmd_login_desc: "Get your one-time link or OTP to access this Dashboard.",

    // Advanced Metadata
    doc_metadata_title: "Smart Context (Metadata)",
    doc_metadata_desc:
      "The system automatically captures detailed context for specific entities.",
    meta_odo: "Odometer (Vehicles)",
    meta_odo_desc:
      "When paying for fuel (@FZ_V3 fuel 500), mention 'odo 12500' to track mileage.",
    meta_bill: "Bill Month (Utility)",
    meta_bill_desc:
      "For @DESCO or @WASA bills, mention 'November' or 'Last month' to link the payment to the correct period.",
    meta_items: "Itemized List (Bajar)",
    meta_items_desc:
      "List items like 'Murgi 500, Tel 200' to automatically extract bazaar details.",

    // Settlement
    doc_settlement_guide_title: "Closing Debts (Settlement)",
    doc_settlement_guide_desc: "How to properly mark a loan as PAID.",
    settle_rule:
      "Use 'Settlement' type or say 'Hasif repayment dise' / 'Dena shodh korlam' in chat. This will zero out the balance for that person.",

    // Credits
    credit_system_title: "AI Bits & Credits",
    credit_system_desc:
      "To keep our AI fast and free, everyone gets 50 daily 'Bits'. Using AI naturally costs 1 bit. Basic commands like /balance are always free!",
    topup_instructions:
      "We need your support to keep this service running! For general support, send any amount. To upgrade your daily limit (double credit), it's 100 Tk / monthly. Send a screenshot of your payment to our admin to upgrade.",
    support_upgrade_title: "💖 Support & Upgrade Limit",
    support_step_1:
      "Send your support amount to 01967550181 (bKash/Rocket/Nagad Personal).",
    support_step_2: "Take a screenshot of your payment confirmation.",
    support_step_3:
      "Send the screenshot along with your Telegram ID/Phone to [ @safiulalom ](https://t.me/safiulalom).",
    support_step_4: "Your daily AI limit will be upgraded within 2-4 hours!",

    // Onboarding / How to Use
    onboarding_title: "How to Get Started",
    onboarding_desc: "Follow these steps to sync your life with Life-OS.",
    step_tg_connect_title: "🔗 Connect Telegram",
    step_tg_connect_desc:
      "1. Find our bot on Telegram. 2. Type '/login' to get your unique ID. 3. Enter the ID in Dashboard > Settings to sync your accounts.",
    step_chat_usage_title: "💬 Using Chat/Bot",
    step_chat_usage_desc:
      "Simply talk naturally! Example: '@Bazar murgi 500 #Cash'. The AI will analyze and save it. If information is missing, it will ask you a question.",
    step_report_usage_title: "📊 Viewing Reports",
    step_report_usage_desc:
      "Head to the 'Reports' page to see your monthly savings, category-wise spending, and your total net position across all wallets.",

    // More detail buttons
    more_details: "More Details",
    back_to_top: "Back to Top",
    // Privacy Policy
    privacy_header_title: "Privacy Policy",
    privacy_header_subtitle:
      "Your financial data is private. We treat it that way.",
    privacy_last_updated: "Last Updated: April 2026",
    privacy_data_collection_title: "Data Collection",
    privacy_data_collection_desc:
      "Life-OS (Personal AI Assistant) collects transaction information you provide via our Telegram and WhatsApp bots or through this dashboard. This includes:",
    privacy_coll_item_1: "Message content sent to the bots for processing.",
    privacy_coll_item_2: "Transaction details (amount, category, note, date).",
    privacy_coll_item_3:
      "Account information (names of wallets/banks you track).",
    privacy_coll_item_4:
      "Contact names specifically linked to your debts/loans.",
    privacy_security_title: "Data Security",
    privacy_security_desc:
      "We implement industry-standard encryption and security measures. Your data is stored in secure databases accessible only by authorized services. We never share your financial records with third-party advertisers or data brokers.",
    privacy_use_of_data_title: "Use of Data",
    privacy_use_of_data_desc: "Your data is used exclusively to:",
    privacy_use_item_1: "Analyze and categorize your spending habits.",
    privacy_use_item_2: "Generate financial reports and summaries.",
    privacy_use_item_3: "Respond to your queries via the AI assistant.",
    privacy_use_item_4:
      "Synchronize your records across all connected platforms.",
    privacy_contact_title: "Contact Us",
    privacy_contact_desc:
      "If you have any questions about this Privacy Policy, please contact us at [ @safiulalom ](https://t.me/safiulalom) on Telegram.",

    // Terms of Service
    terms_header_title: "Terms of Service",
    terms_header_subtitle:
      "Read these terms before using Life-OS and its bots.",
    terms_last_updated: "Effective Date: April 2026",
    terms_reg_title: "Account Registration",
    terms_reg_desc:
      "By registration and use of Life-OS (Personal AI Assistant), you are agreeing to these Terms of Service. This includes our bots on Telegram and WhatsApp.",
    terms_reg_item_1: "You must be at least 13 years of age.",
    terms_reg_item_2:
      "You are responsible for maintaining the security of your Telegram/WhatsApp account.",
    terms_reg_item_3:
      "You are sole proprietor of the data you enter into the system.",
    terms_reg_item_4:
      "We reserve the right to suspend accounts that violate our terms or usage limits.",
    terms_ai_title: "AI-Generated Content",
    terms_ai_desc:
      "The bot uses AI to process natural language. While we strive for precision, we do not guarantee 100% accuracy in financial categorization or math.",
    terms_ai_item_1:
      "Users should periodically audit their ledger records for accuracy.",
    terms_ai_item_2:
      "We are not responsible for any financial decisions made based on AI-processed data.",
    terms_ai_item_3:
      "AI Bits (credits) are consumed per request and are subject to daily limits.",
    terms_use_title: "Acceptable Use",
    terms_use_desc:
      "You agree not to use Life-OS for any illegal activities or to spam our bots. We maintain a zero-tolerance policy for abuse against our systems or support agents.",
    terms_questions_title: "Questions?",
    terms_questions_desc:
      "If you have any questions about these Terms, reach out at [ @safiulalom ](https://t.me/safiulalom) on Telegram.",

    password_managed_externally:
      "Password is managed by your login provider (Telegram/Google)",
    delete_account: "Delete Account",
    delete_account_desc: "Permanently remove your account and all data",
    delete_account_confirm:
      "Are you sure? Your account will be scheduled for deletion in 3 days.",
    remove_member: "Remove Member",
    confirm_remove_member:
      "Are you sure you want to remove this member from the team?",
    delete_team: "Delete Team",
    confirm_delete_team:
      "Are you absolutely sure you want to delete this team? This will permanently delete ALL data, including ledgers, entities, members, and chat history. THIS ACTION CANNOT BE UNDONE!",
  },
  bn: {
    overview: "ওভারভিউ",
    entities: "তালিকা",
    accounts: "অ্যাকাউন্ট",
    lenden: "লেনদেন",
    reports: "রিপোর্ট",
    team: "টিম",
    settings: "সেটিংস",
    help_docs: "সাহায্য ও তথ্য",
    logout: "লগআউট",
    dashboard: "ড্যাশবোর্ড",

    // Transactions
    add_transaction: "লেনদেন যোগ করুন",
    edit_transaction: "লেনদেন পরিবর্তন করুন",
    income: "আয়",
    expense: "ব্যয়",
    transfer: "স্থানান্তর (Transfer)",
    loan_given: "ঋণ প্রদান",
    loan_taken: "ঋণ গ্রহণ",
    person_in: "ব্যক্তি থেকে গ্রহণ (Person In)",
    person_out: "ব্যক্তিকে প্রদান (Person Out)",
    settlement_in: "নিষ্পত্তি গ্রহণ (Settlement In)",
    settlement_out: "নিষ্পত্তি প্রদান (Settlement Out)",
    fund_received: "তহবিল গ্রহণ (Fund Received)",
    subscription: "সাবস্ক্রিপশন",

    amount: "পরিমাণ",
    note: "নোট",
    person: "ব্যক্তি",
    source_account: "উৎস অ্যাকাউন্ট (Source)",
    dest_account: "গন্তব্য অ্যাকাউন্ট (Dest)",
    date: "তারিখ",
    type: "ধরণ",
    save_changes: "পরিবর্তন সংরক্ষণ করুন",
    save_transaction: "লেনদেন সংরক্ষণ করুন",

    // Lenden
    receivable: "প্রাপ্য (Receivable)",
    payable: "প্রদেয় (Payable)",
    all: "সব",
    balance: "ব্যালেন্স",
    net_position: "নিট অবস্থান",
    actions: "অ্যাকশন",
    settle: "নিষ্পত্তি করুন",
    add_loan_debt: "ঋণ/দেনা যোগ করুন",
    lenden_desc: "বকেয়া, ঋণ এবং নিষ্পত্তি ট্র্যাক করুন",
    net: "নিট",

    // Accounts
    total_balance: "মোট ব্যালেন্স",
    active_account: "সক্রিয় অ্যাকাউন্ট",
    transfer_btn: "স্থানান্তর",
    add_money: "টাকা যোগ করুন",
    withdraw: "টাকা তুলুন",
    adjust: "সমন্বয়",
    recent_transactions: "সাম্প্রতিক লেনদেন",
    across_accounts: "{count} টি অ্যাকাউন্টের মধ্যে",
    manage_wallets: "ওয়ালেট এবং অ্যাকাউন্ট ম্যানেজ করুন",
    wallets: "ওয়ালেট",

    // Dashboard / Overview
    month: "মাস",
    month_transactions: "লেনদেন এই মাসে",
    pending: "বাকি",
    no_recent_activity: "কোন সাম্প্রতিক কার্যক্রম নেই",
    recent_activity: "সাম্প্রতিক কার্যক্রম",
    entity_explorer: "তালিকা এক্সপ্লোরার",
    all_contacts: "সব কন্ট্রাক্ট",
    all_caught_up: "সব ঠিক আছে! কোন কাজ বাকি নেই।",
    entries: "এন্ট্রি",

    // Settings
    profile: "প্রোফাইল",
    security: "নিরাপত্তা",
    notifications: "নোটিফিকেশন",
    appearance: "প্রদর্শন সেটিংস",
    language: "ভাষা",
    currency: "মুদ্রা",
    manage_account_desc: "আপনার অ্যাকাউন্ট এবং পছন্দগুলি পরিচালনা করুন",
    profile_info: "প্রোফাইল তথ্য",
    change_photo: "ছবি পরিবর্তন",
    photo_help: "জেপিজি, পিএনজি। সর্বোচ্চ ২ মেগাবাইট।",
    full_name: "পুরো নাম",
    first_name: "প্রথম নাম",
    last_name: "শেষ নাম",
    display_name: "ডাক নাম",
    email_label: "ইমেল",
    phone_label: "ফোন",
    telegram_id: "টেলিগ্রাম আইডি",
    connected_via: "টেলিগ্রাম বটের মাধ্যমে সংযুক্ত",
    update_password: "পাসওয়ার্ড পরিবর্তন",
    current_password: "বর্তমান পাসওয়ার্ড",
    new_password: "নতুন পাসওয়ার্ড",
    confirm_password: "পাসওয়ার্ড নিশ্চিত করুন",
    two_factor: "টু-ফ্যাক্টর অথেনটিকেশন",
    enable_2fa: "২এফএ চালু করুন",
    extra_security: "আপনার অ্যাকাউন্টে বাড়তি নিরাপত্তা যোগ করুন",
    active_sessions: "সক্রিয় সেশনসমূহ",
    connected_api: "এপিআই (API)",
    active_status: "সক্রিয়",
    notification_prefs: "নোটিফিকেশন পছন্দসমূহ",
    telegram_notif: "টেলিগ্রাম নোটিফিকেশন",
    telegram_notif_desc: "বটের মাধ্যমে কনফার্মেশন গ্রহণ করুন",
    daily_summary: "দৈনিক সারাংশ",
    daily_summary_desc: "রাত ৯টায় দৈনিক রিপোর্ট পান",
    pending_reminders: "বাকি কাজের রিমাইন্ডার",
    pending_reminders_desc: "নিষ্পত্তি না হওয়া এন্ট্রিগুলোর কথা মনে করিয়ে দিন",
    lenden_alerts: "লেনদেন সর্তকতা",
    lenden_alerts_desc: "পাওনা বকেয়া হলে নোটিফিকেশন দিন",
    budget_warnings: "বাজেট সর্তকতা",
    budget_warnings_desc: "বাজেটের সীমা অতিক্রম করলে সর্তক করুন",
    dark_mode: "ডার্ক মোড",
    dark_mode_desc: "লাইট এবং ডার্ক থিমের মধ্যে পরিবর্তন করুন",

    // Entity Placeholders
    placeholder_person_name: "যেমন: শফিউল আলম, হুজাইফা",
    placeholder_person_sub: "যেমন: স্ত্রী, ভাই, বন্ধু",
    placeholder_person_grp: "যেমন: পরিবার, কাজ",
    placeholder_org_name: "যেমন: মীনা বাজার, ফার্মেসী",
    placeholder_org_sub: "যেমন: মুদি বাজার, ওষুধ",
    placeholder_org_grp: "যেমন: সেক্টর ৪, মার্কেট",
    placeholder_acc_name: "যেমন: বিকাশ, নগদ, সিটি ব্যাংক",
    placeholder_acc_sub: "যেমন: ওয়ালেট, সেভিংস, বিজনেস",
    placeholder_acc_grp: "যেমন: ব্যক্তিগত, শপ ১",
    placeholder_util_name: "যেমন: ডেসকো, ওয়াসা, তিতাস গ্যাস",
    placeholder_util_sub: "যেমন: বিদ্যুৎ, পানি, গ্যাস বিল",
    placeholder_util_grp: "যেমন: বাসা ১, অফিস",
    placeholder_asset_name: "যেমন: বাইক এফজে-ভি৩, টয়োটা করোলা",
    placeholder_asset_sub: "যেমন: বাইক, গাড়ি, গ্যাজেট",
    placeholder_asset_grp: "যেমন: ব্যক্তিগত, বিজনেস",

    // Help Modal
    help_guide_title: "লেনদেন গাইড ও তথ্য",
    help_guide_desc:
      "কীভাবে আপনার লেনদেন, অ্যাকাউন্ট এবং লেনদেন (Lenden) কার্যকরভাবে পরিচালনা করবেন তা শিখুন।",
    help_acc_flow: "অ্যাকাউন্ট প্রবাহ (উৎস বনাম গন্তব্য)",
    help_source_desc:
      "যে ওয়ালেট বা ব্যাংক অ্যাকাউন্ট থেকে টাকা বের হচ্ছে। যখন আপনি খরচ বা স্থানান্তর করছেন তখন এটি ব্যবহার করুন।",
    help_dest_desc:
      "যে ওয়ালেট বা ব্যাংক অ্যাকাউন্ট টাকা ঢুকছে। যখন আপনি টাকা পাচ্ছেন বা স্থানান্তর করছেন তখন এটি ব্যবহার করুন।",
    help_example_transfer:
      "উদাহরণ: ক্যাশ (উৎস) -> বিকাশ (গন্তব্য) = আপনি বিকাশে নগদ টাকা জমা করেছেন।",
    help_types_title: "লেনদেনের ধরণ",
    help_income_desc:
      "সাধারণ টাকা আসা (বেতন, উপহার ইত্যাদি)। এটি অ্যাকাউন্টের ব্যালেন্স বাড়িয়ে দেয়।",
    help_expense_desc:
      "সাধারণ খরচ (খাবার, ঘর ভাড়া ইত্যাদি)। এটি অ্যাকাউন্টের ব্যালেন্স কমিয়ে দেয়।",
    help_transfer_desc:
      "আপনার নিজের অ্যাকাউন্টগুলোর মধ্যে টাকা স্থানান্তর। এতে আপনার মোট সম্পদের পরিবর্তন হয় না।",
    help_settle_desc:
      "ঋণ পরিশোধ করা বা পাওনা ফেরত পাওয়া। এটি পাওনা/দেনা বন্ধ (Close) করে দেয়।",
    help_lenden_title: "প্রাপ্য ও প্রদেয় (লেনদেন)",
    help_receivable_title: "প্রাপ্য (RECEIVABLE - টাকা ধার দেয়া)",
    help_receivable_desc:
      "আপনি কাউকে টাকা দিয়েছেন। সে আপনার কাছে ঋণী। এটি আপনার মোট প্রাপ্য (Receivable) বাড়িয়ে দেয়।",
    help_receivable_types:
      "ধরণ: পারসন আউট (Person Out), ঋণ প্রদান (Loan Given)।",
    help_payable_title: "প্রদেয় (PAYABLE - টাকা ধার নেয়া)",
    help_payable_desc:
      "আপনি কারো কাছ থেকে টাকা নিয়েছেন। আপনি তার কাছে ঋণী। এটি আপনার মোট প্রদেয় (Payable) বাড়িয়ে দেয়।",
    help_payable_types:
      "ধরণ: পারসন ইন (Person In), ঋণ গ্রহণ (Loan Taken), তহবিল গ্রহণ।",

    // Common Actions
    search: "অনুসন্ধান",
    search_placeholder: "অনুসন্ধান করুন...",
    filter: "ফিল্টার",
    add: "যোগ করুন",
    edit: "পরিবর্তন",
    delete: "মুছে ফেলুন",
    save: "সংরক্ষণ",
    cancel: "বাতিল",
    confirm: "নিশ্চিত করুন",
    loading: "লোড হচ্ছে...",
    delete_transaction: "লেনদেন মুছে ফেলুন",
    delete_confirm_generic:
      "আপনি কি নিশ্চিত যে আপনি এই লেনদেনটি মুছে ফেলতে চান? এটি আর ফিরিয়ে আনা যাবে না।",

    // Entities
    directory_entities: "তালিকা ও ব্যবস্থাপনা",
    manage_entities_desc: "ব্যক্তি, সম্পদ এবং ইউটিলিটি পরিচালনা করুন",
    add_entity: "তালিকা যোগ করুন",
    create_new_entity: "নতুন তালিকা তৈরি করুন",
    edit_entity: "তালিকা পরিবর্তন করুন",
    delete_entity: "তালিকা মুছে ফেলুন",
    delete_confirm: "আপনি কি নিশ্চিত যে আপনি {name} মুছতে চান?",
    no_entities_found: "কোন তালিকা পাওয়া যায়নি।",

    // Entity Types
    type_person: "ব্যক্তি",
    type_organization: "প্রতিষ্ঠান/দোকান",
    type_account: "ওয়ালেট/অ্যাকাউন্ট",
    type_utility: "ইউটিলিটি/সার্ভিস",
    type_asset: "সম্পদ/যানবাহন",

    // Form Labels
    name: "নাম",
    sub_type_relation: "সাব-টাইপ / সম্পর্ক",
    group_house: "গ্রুপ / বাড়ি",
    opening_balance: "প্রারম্ভিক ব্যালেন্স (ঐচ্ছিক)",
    current_balance: "বর্তমান ব্যালেন্স",
    select_type: "ধরণ নির্বাচন করুন",
    select_account: "অ্যাকাউন্ট নির্বাচন করুন",
    select_person: "ব্যক্তি নির্বাচন করুন বা লিখুন",
    select_currency: "মুদ্রা নির্বাচন করুন",
    select_language: "ভাষা নির্বাচন করুন",

    // Sidebar
    financial_dashboard: "ফাইনান্সিয়াল ড্যাশবোর্ড",
    via: "মাধ্যমে",

    // Reports
    analytics_desc: "অ্যানালিটিক্স এবং আর্থিক তথ্য",
    this_month: "এই মাস",
    category_breakdown: "ক্যাটেগরি ব্রেকডাউন",
    net_savings: "নিট সঞ্চয়",
    awaiting_data: "API থেকে তথ্যের জন্য অপেক্ষা করা হচ্ছে...",

    // Team
    my_team: "আমার টিম",
    my_teams_profiles: "টিম এবং প্রোফাইল",
    my_personal_ledger: "আমার ব্যক্তিগত লেজার",
    manage_team: "টিম ম্যানেজমেন্ট",
    manage_teams: "টিম ও প্রোফাইল ব্যবস্থাপনা",
    manage_team_desc: "আপনার পরিবার বা প্রতিষ্ঠানের সদস্যদের পরিচালনা করুন",
    add_member: "সদস্য যোগ করুন",
    invite_member: "সদস্য আমন্ত্রণ করুন",
    member: "সদস্য",
    role: "রোল",
    status: "স্ট্যাটাস",
    active: "সক্রিয়",
    pending_status: "অপেক্ষমান",
    pending_invitations: "অপেক্ষমান আমন্ত্রণ",
    invited_as: "আমন্ত্রণ পেয়েছেন",
    send_invitation: "আমন্ত্রণ পাঠান",
    my_teams: "আমার টিম",
    owner_desc: "সবকিছুর পূর্ণ অ্যাক্সেস",
    editor_desc: "এন্ট্রি যোগ/সম্পাদনা এবং ব্যক্তি পরিচালনা করতে পারেন",
    viewer_desc: "শুধুমাত্র তথ্য দেখার অ্যাক্সেস",
    invite_member_desc_telegram:
      "আপনি যাকে আপনার টিমে যোগ করতে চান তার টেলিগ্রাম ইউজার আইডি লিখুন।",
    telegram_id_help:
      "ব্যবহারকারীরা টেলিগ্রাম বোটে /login টাইপ করে তাদের আইডি খুঁজে পেতে পারেন।",
    add_to_team: "টিমে যোগ করুন",
    manage_role: "রোল পরিবর্তন",
    no_members_found: "কোনো টিম মেম্বার পাওয়া যায়নি।",

    // Login
    welcome_to: "Life-OS : Personal AI Assistant এ স্বাগতম",
    login_desc:
      "ফাইনান্সিয়াল ড্যাশবোর্ড ব্যবহারের জন্য লগইন করুন বা অ্যাকাউন্ট তৈরি করুন",
    telegram_login_desc:
      "আপনার আইডি এবং ওটিপি কোডের জন্য টেলিগ্রাম বোটে /login ব্যবহার করুন।",
    continue_with_google: "গুগল দিয়ে শুরু করুন",
    continue_with_telegram: "টেলিগ্রাম দিয়ে শুরু করুন",
    telegram_user_id: "টেলিগ্রাম ইউজার আইডি",
    login_otp_code: "লগইন ওটিপি কোড",
    verify_and_login: "যাচাই ও লগইন করুন",
    by_continuing_agree: "চালিয়ে যাওয়ার মাধ্যমে, আপনি আমাদের ",
    terms_of_service: "পরিষেবার শর্তাবলী",
    and: " এবং ",
    privacy_policy: "গোপনীয়তা নীতিতে",
    agree_to: " সম্মত হচ্ছেন",
    login_id_placeholder: "যেমন ১২৩৪৫৬৭৮৯",
    login_code_placeholder: "৬-ডিজিটের কোড",
    login_success: "সাফল্যের সাথে লগইন হয়েছে!",
    login_failed: "লগইন করতে ব্যর্থ হয়েছে",
    verifying_token: "টোকেন যাচাই করা হচ্ছে...",
    telegram_sync: "টেলিগ্রামের সাথে সিঙ্ক করুন",
    sync_telegram_desc:
      "আপনার টেলিগ্রাম অ্যাকাউন্টটি এই অ্যাকাউন্টের সাথে যুক্ত করুন যাতে আপনি বট ব্যবহার করতে পারেন।",
    sync_success: "টেলিগ্রাম অ্যাকাউন্ট সফলভাবে যুক্ত হয়েছে!",
    sync_failed: "টেলিগ্রাম অ্যাকাউন্ট যুক্ত করতে ব্যর্থ হয়েছে",
    how_to_get_id_code:
      "টেলিগ্রাম বোটে /login লিখে আপনার আইডি এবং কোড সংগ্রহ করুন।",
    already_synced: "ইতিমধ্যেই টেলিগ্রামের সাথে যুক্ত",
    link_now: "এখনই যুক্ত করুন",
    enter_id_code: "টেলিগ্রাম আইডি এবং কোড দুটিই প্রদান করুন।",
    use_custom: "ব্যবহার করুন",
    no_results: "কোনো ফলাফল পাওয়া যায়নি",

    // Toasts
    entity_created: "এন্ট্রি সফলভাবে তৈরি হয়েছে",
    entity_updated: "এন্ট্রি সফলভাবে পরিবর্তন হয়েছে",
    failed_to_save: "সংরক্ষণ করতে ব্যর্থ হয়েছে",
    data: "ব্যাকআপ এবং ট্রান্সফার",
    data_management: "ব্যাকআপ এবং ট্রান্সফার",
    data_desc: "আপনার আর্থিক তথ্যের ব্যাকআপ এবং প্রোটেকশন পরিচালনা করুন।",
    export_data: "ডাটা এক্সপোর্ট",
    export_desc:
      "আপনার বর্তমান টিমের সব লেনদেন ও তালিকা JSON ফাইল হিসেবে ডাউনলোড করুন।",
    import_data: "ডাটা ইম্পোর্ট",
    import_desc: "লাইফ-ওএস ব্যাকআপ ফাইল আপলোড করে নতুন একটি টিম তৈরি করুন।",
    export: "এক্সপোর্ট",
    import: "ইম্পোর্ট",
    export_success: "ডাটা সফলভাবে এক্সপোর্ট হয়েছে",
    export_failed: "এক্সপোর্ট করতে ব্যর্থ হয়েছে",
    import_success: "ডাটা ইম্পোর্ট হয়েছে! টিম পরিবর্তন করে এটি দেখতে পারবেন।",
    import_failed: "ইম্পোর্ট করতে ব্যর্থ হয়েছে",
    invalid_json: "অকার্যকর ব্যাকআপ ফাইল",
    safety_tip: "সতর্কবার্তা",
    import_merge_tip:
      "ইম্পোর্ট করলে একটি নতুন আলাদা টিম তৈরি হবে। আপনার বর্তমান ডাটা নিরাপদ থাকবে।",

    // Chat
    chat_assistant: "Life-OS অ্যাসিস্ট্যান্ট",
    ask_anything: "আপনার জীবন বা অর্থ সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন...",
    type_message: "মেসেজ লিখুন...",
    assistant_typing: "অ্যাসিস্ট্যান্ট ভাবছে...",
    chat_history: "চ্যাটের ইতিহাস",
    how_can_i_help: "আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
    save_as_draft: "ড্রাফট হিসেবে সেভ করুন",
    save_success: "সফলভাবে সংরক্ষিত হয়েছে!",
    delete_success: "সফলভাবে মুছে ফেলা হয়েছে",
    clear_history: "ইতিহাস মুছে ফেলুন",
    clear_history_confirm:
      "আপনি কি নিশ্চিত যে আপনি এই টিমের চ্যাট ইতিহাস মুছে ফেলতে চান?",

    // Credits & Limits
    credits: "ক্রেডিট",
    daily_limit: "দৈনিক লিমিট",
    out_of_credits: "আজকের জন্য আপনার ক্রেডিট শেষ হয়ে গেছে।",
    credit_used: "-১ ক্রেডিট খরচ হয়েছে",
    remaining: "বাকি আছে",

    // SMS
    send_sms: "SMS পাঠান",
    sms_upcoming: "SMS ইন্টিগ্রেশন শীঘ্রই আসছে!",
    sms_notice: "আপনি সরাসরি SMS এর মাধ্যমে লেজার সামারি পাঠাতে পারবেন।",
    // Documentation
    doc_intro_title: "নলেজ বেস (Knowledge Base)",
    doc_intro_desc:
      "Life-OS : Personal AI Assistant সিস্টেমের মাধ্যমে আপনার ব্যক্তিগত সম্পদ পরিচালনার বিষয়ে আপনার যা কিছু জানা প্রয়োজন।",
    doc_chat_title: "চ্যাট অ্যাসিস্ট্যান্ট",
    doc_chat_desc:
      "আমাদের এআই অ্যাসিস্ট্যান্ট সাধারণ ভাষা বোঝে। দ্রুত এন্ট্রির জন্য ব্যক্তির আগে '@' এবং অ্যাকাউন্টের আগে '#' শর্টকাট ব্যবহার করুন। যেমন: '@Boss ১০,০০০ দিল #OfficeFund এ'।",
    doc_tg_title: "টেলিগ্রাম ইন্টিগ্রেশন",
    doc_tg_desc:
      "সব সময় আপডেট থাকুন! আপনার টেলিগ্রাম অ্যাকাউন্ট আমাদের বটের সাথে সংযুক্ত করুন। কেবল বটকে একটি মেসেজ পাঠান এবং এটি তাৎক্ষণিকভাবে প্রসেস করা হবে।",
    doc_ledger_title: "লেজার ও তালিকা",
    doc_ledger_desc:
      "সহজেই আপনার 'লেনদেন' (প্রাপ্য এবং প্রদেয়) পরিচালনা করুন। ব্যক্তি, পরিবারের সদস্য, দোকান এবং অফিসগুলোকে নমনীয় তালিকা হিসেবে ট্র্যাক করুন।",
    doc_reports_title: "উন্নত রিপোর্টিং",
    doc_reports_desc:
      "আপনার ব্যয়ের অভ্যাস সম্পর্কে বিস্তারিত তথ্য পান। ব্যক্তি, বিভাগ বা সময়ের ভিত্তিতে রিপোর্ট ফিল্টার করুন।",
    doc_team_title: "টিম ম্যানেজমেন্ট (RBAC)",
    doc_team_desc:
      "পরিবার বা সহকর্মীদের সাথে আপনার লেজার শেয়ার করুন। পারমিশন ম্যানেজ করতে ওনার (OWNER), এডিটর (EDITOR) বা ভিউয়ার (VIEWER) রোল ব্যবহার করুন।",
    role_owner: "ওনার (OWNER)",
    role_editor: "এডিটর (EDITOR)",
    role_viewer: "ভিউয়ার (VIEWER)",
    role_owner_desc:
      "পূর্ণ অ্যাক্সেস: টিম, রোল এবং সব আর্থিক তথ্য পরিচালনা করতে পারেন।",
    role_editor_desc:
      "সাধারণ অ্যাক্সেস: তথ্য যোগ এবং এডিট করতে পারেন, কিন্তু টিম বা রোল পরিবর্তন করতে পারেন না।",
    role_viewer_desc:
      "শুধুমাত্র দেখা: সারাংশ এবং লগ দেখতে পারেন, কিন্তু কিছু যোগ বা এডিট করতে পারেন না।",
    doc_wa_title: "হোয়াটসঅ্যাপ অ্যাসিস্ট্যান্ট",
    doc_wa_desc:
      "আপনার প্রিয় মেসেঞ্জারে শীঘ্রই আসছি! খুব শীঘ্রই আপনি একই এআই বুদ্ধিমত্তা দিয়ে হোয়াটসঅ্যাপের মাধ্যমে সবকিছু ট্র্যাক করতে পারবেন।",
    doc_security_title: "গোপনীয়তা ও নিরাপত্তা",
    doc_security_desc:
      "আপনার তথ্য আপনারই। আপনার আর্থিক ইতিহাস গোপন এবং সুরক্ষিত রাখতে আমরা উন্নত এনক্রিপশন এবং নিরাপদ সেশন ম্যানেজমেন্ট ব্যবহার করি।",
    doc_admin_title: "অ্যাডমিন কন্ট্রোল রুম",
    doc_admin_desc:
      "প্ল্যাটফর্ম গভর্নেন্স এবং রিসোর্স ম্যানেজমেন্টের জন্য একটি কেন্দ্রীয় হাব।",
    admin_feature_audit: "অডিট লগ (Audit Logs)",
    admin_feature_audit_desc:
      "স্বচ্ছতার জন্য প্রতিটি প্রশাসনিক কাজ (ইনভাইট, রোল পরিবর্তন, নাম আপডেট) ট্র্যাক করুন।",
    admin_feature_users: "ইউজার গভর্নেন্স",
    admin_feature_users_desc:
      "ইউজার স্ট্যাটাস (অ্যাক্টিভ/সাসপেন্ড) পরিচালনা করুন এবং বিট লিমিট রিসেট বা আপগ্রেড করুন।",
    doc_privacy_title: "গোপনীয়তার নীতি (Privacy Policy)",
    doc_privacy_desc:
      "লাইফ-ওএস আপনার তথ্যের সুরক্ষাকে সর্বোচ্চ গুরুত্ব দেয়। আপনার হিসাবগুলো নিরাপদে সংরক্ষণ করার জন্য কেবল প্রয়োজনীয় তথ্যটুকুই সংগ্রহ করা হয়।",
    privacy_collected_title: "আমরা কি কি তথ্য সংগ্রহ করি?",
    privacy_collected_desc:
      "আমরা শুধুমাত্র আপনার মেসেঞ্জার আইডি (টেলিগ্রাম বা হোয়াটসঅ্যাপ আইডি) এবং আপনার নাম/ইউজারনেম মনে রাখি যাতে আপনার হিসাবগুলো খুঁজে পাওয়া যায়। আপনার কন্টাক্ট লিস্ট, লোকেশন বা অন্য কোনো ব্যক্তিগত ফাইল আমরা ব্যবহার করি না।",
    privacy_assurance:
      "আমরা শুধুমাত্র আপনার প্রয়োজনীয় পরিচিতিটুকু (নাম ও আইডি) আপনার লেজারটি খুঁজে পেতে ব্যবহার করি। আপনার অনুমতি ছাড়া কোনো তথ্য তৃতীয় কোনো পক্ষকে প্রদান করা হয় না এবং আপনার ব্যক্তিগত কোনো মেসেজ বা কন্টাক্ট আমরা অ্যাক্সেস করি না। আপনার ডাটা আমাদের কাছে সম্পূর্ণ নিরাপদ।",
    quick_tips_title: "কুইক টিপস",
    tip_1:
      "অ্যাকাউন্টগুলোর মধ্যে টাকা স্থানান্তরের জন্য 'ট্রান্সফার' (transfer) টাইপ ব্যবহার করুন।",
    tip_2: "সঠিক হিসাবের জন্য অ্যাকাউন্ট মেটাডেটাতে 'openingBalance' যোগ করুন।",
    tip_3:
      "দেনা-পাওনা স্বয়ংক্রিয়ভাবে লিঙ্ক করতে চ্যাটে ব্যক্তির নাম উল্লেখ করুন।",
    tip_4:
      "চ্যাটে 'প্রো' শর্টকাট হিসেবে ব্যক্তির জন্য @Name এবং ওয়ালেটের জন্য #Account ব্যবহার করুন।",
    new_feature_instant: "নতুন ফিচার: ইনস্ট্যান্ট লেনদেন",

    // Help Modal (Now in Docs)
    help_acc_flow_title: "অ্যাকাউন্ট ফ্লো (উৎস বনাম গন্তব্য)",
    help_source_long_desc:
      "যে ওয়ালেট বা ব্যাংক অ্যাকাউন্ট থেকে টাকা বের হচ্ছে। উদাহরণস্বরূপ, আপনি যদি আপনার পকেট থেকে ১০০ টাকা খরচ করেন, তবে 'ক্যাশ' হলো উৎস (Source)।",
    help_dest_long_desc:
      "যে ওয়ালেট বা ব্যাংক অ্যাকাউন্ট টাকা ঢুকছে। উদাহরণস্বরূপ, আপনি যদি বিকাশে টাকা জমা দেন, তবে 'বিকাশ' হলো গন্তব্য (Destination)।",
    help_lenden_long_desc:
      "কার কাছে আপনি টাকা পাবেন এবং কার কাছে ঋণী তা ট্র্যাক করুন। ধার দেওয়ার জন্য 'পারসন আউট' এবং ধার নেওয়ার জন্য 'পারসন ইন' ব্যবহার করুন।",

    // Life-OS Philosophy & Master Types
    doc_philosophy_title: "কেন লাইফ-ওএস (Life-OS)?",
    doc_philosophy_desc:
      "এটি সাধারণ খরচ ট্রাকারের চেয়ে অনেক উন্নত। এটি একটি প্রিসিশন লেজার, রিলেশনশিপ গ্রাফ এবং এআই ডিসিশন ইঞ্জিনের সমন্বয় যা জীবনের জটিল লেনদেনগুলোকে সহজ করে তোলে।",
    doc_classification_title: "মাস্টার লেনদেনের ধরণ",
    doc_classification_desc:
      "আমরা জীবনের সব লেনদেনকে ৬টি মূল ভাগে ভাগ করেছি। বাকি সব কেবল কনটেক্সট বা প্রেক্ষাপট।",
    doc_in_title: "১. আয় (IN)",
    doc_in_desc_long: "বেতন, ফ্রিল্যান্সিং, উপহার, বোনাস, রিফান্ড ইত্যাদি।",
    doc_out_title: "২. ব্যয় (OUT)",
    doc_out_desc_long:
      "বাজার, খাবার, ভাড়া, বিল, চিকিৎসা, ভ্রমণ, মোবাইল রিচার্জ ইত্যাদি।",
    doc_transfer_title: "৩. স্থানান্তর (TRANSFER)",
    doc_transfer_desc_long:
      "আপনার নিজের ওয়ালেট বা ব্যাংকের মধ্যে অভ্যন্তরীণ লেনদেন (যেমন: ক্যাশ → বিকাশ)।",
    doc_debt_given_title: "৪. ঋণ প্রদান (DEBT_GIVEN)",
    doc_debt_given_desc_long: "আপনি পাওনাদার। কেউ আপনার কাছে ঋণী।",
    doc_debt_taken_title: "৫. ঋণ গ্রহণ (DEBT_TAKEN)",
    doc_debt_taken_desc_long: "আপনি দেনাদার। আপনি কারো কাছে ঋণী।",
    doc_settlement_title: "৬. দেনা পরিশোধ (SETTLEMENT)",
    doc_settlement_desc_long: "বিদ্যমান ঋণের টাকা পরিশোধ করা বা ফেরত পাওয়া।",

    doc_domains_title: "মাল্টি-ডোমেইন সাপোর্ট",
    doc_domain_personal: "ব্যক্তিগত: দৈনন্দিন জীবন এবং পারিবারিক লেনদেন।",
    doc_domain_work: "পেশাদার: অফিসের খরচ, লাঞ্চ এবং অগ্রিম টাকা।",
    doc_domain_business: "ব্যবসা: ইনভেন্টরি, বিক্রি এবং ভেন্ডর পে-অ্যাবল।",

    // Detailed Docs / Shortcuts
    doc_shortcuts_title: "শর্টকাট ও ম্যাজিক",
    doc_shortcuts_desc:
      "দীর্ঘ ফর্ম পূরণ না করে প্রো-দের মতো চ্যাট করতে এই চিহ্ন এবং কিওয়ার্ডগুলো ব্যবহার করুন।",
    shortcut_entity: "@Name",
    shortcut_entity_desc:
      "ব্যক্তি, দোকান বা অফিসের সাথে লিঙ্ক করে। যেমন: '@MotaherVi ৫০০ দিলাম' বললেই হিসাব হয়ে যাবে।",
    shortcut_account: "#Account",
    shortcut_account_desc:
      "ওয়ালেট বা ব্যাংকের সাথে লিঙ্ক করে। যেমন: '#bKash ১০০ রিচার্জ' বললে ব্যালেন্স আপডেট হবে।",
    shortcut_query: "Kobe / Last",
    shortcut_query_desc:
      "পুরানো ইতিহাস খুঁজুন। যেমন: 'গাড়িতে তেল লাস্ট কবে নিসি?' বা 'রাহিম কবে ৫০০০ দিসে?' জিজ্ঞাসা করুন।",

    // Scenarios
    doc_scenarios_title: "বাস্তব জীবনের ব্যবহার (Use Cases)",
    doc_scenarios_desc:
      "আপনার নির্দিষ্ট পরিস্থিতিতে লাইফ-ওএস ম্যাজিক প্রয়োগ করার উপায়।",
    scenario_office_title: "💼 অফিস ম্যানেজার",
    scenario_office_desc:
      "বসের ফান্ড নিজের টাকা থেকে আলাদা রাখুন। #Office_Fund এ টাকা গ্রহণ করুন এবং সেখান থেকেই অফিসের খরচ করুন।",
    scenario_mess_title: "🎓 ব্যাচেলর মেস",
    scenario_mess_desc:
      "বাজারের পূর্ণ ট্র্যাকিং এবং মিল লগ। '@Rahim: ২, @Ami: ১' এভাবে মিল কাউন্ট রেকর্ড করুন। মাস শেষে মিল রেট বের করা সহজ হবে।",

    // Detailed Command List
    doc_commands_title: "কমান্ড চিট শিট (Command List)",
    doc_commands_desc:
      "টেলিগ্রাম এবং চ্যাট অ্যাসিস্ট্যান্টের জন্য অতি প্রয়োজনীয় কমান্ডগুলো নিচে দেয়া হলো।",
    cmd_acc: "/balance",
    cmd_acc_desc: "সব ওয়ালেট এবং ব্যাংকের বর্তমান ব্যালেন্স দেখুন।",
    cmd_summary: "/summary",
    cmd_summary_desc: "চলতি মাসের রিপোর্ট (টোটাল আয়, ব্যয় ও নিট সঞ্চয়) দেখুন।",
    cmd_edit: "/edit <id> <নতুন তথ্য>",
    cmd_edit_desc:
      "ভুল তথ্য ঠিক করুন। যেমন: '/edit abc125 ৫০০ বাজার' লিখে ৫০০০ টাকা থাকলে ৫০০ করে ফেলুন।",
    cmd_del: "/delete <id>",
    cmd_del_desc: "শর্ট আইডি ব্যবহার করে যেকোনো নির্দিষ্ট এন্ট্রি মুছে ফেলুন।",
    cmd_login: "/login",
    cmd_login_desc: "ড্যাশবোর্ডে লগইন করার ওটিপি বা ওয়ান-টাইম লিঙ্ক পান।",

    // Advanced Metadata
    doc_metadata_title: "স্মার্ট কন্টেক্সট (Metadata)",
    doc_metadata_desc:
      "সিস্টেম স্বয়ংক্রিয়াভাবে নির্দিষ্ট এন্ট্রিগুলোর বিস্তারিত তথ্য সংগ্রহ করে।",
    meta_odo: "ওডোমিটার (যানবাহনে)",
    meta_odo_desc:
      "গাড়িতে তেল নেওয়ার সময় (@FZ_V3 fuel ৫০০) 'odo ১২৫০০' উল্লেখ করলে মাইলেজ ট্র্যাকিং সহজ হবে।",
    meta_bill: "বিল মাস (ইউটিলিটি)",
    meta_bill_desc:
      "@DESCO বা @WASA বিলের ক্ষেত্রে 'নভেম্বর' বা 'লাস্ট মাস' উল্লেখ করলে সঠিক মাসের সাথে বিল লিঙ্ক হয়ে যাবে।",
    meta_items: "বাজারের তালিকা",
    meta_items_desc:
      "'মুরগি ৫০০, তেল ২০০' এভাবে লিখলে অটোমেটিক বাজারের আইটেমগুলো আলাদা হয়ে যাবে।",

    // Settlement
    doc_settlement_guide_title: "দেনা-পাওনা নিষ্পত্তি (Settlement)",
    doc_settlement_guide_desc:
      "কীভাবে একটি লোন 'পরিষোধ হয়েছে' হিসেবে চিহ্নিত করবেন?",
    settle_rule:
      "সেটেলমেন্ট টাইপ ব্যবহার করুন অথবা চ্যাটে বলুন 'হাফিজ রিপেমেন্ট দিসে' বা 'দেনা শোধ করলাম'। এতে ওই ব্যক্তির ব্যালেন্স জিরো হয়ে যাবে।",

    // Credits
    credit_system_title: "এআই বিটস ও ক্রেডিট",
    credit_system_desc:
      "আমাদের এআই দ্রুত এবং সচল রাখতে সবার জন্য প্রতিদিন ৫০টি 'বিটস' বরাদ্দ থাকে। এআই ব্যবহার করলে ১ বিট খরচ হয়। /balance এর মতো কমান্ডগুলো সবসময় ফ্রি!",
    topup_instructions:
      "এই সার্ভিসটি চালু রাখতে আমাদের আপনাদের সাপোর্ট প্রয়োজন! যেকোনো পরিমাণ অর্থ দিয়ে সাপোর্ট করতে পারেন। দৈনিক এআই লিমিট দ্বিগুণ (আপগ্রেড) করতে ১০০ টাকা/মাস প্রদান করুন এবং এডমিনকে স্ক্রিনশট দিন।",
    support_upgrade_title: "💖 সাপোর্ট ও লিমিট আপগ্রেড",
    support_step_1:
      "আপনার সাপোর্ট বা ফি 01967550181 (বিকাশ/রকেট/নগদ পার্সোনাল) নম্বরে পাঠান।",
    support_step_2: "টাকা পাঠানোর কনফার্মেশন মেসেজ বা স্ক্রিনশট নিন।",
    support_step_3:
      "স্ক্রিনশটটি আপনার আইডি সহ টেলিগ্রামে [ @safiulalom ](https://t.me/safiulalom) আইডিতে পাঠান।",
    support_step_4:
      "পরবর্তী ২-৪ ঘণ্টার মধ্যে আপনার দৈনিক এআই লিমিট বাড়িয়ে দেওয়া হবে!",

    // Onboarding / How to Use
    onboarding_title: "কীভাবে শুরু করবেন?",
    onboarding_desc:
      "লাইফ-ওএস-এর সাথে আপনার জীবন সিঙ্ক করতে এই কয়েকটি ধাপ অনুসরণ করুন।",
    step_tg_connect_title: "🔗 টেলিগ্রাম কানেক্ট করুন",
    step_tg_connect_desc:
      "১. টেলিগ্রামে আমাদের বটটি খুঁজুন। ২. '/login' লিখে আপনার ইউনিক আইডি সংগ্রহ করুন। ৩. ড্যাশবোর্ড > সেটিংস-এ গিয়ে আইডি-টি দিয়ে অ্যাকাউন্ট সিঙ্ক করুন।",
    step_chat_usage_title: "💬 চ্যাট/বট ব্যবহার",
    step_chat_usage_desc:
      "স্বাভাবিকভাবে চ্যাট করুন! যেমন: '@Bazar মুরগি ৫০০ #Cash'। এআই এটি প্রসেস করে সেভ করে নিবে। কোনো তথ্য কম থাকলে বট আপনাকে প্রশ্ন করবে।",
    step_report_usage_title: "📊 রিপোর্ট দেখা",
    step_report_usage_desc:
      "'রিপোর্ট' পেজে গিয়ে আপনার মাসিক সঞ্চয়, ক্যাটেগরি অনুযায়ী খরচ এবং আপনার সব ওয়ালেটের নিট ব্যালেন্স এক পলকে দেখে নিন।",

    more_details: "বিস্তারিত দেখুন",
    back_to_top: "উপরে যান",
    // Privacy Policy
    privacy_header_title: "গোপনীয়তা নীতি",
    privacy_header_subtitle:
      "আপনার আর্থিক তথ্য সম্পূর্ণ ব্যক্তিগত। আমরা সেভাবেই এটি পরিচালনা করি।",
    privacy_last_updated: "সর্বশেষ আপডেট: এপ্রিল ২০২৬",
    privacy_data_collection_title: "তথ্য সংগ্রহ",
    privacy_data_collection_desc:
      "লাইফ-ওএস (ব্যক্তিগত এআই সহকারী) আপনার টেলিগ্রাম এবং হোয়াটসঅ্যাপ বটের মাধ্যমে বা এই ড্যাশবোর্ড থেকে প্রদান করা লেনদেনের তথ্য সংগ্রহ করে। এর মধ্যে রয়েছে:",
    privacy_coll_item_1: "প্রসেসিংয়ের জন্য বোটে পাঠানো বার্তার বিষয়বস্তু।",
    privacy_coll_item_2: "লেনদেনের বিবরণ (পরিমাণ, বিভাগ, নোট, তারিখ)।",
    privacy_coll_item_3: "অ্যাকাউন্টের তথ্য (আপনার ওয়ালেট বা ব্যাংকের নাম)।",
    privacy_coll_item_4:
      "আপনার ঋণ বা ধারের সাথে যুক্ত পরিচিতি বা ব্যক্তির নাম।",
    privacy_security_title: "তথ্য নিরাপত্তা",
    privacy_security_desc:
      "আমরা আধুনিক এনক্রিপশন এবং নিরাপত্তা ব্যবস্থা ব্যবহার করি। আপনার তথ্য নিরাপদ ডেটাবেসে সংরক্ষিত থাকে যা শুধুমাত্র অনুমোদিত সার্ভিসগুলো অ্যাক্সেস করতে পারে। আমরা কখনোই আপনার আর্থিক তথ্য তৃতীয় পক্ষের বিজ্ঞাপনদাতা বা ডেটা ব্রোকারদের সাথে শেয়ার করি না।",
    privacy_use_of_data_title: "তথ্যের ব্যবহার",
    privacy_use_of_data_desc:
      "আপনার তথ্য শুধুমাত্র নিম্নলিখিত উদ্দেশ্যে ব্যবহৃত হয়:",
    privacy_use_item_1:
      "আপনার ব্যয়ের অভ্যাস বিশ্লেষণ এবং বিভাগ অনুযায়ী ভাগ করা।",
    privacy_use_item_2: "আর্থিক রিপোর্ট এবং সারাংশ তৈরি করা।",
    privacy_use_item_3: "এআই সহকারীর মাধ্যমে আপনার প্রশ্নের উত্তর দেওয়া।",
    privacy_use_item_4:
      "আপনার সব সংযুক্ত প্ল্যাটফর্মে রেকর্ড সিঙ্ক বা আপডেট রাখা।",
    privacy_contact_title: "যোগাযোগ করুন",
    privacy_contact_desc:
      "এই গোপনীয়তা নীতি সম্পর্কে আপনার কোনো প্রশ্ন থাকলে, অনুগ্রহ করে টেলিগ্রামে [ @safiulalom ](https://t.me/safiulalom) এ আমাদের সাথে যোগাযোগ করুন।",

    // Terms of Service
    terms_header_title: "পরিষেবার শর্তাবলী",
    terms_header_subtitle:
      "লাইফ-ওএস এবং এর বটগুলো ব্যবহারের আগে এই শর্তাবলী পড়ে নিন।",
    terms_last_updated: "কার্যকর তারিখ: এপ্রিল ২০২৬",
    terms_reg_title: "অ্যাকাউন্ট রেজিস্ট্রেশন",
    terms_reg_desc:
      "লাইফ-ওএস (ব্যক্তিগত এআই সহকারী) এ রেজিস্ট্রেশন এবং ব্যবহারের মাধ্যমে আপনি এই পরিষেবার শর্তাবলীতে সম্মত হচ্ছেন। এর মধ্যে আমাদের টেলিগ্রাম এবং হোয়াটসঅ্যাপ বটগুলো অন্তর্ভুক্ত।",
    terms_reg_item_1: "আপনার বয়স অন্তত ১৩ বছর হতে হবে।",
    terms_reg_item_2:
      "আপনার টেলিগ্রাম বা হোয়াটসঅ্যাপ অ্যাকাউন্টের নিরাপত্তা বজায় রাখার দায়িত্ব আপনার।",
    terms_reg_item_3: "সিস্টেমে আপনার দেওয়া সমস্ত তথ্যের মালিক আপনি নিজেই।",
    terms_reg_item_4:
      "আমাদের শর্ত বা ব্যবহারের সীমা লঙ্ঘনকারী অ্যাকাউন্টগুলো স্থগিত করার অধিকার আমরা সংরক্ষণ করি।",
    terms_ai_title: "এআই-জেনারেটেড কন্টেন্ট",
    terms_ai_desc:
      "বটটি প্রাকৃতিক ভাষা প্রসেস করতে এআই ব্যবহার করে। আমরা নির্ভুলতার সর্বোচ্চ চেষ্টা করলেও, আর্থিক ক্যাটাগরি বা গণনার ১০০% নির্ভুলতার গ্যারান্টি দিই না।",
    terms_ai_item_1:
      "ব্যবহারকারীদের উচিত পর্যায়ক্রমে তাদের লেজার রেকর্ডগুলো যাচাই করা।",
    terms_ai_item_2:
      "এআই-প্রসেস করা তথ্যের ওপর ভিত্তি করে নেওয়া কোনো আর্থিক সিদ্ধান্তের জন্য আমরা দায়ী নই।",
    terms_ai_item_3:
      "প্রতিটি রিকোয়েস্টের জন্য 'এআই বিটস' (ক্রেডিট) খরচ হয় এবং এটি দৈনিক লিমিটের ওপর নির্ভরশীল।",
    terms_use_title: "গ্রহণযোগ্য ব্যবহার",
    terms_use_desc:
      "আপনি কোনো অবৈধ কার্যকলাপের জন্য বা আমাদের বোটে স্প্যাম করার জন্য লাইফ-ওএস ব্যবহার না করতে সম্মত হচ্ছেন। আমাদের সিস্টেম বা সাপোর্ট এজেন্টের প্রতি কোনো প্রকার অপব্যবহারের ক্ষেত্রে আমরা জিরো-টলারেন্স নীতি বজায় রাখি।",
    terms_questions_title: "প্রশ্ন আছে?",
    terms_questions_desc:
      "এই শর্তাবলী সম্পর্কে আপনার কোনো প্রশ্ন থাকলে, টেলিগ্রামে [ @safiulalom ](https://t.me/safiulalom) এ আমাদের সাথে যোগাযোগ করুন।",

    password_managed_externally:
      "পাসওয়ার্ড আপনার লগইন প্রদানকারী (টেলিগ্রাম/গুগল) দ্বারা নিয়ন্ত্রিত হচ্ছে",
    delete_account: "অ্যাকাউন্ট মুছে ফেলুন",
    delete_account_desc:
      "স্থায়ীভাবে আপনার অ্যাকাউন্ট এবং সমস্ত তথ্য মুছে ফেলুন",
    delete_account_confirm:
      "আপনি কি নিশ্চিত? আপনার অ্যাকাউন্টটি ৩ দিনের মধ্যে মুছে ফেলার জন্য নির্ধারিত হবে।",
    remove_member: "সদস্য মুছে ফেলুন",
    confirm_remove_member:
      "আপনি কি নিশ্চিত যে আপনি এই সদস্যকে টিম থেকে মুছে ফেলতে চান?",
    delete_team: "টিম মুছে ফেলুন",
    confirm_delete_team:
      "আপনি কি নিশ্চিত যে আপনি এই টিমটি স্থায়ীভাবে মুছে ফেলতে চান? এটি সমস্ত ডেটা (লেজার, তালিকা, সদস্য এবং চ্যাট ইতিহাস) মুছে ফেলবে। এটি আর ফিরিয়ে আনা যাবে না!",
  },
};
