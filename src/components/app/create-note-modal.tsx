"use client";

import { useState, useEffect, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import CloseIcon from "@mui/icons-material/Close";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import LinkIcon from "@mui/icons-material/Link";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { alpha, useTheme } from "@mui/material/styles";
import { useDropzone } from "react-dropzone";
import { useAppContext } from "./app-context";
import {
  useCreateNoteService,
  useGetAllFoldersService,
} from "@/services/api/services/folders-notes";
import { NoteTypeEnum, Folder } from "@/services/api/types/note-types";

const NOTE_TYPES = [
  {
    type: NoteTypeEnum.TEXT,
    label: "Text",
    description: "Write or paste text content",
    icon: TextFieldsIcon,
    color: "#6366f1",
  },
  {
    type: NoteTypeEnum.URL,
    label: "URL",
    description: "Import from a web URL",
    icon: LinkIcon,
    color: "#06b6d4",
  },
  {
    type: NoteTypeEnum.FILE,
    label: "Upload File",
    description: "Upload a document file",
    icon: UploadFileIcon,
    color: "#f59e0b",
  },
];

export default function CreateNoteModal() {
  const theme = useTheme();
  const {
    createNoteModalOpen,
    setCreateNoteModalOpen,
    createNoteFolderId,
    setCreateNoteFolderId,
    addActiveJob,
    refreshTree,
  } = useAppContext();

  const [step, setStep] = useState<"type" | "form">("type");
  const [selectedType, setSelectedType] = useState<NoteTypeEnum | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [folderId, setFolderId] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [creating, setCreating] = useState(false);

  const createNote = useCreateNoteService();
  const getAllFolders = useGetAllFoldersService();

  const loadFolders = useCallback(async () => {
    try {
      const result = await getAllFolders();
      setFolders(result.data);
      if (createNoteFolderId) {
        setFolderId(createNoteFolderId);
      } else if (result.data.length > 0 && !folderId) {
        setFolderId(result.data[0].id);
      }
    } catch {
      // ignore
    }
  }, [getAllFolders, folderId, createNoteFolderId]);

  useEffect(() => {
    if (createNoteModalOpen) {
      loadFolders();
    }
  }, [createNoteModalOpen, loadFolders]);

  const handleClose = () => {
    setCreateNoteModalOpen(false);
    // Reset
    setStep("type");
    setSelectedType(null);
    setName("");
    setDescription("");
    setContent("");
    setUrl("");
    setFile(null);
    setCreating(false);
    setCreateNoteFolderId(null);
  };

  const handleSelectType = (type: NoteTypeEnum) => {
    setSelectedType(type);
    setStep("form");
  };

  const handleSubmit = async () => {
    if (!selectedType || !name.trim() || !folderId) return;
    setCreating(true);
    try {
      const result = await createNote({
        name: name.trim(),
        description: description.trim(),
        type: selectedType,
        folderId,
        content: selectedType === NoteTypeEnum.TEXT ? content : undefined,
        url: selectedType === NoteTypeEnum.URL ? url : undefined,
        file:
          selectedType === NoteTypeEnum.FILE ? file || undefined : undefined,
      });
      addActiveJob(result.data.jobId, result.data.note.name);
      refreshTree();
      handleClose();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/markdown": [".md"],
    },
  });

  return (
    <Dialog
      open={createNoteModalOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        {step === "form" && (
          <IconButton
            size="small"
            onClick={() => setStep("type")}
            sx={{ mr: 0.5 }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
          {step === "type" ? "Create New Note" : `New ${selectedType} Note`}
        </Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {step === "type" ? (
          <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
            {NOTE_TYPES.map((nt) => {
              const Icon = nt.icon;
              return (
                <Card
                  key={nt.type}
                  sx={{
                    flex: 1,
                    border: `2px solid transparent`,
                    transition: "all 0.2s",
                    "&:hover": {
                      borderColor: nt.color,
                      transform: "translateY(-2px)",
                      boxShadow: `0 4px 20px ${alpha(nt.color, 0.25)}`,
                    },
                  }}
                >
                  <CardActionArea onClick={() => handleSelectType(nt.type)}>
                    <CardContent
                      sx={{
                        textAlign: "center",
                        py: 3,
                      }}
                    >
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mx: "auto",
                          mb: 1.5,
                          bgcolor: alpha(nt.color, 0.12),
                        }}
                      >
                        <Icon sx={{ fontSize: 28, color: nt.color }} />
                      </Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, mb: 0.5 }}
                      >
                        {nt.label}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ lineHeight: 1.4 }}
                      >
                        {nt.description}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        ) : (
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 2.5, mt: 1 }}
          >
            <TextField
              label="Note Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              required
              autoFocus
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />

            <FormControl fullWidth>
              <InputLabel>Folder</InputLabel>
              <Select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                label="Folder"
              >
                {folderId && !folders.some((f) => f.id === folderId) && (
                  <MenuItem value={folderId}>Selected folder</MenuItem>
                )}
                {folders.map((f) => (
                  <MenuItem key={f.id} value={f.id}>
                    {f.parentId ? "  └ " : ""}
                    {f.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedType === NoteTypeEnum.TEXT && (
              <TextField
                label="Content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                fullWidth
                multiline
                rows={6}
                placeholder="Write or paste your note content here..."
              />
            )}

            {selectedType === NoteTypeEnum.URL && (
              <TextField
                label="URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                fullWidth
                placeholder="https://example.com/article"
                type="url"
              />
            )}

            {selectedType === NoteTypeEnum.FILE && (
              <Box
                {...getRootProps()}
                sx={{
                  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
                  borderRadius: 2,
                  p: 4,
                  textAlign: "center",
                  cursor: "pointer",
                  bgcolor: isDragActive
                    ? alpha(theme.palette.primary.main, 0.06)
                    : alpha(theme.palette.action.hover, 0.04),
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                  },
                }}
              >
                <input {...getInputProps()} />
                <CloudUploadIcon
                  sx={{
                    fontSize: 40,
                    color: isDragActive ? "primary.main" : "text.secondary",
                    mb: 1,
                  }}
                />
                {file ? (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {file.name}{" "}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                    >
                      ({(file.size / 1024).toFixed(1)} KB)
                    </Typography>
                  </Typography>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {isDragActive
                        ? "Drop the file here..."
                        : "Drag & drop a file, or click to browse"}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ mt: 0.5, display: "block" }}
                    >
                      Supported: PDF, TXT, DOC, DOCX, MD
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {step === "form" && (
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={handleClose}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={creating || !name.trim() || !folderId}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              px: 3,
            }}
          >
            {creating ? "Creating..." : "Create Note"}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
