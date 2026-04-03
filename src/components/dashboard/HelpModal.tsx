import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Info, ArrowRight, Wallet, Users, LayoutDashboard } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpModal({ open, onOpenChange }: HelpModalProps) {
  const { t } = useSettings();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Info className="w-5 h-5 text-primary" />
            {t("help_guide_title")}
          </DialogTitle>
          <DialogDescription>
            {t("help_guide_desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section: Accounts Logic */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Wallet className="w-4 h-4" /> {t("help_acc_flow")}
            </h3>
            <div className="bg-muted/50 p-3 rounded-lg border border-border text-xs leading-relaxed space-y-2">
              <p>
                <strong className="text-primary underline">Source Account:</strong> {t("help_source_desc")}
              </p>
              <p>
                <strong className="text-primary underline">Destination Account:</strong> {t("help_dest_desc")}
              </p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground italic">
                <span>{t("help_example_transfer")}</span>
              </div>
            </div>
          </section>

          {/* Section: Transaction Types */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <LayoutDashboard className="w-4 h-4" /> {t("help_types_title")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-card border border-border rounded-lg space-y-1">
                <p className="text-xs font-bold text-primary">{t("income")}</p>
                <p className="text-[11px] text-muted-foreground">{t("help_income_desc")}</p>
              </div>
              <div className="p-3 bg-card border border-border rounded-lg space-y-1">
                <p className="text-xs font-bold text-destructive">{t("expense")}</p>
                <p className="text-[11px] text-muted-foreground">{t("help_expense_desc")}</p>
              </div>
              <div className="p-3 bg-card border border-border rounded-lg space-y-1">
                <p className="text-xs font-bold text-blue-500">{t("transfer")}</p>
                <p className="text-[11px] text-muted-foreground">{t("help_transfer_desc")}</p>
              </div>
              <div className="p-3 bg-card border border-border rounded-lg space-y-1">
                <p className="text-xs font-bold text-orange-500">{t("settle")}</p>
                <p className="text-[11px] text-muted-foreground">{t("help_settle_desc")}</p>
              </div>
            </div>
          </section>

          {/* Section: Lenden / Lending */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Users className="w-4 h-4" /> {t("help_lenden_title")}
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-accent/20 border border-border rounded-lg">
                <p className="text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  {t("help_receivable_title")}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t("help_receivable_desc")}
                  <br />
                  <span className="italic mt-1 block opacity-70">{t("help_receivable_types")}</span>
                </p>
              </div>
              <div className="p-3 bg-destructive/5 border border-border rounded-lg">
                <p className="text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  {t("help_payable_title")}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {t("help_payable_desc")}
                  <br />
                  <span className="italic mt-1 block opacity-70">{t("help_payable_types")}</span>
                </p>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
