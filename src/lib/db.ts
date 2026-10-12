import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type { FieldCard, Observation, Place, PlaceSummary, Setting, Visit } from "./types";

const databasePath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.DATABASE_PATH ?? "./data/visits.sqlite");
const audioDirectory = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.AUDIO_DIR ?? "./data/audio");
mkdirSync(path.dirname(databasePath), { recursive: true });

function resolveAudioPath(storedPath: string | null): string | null {
  if (!storedPath) return null;
  return path.isAbsolute(storedPath) ? storedPath : path.join(audioDirectory, storedPath);
}

const globalDb = globalThis as typeof globalThis & { __projectHoverDb?: Database.Database };
export const db = globalDb.__projectHoverDb ?? new Database(databasePath);
globalDb.__projectHoverDb = db;

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    setting TEXT NOT NULL,
    created_at TEXT NOT NULL,
    assistant_id TEXT,
    comparison_text TEXT
  );
  CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL REFERENCES places(id),
    ordinal INTEGER NOT NULL,
    card_json TEXT NOT NULL,
    audio_path TEXT,
    audio_error TEXT,
    retrieved_memory TEXT,
    created_at TEXT NOT NULL,
    UNIQUE(place_id, ordinal)
  );
  CREATE TABLE IF NOT EXISTS observations (
    id TEXT PRIMARY KEY,
    visit_id TEXT NOT NULL UNIQUE REFERENCES visits(id),
    note_text TEXT NOT NULL,
    input_method TEXT NOT NULL,
    created_at TEXT NOT NULL,
    backboard_memory_id TEXT,
    memory_status TEXT NOT NULL DEFAULT 'pending'
  );
`);

type PlaceRow = {
  id: string; nickname: string; setting: Setting; created_at: string;
  assistant_id: string | null; comparison_text: string | null;
};
type VisitRow = {
  id: string; place_id: string; ordinal: number; card_json: string;
  audio_path: string | null; audio_error: string | null;
  retrieved_memory: string | null; created_at: string;
};
type ObservationRow = {
  id: string; visit_id: string; note_text: string; input_method: "speech" | "typed";
  created_at: string; backboard_memory_id: string | null; memory_status: "synced" | "pending";
};

export function listPlaces(): PlaceSummary[] {
  const rows = db.prepare(`
    SELECT p.*, COUNT(v.id) AS visit_count FROM places p
    LEFT JOIN visits v ON v.place_id = p.id
    GROUP BY p.id ORDER BY p.created_at DESC
  `).all() as (PlaceRow & { visit_count: number })[];
  return rows.map((row) => ({
    id: row.id, nickname: row.nickname, setting: row.setting,
    createdAt: row.created_at, assistantReady: Boolean(row.assistant_id),
    visitCount: Number(row.visit_count),
  }));
}

export function getPlaceRow(id: string): PlaceRow | null {
  return (db.prepare("SELECT * FROM places WHERE id = ?").get(id) as PlaceRow | undefined) ?? null;
}

export function createPlace(nickname: string, setting: Setting): Place {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare("INSERT INTO places (id, nickname, setting, created_at) VALUES (?, ?, ?, ?)")
    .run(id, nickname, setting, createdAt);
  return getPlace(id)!;
}

export function setAssistantId(placeId: string, assistantId: string): void {
  db.prepare("UPDATE places SET assistant_id = ? WHERE id = ?").run(assistantId, placeId);
}

export function getPlace(id: string): Place | null {
  const row = getPlaceRow(id);
  if (!row) return null;
  const visitRows = db.prepare("SELECT * FROM visits WHERE place_id = ? ORDER BY ordinal DESC").all(id) as VisitRow[];
  return {
    id: row.id, nickname: row.nickname, setting: row.setting, createdAt: row.created_at,
    assistantReady: Boolean(row.assistant_id), comparison: row.comparison_text,
    visits: visitRows.map(toVisit),
  };
}

function toObservation(row: ObservationRow): Observation {
  return {
    id: row.id, visitId: row.visit_id, noteText: row.note_text,
    inputMethod: row.input_method, createdAt: row.created_at,
    memoryStatus: row.memory_status,
  };
}

function toVisit(row: VisitRow): Visit {
  const observation = db.prepare("SELECT * FROM observations WHERE visit_id = ?").get(row.id) as ObservationRow | undefined;
  const audioPath = resolveAudioPath(row.audio_path);
  return {
    id: row.id, placeId: row.place_id, ordinal: row.ordinal,
    card: JSON.parse(row.card_json) as FieldCard,
    audioReady: Boolean(audioPath && existsSync(/*turbopackIgnore: true*/ audioPath)), audioError: row.audio_error,
    retrievedMemory: row.retrieved_memory, createdAt: row.created_at,
    observation: observation ? toObservation(observation) : null,
  };
}

export function getVisit(id: string): Visit | null {
  const row = db.prepare("SELECT * FROM visits WHERE id = ?").get(id) as VisitRow | undefined;
  return row ? toVisit(row) : null;
}

export function getVisitAudioPath(id: string): string | null {
  const row = db.prepare("SELECT audio_path FROM visits WHERE id = ?").get(id) as { audio_path: string | null } | undefined;
  return resolveAudioPath(row?.audio_path ?? null);
}

export function createVisit(placeId: string, card: FieldCard, retrievedMemory: string | null): Visit {
  const ordinalRow = db.prepare("SELECT COALESCE(MAX(ordinal), 0) + 1 AS next FROM visits WHERE place_id = ?").get(placeId) as { next: number };
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO visits (id, place_id, ordinal, card_json, retrieved_memory, created_at)
    VALUES (?, ?, ?, ?, ?, ?)`).run(id, placeId, ordinalRow.next, JSON.stringify(card), retrievedMemory, new Date().toISOString());
  return getVisit(id)!;
}

export function setVisitAudio(id: string, audioPath: string): void {
  db.prepare("UPDATE visits SET audio_path = ?, audio_error = NULL WHERE id = ?").run(audioPath, id);
}

export function setVisitAudioError(id: string, message: string): void {
  db.prepare("UPDATE visits SET audio_error = ? WHERE id = ?").run(message, id);
}

export function createObservation(visitId: string, noteText: string, inputMethod: "speech" | "typed"): Observation {
  const id = crypto.randomUUID();
  db.prepare(`INSERT INTO observations (id, visit_id, note_text, input_method, created_at)
    VALUES (?, ?, ?, ?, ?)`).run(id, visitId, noteText, inputMethod, new Date().toISOString());
  return getObservation(id)!;
}

export function getObservation(id: string): Observation | null {
  const row = db.prepare("SELECT * FROM observations WHERE id = ?").get(id) as ObservationRow | undefined;
  return row ? toObservation(row) : null;
}

export function setObservationMemory(id: string, memoryId: string): void {
  db.prepare("UPDATE observations SET backboard_memory_id = ?, memory_status = 'synced' WHERE id = ?").run(memoryId, id);
}

export function getPendingObservations(placeId: string): Observation[] {
  const rows = db.prepare(`SELECT o.* FROM observations o JOIN visits v ON v.id = o.visit_id
    WHERE v.place_id = ? AND o.memory_status = 'pending' ORDER BY o.created_at`).all(placeId) as ObservationRow[];
  return rows.map(toObservation);
}

export function setComparison(placeId: string, comparison: string): void {
  db.prepare("UPDATE places SET comparison_text = ? WHERE id = ?").run(comparison, placeId);
}
