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
  ArrowRight
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

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
      title: t("doc_security_title"),
      icon: ShieldCheck,
      color: "text-emerald-500",
      content: t("doc_security_desc")
    }
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold animate-pulse">
            <Zap className="w-3 h-3" />
            <span>{t('new_feature_instant')}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
            <BookOpen className="w-10 h-10 text-primary" />
            {t('doc_intro_title')}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            {t('doc_intro_desc')}
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, idx) => (
            <div key={idx} className="glass p-6 rounded-2xl hover:border-primary/30 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/5">
              <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${section.color}`}>
                <section.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">{section.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Why Life-OS? */}
        <div className="glass p-8 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Zap className="w-64 h-64 text-primary" />
          </div>
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl font-bold text-foreground">{t('doc_philosophy_title')}</h2>
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              {t('doc_philosophy_desc')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {[
                { title: t('doc_domain_personal'), color: 'bg-emerald-500' },
                { title: t('doc_domain_work'), color: 'bg-blue-500' },
                { title: t('doc_domain_business'), color: 'bg-orange-500' }
              ].map((domain, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-card/50 rounded-xl border border-border">
                  <div className={`w-2 h-2 rounded-full ${domain.color}`} />
                  <span className="text-xs font-medium">{domain.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Master Classification */}
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">{t('doc_classification_title')}</h2>
            <p className="text-muted-foreground">{t('doc_classification_desc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 'in', color: 'emerald' },
              { id: 'out', color: 'destructive' },
              { id: 'transfer', color: 'blue' },
              { id: 'debt_given', color: 'orange' },
              { id: 'debt_taken', color: 'purple' },
              { id: 'settlement', color: 'indigo' }
            ].map((type) => (
              <div key={type.id} className="p-6 rounded-2xl bg-secondary/20 border border-border hover:border-primary/20 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-2 py-1 rounded-md bg-${type.color}-500/10 text-${type.color}-500 text-[10px] font-bold uppercase tracking-wider`}>
                    {type.id === 'out' ? 'Expense' : type.id.replace('_', ' ')}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border border-border group-hover:scale-110 transition-transform">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <h4 className="text-lg font-bold mb-2">{t(`doc_${type.id}_title`)}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t(`doc_${type.id}_desc_long`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Deep Dive: Transaction Guide */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 border-b pb-2">
            <Info className="w-6 h-6 text-primary" />
            {t('help_guide_title')}
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Account Flow */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  {t('help_acc_flow_title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <p className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">{t('source_account')}</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">{t('help_source_long_desc')}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <p className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">{t('dest_account')}</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">{t('help_dest_long_desc')}</p>
                  </div>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-center gap-3 text-xs italic text-muted-foreground">
                  <ArrowRight className="w-4 h-4 text-primary" />
                  {t('help_example_transfer')}
                </div>
              </div>

              <div className="glass p-6 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <LayoutDashboard className="w-5 h-5 text-primary" />
                  {t('help_types_title')}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'income', color: 'text-emerald-500', desc: 'help_income_desc' },
                    { label: 'expense', color: 'text-destructive', desc: 'help_expense_desc' },
                    { label: 'transfer', color: 'text-blue-500', desc: 'help_transfer_desc' },
                    { label: 'settle', color: 'text-orange-500', desc: 'help_settle_desc' }
                  ].map(type => (
                    <div key={type.label} className="p-3 bg-secondary/30 rounded-xl border border-border text-center">
                      <p className={`text-xs font-bold ${type.color} mb-1 uppercase`}>{t(type.label)}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{t(type.desc)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lenden / Debt */}
            <div className="glass p-6 rounded-2xl space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {t('help_lenden_title')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('help_lenden_long_desc')}
              </p>
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                  <p className="text-xs font-bold text-emerald-500 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {t('help_receivable_title')}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">{t('help_receivable_desc')}</p>
                </div>
                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-xl">
                  <p className="text-xs font-bold text-destructive flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                    {t('help_payable_title')}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">{t('help_payable_desc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="glass p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border-dashed border-2 border-primary/20">
          <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            {t('quick_tips_title')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              t('tip_1'),
              t('tip_2'),
              t('tip_3'),
              t('tip_4')
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/50 dark:hover:bg-black/20 transition-colors">
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <p className="text-sm text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Docs;
