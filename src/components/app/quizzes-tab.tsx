"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { alpha, useTheme } from "@mui/material/styles";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import DataGridTable from "@/components/table/data-grid-table";
import {
  useDeleteQuizQuestionService,
  useGetQuizQuestionsService,
  useGetQuizzesService,
  useUpdateQuizQuestionService,
} from "@/services/api/services/study";
import { Quiz, QuizQuestion } from "@/services/api/types/study-types";
import { GridColDef } from "@mui/x-data-grid";

const FETCH_LIMIT = 100;
const QUIZ_LIMIT = 25;

type QuizzesTabProps = {
  noteId: string;
};

function truncate(value: string, maxLength = 120) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value || "-";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function splitByPattern(str: string) {
  const items = str.split(",");

  const result = [];
  let current = [];

  for (let i = 0; i < items.length; i++) {
    current.push(items[i].trim());

    const next = items[i + 1];

    // new group starts when next item has no leading space
    if (!next || !next.startsWith(" ")) {
      result.push(current.join(", "));
      current = [];
    }
  }

  return result;
}

function parseOptions(question: QuizQuestion) {
  if (question.options) {
    if (typeof question.options === "string") {
      return splitByPattern(question.options);
    }
    return question.options;
  }

  if (question.type === "multiple_choice") {
    // return question.options
    //   .split(",")
    //   .map((option) => option.trim())
    //   .filter(Boolean);
  }

  if (question.type === "true_false") {
    return ["True", "False"];
  }

  return [];
}

function getCorrectAnswerText(question: QuizQuestion) {
  const options = parseOptions(question);
  const answer = question.correctAnswer;
  const letterIndex = /^[A-Z]$/.test(answer)
    ? answer.charCodeAt(0) - "A".charCodeAt(0)
    : -1;

  return letterIndex >= 0 && options[letterIndex]
    ? `${answer}. ${options[letterIndex]}`
    : answer;
}

