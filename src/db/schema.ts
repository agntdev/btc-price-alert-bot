import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  telegramId: integer("telegram_id").unique().notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
});

export const telegramChats = sqliteTable("telegram_chats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatId: text("chat_id").unique().notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
});

export const priceRecords = sqliteTable("price_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  price: real("price").notNull(),
  timestamp: text("timestamp").notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id),
});

export const alerts = sqliteTable("alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  percentageChange: real("percentage_change").notNull(),
  price: real("price").notNull(),
  timestamp: text("timestamp").notNull(),
  priceRecordId: integer("price_record_id")
    .notNull()
    .references(() => priceRecords.id),
  chatId: integer("chat_id")
    .notNull()
    .references(() => telegramChats.id),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  telegramChat: one(telegramChats, {
    fields: [users.id],
    references: [telegramChats.userId],
  }),
  priceRecord: one(priceRecords, {
    fields: [users.id],
    references: [priceRecords.userId],
  }),
}));

export const telegramChatsRelations = relations(telegramChats, ({ one, many }) => ({
  user: one(users, {
    fields: [telegramChats.userId],
    references: [users.id],
  }),
  alerts: many(alerts),
}));

export const priceRecordsRelations = relations(priceRecords, ({ one, many }) => ({
  user: one(users, {
    fields: [priceRecords.userId],
    references: [users.id],
  }),
  alerts: many(alerts),
}));

export const alertsRelations = relations(alerts, ({ one }) => ({
  priceRecord: one(priceRecords, {
    fields: [alerts.priceRecordId],
    references: [priceRecords.id],
  }),
  telegramChat: one(telegramChats, {
    fields: [alerts.chatId],
    references: [telegramChats.id],
  }),
}));
