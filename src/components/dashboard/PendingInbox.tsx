import { AlertTriangle, Check, X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export function PendingInbox() {
  const { t } = useSettings();
  const items: any[] = [];

  if (items.length === 0) {
    return (
      <div className="glass rounded-lg p-6 text-center">
        <Check className="w-8 h-8 text-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{t('all_caught_up')}</p>
      </div>
    );
  }

  return null;
}
