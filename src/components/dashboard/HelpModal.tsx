import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Info, ArrowRight, Wallet, Users, LayoutDashboard } from "lucide-react";

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpModal({ open, onOpenChange }: HelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Info className="w-5 h-5 text-primary" />
            Transaction Guide & Docs
          </DialogTitle>
          <DialogDescription>
            Learn how to manage your transactions, accounts, and lending (Lenden) effectively.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Section: Accounts Logic */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Wallet className="w-4 h-4" /> Account Flow (Source vs Destination)
            </h3>
            <div className="bg-muted/50 p-3 rounded-lg border border-border text-xs leading-relaxed space-y-2">
              <p>
                <strong className="text-primary underline">Source Account:</strong> The wallet or bank account where the money is coming <span className="font-bold">FROM</span>. Use this when you are spending or transferring money.
              </p>
              <p>
                <strong className="text-primary underline">Destination Account:</strong> The wallet or bank account where the money is going <span className="font-bold">TO</span>. Use this when you are receiving or transferring money.
              </p>
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground italic">
                <span>Example: Cash (Source)</span>
                <ArrowRight className="w-3 h-3" />
                <span>Bkash (Dest) = You put cash into your Bkash.</span>
              </div>
            </div>
          </section>

          {/* Section: Transaction Types */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <LayoutDashboard className="w-4 h-4" /> Transaction Types
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-card border border-border rounded-lg space-y-1">
                <p className="text-xs font-bold text-primary">Income</p>
                <p className="text-[11px] text-muted-foreground">General money coming in (Salary, Gift, etc.). Increases account balance.</p>
              </div>
              <div className="p-3 bg-card border border-border rounded-lg space-y-1">
                <p className="text-xs font-bold text-destructive">Expense</p>
                <p className="text-[11px] text-muted-foreground">General money spent (Food, Rent, etc.). Decreases account balance.</p>
              </div>
              <div className="p-3 bg-card border border-border rounded-lg space-y-1">
                <p className="text-xs font-bold text-blue-500">Transfer</p>
                <p className="text-[11px] text-muted-foreground">Moving money between your own accounts. No net change in wealth.</p>
              </div>
              <div className="p-3 bg-card border border-border rounded-lg space-y-1">
                <p className="text-xs font-bold text-orange-500">Settlement</p>
                <p className="text-[11px] text-muted-foreground">Paying back a debt or receiving a repayment. Closes a receivable/payable.</p>
              </div>
            </div>
          </section>

          {/* Section: Lenden / Lending */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
              <Users className="w-4 h-4" /> Receivable & Payable (Lenden)
            </h3>
            <div className="space-y-2">
              <div className="p-3 bg-accent/20 border border-border rounded-lg">
                <p className="text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Receivable (Lending Money)
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  You give money to someone. They owe you. This increases your <strong>Receivable</strong> total.
                  <br />
                  <span className="italic mt-1 block opacity-70">Types: Person Out, Loan Given.</span>
                </p>
              </div>
              <div className="p-3 bg-destructive/5 border border-border rounded-lg">
                <p className="text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  Payable (Borrowing Money)
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  You take money from someone. You owe them. This increases your <strong>Payable</strong> total.
                  <br />
                  <span className="italic mt-1 block opacity-70">Types: Person In, Loan Taken, Fund Received.</span>
                </p>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
