import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Users, Search, Plus, Phone, Mail, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePeople } from "@/hooks/usePeople";
import { TransactionModal } from "@/components/dashboard/TransactionModal";
import { useState } from "react";
import { Loader2 } from "lucide-react";

const People = () => {
  const { data, isLoading } = usePeople();
  const [modalOpen, setModalOpen] = useState(false);

  const peopleBalances = data?.people || [];

  return (
    <DashboardLayout>
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">People</h2>
          <p className="text-sm text-muted-foreground">Manage contacts & relationships</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" /> Add Person / Tx
        </Button>
      </div>

      <TransactionModal open={modalOpen} onOpenChange={setModalOpen} defaultValues={{ kind: "person_out" }} />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search people..." className="pl-9 h-9 text-sm" />
        </div>
        <Badge variant="outline" className="cursor-pointer">All</Badge>
        <Badge variant="outline" className="cursor-pointer">Family</Badge>
        <Badge variant="outline" className="cursor-pointer">Friends</Badge>
        <Badge variant="outline" className="cursor-pointer">Office</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : peopleBalances.map((person: any) => (
          <div key={person.person_key} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {person.person[0]}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{person.person}</h4>
                  <p className="text-xs text-muted-foreground capitalize">{person.count} transactions</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="text-muted-foreground">Receivable</span>
                <p className="text-receivable font-mono font-semibold">৳{Number(person.receivable).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Payable</span>
                <p className="text-payable font-mono font-semibold">৳{Number(person.payable).toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className={`text-xs font-semibold font-mono ${Number(person.net) >= 0 ? 'text-receivable' : 'text-payable'}`}>
                Net: ৳{Math.abs(Number(person.net)).toLocaleString()} {Number(person.net) >= 0 ? '↑' : '↓'}
              </span>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Phone className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Mail className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </DashboardLayout>
  );
};

export default People;
