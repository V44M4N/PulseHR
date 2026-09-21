import { act, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { RoleProvider, useRole } from './RoleContext';
import { clearSession } from '@/lib/api-client';
const success = (data: unknown) => new Response(JSON.stringify({ success: true, data }), { status: 200 });
const expired = () => new Response(JSON.stringify({ success: false, error: { message: 'Expired' } }), { status: 401 });
function Probe() {
  const auth = useRole();
  return <><span>{auth.isLoading ? 'loading' : auth.user ? `${auth.user.name}:${auth.role}` : 'signed out'}</span><button onClick={() => void auth.logout()}>Logout</button></>;
}
afterEach(() => { cleanup(); clearSession(); vi.unstubAllGlobals(); });
describe('authenticated identity', () => {
  it.each(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN'])('restores the backend %s role rather than a saved demo role', async role => {
    localStorage.setItem('pulsehr.role', 'admin');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(success({ accessToken: 'access' })).mockResolvedValueOnce(success({ id: 'user', email: 'person@example.test', role, isActive: true, employee: { id: 'employee', firstName: 'Test', lastName: 'Person', designation: 'Engineer' } })));
    render(<QueryClientProvider client={new QueryClient()}><RoleProvider><Probe /></RoleProvider></QueryClientProvider>);
    expect(await screen.findByText(`Test Person:${role.toLowerCase()}`)).toBeInTheDocument();
    localStorage.removeItem('pulsehr.role');
  });
  it('clears private query data when the session expires', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(expired()));
    const client = new QueryClient(); client.setQueryData(['private'], { salary: 123 });
    render(<QueryClientProvider client={client}><RoleProvider><Probe /></RoleProvider></QueryClientProvider>);
    await screen.findByText('signed out');
    expect(client.getQueryData(['private'])).toBeUndefined();
  });
  it('clears identity and cache on logout', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(success({ accessToken: 'access' })).mockResolvedValueOnce(success({ id: 'user', email: 'person@example.test', role: 'HR', isActive: true, employee: { id: 'employee', firstName: 'Test', lastName: 'Person', designation: 'HR' } })).mockResolvedValueOnce(success({ message: 'Logged out' })));
    const client = new QueryClient();
    render(<QueryClientProvider client={client}><RoleProvider><Probe /></RoleProvider></QueryClientProvider>);
    await screen.findByText('Test Person:hr'); client.setQueryData(['private'], 'private');
    await act(async () => { screen.getByRole('button').click(); });
    await waitFor(() => expect(screen.getByText('signed out')).toBeInTheDocument());
    expect(client.getQueryData(['private'])).toBeUndefined();
  });
});
