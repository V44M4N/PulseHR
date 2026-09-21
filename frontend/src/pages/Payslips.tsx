import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, TrendingUp } from "lucide-react";
import { payslips } from "@/lib/mock-data";
import { StatCard } from "@/components/StatCard";

const fmt = (n: number) => "₹" + n.toLocaleString("en-IN");

export default function Payslips() {
  const ytdGross = payslips.reduce((s,p)=>s+p.gross,0);
  const ytdNet = payslips.reduce((s,p)=>s+p.net,0);
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Payslips & compensation" description="Download payslips, view tax summaries and submit declarations." actions={
        <Button variant="outline"><FileText className="h-4 w-4" /> Form 16</Button>
      } />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="YTD gross" value={fmt(ytdGross)} accent="primary" />
        <StatCard label="YTD net pay" value={fmt(ytdNet)} accent="accent" />
        <StatCard label="YTD tax" value={fmt(ytdGross-ytdNet)} accent="warning" />
        <StatCard label="Next payday" value="30 Apr" delta="In 8 days" trend="up" accent="info" />
      </div>

      <div className="card-surface p-6">
        <h2 className="font-display font-semibold text-lg mb-4">Salary breakdown — March 2026</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Earnings</h3>
            {[["Basic","92,000"],["HRA","36,800"],["Special allowance","42,200"],["LTA","8,000"],["Bonus","5,000"]].map(([k,v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-border text-sm"><span>{k}</span><span className="font-medium">₹{v}</span></div>
            ))}
            <div className="flex justify-between pt-3 font-semibold"><span>Gross</span><span className="text-accent">₹1,84,000</span></div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Deductions</h3>
            {[["TDS","21,400"],["EPF","11,040"],["Professional tax","200"],["Health insurance","1,200"],["Loan recovery","0"]].map(([k,v]) => (
              <div key={k} className="flex justify-between py-2 border-b border-border text-sm"><span>{k}</span><span className="font-medium">₹{v}</span></div>
            ))}
            <div className="flex justify-between pt-3 font-semibold"><span>Total deductions</span><span className="text-destructive">₹32,400</span></div>
          </div>
        </div>
        <div className="mt-6 p-4 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-between">
          <div>
            <div className="text-xs text-primary-foreground/70">Net pay</div>
            <div className="text-3xl font-display font-bold">₹1,51,600</div>
          </div>
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Download className="h-4 w-4" /> Download PDF</Button>
        </div>
      </div>

      <div className="card-surface p-6">
        <h2 className="font-display font-semibold text-lg mb-4">Payslip history</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase tracking-wider border-b border-border">
              <tr><th className="text-left py-3 font-medium">Month</th><th className="text-right font-medium">Gross</th><th className="text-right font-medium">Deductions</th><th className="text-right font-medium">Net</th><th className="text-center font-medium">Status</th><th></th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payslips.map(p => (
                <tr key={p.month} className="hover:bg-muted/30">
                  <td className="py-3 font-medium">{p.month}</td>
                  <td className="text-right">{fmt(p.gross)}</td>
                  <td className="text-right text-destructive">-{fmt(p.deductions)}</td>
                  <td className="text-right font-semibold">{fmt(p.net)}</td>
                  <td className="text-center"><Badge variant="outline" className="border-success/40 text-success bg-success/5">{p.status}</Badge></td>
                  <td className="text-right"><Button variant="ghost" size="sm"><Download className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}