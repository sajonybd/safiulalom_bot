import { useState } from "react";
import { ChevronRight, Users, User, FolderOpen, Tag, Loader2 } from "lucide-react";
import { usePeople } from "@/hooks/usePeople";
import { useSettings } from "@/contexts/SettingsContext";

export function EntityExplorer() {
  const { t, currencySymbol } = useSettings();
  const [expandedGroup, setExpandedGroup] = useState<string | null>(t('all_contacts'));
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);
  
  const { data, isLoading } = usePeople();
  const people = (data?.people || []);
  
  return (
    <div className="glass rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          {t('entity_explorer')}
        </h3>
      </div>
      <div className="p-2">
        {isLoading ? (
          <div className="py-6 flex justify-center">
             <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div>
            <button
              onClick={() => setExpandedGroup(expandedGroup === t('all_contacts') ? null : t('all_contacts'))}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground hover:bg-secondary/50 transition-colors"
            >
              <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expandedGroup === t('all_contacts') ? 'rotate-90' : ''}`} />
              <FolderOpen className="w-3.5 h-3.5 text-accent" />
              <span className="font-medium">{t('all_contacts')}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{people.length}</span>
            </button>
            {expandedGroup === t('all_contacts') && (
              <div className="ml-4 animate-slide-in">
                {people.map((entity: any) => (
                  <div key={entity.person_key}>
                    <button
                      onClick={() => setExpandedEntity(expandedEntity === entity.person ? null : entity.person)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs hover:bg-secondary/30 transition-colors"
                    >
                      <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform ${expandedEntity === entity.person ? 'rotate-90' : ''}`} />
                      <User className="w-3 h-3 text-primary" />
                      <span className="text-foreground">{entity.person}</span>
                      <span className="text-[10px] text-muted-foreground">({entity.count} {t("entries")})</span>
                    </button>
                    {expandedEntity === entity.person && (
                      <div className="ml-6 flex gap-1 py-1 px-3">
                         <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {t('receivable')}: {currencySymbol}{Number(entity.receivable).toLocaleString()}
                         </span>
                         <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            {t('payable')}: {currencySymbol}{Number(entity.payable).toLocaleString()}
                         </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
