import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import supabase from "@/lib/supabase";

// Definir interfaces para os tipos de dados
interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

interface UserWithRoles extends UserProfile {
  roles: string[];
}

type AuthContextType = {
  user: UserWithRoles | null;
  isLoading: boolean;
  error: Error | null;
  login: (credentials: { email: string; password: string }) => Promise<UserWithRoles | null>;
  logout: () => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    name: string;
  }) => Promise<UserWithRoles | null>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserWithRoles | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Função auxiliar para buscar o perfil e papéis do usuário
  const fetchUserData = async (userId: string): Promise<UserWithRoles | null> => {
    try {
      console.log("Buscando dados do usuário:", userId);
      
      // Verificar se existe cache local para evitar chamadas desnecessárias
      const cacheKey = `user_data_${userId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      // Se o cache for válido, use-o (válido por 10 minutos = 600000ms)
      if (cachedData) {
        try {
          const parsedCache = JSON.parse(cachedData);
          const cacheTime = parsedCache.timestamp || 0;
          const now = Date.now();
          const cacheAge = now - cacheTime;
          
          if (cacheAge < 600000) { // 10 minutos
            console.log("Usando dados em cache para usuário:", userId);
            return parsedCache.data;
          }
          console.log("Cache expirado, buscando dados frescos");
        } catch (e) {
          console.warn("Erro ao parsear cache:", e);
        }
      }
      
      // Timeout para evitar travamentos indefinidos
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido ao buscar dados do usuário")), 5000);
      });
      
      // Função principal para buscar dados
      const fetchDataPromise = async (): Promise<UserWithRoles | null> => {
        // Buscar perfil e papéis em paralelo
        console.log("Iniciando busca paralela de perfil e papéis...");
        const [profileResult, rolesResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single(),
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
        ]);

        console.log("Resultados das buscas paralelas recebidos.");

        // --- Tratamento do resultado do Perfil ---
        let profile = profileResult.data;
        const profileError = profileResult.error;

        if (profileError) {
          // Se o erro for "PGRST116" (nenhuma linha encontrada), tentamos criar o perfil
          if (profileError.code === 'PGRST116') { 
            console.log("Perfil não encontrado (PGRST116), tentando criar um perfil básico...");
            try {
              const { data: userData, error: userError } = await supabase.auth.getUser();
              if (userError) throw userError;

              const { data: newProfile, error: insertError } = await supabase
                .from('profiles')
                .insert([
                  {
                    id: userId,
                    name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'Usuário',
                    email: userData.user.email || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                ])
                .select('*')
                .single();

              if (insertError) throw insertError;

              console.log("Perfil criado com sucesso:", newProfile);
              profile = newProfile; // Usar o perfil recém-criado

              // Adicionar papel padrão (corretor) para o novo perfil
              console.log("Adicionando papel padrão (corretor)...");
              const { error: roleInsertError } = await supabase
                .from('user_roles')
                .insert([{ user_id: userId, role: 'corretor' }]);

              if (roleInsertError) {
                console.error("Erro ao adicionar papel:", roleInsertError);
                // Não lançar erro aqui, podemos continuar sem o papel padrão se necessário
              }

            } catch (creationError) {
              console.error("Erro ao criar perfil ou buscar usuário:", creationError);
              console.error("Detalhes completos do erro:", JSON.stringify(creationError));
              // Se a criação falhar, lançamos o erro original da busca para o catch externo
              throw profileError; 
            }
          } else {
            // Se for outro erro na busca de perfil, lançamos ele
            console.error("Erro ao buscar perfil:", profileError);
            console.error("Detalhes completos do erro:", JSON.stringify(profileError));
            throw profileError;
          }
        } else {
           console.log("Perfil encontrado:", profile);
        }

        // --- Tratamento do resultado dos Papéis ---
        const userRoles = rolesResult.data;
        const rolesError = rolesResult.error;

        if (rolesError) {
          console.error("Erro ao buscar papéis:", rolesError);
          console.error("Detalhes completos do erro:", JSON.stringify(rolesError));
          // Se não conseguir buscar papéis, continue com um array vazio ou padrão
          console.log("Continuando com array de papéis padrão (corretor)");
          const userWithDefaultRole: UserWithRoles = {
            ...(profile as UserProfile), // Profile deve existir neste ponto (criado ou encontrado)
            roles: ['corretor'] // Papel padrão
          };
          return userWithDefaultRole;
        }

        console.log("Papéis encontrados:", userRoles);

        // Combinar em um único objeto
        const userWithRoles: UserWithRoles = {
          ...(profile as UserProfile), // Profile deve existir
          roles: userRoles?.map(r => r.role) || []
        };

        console.log("Dados do usuário completos:", userWithRoles);
        
        // Salvar no cache local com timestamp
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            data: userWithRoles,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn("Erro ao salvar cache:", e);
        }
        
        return userWithRoles;
      };
      
      // Competição entre o timeout e a busca real
      return Promise.race([fetchDataPromise(), timeoutPromise]) as Promise<UserWithRoles | null>;
    } catch (err) {
      console.error("Erro ao buscar dados do usuário:", err);
      
      // Encerrar o carregamento mesmo em caso de erro
      setTimeout(() => setIsLoading(false), 100);
      
      // Tente recuperar informações básicas do usuário do Supabase Auth
      try {
        console.log("Tentando obter dados básicos do usuário do Auth...");
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Erro ao buscar dados básicos:", userError);
          return null;
        }
        
        // Criar um objeto de usuário básico para não bloquear o login
        const basicUser: UserWithRoles = {
          id: userId,
          name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'Usuário',
          email: userData.user.email || null,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: ['corretor'] // Papel padrão
        };
        
        console.log("Usando dados básicos do usuário:", basicUser);
        return basicUser;
      } catch (recoveryErr) {
        console.error("Falha na recuperação de dados básicos:", recoveryErr);
        return null;
      }
    }
  };

  useEffect(() => {
    // Verifica a sessão atual ao carregar
    const checkSession = async () => {
      try {
        console.log("Verificando sessão...");
        
        // Adicionar timeout global para o checkSession
        const sessionTimeoutId = setTimeout(() => {
          console.log("Timeout de sessão acionado");
          setIsLoading(false);
        }, 10000);
        
        const { data, error } = await supabase.auth.getSession();
        
        // Limpar timeout se a resposta vier antes
        clearTimeout(sessionTimeoutId);
        
        if (error) {
          console.error("Erro na sessão:", error);
          throw error;
        }
        
        console.log("Resposta da sessão:", data);
        
        if (data.session) {
          console.log("Sessão encontrada, buscando dados do usuário");
          const userData = await fetchUserData(data.session.user.id);
          if (userData) {
            setUser(userData);
            console.log("Usuário logado:", userData);
          }
        } else {
          console.log("Nenhuma sessão ativa encontrada");
        }
      } catch (err) {
        console.error("Erro ao verificar sessão:", err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setIsLoading(false);
      }
    };

    // Configura o listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Evento de autenticação:", event, session);
      
      if (event === 'SIGNED_IN' && session) {
        console.log("Usuário fez login, buscando dados");
        const userData = await fetchUserData(session.user.id);
        if (userData) {
          setUser(userData);
          console.log("Dados do usuário atualizados após login");
        }
      } else if (event === 'SIGNED_OUT') {
        console.log("Usuário fez logout");
        setUser(null);
      }
    });

    checkSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      console.log("Tentando login com:", credentials.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        console.error("Erro no login:", error);
        throw error;
      }

      console.log("Login bem-sucedido:", data);
      
      const userData = await fetchUserData(data.user.id);
      if (userData) {
        setUser(userData);
        console.log("Dados do usuário carregados após login");
      } else {
        console.error("Não foi possível obter dados do usuário após login");
      }
      
      return userData;
    } catch (err) {
      console.error("Erro completo no login:", err);
      const errorMessage = err instanceof Error ? err.message : 'Falha no login';
      toast({
        title: "Falha no login",
        description: errorMessage,
        variant: "destructive",
      });
      setError(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    email: string;
    password: string;
    name: string;
  }) => {
    try {
      setIsLoading(true);
      console.log("Tentando registrar usuário:", userData.email);
      
      // Registrar no auth do Supabase
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name
          }
        }
      });

      if (error) {
        console.error("Erro no registro:", error);
        throw error;
      }
      
      console.log("Resposta do registro:", data);
      
      if (!data.user) {
        console.error("Usuário não retornado no registro");
        throw new Error('Falha ao criar usuário');
      }
      
      // Criar perfil de usuário na tabela profiles
      console.log("Criando perfil para o usuário:", data.user.id);
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: data.user.id,
            email: userData.email || null,
            name: userData.name,
          }
        ]);
        
      if (profileError) {
        console.error("Erro ao criar perfil:", profileError);
        throw profileError;
      }
      
      // Adicionar papel padrão (corretor)
      console.log("Adicionando papel padrão (corretor) para o usuário");
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([
          {
            user_id: data.user.id,
            role: 'corretor'
          }
        ]);
        
      if (roleError) {
        console.error("Erro ao adicionar papel:", roleError);
        throw roleError;
      }
      
      // Buscar dados completos do usuário
      console.log("Buscando dados completos do novo usuário");
      const userWithRoles = await fetchUserData(data.user.id);
      
      if (userWithRoles) {
        setUser(userWithRoles);
        console.log("Usuário registrado e logado com sucesso");
      } else {
        console.error("Não foi possível buscar dados do usuário após registro");
      }
      
      return userWithRoles;
    } catch (err) {
      console.error("Erro completo no registro:", err);
      const errorMessage = err instanceof Error ? err.message : 'Falha no cadastro';
      toast({
        title: "Falha no cadastro",
        description: errorMessage,
        variant: "destructive",
      });
      setError(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      console.log("Iniciando logout");
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Erro ao fazer logout:", error);
        throw error;
      }
      
      console.log("Logout bem-sucedido");
      setUser(null);
      queryClient.clear();
    } catch (err) {
      console.error("Erro completo no logout:", err);
      const errorMessage = err instanceof Error ? err.message : 'Falha ao sair';
      toast({
        title: "Falha ao sair",
        description: errorMessage,
        variant: "destructive",
      });
      setError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
