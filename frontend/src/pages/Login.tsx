import { FormEvent, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRole } from '@/context/RoleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function Login() {
  const { user, isLoading, login, sessionError } = useRole();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const requested = location.state?.from;
  const destination = typeof requested === 'string' && requested.startsWith('/') && !requested.startsWith('//') && requested !== '/login' ? requested : '/';
  if (isLoading) return <div role="status" className="min-h-screen grid place-items-center">Restoring your session…</div>;
  if (user) return <Navigate to={destination} replace />;
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true); setError('');
    try { await login(email.trim(), password, mfaCode || undefined); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to sign in'); }
    finally { setPending(false); }
  };
  return <main className="min-h-screen grid place-items-center bg-background p-4">
    <Card className="w-full max-w-md">
      <CardHeader><CardTitle>Sign in to PulseHR</CardTitle><CardDescription>Use your work email and password.</CardDescription></CardHeader>
      <CardContent><form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} disabled={pending} /></div>
        <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} disabled={pending} /></div>
        <div className="space-y-2"><Label htmlFor="mfaCode">Authenticator code (if enabled)</Label><Input id="mfaCode" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="123456" value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} disabled={pending} /></div>
        {(error || sessionError) && <p role="alert" className="text-sm text-destructive">{error || sessionError}</p>}
        <Button type="submit" className="w-full" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</Button>
      </form></CardContent>
    </Card>
  </main>;
}
