import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
export function QueryState({ loading, error, retry }: { loading?: boolean; error?: Error | null; retry: () => unknown }) {
  if (loading) return <div role="status" aria-label="Loading records" className="space-y-3"><Skeleton className="h-8 w-1/3" /><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;
  if (error) return <div role="alert" className="card-surface p-4 space-y-3"><p>{error.message}</p><Button variant="outline" onClick={() => retry()}>Try again</Button></div>;
  return null;
}
