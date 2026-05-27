"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemTextMui from "@mui/material/ListItemText";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import FolderIcon from "@mui/icons-material/Folder";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import DescriptionIcon from "@mui/icons-material/Description";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import SyncIcon from "@mui/icons-material/Sync";
import ErrorIcon from "@mui/icons-material/Error";
import { alpha, useTheme } from "@mui/material/styles";
import useConfirmDialog from "@/components/confirm-dialog/use-confirm-dialog";
import { useAppContext } from "./app-context";
import {
  useCreateFolderService,
  useDeleteFolderService,
  useGetAllFoldersService,
  useGetFolderContentsService,
  useUpdateFolderService,
} from "@/services/api/services/folders-notes";
import { Folder, Note, NoteStatusEnum } from "@/services/api/types/note-types";

const OPEN_FOLDERS_STORAGE_KEY = "notelm:open-folder-ids";

function getStoredOpenFolderIds() {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(OPEN_FOLDERS_STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    window.localStorage.removeItem(OPEN_FOLDERS_STORAGE_KEY);
    return [];
  }
}

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

type FolderActionMode = "edit" | "delete" | "move" | "duplicate";

type FolderNodeProps = {
  folder: Folder;
  depth: number;
  openFolderIds: string[];
  setFolderOpen: (folderId: string, open: boolean) => void;
  onCreateNote: (folderId: string) => void;
  onCreateChildFolder: (folder: Folder) => void;
  onFolderAction: (folder: Folder, mode: FolderActionMode) => void;
};

