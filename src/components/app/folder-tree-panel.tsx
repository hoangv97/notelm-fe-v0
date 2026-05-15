"use client";

import { useEffect, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DescriptionIcon from "@mui/icons-material/Description";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SyncIcon from "@mui/icons-material/Sync";
import ErrorIcon from "@mui/icons-material/Error";
import { alpha, useTheme } from "@mui/material/styles";
import { useAppContext } from "./app-context";
import {
  useCreateFolderService,
  useGetFolderContentsService,
} from "@/services/api/services/folders-notes";
import { Folder, Note, NoteStatusEnum } from "@/services/api/types/note-types";

function getNoteStatusIcon(status: NoteStatusEnum) {
  switch (status) {
    case NoteStatusEnum.PENDING:
      return (
        <HourglassEmptyIcon fontSize="small" sx={{ color: "warning.main" }} />
      );
    case NoteStatusEnum.PROCESSING:
      return <SyncIcon fontSize="small" sx={{ color: "info.main" }} />;
    case NoteStatusEnum.COMPLETED:
      return (
        <DescriptionIcon fontSize="small" sx={{ color: "success.main" }} />
      );
    case NoteStatusEnum.FAILED:
      return <ErrorIcon fontSize="small" sx={{ color: "error.main" }} />;
    default:
      return <DescriptionIcon fontSize="small" />;
  }
}

type FolderNodeProps = {
  folder: Folder;
  depth: number;
};

function FolderNode({ folder, depth }: FolderNodeProps) {
  const theme = useTheme();
  const { selectedItem, setSelectedItem, treeRefreshKey } = useAppContext();
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<{
    folders: Folder[];
    notes: Note[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const getFolderContents = useGetFolderContentsService();

  const isSelected =
    selectedItem?.type === "folder" && selectedItem?.id === folder.id;

  const loadChildren = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFolderContents(folder.id);
      setChildren(result.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [folder.id, getFolderContents]);

  useEffect(() => {
    if (open) {
      loadChildren();
    }
  }, [open, treeRefreshKey, loadChildren]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  const handleSelect = () => {
    setSelectedItem({ type: "folder", id: folder.id });
    if (!open) setOpen(true);
  };

  return (
    <>
      <ListItemButton
        onClick={handleSelect}
        sx={{
          pl: 2 + depth * 2,
          borderRadius: 1,
          mx: 0.5,
          mb: 0.25,
          bgcolor: isSelected
            ? alpha(theme.palette.primary.main, 0.12)
            : "transparent",
          "&:hover": {
            bgcolor: isSelected
              ? alpha(theme.palette.primary.main, 0.18)
              : alpha(theme.palette.action.hover, 0.08),
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          {open ? (
            <FolderOpenIcon
              fontSize="small"
              sx={{ color: folder.color || "primary.main" }}
            />
          ) : (
            <FolderIcon
              fontSize="small"
              sx={{ color: folder.color || "primary.main" }}
            />
          )}
        </ListItemIcon>
        <ListItemText
          primary={folder.name}
          primaryTypographyProps={{
            fontSize: "0.875rem",
            fontWeight: isSelected ? 600 : 400,
            noWrap: true,
          }}
        />
        <IconButton size="small" onClick={handleToggle} sx={{ p: 0.25 }}>
          {open ? (
            <ExpandLess fontSize="small" />
          ) : (
            <ExpandMore fontSize="small" />
          )}
        </IconButton>
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {loading ? (
          <Box sx={{ pl: 4 + depth * 2, py: 1 }}>
            <CircularProgress size={16} />
          </Box>
        ) : (
          <List component="div" disablePadding>
            {children?.folders.map((childFolder) => (
              <FolderNode
                key={childFolder.id}
                folder={childFolder}
                depth={depth + 1}
              />
            ))}
            {children?.notes.map((note) => (
              <NoteNode key={note.id} note={note} depth={depth + 1} />
            ))}
            {children &&
              children.folders.length === 0 &&
              children.notes.length === 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    pl: 4 + depth * 2,
                    py: 0.5,
                    color: "text.disabled",
                    display: "block",
                  }}
                >
                  Empty folder
                </Typography>
              )}
          </List>
        )}
      </Collapse>
    </>
  );
}

type NoteNodeProps = {
  note: Note;
  depth: number;
};

function NoteNode({ note, depth }: NoteNodeProps) {
  const theme = useTheme();
  const { selectedItem, setSelectedItem } = useAppContext();
  const isSelected =
    selectedItem?.type === "note" && selectedItem?.id === note.id;

  return (
    <ListItemButton
      onClick={() => setSelectedItem({ type: "note", id: note.id })}
      sx={{
        pl: 2 + depth * 2,
        borderRadius: 1,
        mx: 0.5,
        mb: 0.25,
        bgcolor: isSelected
          ? alpha(theme.palette.primary.main, 0.12)
          : "transparent",
        "&:hover": {
          bgcolor: isSelected
            ? alpha(theme.palette.primary.main, 0.18)
            : alpha(theme.palette.action.hover, 0.08),
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 32 }}>
        {getNoteStatusIcon(note.status)}
      </ListItemIcon>
      <ListItemText
        primary={note.name}
        primaryTypographyProps={{
          fontSize: "0.8125rem",
          fontWeight: isSelected ? 600 : 400,
          noWrap: true,
        }}
      />
    </ListItemButton>
  );
}

export default function FolderTreePanel() {
  const theme = useTheme();
  const {
    selectedItem,
    setSelectedItem,
    treeRefreshKey,
    refreshTree,
    setCreateNoteModalOpen,
  } = useAppContext();
  const [rootFolders, setRootFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#6366f1");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const getFolderContents = useGetFolderContentsService();
  const createFolder = useCreateFolderService();

  const selectedParentId =
    selectedItem?.type === "folder" ? selectedItem.id : null;

  const loadRoot = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFolderContents(null);
      setRootFolders(result.data.folders);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getFolderContents]);

  useEffect(() => {
    loadRoot();
  }, [treeRefreshKey, loadRoot]);

  const handleCloseCreateFolder = () => {
    setCreateFolderOpen(false);
    setNewFolderName("");
    setNewFolderColor("#6366f1");
    setCreatingFolder(false);
  };

  const handleCreateFolder = async () => {
    const trimmedName = newFolderName.trim();
    if (!trimmedName) return;

    setCreatingFolder(true);
    try {
      const result = await createFolder({
        name: trimmedName,
        color: newFolderColor,
        parentId: selectedParentId,
      });
      setSelectedItem({ type: "folder", id: result.data.id });
      refreshTree();
      handleCloseCreateFolder();
    } catch {
      setCreatingFolder(false);
    }
  };

  return (
    <Box
      sx={{
        width: 280,
        minWidth: 280,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: alpha(theme.palette.background.default, 0.5),
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <NoteAddIcon fontSize="small" sx={{ color: "primary.main" }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, flexGrow: 1 }}>
          Notes Explorer
        </Typography>
        <IconButton
          size="small"
          onClick={() => setCreateFolderOpen(true)}
          title="New folder"
          sx={{ color: "primary.main" }}
        >
          <CreateNewFolderIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      {/* Tree */}
      <Box sx={{ flexGrow: 1, overflow: "auto", py: 0.5 }}>
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              py: 4,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : rootFolders.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No folders yet
            </Typography>
          </Box>
        ) : (
          <List component="nav" disablePadding>
            {rootFolders.map((folder) => (
              <FolderNode key={folder.id} folder={folder} depth={0} />
            ))}
          </List>
        )}
      </Box>

      {/* Create Note Button */}
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<CreateNewFolderIcon />}
          onClick={() => setCreateFolderOpen(true)}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            py: 1,
            mb: 1,
          }}
        >
          New Folder
        </Button>
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => setCreateNoteModalOpen(true)}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            py: 1,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            "&:hover": {
              background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
            },
          }}
        >
          Create Note
        </Button>
      </Box>

      <Dialog
        open={createFolderOpen}
        onClose={handleCloseCreateFolder}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>New Folder</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Name"
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
            autoFocus
            fullWidth
            sx={{ mt: 1 }}
          />
          <TextField
            label="Color"
            type="color"
            value={newFolderColor}
            onChange={(event) => setNewFolderColor(event.target.value)}
            fullWidth
          />
          {selectedParentId && (
            <Typography variant="caption" color="text.secondary">
              This folder will be created inside the selected folder.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseCreateFolder}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateFolder}
            disabled={creatingFolder || !newFolderName.trim()}
          >
            {creatingFolder ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