export default function QuizzesTab({ noteId }: QuizzesTabProps) {
  const theme = useTheme();
  const { confirmDialog } = useConfirmDialog();
  const getQuizzes = useGetQuizzesService();
  const getQuizQuestions = useGetQuizQuestionsService();
  const updateQuizQuestion = useUpdateQuizQuestionService();
  const deleteQuizQuestion = useDeleteQuizQuestionService();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [rows, setRows] = useState<QuizQuestion[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<QuizQuestion | null>(
    null
  );
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState("");
  const [editQuestion, setEditQuestion] = useState<QuizQuestion | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedQuiz = useMemo(
    () => quizzes.find((quiz) => quiz.id === selectedQuizId),
    [quizzes, selectedQuizId]
  );

  const loadQuizzes = useCallback(async () => {
    setLoadingQuizzes(true);
    try {
      const result = await getQuizzes({
        noteId,
        page: 1,
        limit: QUIZ_LIMIT,
      });
      setQuizzes(result.data.data);
      setSelectedQuizId((current) => current || result.data.data[0]?.id || "");
    } catch {
      setQuizzes([]);
      setSelectedQuizId("");
    } finally {
      setLoadingQuizzes(false);
    }
  }, [getQuizzes, noteId]);

  const loadQuestions = useCallback(async () => {
    if (!selectedQuizId) {
      setRows([]);
      return;
    }

    setLoadingQuestions(true);
    try {
      const nextRows: QuizQuestion[] = [];
      let currentPage = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const result = await getQuizQuestions({
          quizId: selectedQuizId,
          page: currentPage,
          limit: FETCH_LIMIT,
        });
        const pageRows = result.data.data;
        nextRows.push(...pageRows);
        hasNextPage = result.data.hasNextPage && pageRows.length > 0;
        currentPage += 1;
      }

      setRows(nextRows);
    } catch {
      setRows([]);
    } finally {
      setLoadingQuestions(false);
    }
  }, [getQuizQuestions, selectedQuizId]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handlePreview = (question: QuizQuestion) => {
    setPreviewQuestion(question);
    setSelectedAnswer(null);
    setShortAnswer("");
  };

  const handleDelete = async (question: QuizQuestion) => {
    const confirmed = await confirmDialog({
      title: "Delete quiz question",
      message: "Delete this quiz question? This cannot be undone.",
      successButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    await deleteQuizQuestion(question.id);
    await loadQuestions();
  };

  const handleSave = async () => {
    if (!editQuestion) return;

    setSaving(true);
    try {
      await updateQuizQuestion(editQuestion.id, {
        question: editQuestion.question,
        options: editQuestion.options,
        correctAnswer: editQuestion.correctAnswer,
        explanation: editQuestion.explanation,
        type: editQuestion.type,
        difficulty: editQuestion.difficulty,
        tags: editQuestion.tags,
      });
      setEditQuestion(null);
      await loadQuestions();
    } finally {
      setSaving(false);
    }
  };

  const handleRowUpdate = async (updated: QuizQuestion) => {
    await updateQuizQuestion(updated.id, {
      question: updated.question,
      options: updated.options,
      correctAnswer: updated.correctAnswer,
      explanation: updated.explanation,
      type: updated.type,
      difficulty: updated.difficulty,
      tags: updated.tags,
    });
    setRows((current) =>
      current.map((question) =>
        question.id === updated.id ? updated : question
      )
    );
    return updated;
  };

  const columns: GridColDef<QuizQuestion>[] = [
    {
      field: "index",
      headerName: "Index",
      width: 96,
      type: "number",
      valueGetter: (value) => Number(value) + 1,
    },
    {
      field: "question",
      headerName: "Question",
      flex: 1.3,
      minWidth: 260,
      editable: true,
      renderCell: (params) => truncate(params.row.question),
    },
    {
      field: "type",
      headerName: "Type",
      width: 160,
      editable: true,
      renderCell: (params) => (
        <Chip label={params.row.type} size="small" variant="outlined" />
      ),
    },
    {
      field: "difficulty",
      headerName: "Difficulty",
      width: 140,
      editable: true,
      renderCell: (params) => (
        <Chip
          label={params.row.difficulty || "unset"}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: "correctAnswer",
      headerName: "Correct answer",
      flex: 0.8,
      minWidth: 180,
      editable: true,
      renderCell: (params) => truncate(getCorrectAnswerText(params.row), 80),
    },
    {
      field: "explanation",
      headerName: "Explanation",
      flex: 1,
      minWidth: 220,
      editable: true,
      renderCell: (params) => truncate(params.row.explanation || "-", 100),
    },
    {
      field: "createdAt",
      headerName: "Created at",
      width: 180,
      renderCell: (params) => formatDateTime(params.row.createdAt),
    },
    {
      field: "updatedAt",
      headerName: "Updated at",
      width: 180,
      renderCell: (params) => formatDateTime(params.row.updatedAt),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 132,
      align: "right",
      headerAlign: "right",
      filterable: false,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Preview">
            <IconButton size="small" onClick={() => handlePreview(params.row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => setEditQuestion(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(params.row)}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const previewOptions = previewQuestion ? parseOptions(previewQuestion) : [];
  const isShortAnswer = previewQuestion?.type === "short_answer";
  const answered = selectedAnswer !== null;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          mb: 2,
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Quiz questions
          </Typography>
          {selectedQuiz && (
            <Typography variant="body2" color="text.secondary">
              {selectedQuiz.title} · {selectedQuiz.questionCount} questions
            </Typography>
          )}
        </Box>
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel id="quiz-select-label">Quiz</InputLabel>
          <Select
            labelId="quiz-select-label"
            label="Quiz"
            value={selectedQuizId}
            disabled={loadingQuizzes || quizzes.length === 0}
            onChange={(event) => setSelectedQuizId(event.target.value)}
          >
            {quizzes.map((quiz) => (
              <MenuItem key={quiz.id} value={quiz.id}>
                {quiz.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <DataGridTable
        rows={rows}
        columns={columns}
        loading={loadingQuizzes || loadingQuestions}
        noRowsLabel="No quiz questions found for this note."
        processRowUpdate={handleRowUpdate}
        tableMinWidth={1500}
      />

      <Dialog
        open={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Preview question</DialogTitle>
        <DialogContent>
          <Typography variant="h6" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
            {previewQuestion?.question}
          </Typography>
          {isShortAnswer ? (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <TextField
                label="Your answer"
                value={shortAnswer}
                onChange={(event) => setShortAnswer(event.target.value)}
                fullWidth
                multiline
                minRows={4}
                disabled={answered}
              />
              <Button
                variant="contained"
                disabled={answered || !shortAnswer.trim()}
                onClick={() => setSelectedAnswer(shortAnswer.trim())}
                sx={{ justifySelf: "flex-start", textTransform: "none" }}
              >
                Submit answer
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gap: 1 }}>
              {previewOptions.map((option, index) => {
                const label = String.fromCharCode("A".charCodeAt(0) + index);
                const answerValue =
                  previewQuestion?.type === "true_false" ? option : label;
                const isSelected = selectedAnswer === answerValue;
                const isCorrect =
                  previewQuestion?.correctAnswer === answerValue;

                return (
                  <Button
                    key={`${label}-${option}`}
                    variant={isSelected ? "contained" : "outlined"}
                    color={answered && isCorrect ? "success" : "primary"}
                    onClick={() => setSelectedAnswer(answerValue)}
                    sx={{
                      justifyContent: "flex-start",
                      textTransform: "none",
                    }}
                  >
                    {previewQuestion?.type === "true_false"
                      ? option
                      : `${label}. ${option}`}
                  </Button>
                );
              })}
            </Box>
          )}
          {answered && previewQuestion && (
            <Box
              sx={{
                mt: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.success.main, 0.08),
                border: `1px solid ${alpha(theme.palette.success.main, 0.24)}`,
              }}
            >
              {isShortAnswer && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5, whiteSpace: "pre-wrap" }}
                >
                  Your answer: {selectedAnswer}
                </Typography>
              )}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Correct answer: {getCorrectAnswerText(previewQuestion)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: "pre-wrap" }}
              >
                {previewQuestion.explanation}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewQuestion(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editQuestion}
        onClose={() => setEditQuestion(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit quiz question</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            label="Question"
            value={editQuestion?.question ?? ""}
            onChange={(event) =>
              setEditQuestion((current) =>
                current ? { ...current, question: event.target.value } : current
              )
            }
            fullWidth
            multiline
            minRows={3}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Options"
            value={editQuestion?.options ?? ""}
            onChange={(event) =>
              setEditQuestion((current) =>
                current ? { ...current, options: event.target.value } : current
              )
            }
            fullWidth
            helperText="Comma-separated options for multiple choice questions."
            sx={{ mb: 2 }}
          />
          <TextField
            label="Correct answer"
            value={editQuestion?.correctAnswer ?? ""}
            onChange={(event) =>
              setEditQuestion((current) =>
                current
                  ? { ...current, correctAnswer: event.target.value }
                  : current
              )
            }
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Explanation"
            value={editQuestion?.explanation ?? ""}
            onChange={(event) =>
              setEditQuestion((current) =>
                current
                  ? { ...current, explanation: event.target.value }
                  : current
              )
            }
            fullWidth
            multiline
            minRows={3}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr 1fr" }}>
            <TextField
              label="Type"
              value={editQuestion?.type ?? ""}
              onChange={(event) =>
                setEditQuestion((current) =>
                  current ? { ...current, type: event.target.value } : current
                )
              }
              fullWidth
            />
            <TextField
              label="Difficulty"
              value={editQuestion?.difficulty ?? ""}
              onChange={(event) =>
                setEditQuestion((current) =>
                  current
                    ? { ...current, difficulty: event.target.value }
                    : current
                )
              }
              fullWidth
            />
          </Box>
          <TextField
            label="Tags"
            value={editQuestion?.tags ?? ""}
            onChange={(event) =>
              setEditQuestion((current) =>
                current ? { ...current, tags: event.target.value } : current
              )
            }
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditQuestion(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
