import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  serial,
  pgEnum,
  real,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["student", "teacher", "parent", "admin"]);
export const questionTypeEnum = pgEnum("question_type", [
  "multiple_choice",
  "fill_blank",
  "matching",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("student"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  teacherId: integer("teacher_id").references(() => users.id).notNull(),
  classCode: text("class_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classEnrollments = pgTable("class_enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
});

export const parentChildren = pgTable("parent_children", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").references(() => users.id).notNull(),
  childId: integer("child_id").references(() => users.id).notNull(),
});

export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
});

export const mishnayos = pgTable("mishnayos", {
  id: serial("id").primaryKey(),
  chapterId: integer("chapter_id").references(() => chapters.id).notNull(),
  number: integer("number").notNull(),
  title: text("title").notNull(),
  hebrewText: text("hebrew_text"),
  englishSummary: text("english_summary"),
  youtubeVideoId: text("youtube_video_id"),
  pdfStartPage: integer("pdf_start_page"),
  order: integer("order").notNull(),
});

export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  mishnayosId: integer("mishnayos_id").references(() => mishnayos.id).notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  order: integer("order").notNull().default(0),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  mishnayosId: integer("mishnayos_id").references(() => mishnayos.id).notNull(),
  type: questionTypeEnum("type").notNull(),
  questionText: text("question_text").notNull(),
  order: integer("order").notNull().default(0),
});

export const questionOptions = pgTable("question_options", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  text: text("text").notNull(),
  isCorrect: boolean("is_correct").notNull().default(false),
});

export const matchingPairs = pgTable("matching_pairs", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  leftText: text("left_text").notNull(),
  rightText: text("right_text").notNull(),
});

export const studentProgress = pgTable("student_progress", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  mishnayosId: integer("mishnayos_id").references(() => mishnayos.id).notNull(),
  unlocked: boolean("unlocked").notNull().default(false),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  videoWatched: boolean("video_watched").notNull().default(false),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  mishnayosId: integer("mishnayos_id").references(() => mishnayos.id).notNull(),
  score: real("score").notNull(),
  maxScore: integer("max_score").notNull(),
  passed: boolean("passed").notNull().default(false),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const quizAnswers = pgTable("quiz_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").references(() => quizAttempts.id).notNull(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  studentAnswer: text("student_answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
});

export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
});
