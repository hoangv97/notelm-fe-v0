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
  useDeleteFlashcardService,
  useGetFlashcardsService,
  useUpdateFlashcardService,
} from "@/services/api/services/study";
import { Flashcard } from "@/services/api/types/study-types";
import { GridColDef } from "@mui/x-data-grid";

const FETCH_LIMIT = 100;

type FlashcardsTabProps = {
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

export default function FlashcardsTab({ noteId }: FlashcardsTabProps) {
  const theme = useTheme();
  const { confirmDialog } = useConfirmDialog();
  const getFlashcards = useGetFlashcardsService();
  const updateFlashcard = useUpdateFlashcardService();
  const deleteFlashcard = useDeleteFlashcardService();

  const [rows, setRows] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewCard, setPreviewCard] = useState<Flashcard | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [editCard, setEditCard] = useState<Flashcard | null>(null);
  const [saving, setSaving] = useState(false);

  const loadFlashcards = useCallback(async () => {
    setLoading(true);
    try {
      const nextRows: Flashcard[] = [];
      let currentPage = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const result = await getFlashcards({
          noteId,
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
      setLoading(false);
    }
  }, [getFlashcards, noteId]);

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

  const handleRowUpdate = async (updated: Flashcard) => {
    await updateFlashcard(updated.id, {
      front: updated.front,
      back: updated.back,
      tags: updated.tags,
      difficulty: updated.difficulty,
    });
    setRows((current) =>
      current.map((flashcard) =>
        flashcard.id === updated.id ? updated : flashcard
      )
    );
    return updated;
  };

  const columns: GridColDef<Flashcard>[] = [
    {
      field: "front",
      headerName: "Front",
      flex: 1.2,
      minWidth: 220,
      editable: true,
      renderCell: (params) => truncate(params.row.front),
    },
    {
      field: "back",
      headerName: "Back",
      flex: 1.2,
      minWidth: 220,
      editable: true,
      renderCell: (params) => truncate(params.row.back),
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
      field: "tags",
      headerName: "Tags",
      flex: 0.8,
      minWidth: 160,
      editable: true,
      renderCell: (params) => truncate(params.row.tags || "-", 80),
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
            <IconButton size="small" onClick={() => setEditCard(params.row)}>
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

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
          Flashcards
        </Typography>
      </Box>

      <DataGridTable
        rows={rows}
        columns={columns}
        loading={loading}
        noRowsLabel="No flashcards found for this note."
        processRowUpdate={handleRowUpdate}
        tableMinWidth={1300}
      />

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
