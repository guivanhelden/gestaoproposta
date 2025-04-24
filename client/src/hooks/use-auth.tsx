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
      
      // Timeout para evitar travamentos indefinidos
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Tempo limite excedido ao buscar dados do usuário")), 15000);
      });
      
      // Função principal para buscar dados
      const fetchDataPromise = async (): Promise<UserWithRoles | null> => {
        // Verificar se o perfil existe antes de buscar
        console.log("Verificando se o perfil existe...");
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('id', userId);
        
        if (countError) {
          console.error("Erro ao verificar perfil:", countError);
          console.error("Detalhes completos do erro:", JSON.stringify(countError));
          throw countError;
        }
        
        console.log(`Encontrados ${count} perfis para o ID ${userId}`);
        
        // Se o perfil não existir, crie um
        if (!count || count === 0) {
          console.log("Perfil não encontrado, tentando criar um perfil básico...");
          
          // Buscar informações básicas do usuário
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error("Erro ao buscar dados do usuário:", userError);
            throw userError;
          }
          
          // Criar um perfil básico
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
            
          if (insertError) {
            console.error("Erro ao criar perfil:", insertError);
            console.error("Detalhes completos do erro:", JSON.stringify(insertError));
            
            // Se não conseguir criar o perfil, vamos tentar continuar com os dados básicos
            console.log("Tentando continuar com dados básicos do usuário...");
            
            const basicProfile: UserWithRoles = {
              id: userId,
              name: userData.user.user_metadata?.name || userData.user.email?.split('@')[0] || 'Usuário',
              email: userData.user.email || null,
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              roles: ['corretor'] // Papel padrão
            };
            
            console.log("Usando perfil básico:", basicProfile);
            return basicProfile;
          }
          
          console.log("Perfil criado com sucesso:", newProfile);
          
          // Adicionar papel padrão (corretor)
          console.log("Adicionando papel padrão (corretor)...");
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert([
              {
                user_id: userId,
                role: 'corretor'
              }
            ]);
            
          if (roleError) {
            console.error("Erro ao adicionar papel:", roleError);
            console.error("Detalhes completos do erro:", JSON.stringify(roleError));
          }
        }
        
        // Buscar perfil do usuário
        console.log("Buscando perfil do usuário...");
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError) {
          console.error("Erro ao buscar perfil:", profileError);
          console.error("Detalhes completos do erro:", JSON.stringify(profileError));
          throw profileError;
        }
        
        console.log("Perfil encontrado:", profile);
        
        // Buscar papéis do usuário
        console.log("Buscando papéis do usuário...");
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);
        
        if (rolesError) {
          console.error("Erro ao buscar papéis:", rolesError);
          console.error("Detalhes completos do erro:", JSON.stringify(rolesError));
          
          // Se não conseguir buscar papéis, continue com um array vazio
          console.log("Continuando com array de papéis vazio");
          const userWithDefaultRole: UserWithRoles = {
            ...profile,
            roles: ['corretor'] // Papel padrão
          };
          
          return userWithDefaultRole;
        }
        
        console.log("Papéis encontrados:", userRoles);
        
        // Combinar em um único objeto
        const userWithRoles: UserWithRoles = {
          ...profile,
          roles: userRoles?.map(r => r.role) || []
        };
        
        console.log("Dados do usuário completos:", userWithRoles);
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
