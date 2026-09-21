import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Download, Search, FolderLock } from "lucide-react";
import { documents } from "@/lib/mock-data";

export default function Documents() {
  const cats = Array.from(new Set(documents.map(d => d.category)));
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Document vault" description="Securely access HR-issued and personal documents." actions={
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Upload className="h-4 w-4" /> Upload</Button>
      } />

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="card-surface p-4 lg:col-span-1">
          <div className="flex items-center gap-2 text-sm font-semibold mb-3"><FolderLock className="h-4 w-4 text-accent" /> Categories</div>
          <div className="space-y-1">
            <button className="w-full text-left px-3 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium">All ({documents.length})</button>
            {cats.map(c => (
              <button key={c} className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm flex justify-between">
                <span>{c}</span><span className="text-muted-foreground">{documents.filter(d=>d.category===c).length}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card-surface p-6 lg:col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search documents…" className="pl-9" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {documents.map(d => (
              <div key={d.name} className="group flex items-center gap-3 p-4 rounded-xl border border-border hover:border-accent/40 hover:shadow-soft transition-all bg-card">
                <div className="h-10 w-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0"><FileText className="h-5 w-5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground flex gap-2"><span>{d.uploaded}</span>·<span>{d.size}</span></div>
                </div>
                <Badge variant="outline" className="hidden md:flex">{d.category}</Badge>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100"><Download className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}