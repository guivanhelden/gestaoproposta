import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DndProvider } from "@/lib/dnd-provider";
import { AuthProvider } from "@/hooks/use-auth";

import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import Dashboard from "@/pages/dashboard";

// Quadros
import Quadros from "@/pages/quadros";
import GerenciadorQuadros from "@/pages/quadros/gerenciador";
import VisualizarQuadro from "@/pages/quadros/visualizar/[id]";

// Outras páginas
import Emails from "@/pages/emails";
import Operadoras from "@/pages/operadoras";
import Administradoras from "@/pages/administradoras";
import Equipes from "@/pages/equipes";
import Corretores from "@/pages/corretores";
import Ajustes from "@/pages/ajustes";

import { ProtectedRoute } from "./lib/protected-route";

// Componente de redirecionamento para as antigas rotas de quadros
const QuadrosRedirect = () => <Redirect to="/quadros" />;

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      
      {/* Quadros de Propostas */}
      <ProtectedRoute path="/quadros" component={Quadros} />
      <ProtectedRoute path="/quadros/gerenciador" component={GerenciadorQuadros} />
      <ProtectedRoute path="/quadros/visualizar/:id" component={VisualizarQuadro} />
      
      {/* Redirecionamentos para rotas antigas */}
      <ProtectedRoute path="/quadros/pme-seguradoras" component={QuadrosRedirect} />
      <ProtectedRoute path="/quadros/pme-principais-operadoras" component={QuadrosRedirect} />
      <ProtectedRoute path="/quadros/pme-demais-operadoras" component={QuadrosRedirect} />
      <ProtectedRoute path="/quadros/pessoa-fisica" component={QuadrosRedirect} />
      <ProtectedRoute path="/quadros/adesao" component={QuadrosRedirect} />
      
      {/* Outras rotas */}
      <ProtectedRoute path="/emails" component={Emails} />
      <ProtectedRoute path="/operadoras" component={Operadoras} />
      <ProtectedRoute path="/administradoras" component={Administradoras} />
      <ProtectedRoute path="/equipes" component={Equipes} />
      <ProtectedRoute path="/corretores" component={Corretores} />
      <ProtectedRoute path="/ajustes" component={Ajustes} />
      
      {/* Fallback para 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <DndProvider>
            <Toaster />
            <Router />
          </DndProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
