import { PageHeader } from "@/components/PageHeader";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Plus, Pin } from "lucide-react";
import { useModuleQuery, useModuleMutation } from "@/hooks/useModuleQuery";
import { QueryState } from "@/components/QueryState";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function Feed() {
  const query = useModuleQuery<any>(['feed'], '/feed?page=1&limit=100');
  const post = useModuleMutation<any>(['feed'], 'post', '/feed');
  const react = useModuleMutation<any>(['feed'], 'post', (body: any) => `/feed/${body.id}/react`);
  const announcements = query.data?.data?.announcements ?? [];
  const [body, setBody] = useState('');
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Company feed" description="Announcements, recognitions and what's happening." />

      <div className="card-surface p-4">
        <Textarea value={body} onChange={event => setBody(event.target.value)} placeholder="Share an update with the team…" className="border-0 bg-muted/30 resize-none" rows={3} />
        <div className="flex justify-between items-center mt-2">
          <Button variant="ghost" size="sm"><Plus className="h-4 w-4" /> Attach</Button>
          <Button disabled={!body.trim() || post.isPending} onClick={() => { post.mutate({ title: 'Team update', body }); setBody(''); }} className="bg-accent text-accent-foreground hover:bg-accent/90"><Send className="h-4 w-4" /> Post</Button>
        </div>
      </div>

      <QueryState loading={query.isPending} error={query.error} retry={query.refetch} />
      {announcements.map((a: any, i: number) => (
        <article key={a.id} className="card-surface p-6">
          <header className="flex items-start gap-3">
            <Avatar className="h-10 w-10"><AvatarFallback className="bg-accent text-accent-foreground">{(a.authorName || 'P')[0]}</AvatarFallback></Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2"><span className="font-semibold text-sm">{a.authorName}</span>{i===0 && <Pin className="h-3 w-3 text-accent" />}</div>
              <div className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</div>
            </div>
          </header>
          <h2 className="font-display font-semibold text-lg mt-3">{a.title}</h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.body}</p>
          <footer className="flex items-center gap-1 mt-4 pt-4 border-t border-border">
            <Button variant="ghost" size="sm" onClick={() => react.mutate({ id: a.id })}><Heart className="h-4 w-4" /> {a.reactions}</Button>
            <Button variant="ghost" size="sm"><MessageCircle className="h-4 w-4" /> Comment</Button>
          </footer>
        </article>
      ))}
    </div>
  );
}
