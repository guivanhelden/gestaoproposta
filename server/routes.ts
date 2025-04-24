import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  // insertTeamSchema, // Removido
  insertOperatorSchema, 
  // insertAdministratorSchema, // Removido
  // insertProposalSchema, // Removido
  // insertEmailSchema, // Removido
  // insertProposalHistorySchema // Removido
} from "@shared/schema";

// Definir a URL base do Supabase e a API key
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://axuiroefeifjcbtokddq.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dWlyb2VmZWlmamNidG9rZGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgxNTg0ODcsImV4cCI6MjA0MzczNDQ4N30.G-7dQg-5E_TpZQw6cCj2_MvLNtpkMvFEIf7oQDqQJJQ';

export async function registerRoutes(app: Express): Promise<Server> {
  // Rota de teste simples
  app.get("/test", (req, res) => {
    res.json({ message: "Servidor funcionando corretamente!" });
  });

  // Configuração de autenticação
  setupAuth(app);

  // API Routes
  const apiRouter = app.route('/api');
  
  // Equipes (Removido)
  // app.get("/api/teams", ...)
  // app.get("/api/teams/:id", ...)
  // app.post("/api/teams", ...)
  // app.put("/api/teams/:id", ...)
  // app.delete("/api/teams/:id", ...)
  
  // Operadoras (Mantido - Interage com Supabase)
  app.get("/api/operators", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/operators`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar operadoras');
      }
      
      const operators = await response.json();
      res.json(operators);
    } catch (error) {
      console.error('Erro ao buscar operadoras:', error);
      res.status(500).json({ message: 'Erro ao buscar operadoras' });
    }
  });
  
  app.get("/api/operators/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const response = await fetch(`${SUPABASE_URL}/rest/v1/operators?id=eq.${id}`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao buscar operadora');
      }
      
      const operators = await response.json();
      
      if (operators.length === 0) {
        return res.status(404).json({ message: "Operadora não encontrada" });
      }
      
      res.json(operators[0]);
    } catch (error) {
      console.error('Erro ao buscar operadora:', error);
      res.status(500).json({ message: 'Erro ao buscar operadora' });
    }
  });
  
  app.post("/api/operators", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const operatorData = req.body;
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/operators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(operatorData),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao criar operadora');
      }
      
      const createdOperator = await response.json();
      res.status(201).json(createdOperator[0]);
    } catch (error) {
      console.error('Erro ao criar operadora:', error);
      res.status(500).json({ message: 'Erro ao criar operadora' });
    }
  });
  
  app.put("/api/operators/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      const operatorData = req.body;
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/operators?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(operatorData),
      });
      
      if (!response.ok) {
        throw new Error('Erro ao atualizar operadora');
      }
      
      const updatedOperator = await response.json();
      
      if (updatedOperator.length === 0) {
        return res.status(404).json({ message: "Operadora não encontrada" });
      }
      
      res.json(updatedOperator[0]);
    } catch (error) {
      console.error('Erro ao atualizar operadora:', error);
      res.status(500).json({ message: 'Erro ao atualizar operadora' });
    }
  });
  
  app.delete("/api/operators/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const id = parseInt(req.params.id);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/operators?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir operadora');
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir operadora:', error);
      res.status(500).json({ message: 'Erro ao excluir operadora' });
    }
  });
  
  // Administradoras (Removido)
  // app.get("/api/administrators", ...)
  // app.get("/api/administrators/:id", ...)
  // app.post("/api/administrators", ...)
  // app.put("/api/administrators/:id", ...)
  // app.delete("/api/administrators/:id", ...)

  // Propostas (Removido)
  // app.get("/api/proposals", ...)
  // ...
  
  // Emails (Removido)
  // app.get("/api/emails", ...)
  // ...
  
  // Histórico de propostas (Removido)
  // app.get("/api/proposals/:proposalId/history", ...)

  const httpServer = createServer(app);
  return httpServer;
}
