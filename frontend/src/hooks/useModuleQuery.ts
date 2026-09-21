import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useModuleQuery<T>(key: string[], path: string, enabled = true) {
  return useQuery({ queryKey: key, queryFn: ({ signal }) => api.get<T>(path, signal), enabled });
}

export function useModuleMutation<T = unknown>(key: string[], method: 'post' | 'put' | 'delete', path: string | ((body: T) => string)) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: T) => method === 'post' ? api.post(path instanceof Function ? path(body) : path, body) : method === 'put' ? api.put(path instanceof Function ? path(body) : path, body) : api.delete(path instanceof Function ? path(body) : path),
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
