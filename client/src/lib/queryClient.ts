import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Função de timeout para abortar requisições que demoram muito
const fetchWithTimeout = async (
  resource: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> => {
  const { timeout = 15000, ...fetchOptions } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...fetchOptions,
      signal: controller.signal
    });
    return response;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new Error('Tempo limite da requisição excedido');
    }
    throw error;
  } finally {
    clearTimeout(id);
  }
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetchWithTimeout(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    timeout: 15000 // 15 segundos de timeout
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetchWithTimeout(queryKey[0] as string, {
      credentials: "include",
      timeout: 15000 // 15 segundos de timeout
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente chamado cacheTime)
      retry: 1, // Tenta apenas uma vez antes de falhar
      retryDelay: 1000, // 1 segundo entre tentativas
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
