export type PaginatedContentChunksResponse = {
  data: ContentChunk[];
  hasNextPage: boolean;
};

export type ContentChunk = {
  metadata: string;
  text: string;
  chunkIndex: number;
  noteId: string;
  userId: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | Record<string, never> | null;
};

export type CreateContentChunkRequest = Pick<
  ContentChunk,
  "metadata" | "text" | "chunkIndex" | "noteId"
>;

export type UpdateContentChunkRequest = Partial<
  Pick<ContentChunk, "metadata" | "text" | "chunkIndex">
>;
