// Importa utilitários do Drizzle ORM
import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Cria a tabela de usuários com ID único gerado automaticamente
export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
});

// Define a relação: um usuário pode estar vinculado a várias clínicas
export const usersTableRelations = relations(usersTable, ({ many }) => ({
  usersToClinics: many(usersToClinicsTable),
}));

// Cria a tabela de clínicas
export const clinicsTable = pgTable("clinics", {
  id: uuid("id").defaultRandom().primaryKey(), // ID gerado automaticamente
  name: text("name").notNull(), // Nome da clínica (obrigatório)
  createdAt: timestamp("created_at").defaultNow().notNull(), // Timestamp de criação
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()), // Atualiza o campo updatedAt automaticamente
});

// Tabela intermediária para relacionar usuários a clínicas (muitos-para-muitos)
export const usersToClinicsTable = pgTable("users_to_clinics", {
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id), // Referência ao usuário
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id), // Referência à clínica
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Define as relações entre usuários e clínicas
export const usersToClinicsTableRelations = relations(
  usersToClinicsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [usersToClinicsTable.userId],
      references: [usersTable.id],
    }),
    clinic: one(clinicsTable, {
      fields: [usersToClinicsTable.clinicId],
      references: [clinicsTable.id],
    }),
  }),
);

// Define os relacionamentos da clínica com outras tabelas
export const clinicsTableRelations = relations(clinicsTable, ({ many }) => ({
  doctors: many(doctorsTable), // Uma clínica pode ter vários médicos
  patients: many(patientsTable), // Uma clínica pode ter vários pacientes
  appointments: many(appointmentsTable), // Uma clínica pode ter vários agendamentos
  usersToClinics: many(usersToClinicsTable), // Relações com usuários
}));

// Cria a tabela de médicos/terapeutas
export const doctorsTable = pgTable("doctors", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }), // Apaga médicos se a clínica for removida
  name: text("name").notNull(),
  avatarImageUrl: text("avatar_image_url"), // URL da imagem do médico
  availableFromWeekDay: integer("available_from_week_day").notNull(), // Dia da semana de início da disponibilidade
  availableToWeekDay: integer("available_to_week_day").notNull(), // Dia da semana de término da disponibilidade
  availableFromTime: time("available_from_time").notNull(), // Hora de início
  availableToTime: time("available_to_time").notNull(), // Hora de fim
  specialty: text("specialty").notNull(), // Especialidade do médico
  appointmentPriceInCents: integer("appointment_price_in_cents").notNull(), // Valor da consulta em centavos
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relacionamento: médico pertence a uma clínica e pode ter vários agendamentos
export const doctorsTableRelations = relations(
  doctorsTable,
  ({ many, one }) => ({
    clinic: one(clinicsTable, {
      fields: [doctorsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
  }),
);

// Enum para sexo do paciente: masculino ou feminino
export const patientSexEnum = pgEnum("patient_sex", ["male", "female"]);

// Tabela de pacientes
export const patientsTable = pgTable("patients", {
  id: uuid("id").defaultRandom().primaryKey(),
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  sex: patientSexEnum("sex").notNull(), // Usa o enum definido acima
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relacionamento: paciente pertence a uma clínica e pode ter vários agendamentos
export const patientsTableRelations = relations(
  patientsTable,
  ({ one, many }) => ({
    clinic: one(clinicsTable, {
      fields: [patientsTable.clinicId],
      references: [clinicsTable.id],
    }),
    appointments: many(appointmentsTable),
  }),
);

// Tabela de agendamentos
export const appointmentsTable = pgTable("appointments", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: timestamp("date").notNull(), // Data e hora do agendamento
  clinicId: uuid("clinic_id")
    .notNull()
    .references(() => clinicsTable.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  doctorId: uuid("doctor_id")
    .notNull()
    .references(() => doctorsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relacionamento: agendamento pertence a um paciente, médico e clínica
export const appointmentsTableRelations = relations(
  appointmentsTable,
  ({ one }) => ({
    clinic: one(clinicsTable, {
      fields: [appointmentsTable.clinicId],
      references: [clinicsTable.id],
    }),
    patient: one(patientsTable, {
      fields: [appointmentsTable.patientId],
      references: [patientsTable.id],
    }),
    doctor: one(doctorsTable, {
      fields: [appointmentsTable.doctorId],
      references: [doctorsTable.id],
    }),
  }),
);
