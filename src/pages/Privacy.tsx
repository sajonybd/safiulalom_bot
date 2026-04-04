import { useSettings } from "@/contexts/SettingsContext";
import { Shield, Lock, Eye, FileText, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Privacy() {
  const { t } = useSettings();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <div className="max-w-3xl mx-auto px-6 py-12 lg:py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-8 gap-2 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all rounded-xl"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" /> {t("back") || "Back"}
        </Button>

        <header className="space-y-4 mb-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 glow-primary">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            {t("privacy_header_title")}
          </h1>
          <p className="text-lg text-muted-foreground font-medium">
            {t("privacy_header_subtitle")}
          </p>
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/60 uppercase tracking-widest pt-2">
            <Lock className="w-3 h-3" /> {t("privacy_last_updated")}
          </div>
        </header>

        <div className="space-y-12 text-foreground/80 leading-relaxed">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Eye className="w-6 h-6 text-primary/60" /> {t("privacy_data_collection_title")}
            </h2>
            <p>
              {t("privacy_data_collection_desc")}
            </p>
            <ul className="list-disc pl-6 space-y-2 marker:text-primary">
              <li>{t("privacy_coll_item_1")}</li>
              <li>{t("privacy_coll_item_2")}</li>
              <li>{t("privacy_coll_item_3")}</li>
              <li>{t("privacy_coll_item_4")}</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Lock className="w-6 h-6 text-primary/60" /> {t("privacy_security_title")}
            </h2>
            <p>
              {t("privacy_security_desc")}
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <FileText className="w-6 h-6 text-primary/60" /> {t("privacy_use_of_data_title")}
            </h2>
            <p>
              {t("privacy_use_of_data_desc")}
            </p>
            <ul className="list-disc pl-6 space-y-2 marker:text-primary">
              <li>{t("privacy_use_item_1")}</li>
              <li>{t("privacy_use_item_2")}</li>
              <li>{t("privacy_use_item_3")}</li>
              <li>{t("privacy_use_item_4")}</li>
            </ul>
          </section>

          <section className="p-8 rounded-3xl bg-muted/30 border border-border/50 space-y-4 backdrop-blur-sm">
            <h3 className="text-lg font-bold text-foreground">{t("privacy_contact_title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("privacy_contact_desc").split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
                const match = part.match(/\[(.*?)\]\((.*?)\)/);
                if (match) {
                  return <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">{match[1]}</a>;
                }
                return part;
              })}
            </p>
          </section>
        </div>

        <footer className="mt-20 pt-8 border-t border-border/50 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Life-OS. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
