import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/StatCard";
import { Receipt, Plus } from "lucide-react";
import { expenses } from "@/lib/mock-data";

export default function Expenses() {
  const total = expenses.reduce((s,e)=>s+e.amount,0);
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Expense claims" description="Submit receipts and track reimbursements." actions={
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="h-4 w-4" /> New claim</Button>
      } />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Submitted" value={"₹" + total.toLocaleString("en-IN")} icon={Receipt} accent="primary" />
        <StatCard label="Approved" value="₹4,250" accent="accent" />
        <StatCard label="Reimbursed" value="₹1,499" accent="info" />
        <StatCard label="Pending" value="₹13,320" accent="warning" />
      </div>
      <div className="card-surface p-6">
        <h2 className="font-display font-semibold text-lg mb-4">Recent claims</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
              <tr><th className="text-left py-3 font-medium">ID</th><th className="text-left font-medium">Date</th><th className="text-left font-medium">Category</th><th className="text-left font-medium">Description</th><th className="text-right font-medium">Amount</th><th className="text-center font-medium">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map(e => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="py-3 font-mono text-xs text-muted-foreground">{e.id}</td>
                  <td className="text-muted-foreground">{e.date}</td>
                  <td><Badge variant="outline">{e.category}</Badge></td>
                  <td>{e.desc}</td>
                  <td className="text-right font-semibold">₹{e.amount.toLocaleString("en-IN")}</td>
                  <td className="text-center"><Badge variant="outline" className={
                    e.status === "Approved" || e.status === "Reimbursed" ? "border-success/40 text-success bg-success/5" :
                    e.status === "Pending" ? "border-warning/40 text-warning bg-warning/5" :
                    "border-info/40 text-info bg-info/5"
                  }>{e.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}