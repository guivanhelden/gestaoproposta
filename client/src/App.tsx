import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DndProvider } from "@/lib/dnd-provider";
import { AuthProvider } from "@/hooks/use-auth";
import MainLayout from "@/components/layout/MainLayout";

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

// Função para envolver um componente com MainLayout
const withLayout = (Component: React.ComponentType<any>) => {
  return (props: any) => (
    <MainLayout>
      <Component {...props} />
    </MainLayout>
  );
};

function Router() {
  return (
    <Switch>
      {/* Rota pública sem layout principal */}
      <Route path="/auth" component={AuthPage} />

      {/* Rotas protegidas com layout principal */}
      <ProtectedRoute path="/" component={withLayout(HomePage)} />
      {/* Reaplicar o withLayout na rota /dashboard */}
      <ProtectedRoute path="/dashboard" component={withLayout(Dashboard)} /> 
      
      {/* Quadros de Propostas */}
      <ProtectedRoute path="/quadros" component={withLayout(Quadros)} />
      <ProtectedRoute path="/quadros/gerenciador" component={withLayout(GerenciadorQuadros)} />
      <ProtectedRoute path="/quadros/visualizar/:id" component={withLayout(VisualizarQuadro)} />
      
      {/* Redirecionamentos para rotas antigas */}
      <ProtectedRoute path="/quadros/pme-seguradoras" component={withLayout(QuadrosRedirect)} />
      <ProtectedRoute path="/quadros/pme-principais-operadoras" component={withLayout(QuadrosRedirect)} />
      <ProtectedRoute path="/quadros/pme-demais-operadoras" component={withLayout(QuadrosRedirect)} />
      <ProtectedRoute path="/quadros/pessoa-fisica" component={withLayout(QuadrosRedirect)} />
      <ProtectedRoute path="/quadros/adesao" component={withLayout(QuadrosRedirect)} />
      
      {/* Outras rotas */}
      <ProtectedRoute path="/emails" component={withLayout(Emails)} />
      <ProtectedRoute path="/operadoras" component={withLayout(Operadoras)} />
      <ProtectedRoute path="/administradoras" component={withLayout(Administradoras)} />
      <ProtectedRoute path="/equipes" component={withLayout(Equipes)} />
      <ProtectedRoute path="/corretores" component={withLayout(Corretores)} />
      <ProtectedRoute path="/ajustes" component={withLayout(Ajustes)} />
      
      {/* Rota NotFound - Deve ser a última */}
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
