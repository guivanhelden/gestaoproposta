import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("corretor"),
  avatar: text("avatar"),
  teamId: integer("team_id").references(() => teams.id),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true, 
  email: true,
  role: true,
  avatar: true,
  teamId: true,
});

// Equipes
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  supervisorId: integer("supervisor_id"),
  status: boolean("status").notNull().default(true),
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  supervisorId: true,
  status: true,
});

// Operadoras
export const operators = pgTable("operators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj"),
  modalities: text("modalities").array(),
  status: boolean("status").notNull().default(true),
});

export const insertOperatorSchema = createInsertSchema(operators).pick({
  name: true,
  cnpj: true,
  modalities: true,
  status: true,
});

// Administradoras
export const administrators = pgTable("administrators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  operationType: text("operation_type").notNull(),
  status: boolean("status").notNull().default(true),
});

export const insertAdministratorSchema = createInsertSchema(administrators).pick({
  name: true,
  operationType: true,
  status: true,
});

// Propostas
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  cnpj: text("cnpj").notNull(),
  stage: text("stage").notNull().default("entrada-proposta"),
  type: text("type").notNull(), // pme-seguradoras, pme-principais, pme-demais, pessoa-fisica, adesao
  operatorId: integer("operator_id").references(() => operators.id),
  plan: text("plan"),
  modality: text("modality"),
  contractType: text("contract_type"),
  coparticipation: text("coparticipation"),
  value: text("value"),
  lives: integer("lives"),
  validityDate: text("validity_date"),
  grace: text("grace"),
  previousOperator: text("previous_operator"),
  companyData: jsonb("company_data"),
  partners: jsonb("partners"),
  beneficiaries: jsonb("beneficiaries"),
  brokerId: integer("broker_id").references(() => users.id),
  teamId: integer("team_id").references(() => teams.id),
  comments: text("comments"),
  documents: jsonb("documents"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProposalSchema = createInsertSchema(proposals).pick({
  companyName: true,
  cnpj: true,
  stage: true,
  type: true,
  operatorId: true,
  plan: true,
  modality: true,
  contractType: true,
  coparticipation: true,
  value: true,
  lives: true,
  validityDate: true,
  grace: true,
  previousOperator: true,
  companyData: true,
  partners: true,
  beneficiaries: true,
  brokerId: true,
  teamId: true,
  comments: true,
  documents: true,
});

// Emails
export const emails = pgTable("emails", {
  id: serial("id").primaryKey(),
  to: text("to").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status").notNull().default("enviado"),
  proposalId: integer("proposal_id").references(() => proposals.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEmailSchema = createInsertSchema(emails).pick({
  to: true,
  subject: true,
  body: true,
  status: true,
  proposalId: true,
});

// História de proposta
export const proposalHistory = pgTable("proposal_history", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").references(() => proposals.id),
  action: text("action").notNull(),
  stage: text("stage"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProposalHistorySchema = createInsertSchema(proposalHistory).pick({
  proposalId: true,
  action: true,
  stage: true,
  userId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Operator = typeof operators.$inferSelect;
export type InsertOperator = z.infer<typeof insertOperatorSchema>;

export type Administrator = typeof administrators.$inferSelect;
export type InsertAdministrator = z.infer<typeof insertAdministratorSchema>;

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = z.infer<typeof insertProposalSchema>;

export type Email = typeof emails.$inferSelect;
export type InsertEmail = z.infer<typeof insertEmailSchema>;

export type ProposalHistory = typeof proposalHistory.$inferSelect;
export type InsertProposalHistory = z.infer<typeof insertProposalHistorySchema>;
