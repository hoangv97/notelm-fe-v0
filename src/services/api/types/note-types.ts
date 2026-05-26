export type Folder = {
  id: string;
  name: string;
  position: number;
  color: string;
  parentId: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  description?: string;
};

export enum NoteTypeEnum {
  TEXT = "text",
  URL = "url",
  FILE = "file",
}

export enum NoteStatusEnum {
  PENDING = "pending",
  QUEUED = "queued",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export type Note = {
  viewCount: number;
  lastViewedAt: string | null;
  isPinned: boolean;
  tags: string;
  completedTypes: string;
  generationTypes: string;
  errorMessage: string | null;
  status: NoteStatusEnum;
  extractedTextLength: number;
  rawText: string;
  mimeType: string | null;
  fileSizeBytes: number | null;
  filePath: string | null;
  sourceUrl: string | null;
  inputType: NoteTypeEnum | string;
  description: string;
  name: string;
  folderId: string;
  userId: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  // UI compatibility aliases derived from the backend model.
  type?: NoteTypeEnum | string;
  content?: string;
  url?: string;
  tagsList?: string[];
};

export type FolderContentsResponse = {
  folders: Folder[];
  notes: Note[];
};

export type CreateFolderRequest = Pick<Folder, "name" | "color"> &
  Partial<Pick<Folder, "position" | "parentId">>;

export type UpdateFolderRequest = Partial<
  Pick<Folder, "name" | "color" | "position" | "parentId">
>;

export enum JobStatusEnum {
  QUEUED = "queued",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export type JobQueue = {
  userId: string;
  completedAt: string | null;
  startedAt: string | null;
  idempotencyKey: string | null;
  attemptCount: number;
  errorMessage: string | null;
  resultSummary: string | null;
  payload: string | null;
  status: JobStatusEnum;
  jobType: string;
  bullmqJobId: string | null;
  noteId: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  // UI compatibility aliases derived from status/error/result fields.
  progress: number;
  message?: string;
};

export type CreateNoteRequest = {
  name: string;
  description?: string;
  type: NoteTypeEnum;
  folderId: string;
  content?: string;
  url?: string;
  file?: File;
  generationTypes?: GenerateNoteType[];
};

export type CreateNoteResponse = {
  note: Note;
  jobId: string;
};

export type GenerateNoteType = "summary" | "flashcards" | "quiz" | "mindmap";

export type GenerateNoteRequest = {
  types: GenerateNoteType[];
};
