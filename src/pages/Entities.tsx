import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Users, Search, Plus, MoreVertical, Edit, Trash2, Building2, Car, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSettings } from "@/contexts/SettingsContext";

const iconMap: Record<string, any> = {
  PERSON: Users,
  ORGANIZATION: Building2,
  UTILITY: Zap,
  ASSET: Car,
  ACCOUNT: Building2,
};

export default function Entities() {
  const { t, currencySymbol } = useSettings();
  const [entities, setEntities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "PERSON",
    subType: "",
    groupId: "",
    openingBalance: ""
  });

  const fetchEntities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/ui_entities");
      const data = await res.json();
      if (data.ok) setEntities(data.entities);
    } catch {
      toast.error(t("failed_to_load"));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEntities();
  }, []);

  const handleSave = async () => {
    if (!formData.name) {
      toast.error(t("name") + " is required");
      return;
    }

    try {
      const method = editingId ? "PATCH" : "POST";
      const { openingBalance, ...rest } = formData;
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        ...rest,
        metadata: { openingBalance: Number(openingBalance) || 0 }
      };

      const res = await fetch("/api/ui_entities", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.ok) {
        toast.success(editingId ? t("entity_updated") : t("entity_created"));
        setModalOpen(false);
        fetchEntities();
      } else {
        toast.error(data.error || t("failed_to_save"));
      }
    } catch {
      toast.error(t("failed_to_save"));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(t("delete_confirm").replace("{name}", name))) return;
    try {
      const res = await fetch(`/api/ui_entities?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        toast.success(t("delete_success"));
        fetchEntities();
      }
    } catch {
      toast.error(t("failed_to_save"));
    }
  };

  const openModal = (entity?: any) => {
    if (entity) {
      setEditingId(entity.id);
      setFormData({
        name: entity.name,
        type: entity.type,
        subType: entity.subType || "",
        groupId: entity.groupId || "",
        openingBalance: entity.metadata?.openingBalance || "",
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", type: "PERSON", subType: "", groupId: "", openingBalance: "" });
    }
    setModalOpen(true);
  };

  const filtered = entities.filter(e => {
    if (activeTab !== "ALL" && e.type !== activeTab) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-5 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t("directory_entities")}</h2>
            <p className="text-sm text-muted-foreground">{t("manage_entities_desc")}</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => openModal()}>
            <Plus className="w-4 h-4" /> {t("add_entity")}
          </Button>
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingId ? t("edit_entity") : t("create_new_entity")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("type")}</label>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.type} 
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="PERSON">{t("type_person")}</option>
                  <option value="ORGANIZATION">{t("type_organization")}</option>
                  <option value="ACCOUNT">{t("type_account")}</option>
                  <option value="UTILITY">{t("type_utility")}</option>
                  <option value="ASSET">{t("type_asset")}</option>
                </select>
              </div>

              {/* Dynamic Placeholders based on type */}
              {(() => {
                const p = {
                  PERSON: { name: "e.g. Safiul Alom, Hujyfa", sub: "e.g. Wife, Brother, Friend", grp: "e.g. Family, Work" },
                  ORGANIZATION: { name: "e.g. Meena Bazar, Pharmacy", sub: "e.g. Groceries, Medicine", grp: "e.g. Sector 4, Market" },
                  ACCOUNT: { name: "e.g. bKash, Cash, City Bank", sub: "e.g. Wallet, Savings, Business", grp: "e.g. Personal, Shop 1" },
                  UTILITY: { name: "e.g. DESCO, WASA, Titas Gas", sub: "e.g. Electricity, Water, Bill", grp: "e.g. House 1, Office" },
                  ASSET: { name: "e.g. Bike FZ-V3, Toyota Corolla", sub: "e.g. Bike, Car, Gadget", grp: "e.g. Personal, Business" }
                }[formData.type] || { name: "e.g. Name", sub: "e.g. Sub-type", grp: "e.g. Group" };

                return (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("name")}</label>
                      <Input placeholder={p.name} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{t("sub_type_relation")}</label>
                      <Input placeholder={p.sub} value={formData.subType} onChange={e => setFormData({ ...formData, subType: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium">{t("group_house")}</label>
                       <Input placeholder={p.grp} value={formData.groupId} onChange={e => setFormData({ ...formData, groupId: e.target.value })} />
                    </div>
                    {formData.type === "ACCOUNT" && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t("opening_balance")}</label>
                        <Input type="number" placeholder="0.00" value={formData.openingBalance} onChange={e => setFormData({ ...formData, openingBalance: e.target.value })} />
                      </div>
                    )}
                  </>
                );
              })()}

              <Button className="w-full mt-4" onClick={handleSave}>
                {editingId ? t("save_changes") : t("create_new_entity")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("search_placeholder")} className="pl-9 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {["ALL", "PERSON", "ORGANIZATION", "ACCOUNT", "UTILITY", "ASSET"].map(tab => (
            <Badge 
              key={tab} 
              variant={activeTab === tab ? "default" : "outline"} 
              className="cursor-pointer"
              onClick={() => setActiveTab(tab)}
            >
              {tab === "ALL" ? t("all") : t(`type_${tab.toLowerCase()}`)}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full py-10 text-center text-muted-foreground">
              {t("no_entities_found")}
            </div>
          ) : filtered.map((entity: any) => {
            const Icon = iconMap[entity.type] || Users;
            
            return (
              <div key={entity.id} className="rounded-xl border border-border bg-card p-4 space-y-3 transition-colors hover:border-primary/50">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-bold tracking-wider">{t(`type_${entity.type.toLowerCase()}`)}</span>
                    </div>
                    <div className="flex gap-1 opacity-50 hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openModal(entity)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(entity.id, entity.name)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-foreground mt-1">{entity.name}</h4>
                  
                  {entity.type === "ACCOUNT" && (
                    <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-medium">{t("current_balance")}</p>
                      <p className="text-sm font-bold font-mono text-primary">{currencySymbol}{Number(entity.currentBalance || 0).toLocaleString()}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-2">
                    {entity.subType && <Badge variant="secondary" className="text-[10px]">{entity.subType}</Badge>}
                    {entity.groupId && <Badge variant="outline" className="text-[10px] bg-muted/50">{entity.groupId}</Badge>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
