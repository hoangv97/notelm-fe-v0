export type PaginatedStudyResponse<T> = {
  data: T[];
  hasNextPage: boolean;
};

export type Flashcard = {
  reviewCount: number;
  isEdited: boolean;
  isSuspended: boolean;
  sourceChunkId: string;
  tags: string;
  difficulty: string;
  back: string;
  front: string;
  noteId: string;
  userId: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type Quiz = {
  timeLimitSeconds: number;
  questionCount: number;
  title: string;
  noteId: string;
  userId: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type QuizQuestion = {
  tags: string;
  difficulty: string;
  explanation: string;
  correctAnswer: string;
  options?: string;
  question: string;
  type: string;
  index: number;
  quizId: string;
  userId: string;
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
