import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();
  const [timeoutExceeded, setTimeoutExceeded] = useState(false);

  useEffect(() => {
    // Se a tela de carregamento persistir por mais de 10 segundos,
    // forçar o redirecionamento para a página de autenticação
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log("Timeout de carregamento da rota protegida excedido");
        setTimeoutExceeded(true);
      }
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [isLoading]);
  
  return (
    <Route 
      path={path} 
      component={(params) => {
        if (isLoading && !timeoutExceeded) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }

        if (!user || timeoutExceeded) {
          return <Redirect to="/auth" />;
        }

        return <Component {...params} />;
      }}
    />
  );
}
