import { useState } from 'react';
import supabase from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export function SupabaseTest() {
  const [status, setStatus] = useState<string>('');
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    try {
      setStatus('Testando conexão com Supabase...');
      const { data, error } = await supabase.from('profiles').select('count');
      
      if (error) {
        throw error;
      }
      
      setData(data);
      setError(null);
      setStatus('Conexão bem-sucedida!');
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
      setStatus('Falha na conexão');
      console.error('Erro ao testar conexão:', err);
    }
  };
  
  const testAuth = async () => {
    try {
      setStatus('Testando configuração de autenticação...');
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        throw error;
      }
      
      setData(data);
      setError(null);
      setStatus('Autenticação configurada corretamente!');
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido');
      setStatus('Falha na autenticação');
      console.error('Erro ao testar autenticação:', err);
    }
  };
  
  return (
    <div className="p-4 border rounded-md space-y-4">
      <h2 className="text-lg font-bold">Teste do Supabase</h2>
      
      <div className="space-y-2">
        <Button onClick={testConnection} variant="outline" className="mr-2">
          Testar Conexão
        </Button>
        
        <Button onClick={testAuth} variant="outline">
          Testar Autenticação
        </Button>
      </div>
      
      {status && (
        <div className="mt-4">
          <p className="font-medium">Status: {status}</p>
        </div>
      )}
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700">
          <p>Erro: {error}</p>
        </div>
      )}
      
      {data && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 