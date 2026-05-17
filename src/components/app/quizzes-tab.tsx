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
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { alpha, useTheme } from "@mui/material/styles";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import {
  useDeleteQuizQuestionService,
  useGetQuizQuestionsService,
  useGetQuizzesService,
  useUpdateQuizQuestionService,
} from "@/services/api/services/study";
import { Quiz, QuizQuestion } from "@/services/api/types/study-types";

const PAGE_LIMIT = 10;
const QUIZ_LIMIT = 25;

type QuizzesTabProps = {
  noteId: string;
};

function truncate(value: string, maxLength = 120) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
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
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
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
      setHasNextPage(false);
      return;
    }

    setLoadingQuestions(true);
    try {
      const result = await getQuizQuestions({
        quizId: selectedQuizId,
        page,
        limit: PAGE_LIMIT,
      });
      setRows(result.data.data);
      setHasNextPage(result.data.hasNextPage);
    } catch {
      setRows([]);
      setHasNextPage(false);
    } finally {
      setLoadingQuestions(false);
    }
  }, [getQuizQuestions, page, selectedQuizId]);

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
            onChange={(event) => {
              setSelectedQuizId(event.target.value);
              setPage(1);
            }}
          >
            {quizzes.map((quiz) => (
              <MenuItem key={quiz.id} value={quiz.id}>
                {quiz.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell style={{ width: 72 }}>Index</TableCell>
              <TableCell>Question</TableCell>
              <TableCell style={{ width: 140 }}>Type</TableCell>
              <TableCell style={{ width: 120 }}>Difficulty</TableCell>
              <TableCell>Correct answer</TableCell>
              <TableCell style={{ width: 120 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(loadingQuizzes || loadingQuestions) &&
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <Skeleton height={32} />
                  </TableCell>
                </TableRow>
              ))}
            {!loadingQuizzes && !loadingQuestions && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 4, textAlign: "center" }}
                  >
                    No quiz questions found for this note.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!loadingQuizzes &&
              !loadingQuestions &&
              rows.map((question) => (
                <TableRow key={question.id} hover>
                  <TableCell>{question.index + 1}</TableCell>
                  <TableCell>{truncate(question.question)}</TableCell>
                  <TableCell>
                    <Chip
                      label={question.type}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={question.difficulty || "unset"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {truncate(getCorrectAnswerText(question), 80)}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Preview">
                      <IconButton
                        size="small"
                        onClick={() => handlePreview(question)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => setEditQuestion(question)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(question)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
        <Button
          variant="outlined"
          disabled={page === 1 || loadingQuestions}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outlined"
          disabled={!hasNextPage || loadingQuestions}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </Button>
      </Box>

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
