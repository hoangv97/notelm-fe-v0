"use client";

import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
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
  useDeleteFlashcardService,
  useGetFlashcardsService,
  useUpdateFlashcardService,
} from "@/services/api/services/study";
import { Flashcard } from "@/services/api/types/study-types";

const PAGE_LIMIT = 10;

type FlashcardsTabProps = {
  noteId: string;
};

function truncate(value: string, maxLength = 120) {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

export default function FlashcardsTab({ noteId }: FlashcardsTabProps) {
  const theme = useTheme();
  const { confirmDialog } = useConfirmDialog();
  const getFlashcards = useGetFlashcardsService();
  const updateFlashcard = useUpdateFlashcardService();
  const deleteFlashcard = useDeleteFlashcardService();

  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [rows, setRows] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewCard, setPreviewCard] = useState<Flashcard | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [editCard, setEditCard] = useState<Flashcard | null>(null);
  const [saving, setSaving] = useState(false);

  const loadFlashcards = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFlashcards({ noteId, page, limit: PAGE_LIMIT });
      setRows(result.data.data);
      setHasNextPage(result.data.hasNextPage);
    } catch {
      setRows([]);
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [getFlashcards, noteId, page]);

  useEffect(() => {
    loadFlashcards();
  }, [loadFlashcards]);

  const handlePreview = (flashcard: Flashcard) => {
    setPreviewCard(flashcard);
    setShowBack(false);
  };

  const handleDelete = async (flashcard: Flashcard) => {
    const confirmed = await confirmDialog({
      title: "Delete flashcard",
      message: "Delete this flashcard? This cannot be undone.",
      successButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    await deleteFlashcard(flashcard.id);
    await loadFlashcards();
  };

  const handleSave = async () => {
    if (!editCard) return;

    setSaving(true);
    try {
      await updateFlashcard(editCard.id, {
        front: editCard.front,
        back: editCard.back,
        tags: editCard.tags,
        difficulty: editCard.difficulty,
      });
      setEditCard(null);
      await loadFlashcards();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
          Flashcards
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Page {page}
        </Typography>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Front</TableCell>
              <TableCell>Back</TableCell>
              <TableCell style={{ width: 120 }}>Difficulty</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell style={{ width: 120 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading &&
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={5}>
                    <Skeleton height={32} />
                  </TableCell>
                </TableRow>
              ))}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ py: 4, textAlign: "center" }}
                  >
                    No flashcards found for this note.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              rows.map((flashcard) => (
                <TableRow key={flashcard.id} hover>
                  <TableCell>{truncate(flashcard.front)}</TableCell>
                  <TableCell>{truncate(flashcard.back)}</TableCell>
                  <TableCell>
                    <Chip
                      label={flashcard.difficulty || "unset"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{truncate(flashcard.tags || "-", 80)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Preview">
                      <IconButton
                        size="small"
                        onClick={() => handlePreview(flashcard)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => setEditCard(flashcard)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(flashcard)}
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
          disabled={page === 1 || loading}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          Previous
        </Button>
        <Button
          variant="outlined"
          disabled={!hasNextPage || loading}
          onClick={() => setPage((current) => current + 1)}
        >
          Next
        </Button>
      </Box>

      <Dialog
        open={!!previewCard}
        onClose={() => setPreviewCard(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Preview flashcard</DialogTitle>
        <DialogContent>
          <Box
            onClick={() => setShowBack((current) => !current)}
            sx={{
              minHeight: 220,
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              {showBack ? "Back" : "Front"}
            </Typography>
            <Typography variant="h6" sx={{ whiteSpace: "pre-wrap" }}>
              {showBack ? previewCard?.back : previewCard?.front}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBack((current) => !current)}>
            Show {showBack ? "front" : "back"}
          </Button>
          <Button onClick={() => setPreviewCard(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editCard}
        onClose={() => setEditCard(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit flashcard</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <TextField
            label="Front"
            value={editCard?.front ?? ""}
            onChange={(event) =>
              setEditCard((current) =>
                current ? { ...current, front: event.target.value } : current
              )
            }
            fullWidth
            multiline
            minRows={3}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Back"
            value={editCard?.back ?? ""}
            onChange={(event) =>
              setEditCard((current) =>
                current ? { ...current, back: event.target.value } : current
              )
            }
            fullWidth
            multiline
            minRows={4}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Difficulty"
            value={editCard?.difficulty ?? ""}
            onChange={(event) =>
              setEditCard((current) =>
                current
                  ? { ...current, difficulty: event.target.value }
                  : current
              )
            }
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            label="Tags"
            value={editCard?.tags ?? ""}
            onChange={(event) =>
              setEditCard((current) =>
                current ? { ...current, tags: event.target.value } : current
              )
            }
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditCard(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
