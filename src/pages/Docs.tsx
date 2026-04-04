import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  BookOpen, 
  MessageSquare, 
  Send, 
  Wallet, 
  Users, 
  BarChart3, 
  ShieldCheck,
  Zap,
  Info,
  LayoutDashboard,
  ArrowRight,
  Terminal,
  ChefHat,
  Briefcase,
  Search,
  Sparkles,
  Command,
  Database,
  CheckCircle2,
  ListRestart,
  PlayCircle,
  Link,
  ChevronRight
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Docs = () => {
  const { t } = useSettings();

  const sections = [
    {
      title: t("doc_chat_title"),
      icon: MessageSquare,
      color: "text-primary",
      content: t("doc_chat_desc")
    },
    {
      title: t("doc_tg_title"),
      icon: Send,
      color: "text-accent",
      content: t("doc_tg_desc")
    },
    {
      title: t("doc_ledger_title"),
      icon: Wallet,
      color: "text-primary",
      content: t("doc_ledger_desc")
    },
    {
      title: t("doc_reports_title"),
      icon: BarChart3,
      color: "text-accent",
      content: t("doc_reports_desc")
    },
    {
      title: t("doc_team_title"),
      icon: Users,
      color: "text-primary",
      content: t("doc_team_desc")
    },
    {
      title: t("doc_admin_title"),
      icon: ShieldCheck,
      color: "text-red-500",
      content: t("doc_admin_desc")
    },
    {
      title: t("doc_wa_title"),
      icon: MessageSquare,
      color: "text-green-500",
      content: t("doc_wa_desc")
    },
    {
      title: t("credit_system_title"),
      icon: Sparkles,
      color: "text-amber-500",
      content: t("credit_system_desc")
    },
    {
      title: t("doc_security_title"),
      icon: ShieldCheck,
      color: "text-emerald-500",
      content: t("doc_security_desc")
    }
  ];

  const shortcuts = [
    { symbol: "@", title: t("shortcut_entity"), desc: t("shortcut_entity_desc"), icon: Users },
    { symbol: "#", title: t("shortcut_account"), desc: t("shortcut_account_desc"), icon: Wallet },
    { symbol: "?", title: t("shortcut_query"), desc: t("shortcut_query_desc"), icon: Search }
  ];

  const commands = [
    { cmd: t("cmd_acc"), desc: t("cmd_acc_desc") },
    { cmd: t("cmd_summary"), desc: t("cmd_summary_desc") },
    { cmd: t("cmd_edit"), desc: t("cmd_edit_desc") },
    { cmd: t("cmd_del"), desc: t("cmd_del_desc") },
    { cmd: t("cmd_login"), desc: t("cmd_login_desc") }
  ];

  const onboardingSteps = [
    { title: t("step_tg_connect_title"), desc: t("step_tg_connect_desc"), icon: Link },
    { title: t("step_chat_usage_title"), desc: t("step_chat_usage_desc"), icon: MessageSquare },
    { title: t("step_report_usage_title"), desc: t("step_report_usage_desc"), icon: BarChart3 }
  ];

  const metadata = [
    { title: t("meta_odo"), desc: t("meta_odo_desc"), icon: Zap },
    { title: t("meta_bill"), desc: t("meta_bill_desc"), icon: Database },
    { title: t("meta_items"), desc: t("meta_items_desc"), icon: ListRestart }
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>{t('new_feature_instant')}</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-foreground tracking-tight flex items-center gap-4">
            <BookOpen className="w-12 h-12 text-primary" />
            {t('doc_intro_title')}
          </h1>
          <p className="text-muted-foreground text-xl max-w-3xl leading-relaxed">
            {t('doc_intro_desc')}
          </p>
        </div>

        <Tabs defaultValue="guide" className="space-y-8">
          <TabsList className="bg-secondary/50 p-1 rounded-xl h-auto w-full flex flex-wrap gap-1 justify-start">
            <TabsTrigger value="guide" className="rounded-lg flex-1 font-bold whitespace-nowrap">🚀 {t('onboarding_title')}</TabsTrigger>
            <TabsTrigger value="basics" className="rounded-lg flex-1 font-bold whitespace-nowrap">{t('all')}</TabsTrigger>
            <TabsTrigger value="shortcuts" className="rounded-lg flex-1 font-bold whitespace-nowrap">{t('doc_shortcuts_title')}</TabsTrigger>
            <TabsTrigger value="schema" className="rounded-lg flex-1 font-bold whitespace-nowrap">🧠 Schema</TabsTrigger>
            <TabsTrigger value="privacy" className="rounded-lg flex-1 font-bold whitespace-nowrap">🛡️ Privacy</TabsTrigger>
            <TabsTrigger value="scenarios" className="rounded-lg flex-1 font-bold whitespace-nowrap">{t('doc_scenarios_title')}</TabsTrigger>
            <TabsTrigger value="commands" className="rounded-lg flex-1 font-bold whitespace-nowrap">⌨️ Commands</TabsTrigger>
            <TabsTrigger value="credits" className="rounded-lg flex-1 font-bold whitespace-nowrap">💳 Bits</TabsTrigger>
          </TabsList>

          {/* Guide Tab (Onboarding) */}
          <TabsContent value="guide" className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-6">
                <div className="flex items-center gap-4 mb-2">
                   <PlayCircle className="w-10 h-10 text-primary" />
                   <h2 className="text-3xl font-black">{t('onboarding_title')}</h2>
                </div>
                <p className="text-muted-foreground text-lg">{t('onboarding_desc')}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {onboardingSteps.map((step, i) => (
                     <div key={i} className="relative glass p-8 rounded-[2.5rem] border border-border/50 group hover:border-primary/30 transition-all">
                        <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-black shadow-lg">
                           {i + 1}
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                           <step.icon className="w-6 h-6 text-primary" />
                        </div>
                        <h4 className="text-xl font-bold mb-3">{step.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                           {step.desc}
                        </p>
                     </div>
                   ))}
                </div>
             </div>

             <div className="p-8 rounded-[3rem] bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 flex flex-col md:flex-row items-center gap-8">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-black/40 flex items-center justify-center shrink-0 shadow-inner">
                   <Zap className="w-12 h-12 text-primary animate-pulse" />
                </div>
                <div className="flex-1 space-y-2">
                   <h3 className="text-2xl font-black">Proactive AI Decision Engine</h3>
                   <p className="text-muted-foreground">
                     The AI won't just record—it will guide you. If you mention <strong>"Gari tel nilam"</strong>, the bot will instantly reply asking for your <strong>Odometer</strong>. To keep things clean, simply type the number and it will be linked!
                   </p>
                </div>
                <ChevronRight className="w-10 h-10 text-primary/30 hidden md:block" />
             </div>
          </TabsContent>

          {/* Basics Tab */}
          <TabsContent value="basics" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section, idx) => (
                <div key={idx} className="glass p-6 rounded-3xl hover:border-primary/30 transition-all duration-300 group hover:shadow-xl hover:shadow-primary/5 border border-border/50">
                  <div className={`w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${section.color}`}>
                    <section.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-foreground mb-3">{section.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Shortcuts Tab */}
          <TabsContent value="shortcuts" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/10">
              <div className="flex items-center gap-4 mb-8">
                <Terminal className="w-10 h-10 text-primary" />
                <div>
                  <h2 className="text-3xl font-black text-foreground">{t('doc_shortcuts_title')}</h2>
                  <p className="text-muted-foreground">{t('doc_shortcuts_desc')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {shortcuts.map((s, i) => (
                  <div key={i} className="bg-background/80 p-6 rounded-3xl border border-border hover:border-primary/40 transition-colors group">
                    <span className="text-5xl font-black text-primary/20 group-hover:text-primary transition-colors block mb-4">{s.symbol}</span>
                    <h4 className="text-xl font-bold mb-2 flex items-center gap-2">
                       <s.icon className="w-4 h-4 text-primary" />
                       {s.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed italic">
                      "{s.desc}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Metadata Section */}
            <div className="space-y-6">
               <h2 className="text-2xl font-black flex items-center gap-2">
                 <Database className="w-6 h-6 text-primary" />
                 {t('doc_metadata_title')}
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {metadata.map((m, i) => (
                    <div key={i} className="glass p-6 rounded-3xl border border-border/50 space-y-3">
                       <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <m.icon className="w-5 h-5 text-primary" />
                       </div>
                       <h4 className="font-bold text-foreground">{m.title}</h4>
                       <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                    </div>
                  ))}
               </div>
            </div>
          </TabsContent>

          {/* Master Schema Tab */}
          <TabsContent value="schema" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Database className="w-6 h-6 text-primary" />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black">{t('doc_classification_title')}</h2>
                      <p className="text-muted-foreground">{t('doc_classification_desc')}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {[
                     { key: 'in', color: 'text-green-500', bg: 'bg-green-500/10' },
                     { key: 'out', color: 'text-red-500', bg: 'bg-red-500/10' },
                     { key: 'transfer', color: 'text-blue-500', bg: 'bg-blue-500/10' },
                     { key: 'debt_given', color: 'text-amber-500', bg: 'bg-amber-500/10' },
                     { key: 'debt_taken', color: 'text-purple-500', bg: 'bg-purple-500/10' },
                     { key: 'settlement', color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
                   ].map((type) => (
                     <div key={type.key} className="glass p-6 rounded-3xl border border-border/50 space-y-3 group hover:border-primary/30 transition-all">
                        <h4 className={`font-black text-xl flex items-center gap-2 ${type.color}`}>
                           <span className={`w-2 h-2 rounded-full ${type.bg.replace('/10', '')}`} />
                           {t(`doc_${type.key}_title`)}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                           {t(`doc_${type.key}_desc_long`)}
                        </p>
                     </div>
                   ))}
                </div>
             </div>

             <div className="glass p-10 rounded-[3rem] border border-primary/20 space-y-8">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                      <ListRestart className="w-6 h-6 text-primary" />
                   </div>
                   <h2 className="text-3xl font-black">{t('help_acc_flow_title')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4 p-6 rounded-3xl bg-background/50 border border-border">
                      <h4 className="text-xl font-bold text-primary">{t('source_account')}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{t('help_source_long_desc')}</p>
                   </div>
                   <div className="space-y-4 p-6 rounded-3xl bg-background/50 border border-border">
                      <h4 className="text-xl font-bold text-blue-600 dark:text-blue-400">{t('dest_account')}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{t('help_dest_long_desc')}</p>
                   </div>
                </div>
             </div>

             <div className="glass p-8 rounded-[2.5rem] border border-violet-500/20 bg-violet-500/5">
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-violet-500" />
                   </div>
                   <h3 className="text-2xl font-black text-foreground">{t('help_lenden_title')}</h3>
                </div>
                <p className="text-muted-foreground mb-4">{t('help_lenden_long_desc')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-4 bg-background/50 rounded-2xl border border-violet-500/10 text-sm">
                      <span className="font-bold text-violet-500">{t('receivable')}:</span> {t('help_receivable_desc')}
                   </div>
                   <div className="p-4 bg-background/50 rounded-2xl border border-violet-500/10 text-sm">
                      <span className="font-bold text-violet-500">{t('payable')}:</span> {t('help_payable_desc')}
                   </div>
                </div>
             </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-emerald-500" />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black">{t('doc_privacy_title')}</h2>
                      <p className="text-muted-foreground">{t('doc_privacy_desc')}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="glass p-8 rounded-[2.5rem] border border-border space-y-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                         <Info className="w-5 h-5 text-primary" />
                         {t('privacy_collected_title')}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                         {t('privacy_collected_desc')}
                      </p>
                      <div className="p-4 bg-secondary/30 rounded-2xl border border-border/50 font-mono text-xs text-primary">
                         Fields: [ telegramId, whatsappId, first_name, username ]
                      </div>
                   </div>

                   <div className="glass p-8 rounded-[2.5rem] border border-primary/20 bg-primary/5 space-y-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                         <ShieldCheck className="w-5 h-5 text-primary" />
                         {t('doc_security_title')}
                      </h3>
                      <p className="text-primary/80 text-sm font-medium leading-relaxed italic">
                         "{t('privacy_assurance')}"
                      </p>
                      <ul className="space-y-2 mt-4">
                         {[
                           "No personal messages access",
                           "No contacts list sharing",
                           "No location tracking",
                           "Private chat responses only"
                         ].map((item, i) => (
                           <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              {item}
                           </li>
                         ))}
                      </ul>
                   </div>
                </div>
             </div>
          </TabsContent>

          {/* Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass p-8 md:p-10 rounded-[3rem] space-y-6 border border-primary/20 relative overflow-hidden group">
                  <div className="absolute -top-12 -right-12 p-20 bg-primary/5 rounded-full group-hover:scale-125 transition-transform duration-700" />
                  <Briefcase className="w-16 h-16 text-primary relative z-10" />
                  <div className="space-y-4 relative z-10">
                    <h2 className="text-3xl font-black text-foreground">{t('scenario_office_title')}</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('scenario_office_desc')}
                    </p>
                    <div className="bg-primary/10 p-4 rounded-2xl border border-primary/20 mt-4">
                       <code className="text-sm text-primary font-mono font-bold break-words whitespace-normal block">@Boss theke 20,000 pelam #OfficeAccount e</code>
                    </div>
                  </div>
                </div>

                <div className="glass p-8 md:p-10 rounded-[3rem] space-y-6 border border-orange-500/20 relative overflow-hidden group">
                  <div className="absolute -top-12 -right-12 p-20 bg-orange-500/5 rounded-full group-hover:scale-125 transition-transform duration-700" />
                  <ChefHat className="w-16 h-16 text-orange-500 relative z-10" />
                  <div className="space-y-4 relative z-10">
                    <h2 className="text-3xl font-black text-foreground">{t('scenario_mess_title')}</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {t('scenario_mess_desc')}
                    </p>
                    <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20 mt-4">
                       <code className="text-sm text-orange-600 dark:text-orange-400 font-mono font-bold break-words whitespace-normal block">Meal log: @Rahim 2, @Ami 1, @Robin 2</code>
                    </div>
                  </div>
                </div>
             </div>

             {/* Settlement Guide */}
             <div className="glass p-8 rounded-[2.5rem] border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                   </div>
                   <h3 className="text-2xl font-black text-foreground">{t('doc_settlement_guide_title')}</h3>
                </div>
                <p className="text-muted-foreground mb-4">{t('doc_settlement_guide_desc')}</p>
                <div className="p-4 bg-background/50 rounded-2xl border border-emerald-500/10 italic text-sm">
                   {t('settle_rule')}
                </div>
             </div>
          </TabsContent>

          {/* Commands Tab */}
          <TabsContent value="commands" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-secondary/20 p-8 rounded-[2.5rem] border border-border">
                <div className="flex items-center gap-4 mb-8">
                   <Command className="w-10 h-10 text-primary" />
                   <div>
                      <h2 className="text-3xl font-black text-foreground">{t('doc_commands_title')}</h2>
                      <p className="text-muted-foreground">{t('doc_commands_desc')}</p>
                   </div>
                </div>

                <div className="space-y-3">
                   {commands.map((c, i) => (
                     <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-background rounded-2xl border border-border hover:border-primary/30 transition-colors">
                        <code className="text-primary font-mono font-bold text-base mb-2 md:mb-0">{c.cmd}</code>
                        <p className="text-sm text-muted-foreground md:text-right">{c.desc}</p>
                     </div>
                   ))}
                </div>
             </div>
          </TabsContent>

          {/* Credits Tab */}
          <TabsContent value="credits" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="glass p-8 rounded-[2.5rem] border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-amber-500" />
                   </div>
                   <div>
                      <h2 className="text-3xl font-black text-foreground">{t('credit_system_title')}</h2>
                      <p className="text-muted-foreground">{t('credit_system_desc')}</p>
                   </div>
                </div>

                <div className="bg-background/50 p-10 rounded-[2.5rem] border border-border space-y-8">
                   <h3 className="text-2xl font-black flex items-center gap-3">
                      <Zap className="w-6 h-6 text-primary" />
                      {t('support_upgrade_title')}
                   </h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="flex gap-4 p-4 rounded-2xl hover:bg-secondary/30 transition-colors">
                           <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                              {step}
                           </div>
                           <p className="text-sm font-medium leading-relaxed">
                              {t(`support_step_` + step).split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
                                 const match = part.match(/\[(.*?)\]\((.*?)\)/);
                                 if (match) {
                                    return <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">{match[1]}</a>;
                                 }
                                 return part;
                              })}
                           </p>
                        </div>
                      ))}
                   </div>

                   <div className="p-6 rounded-3xl bg-secondary/20 border border-border/50 text-center">
                      <p className="text-muted-foreground text-sm">
                        {t('topup_instructions')}
                      </p>
                   </div>
                </div>
             </div>
          </TabsContent>
        </Tabs>

        {/* Floating Quick Navigation */}
        <div className="flex justify-center pt-10">
           <button 
             onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
             className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
           >
             <ArrowRight className="w-3 h-3 -rotate-90" />
             {t('back_to_top')}
           </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Docs;
