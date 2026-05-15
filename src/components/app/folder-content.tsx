"use client";

import { useEffect, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Chip from "@mui/material/Chip";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import { alpha, useTheme } from "@mui/material/styles";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useAppContext } from "./app-context";
import {
  useDeleteFolderService,
  useGetFolderService,
  useUpdateFolderService,
} from "@/services/api/services/folders-notes";
import { Folder } from "@/services/api/types/note-types";

type FolderContentProps = {
  folderId: string;
};

export default function FolderContent({ folderId }: FolderContentProps) {
  const theme = useTheme();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [position, setPosition] = useState(0);
  const [saved, setSaved] = useState(false);

  const { setSelectedItem, refreshTree } = useAppContext();
  const { confirmDialog } = useConfirmDialog();
  const getFolder = useGetFolderService();
  const updateFolder = useUpdateFolderService();
  const deleteFolder = useDeleteFolderService();

  const loadFolder = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFolder(folderId);
      setFolder(result.data);
      setName(result.data.name);
      setColor(result.data.color || "#6366f1");
      setPosition(result.data.position ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [folderId, getFolder]);

  useEffect(() => {
    loadFolder();
  }, [loadFolder]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const result = await updateFolder(folderId, {
        name,
        color,
        position,
      });
      setFolder(result.data);
      refreshTree();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmDialog({
      title: "Delete folder",
      message:
        "Delete this folder? Notes and nested folders may also be affected depending on server rules.",
      successButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteFolder(folderId);
      setSelectedItem(null);
      refreshTree();
    } catch {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ flex: 1, p: 4 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width={120} height={36} />
      </Box>
    );
  }

  if (!folder) {
    return (
      <Box sx={{ flex: 1, p: 4 }}>
        <Typography color="error">Folder not found</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        p: 0,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 4,
          py: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.04)}, ${alpha(theme.palette.secondary.main, 0.04)})`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
          <FolderIcon
            sx={{ color: folder.color || "primary.main", fontSize: 28 }}
          />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {folder.name}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Chip
            label={`Created: ${new Date(folder.createdAt).toLocaleDateString()}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`Updated: ${new Date(folder.updatedAt).toLocaleDateString()}`}
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Form */}
      <Box sx={{ p: 4, maxWidth: 600 }}>
        <Typography
          variant="subtitle2"
          sx={{ mb: 2, color: "text.secondary", fontWeight: 600 }}
        >
          Folder Information
        </Typography>

        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
          variant="outlined"
        />

        <TextField
          label="Color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
          variant="outlined"
        />

        <TextField
          label="Position"
          type="number"
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          fullWidth
          sx={{ mb: 3 }}
          variant="outlined"
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          {saved && (
            <Typography
              variant="body2"
              sx={{ color: "success.main", fontWeight: 500 }}
            >
              ✓ Saved successfully
            </Typography>
          )}
        </Box>

        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            disabled={deleting}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              px: 3,
            }}
          >
            {deleting ? "Deleting..." : "Delete Folder"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
