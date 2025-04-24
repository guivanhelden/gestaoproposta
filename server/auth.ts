import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

const supabaseUrl = 'https://axuiroefeifjcbtokddq.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "vh-saude-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  // Esquema de validação para registro
  const registerSchema = insertUserSchema.extend({
    passwordConfirm: z.string(),
  }).refine((data) => data.password === data.passwordConfirm, {
    message: "Senhas não coincidem",
    path: ["passwordConfirm"],
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validar dados
      const userData = registerSchema.parse(req.body);
      
      // Verificar se usuário já existe
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).send("Nome de usuário já existe");
      }

      // Criar usuário
      const user = await storage.createUser({
        ...userData,
        password: await hashPassword(userData.password),
      });

      // Autenticar após registro
      req.login(user, (err) => {
        if (err) return next(err);
        // Não retorna a senha no response
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Não retorna a senha no response
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.status(200).json(userWithoutPassword);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Não retorna a senha no response
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
}

// Função auxiliar para buscar o perfil e papéis do usuário
const fetchUserData = async (userId: string): Promise<UserWithRoles | null> => {
  try {
    console.log("Buscando dados do usuário:", userId);
    
    // Buscar perfil diretamente
    console.log("Buscando perfil do usuário...");
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')  // Buscar todos os campos
      .eq('id', userId)
      .maybeSingle(); // Usar maybeSingle em vez de single para não lançar erro
      
    if (profileError) {
      console.error("Erro ao buscar perfil:", profileError);
      throw profileError;
    }
    
    // Se o perfil não existir, use dados básicos
    if (!profile) {
      console.log("Perfil não encontrado, usando dados básicos");
      // Obter dados básicos do usuário
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("Erro ao buscar dados do usuário:", userError);
        throw userError;
      }
      
      // Criar um perfil básico em memória (não tentar inserir no banco)
      const basicUser: UserWithRoles = {
        id: userId,
        name: userData?.user?.user_metadata?.name || userData?.user?.email?.split('@')[0] || 'Usuário',
        email: userData?.user?.email || null,
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        roles: ['corretor'] // Papel padrão
      };
      
      console.log("Usando dados básicos:", basicUser);
      return basicUser;
    }
    
    console.log("Perfil encontrado:", profile);
    
    // Tente buscar os papéis do usuário
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);
      
    if (rolesError) {
      console.error("Erro ao buscar papéis:", rolesError);
      // Continuar com papel padrão
      const userWithDefaultRole: UserWithRoles = {
        ...profile,
        roles: ['corretor']
      };
      return userWithDefaultRole;
    }
    
    // Combinar os dados em um único objeto
    const userWithRoles: UserWithRoles = {
      ...profile,
      roles: roles?.map(r => r.role) || ['corretor']
    };
    
    console.log("Retornando dados completos:", userWithRoles);
    return userWithRoles;
    
  } catch (err) {
    console.error("Erro geral ao buscar dados do usuário:", err);
    
    // Recuperação de emergência: usar dados básicos do Auth
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const basicUser: UserWithRoles = {
          id: userId,
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Usuário',
          email: data.user.email || null,
          avatar_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: ['corretor']
        };
        
        console.log("Retornando dados de emergência:", basicUser);
        return basicUser;
      }
    } catch (e) {
      console.error("Falha final:", e);
    }
    
    return null;
  }
};
