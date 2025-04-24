import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Obtenha as credenciais do seu projeto Supabase
// No ambiente de produção, essas variáveis devem ser injetadas pelo processo de build
const supabaseUrl = 'https://axuiroefeifjcbtokddq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dWlyb2VmZWlmamNidG9rZGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3ODg0ODcsImV4cCI6MjA1ODM2NDQ4N30.C1kKcA8ZzEL_62bL9z81qjEcS23bzQRhSA55o4wCY9o';

// Função de fetch com timeout
const fetchWithTimeout = (input: RequestInfo | URL, init?: RequestInit) => {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), 15000);
  
  const signal = init?.signal || timeoutController.signal;
  const newInit = { ...init, signal };
  
  const fetchPromise = fetch(input, newInit);
  return fetchPromise.finally(() => clearTimeout(timeoutId));
};

// Configura opções para o cliente Supabase
const supabaseOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    // Configurações para lidar com problemas de rede
    fetch: fetchWithTimeout
  },
  realtime: {
    timeout: 10000 // 10 segundos para timeout de websockets
  }
};

// Crie e exporte o cliente Supabase
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, supabaseOptions);

// Configuração para detectar problemas de conexão
window.addEventListener('online', () => {
  console.log('Conexão com a internet restaurada');
  // Atualiza a sessão automaticamente quando a conexão for restaurada
  supabase.auth.getSession().then(() => {
    console.log('Sessão atualizada após reconexão');
  });
});

export default supabase; 