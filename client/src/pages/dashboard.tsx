import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
// Remover imports de Header e Sidebar
// import Header from "@/components/layout/header";
// import Sidebar from "@/components/layout/sidebar";
import StatsCard from "@/components/dashboard/stats-card";
import ChartCard from "@/components/dashboard/chart-card";
import RecentActions from "@/components/dashboard/recent-actions";

// Ícones
import { 
  ClipboardList, 
  CheckCircle, 
  AlertCircle, 
  DollarSign 
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  // Remover estado e função de toggle locais
  // const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  // const toggleSidebar = () => {
  //   setIsSidebarCollapsed(prev => !prev);
  // };
  
  // Buscar totais de propostas para os stats cards
  const { data: proposalStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/proposals"],
    // Adicionar tipagem any temporariamente para evitar erros de linter após a remoção dos tipos locais
    select: (data: any) => {
      const proposals = data || [];
      const total = proposals.length;
      const pendentes = proposals.filter((p: any) => 
        ['pendencias-iniciais', 'pendencia-operadora'].includes(p.stage)
      ).length;
      const concluidas = proposals.filter((p: any) => 
        p.stage === 'contrato-ativo'
      ).length;
      const andamento = total - pendentes - concluidas;
      
      const vendasMes = proposals
        .filter((p: any) => p.stage === 'contrato-ativo')
        .reduce((acc: number, p: any) => acc + (parseFloat(p.value?.replace('R$ ', '').replace(',', '.')) || 0), 0);
        
      return {
        andamento,
        concluidas,
        pendentes,
        vendasMes
      };
    }
  });

  // Retornar apenas o conteúdo da página, sem Header, Sidebar ou div wrapper
  return (
    <>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <p className="text-gray-600">Visão geral do sistema de gestão de propostas</p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            title="Propostas em Andamento"
            value={proposalStats?.andamento.toString() || "0"}
            trend={15}
            trend_text="em relação ao mês anterior"
            icon={<ClipboardList className="h-6 w-6 text-primary" />}
            color="primary"
          />
          
          <StatsCard 
            title="Propostas Concluídas"
            value={proposalStats?.concluidas.toString() || "0"}
            trend={23}
            trend_text="em relação ao mês anterior"
            icon={<CheckCircle className="h-6 w-6 text-green-500" />}
            color="success"
          />
          
          <StatsCard 
            title="Propostas Pendentes"
            value={proposalStats?.pendentes.toString() || "0"}
            trend={8}
            trend_text="em relação ao mês anterior"
            trendUp={false}
            icon={<AlertCircle className="h-6 w-6 text-amber-500" />}
            color="warning"
          />
          
          <StatsCard 
            title="Vendas no Mês"
            value={`R$ ${proposalStats?.vendasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || "0,00"}`}
            trend={32}
            trend_text="em relação ao mês anterior"
            icon={<DollarSign className="h-6 w-6 text-accent" />}
            color="accent"
          />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ChartCard 
            title="Evolução de Propostas por Mês"
            type="line"
            data={[
              { name: 'Jan', value: 42 },
              { name: 'Fev', value: 47 },
              { name: 'Mar', value: 54 },
              { name: 'Abr', value: 58 },
              { name: 'Mai', value: 65 },
              { name: 'Jun', value: 78 },
            ]}
          />
          
          <ChartCard 
            title="Distribuição por Modalidade"
            type="pie"
            data={[
              { name: 'PME Seguradoras', value: 35 },
              { name: 'PME Principais', value: 25 },
              { name: 'PME Demais', value: 15 },
              { name: 'Pessoa Física', value: 15 },
              { name: 'Adesão', value: 10 },
            ]}
          />
        </div>

        {/* Últimas Ações */}
        <RecentActions />
      </div>
    </>
  );
}
