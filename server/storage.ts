import { 
  users, 
  type User, type InsertUser, 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface para operações de armazenamento (simplificada)
export interface IStorage {
  // Sessão
  sessionStore: session.Store;
  
  // Usuários
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  
  sessionStore: session.Store;
  
  currentUserId: number;

  constructor() {
    // Inicializa mapas
    this.users = new Map();
    
    // Inicializa contadores
    this.currentUserId = 1;
    
    // Inicializa session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // limpa sessões expiradas a cada 24h
    });
  }

  // Usuários
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    
    // Garante que os campos requeridos em 'User' tenham valores padrão 
    // se forem opcionais ou não existirem em 'InsertUser'.
    const user: User = {
      id: id,
      username: insertUser.username,
      password: insertUser.password, 
      name: insertUser.name,
      email: insertUser.email,
      role: insertUser.role || 'corretor', // Garante que 'role' seja sempre string
      avatar: insertUser.avatar || null,     // Garante valor default para avatar
      teamId: insertUser.teamId || null,     // Garante valor default para teamId
    };
    
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