function FolderNode({
  folder,
  depth,
  openFolderIds,
  setFolderOpen,
  onCreateNote,
  onCreateChildFolder,
  onFolderAction,
}: FolderNodeProps) {
  const theme = useTheme();
  const { selectedItem, setSelectedItem, treeRefreshKey } = useAppContext();
  const [children, setChildren] = useState<{
    folders: Folder[];
    notes: Note[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const getFolderContents = useGetFolderContentsService();

  const isOpen = openFolderIds.includes(folder.id);
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
    if (isOpen) {
      loadChildren();
    }
  }, [isOpen, treeRefreshKey, loadChildren]);

  useEffect(() => {
    if (isSelected) {
      setFolderOpen(folder.id, true);
    }
  }, [folder.id, isSelected, setFolderOpen]);

  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setFolderOpen(folder.id, !isOpen);
  };

  const handleSelect = () => {
    setSelectedItem({ type: "folder", id: folder.id });
    setFolderOpen(folder.id, true);
  };

  const handleAddNote = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onCreateNote(folder.id);
  };

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
  };

  const handleAction = (mode: FolderActionMode) => {
    handleCloseMenu();
    onFolderAction(folder, mode);
  };

  return (
    <>
      <ListItemButton
        onClick={handleSelect}
        sx={{
          pl: 0.75 + depth * 1.5,
          pr: 0.5,
          borderRadius: 1,
          mx: 0.75,
          mb: 0.25,
          minHeight: 32,
          gap: 0.25,
          color: "text.secondary",
          bgcolor: isSelected
            ? alpha(theme.palette.text.primary, 0.08)
            : "transparent",
          "&:hover": {
            bgcolor: isSelected
              ? alpha(theme.palette.text.primary, 0.1)
              : alpha(theme.palette.text.primary, 0.06),
            "& .folder-row-actions": {
              opacity: 1,
              pointerEvents: "auto",
            },
          },
        }}
      >
        <IconButton
          size="small"
          onClick={handleToggle}
          sx={{ p: 0.125, color: "text.disabled" }}
        >
          {isOpen ? (
            <ExpandMoreIcon sx={{ fontSize: 18 }} />
          ) : (
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton>
        <ListItemIcon sx={{ minWidth: 24 }}>
          {isOpen ? (
            <FolderOpenIcon
              fontSize="small"
              sx={{ color: folder.color || "text.secondary" }}
            />
          ) : (
            <FolderIcon
              fontSize="small"
              sx={{ color: folder.color || "text.secondary" }}
            />
          )}
        </ListItemIcon>
        <ListItemText
          primary={folder.name}
          primaryTypographyProps={{
            fontSize: "0.875rem",
            fontWeight: isSelected ? 600 : 500,
            noWrap: true,
            color: isSelected ? "text.primary" : "text.secondary",
          }}
        />
        <Box
          className="folder-row-actions"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.125,
            opacity: menuAnchor ? 1 : 0,
            pointerEvents: menuAnchor ? "auto" : "none",
            transition: "opacity 120ms ease",
          }}
        >
          <IconButton
            size="small"
            title="Add note"
            onClick={handleAddNote}
            sx={{ p: 0.25, color: "text.secondary" }}
          >
            <AddIcon sx={{ fontSize: 17 }} />
          </IconButton>
          <IconButton
            size="small"
            title="Folder actions"
            onClick={handleOpenMenu}
            sx={{ p: 0.25, color: "text.secondary" }}
          >
            <MoreHorizIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </ListItemButton>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        onClick={(event) => event.stopPropagation()}
        PaperProps={{
          sx: {
            minWidth: 180,
            borderRadius: 1.5,
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <MenuItem onClick={() => handleAction("edit")}>
          <DriveFileRenameOutlineIcon fontSize="small" sx={{ mr: 1.25 }} />
          <ListItemTextMui>Edit</ListItemTextMui>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            onCreateChildFolder(folder);
          }}
        >
          <CreateNewFolderIcon fontSize="small" sx={{ mr: 1.25 }} />
          <ListItemTextMui>Create child folder</ListItemTextMui>
        </MenuItem>
        <MenuItem onClick={() => handleAction("delete")}>
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1.25 }} />
          <ListItemTextMui>Delete</ListItemTextMui>
        </MenuItem>
        <MenuItem onClick={() => handleAction("move")}>
          <DriveFileMoveOutlinedIcon fontSize="small" sx={{ mr: 1.25 }} />
          <ListItemTextMui>Move to</ListItemTextMui>
        </MenuItem>
        <MenuItem onClick={() => handleAction("duplicate")}>
          <ContentCopyIcon fontSize="small" sx={{ mr: 1.25 }} />
          <ListItemTextMui>Duplicate</ListItemTextMui>
        </MenuItem>
      </Menu>

      <Collapse in={isOpen} timeout="auto" unmountOnExit>
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
                openFolderIds={openFolderIds}
                setFolderOpen={setFolderOpen}
                onCreateNote={onCreateNote}
                onCreateChildFolder={onCreateChildFolder}
                onFolderAction={onFolderAction}
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
                    pl: 4.5 + depth * 2,
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
        pl: 3.5 + depth * 1.5,
        pr: 1,
        borderRadius: 1,
        mx: 0.75,
        mb: 0.25,
        minHeight: 32,
        color: "text.secondary",
        bgcolor: isSelected
          ? alpha(theme.palette.text.primary, 0.08)
          : "transparent",
        "&:hover": {
          bgcolor: isSelected
            ? alpha(theme.palette.text.primary, 0.1)
            : alpha(theme.palette.text.primary, 0.06),
        },
      }}
    >
      <ListItemIcon sx={{ minWidth: 26 }}>
        {getNoteStatusIcon(note.status)}
      </ListItemIcon>
      <ListItemText
        primary={note.name}
        primaryTypographyProps={{
          fontSize: "0.8125rem",
          fontWeight: isSelected ? 600 : 400,
          noWrap: true,
          color: isSelected ? "text.primary" : "text.secondary",
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
    setCreateNoteFolderId,
  } = useAppContext();
  const [rootFolders, setRootFolders] = useState<Folder[]>([]);
  const [rootNotes, setRootNotes] = useState<Note[]>([]);
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [openFolderIds, setOpenFolderIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<
    string | null
  >(null);
  const [createFolderParentLabel, setCreateFolderParentLabel] = useState<
    string | null
  >(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#6366f1");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [activeFolder, setActiveFolder] = useState<Folder | null>(null);
  const [actionMode, setActionMode] = useState<FolderActionMode | null>(null);
  const [actionName, setActionName] = useState("");
  const [actionColor, setActionColor] = useState("#6366f1");
  const [moveParentId, setMoveParentId] = useState("__root__");
  const [submittingAction, setSubmittingAction] = useState(false);
  const getFolderContents = useGetFolderContentsService();
  const getAllFolders = useGetAllFoldersService();
  const createFolder = useCreateFolderService();
  const updateFolder = useUpdateFolderService();
  const deleteFolder = useDeleteFolderService();
  const { confirmDialog } = useConfirmDialog();

  // const selectedParentId =
  //   selectedItem?.type === "folder" ? selectedItem.id : null;

  const openCreateFolderDialog = useCallback(
    (parentId: string | null, parentLabel: string | null = null) => {
      setCreateFolderParentId(parentId);
      setCreateFolderParentLabel(parentLabel);
      setCreateFolderOpen(true);
    },
    []
  );

  const setFolderOpen = useCallback((folderId: string, open: boolean) => {
    setOpenFolderIds((current) => {
      const next = open
        ? Array.from(new Set([...current, folderId]))
        : current.filter((id) => id !== folderId);

      window.localStorage.setItem(
        OPEN_FOLDERS_STORAGE_KEY,
        JSON.stringify(next)
      );
      return next;
    });
  }, []);

  const loadRoot = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFolderContents(null);
      setRootFolders(result.data.folders);
      setRootNotes(result.data.notes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getFolderContents]);

  const loadAllFolders = useCallback(async () => {
    try {
      const result = await getAllFolders();
      setAllFolders(result.data);
    } catch {
      // ignore
    }
  }, [getAllFolders]);

  useEffect(() => {
    setOpenFolderIds(getStoredOpenFolderIds());
  }, []);

  useEffect(() => {
    loadRoot();
    loadAllFolders();
  }, [treeRefreshKey, loadRoot, loadAllFolders]);

  const moveTargets = useMemo(
    () => allFolders.filter((folder) => folder.id !== activeFolder?.id),
    [activeFolder?.id, allFolders]
  );

  const handleCreateNote = useCallback(
    (folderId: string) => {
      setSelectedItem({ type: "folder", id: folderId });
      setFolderOpen(folderId, true);
      setCreateNoteFolderId(folderId);
      setCreateNoteModalOpen(true);
    },
    [
      setCreateNoteFolderId,
      setCreateNoteModalOpen,
      setFolderOpen,
      setSelectedItem,
    ]
  );

  const handleCloseCreateFolder = () => {
    setCreateFolderOpen(false);
    setCreateFolderParentId(null);
    setCreateFolderParentLabel(null);
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
        parentId: createFolderParentId,
      });
      if (createFolderParentId) {
        setFolderOpen(createFolderParentId, true);
      }
      setSelectedItem({ type: "folder", id: result.data.id });
      refreshTree();
      handleCloseCreateFolder();
    } catch {
      setCreatingFolder(false);
    }
  };

  const handleCreateChildFolder = useCallback(
    (folder: Folder) => {
      setSelectedItem({ type: "folder", id: folder.id });
      setFolderOpen(folder.id, true);
      openCreateFolderDialog(folder.id, folder.name);
    },
    [openCreateFolderDialog, setFolderOpen, setSelectedItem]
  );

  const handleOpenFolderAction = (folder: Folder, mode: FolderActionMode) => {
    setActiveFolder(folder);
    setActionMode(mode);
    setActionName(mode === "duplicate" ? `${folder.name} copy` : folder.name);
    setActionColor(folder.color || "#6366f1");
    setMoveParentId(folder.parentId ?? "__root__");
  };

  const handleCloseFolderAction = () => {
    setActiveFolder(null);
    setActionMode(null);
    setActionName("");
    setActionColor("#6366f1");
    setMoveParentId("__root__");
    setSubmittingAction(false);
  };

  const handleDeleteFolder = async () => {
    if (!activeFolder) return;

    const confirmed = await confirmDialog({
      title: "Delete folder",
      message:
        "Delete this folder? Notes and nested folders may also be affected depending on server rules.",
      successButtonText: "Delete",
      cancelButtonText: "Cancel",
    });

    if (!confirmed) {
      handleCloseFolderAction();
      return;
    }

    setSubmittingAction(true);
    try {
      await deleteFolder(activeFolder.id);
      if (
        selectedItem?.type === "folder" &&
        selectedItem.id === activeFolder.id
      ) {
        setSelectedItem(null);
      }
      setFolderOpen(activeFolder.id, false);
      refreshTree();
      handleCloseFolderAction();
    } catch {
      setSubmittingAction(false);
    }
  };

  useEffect(() => {
    if (actionMode === "delete") {
      handleDeleteFolder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionMode]);

  const handleSubmitFolderAction = async () => {
    if (!activeFolder || !actionMode || !actionName.trim()) return;

    setSubmittingAction(true);
    try {
      if (actionMode === "edit") {
        await updateFolder(activeFolder.id, {
          name: actionName.trim(),
          color: actionColor,
        });
      }

      if (actionMode === "move") {
        await updateFolder(activeFolder.id, {
          parentId: moveParentId === "__root__" ? null : moveParentId,
        });
        if (moveParentId !== "__root__") {
          setFolderOpen(moveParentId, true);
        }
      }

      if (actionMode === "duplicate") {
        const result = await createFolder({
          name: actionName.trim(),
          color: actionColor,
          parentId: activeFolder.parentId,
        });
        if (activeFolder.parentId) {
          setFolderOpen(activeFolder.parentId, true);
        }
        setSelectedItem({ type: "folder", id: result.data.id });
      }

      refreshTree();
      handleCloseFolderAction();
    } catch {
      setSubmittingAction(false);
    }
  };

  const actionTitle =
    actionMode === "edit"
      ? "Edit folder"
      : actionMode === "move"
        ? "Move folder"
        : actionMode === "duplicate"
          ? "Duplicate folder"
          : "";

  return (
    <Box
      sx={{
        width: 280,
        minWidth: 280,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.default,
      }}
    >
      <Box
        sx={{
          px: 1.5,
          py: 1.25,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <NoteAddIcon fontSize="small" sx={{ color: "text.secondary" }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, flexGrow: 1 }}>
          Notes
        </Typography>
        {/* <IconButton
          size="small"
          onClick={() => openCreateFolderDialog(selectedParentId)}
          title="New folder"
          sx={{ color: "text.secondary" }}
        >
          <CreateNewFolderIcon fontSize="small" />
        </IconButton> */}
      </Box>

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
        ) : rootFolders.length === 0 && rootNotes.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              No notes yet
            </Typography>
          </Box>
        ) : (
          <List component="nav" disablePadding>
            {rootFolders.map((folder) => (
              <FolderNode
                key={folder.id}
                folder={folder}
                depth={0}
                openFolderIds={openFolderIds}
                setFolderOpen={setFolderOpen}
                onCreateNote={handleCreateNote}
                onCreateChildFolder={handleCreateChildFolder}
                onFolderAction={handleOpenFolderAction}
              />
            ))}
            {rootNotes.map((note) => (
              <NoteNode key={note.id} note={note} depth={0} />
            ))}
          </List>
        )}
      </Box>

      <Divider />
      <Box sx={{ p: 1 }}>
        <Button
          variant="text"
          fullWidth
          startIcon={<CreateNewFolderIcon />}
          onClick={() => openCreateFolderDialog(null)}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 1,
            textTransform: "none",
            color: "text.secondary",
            fontWeight: 600,
          }}
        >
          New Folder
        </Button>
        <Button
          variant="text"
          fullWidth
          startIcon={<AddIcon />}
          onClick={() => {
            setCreateNoteFolderId(null);
            setCreateNoteModalOpen(true);
          }}
          sx={{
            justifyContent: "flex-start",
            borderRadius: 1,
            textTransform: "none",
            color: "text.secondary",
            fontWeight: 600,
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
          {createFolderParentId && (
            <Typography variant="caption" color="text.secondary">
              This folder will be created inside{" "}
              {createFolderParentLabel ?? "the selected folder"}.
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

      <Dialog
        open={Boolean(actionMode && actionMode !== "delete")}
        onClose={handleCloseFolderAction}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{actionTitle}</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          {(actionMode === "edit" || actionMode === "duplicate") && (
            <>
              <TextField
                label="Name"
                value={actionName}
                onChange={(event) => setActionName(event.target.value)}
                autoFocus
                fullWidth
                sx={{ mt: 1 }}
              />
              <TextField
                label="Color"
                type="color"
                value={actionColor}
                onChange={(event) => setActionColor(event.target.value)}
                fullWidth
              />
            </>
          )}

          {actionMode === "move" && (
            <FormControl fullWidth sx={{ mt: 1 }}>
              <InputLabel>Destination</InputLabel>
              <Select
                value={moveParentId}
                label="Destination"
                onChange={(event) => setMoveParentId(event.target.value)}
              >
                <MenuItem value="__root__">Root</MenuItem>
                {moveTargets.map((folder) => (
                  <MenuItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseFolderAction}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitFolderAction}
            disabled={
              submittingAction ||
              ((actionMode === "edit" || actionMode === "duplicate") &&
                !actionName.trim())
            }
          >
            {submittingAction
              ? "Saving..."
              : actionMode === "duplicate"
                ? "Duplicate"
                : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
