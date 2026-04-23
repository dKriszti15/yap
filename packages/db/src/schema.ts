import { pgTable, uuid, text, timestamp, foreignKey, uniqueIndex } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id:        uuid('id').primaryKey().defaultRandom(),
  sub:       text('sub').notNull().unique(),
  username:  text('username').notNull().unique(),
  email:     text('email').notNull(),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const groups = pgTable('groups', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      text('name').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const groupMembers = pgTable('group_members', {
  id:        uuid('id').primaryKey().defaultRandom(),
  groupId:   uuid('group_id').notNull(),
  userId:    uuid('user_id').notNull(),
  role:      text('role').notNull().default('member'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.groupId], foreignColumns: [groups.id] }).onDelete('cascade'),
  foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete('cascade'),
  uniqueIndex('group_members_unique').on(table.groupId, table.userId),
])

export const friendships = pgTable('friendships', {
  id:        uuid('id').primaryKey().defaultRandom(),
  userId:    uuid('user_id').notNull(),
  friendId:  uuid('friend_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.userId], foreignColumns: [users.id] }).onDelete('cascade'),
  foreignKey({ columns: [table.friendId], foreignColumns: [users.id] }).onDelete('cascade'),
  uniqueIndex('friendships_unique').on(table.userId, table.friendId),
])