import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { fetchProposalDetails, fetchOperators, OperatorInfo, ProposalDetails } from "@/lib/api";
import { Database } from "@/lib/database.types";

// Tipo para PmePartner do Supabase
type PmePartner = Database['public']['Tables']['pme_company_partners']['Row'];
type Partner = { // Definir a versão UI do partner
  id: string;
  company_id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  is_responsavel: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  is_active?: boolean | null;
  incluir_como_titular?: boolean | null;
};

export function useProposalDetails(submissionId: string | null) {
  const { toast } = useToast();
  const [operatorsList, setOperatorsList] = useState<OperatorInfo[]>([]);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);

  const queryKey = ['proposalDetails', submissionId];
  const {
    data: proposalDetails,
    isLoading,
    error,
    isError,
  } = useQuery<ProposalDetails, Error>({
    queryKey: queryKey,
    queryFn: async () => {
        if (!submissionId) {
            return null;
        }
        console.log(`[useQuery - ${queryKey.join('-')}] Fetching details...`);
        return fetchProposalDetails(submissionId);
    },
    enabled: !!submissionId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
      if (isError && error) {
          console.error("[useProposalDetails] Erro ao buscar detalhes via React Query:", error);
          toast({
              title: "Erro ao carregar dados",
              description: `Não foi possível buscar os detalhes da proposta: ${error.message}`, 
              variant: "destructive"
          });
      }
  }, [isError, error, toast]);

  useEffect(() => {
    const loadOperators = async () => {
      try {
        const operators = await fetchOperators();
        setOperatorsList(operators);
      } catch (error: any) {
        console.error("Erro ao buscar operadoras:", error);
      }
    };
    loadOperators();
  }, []);

  const handleCnpjSearch = async (cnpj: string) => {
    console.log("[useProposalDetails] Buscando CNPJ:", cnpj);
    setIsSearchingCnpj(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast({ title: "Busca CNPJ", description: "Funcionalidade ainda não implementada." });
    setIsSearchingCnpj(false);
  };

  return {
    proposalDetails: proposalDetails ?? null,
    isLoading,
    operatorsList,
    isSearchingCnpj,
    handleCnpjSearch,
  };
} 