"use client";

import { useEffect, useState, useCallback } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import SaveIcon from "@mui/icons-material/Save";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import DescriptionIcon from "@mui/icons-material/Description";
import ContentPasteSearchIcon from "@mui/icons-material/ContentPasteSearch";
import StyleIcon from "@mui/icons-material/Style";
import QuizIcon from "@mui/icons-material/Quiz";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import InfoIcon from "@mui/icons-material/Info";
import { alpha, useTheme } from "@mui/material/styles";
import ContentChunksTab from "./content-chunks-tab";
import FlashcardsTab from "./flashcards-tab";
import MindmapTab from "./mindmap-tab";
import QuizzesTab from "./quizzes-tab";
import {
  useGenerateNoteService,
  useGetNoteService,
  useUpdateNoteService,
} from "@/services/api/services/folders-notes";
import {
  GenerateNoteType,
  Note,
  NoteStatusEnum,
} from "@/services/api/types/note-types";

type NoteContentProps = {
  noteId: string;
};

const GENERATE_OPTIONS: Array<{ type: GenerateNoteType; label: string }> = [
  { type: "summary", label: "Summary" },
  { type: "flashcards", label: "Flashcards" },
  { type: "quiz", label: "Quiz" },
  { type: "mindmap", label: "Mindmap" },
];

function getStatusColor(status: NoteStatusEnum) {
  switch (status) {
    case NoteStatusEnum.PENDING:
      return "warning";
    case NoteStatusEnum.PROCESSING:
      return "info";
    case NoteStatusEnum.COMPLETED:
      return "success";
    case NoteStatusEnum.FAILED:
      return "error";
    default:
      return "default";
  }
}

function TabPanel({
  children,
  value,
  index,
}: {
  children: React.ReactNode;
  value: number;
  index: number;
}) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      sx={{ flex: 1, overflow: "auto" }}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </Box>
  );
}

export default function NoteContent({ noteId }: NoteContentProps) {
  const theme = useTheme();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedGenerateTypes, setSelectedGenerateTypes] = useState<
    GenerateNoteType[]
  >(GENERATE_OPTIONS.map((option) => option.type));

  // Editable fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");

  const getNote = useGetNoteService();
  const updateNote = useUpdateNoteService();
  const generateNote = useGenerateNoteService();

  const loadNote = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      }
      try {
        const result = await getNote(noteId);
        const data = result.data;
        setNote(data);
        setName(data.name);
        setDescription(data.description || "");
        setTags(data.tagsList || []);
        setContent(data.content || "");
        setUrl(data.url || "");
      } catch {
        // ignore
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [noteId, getNote]
  );

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  useEffect(() => {
    if (note?.status !== NoteStatusEnum.PROCESSING) return;

    const intervalId = window.setInterval(() => {
      loadNote(false);
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [loadNote, note?.status]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const result = await updateNote(noteId, {
        name,
        description,
        tags,
        content,
        url,
      });
      setNote(result.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput("");
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToDelete));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleToggleGenerateType = (type: GenerateNoteType) => {
    setSelectedGenerateTypes((current) =>
      current.includes(type)
        ? current.filter((selectedType) => selectedType !== type)
        : [...current, type]
    );
  };

  const handleGenerate = async () => {
    if (selectedGenerateTypes.length === 0 || generating) return;

    setGenerateModalOpen(false);
    setGenerating(true);
    try {
      await generateNote(noteId, { types: selectedGenerateTypes });
      await loadNote(false);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ flex: 1, p: 4 }}>
        <Skeleton variant="text" width={300} height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
      </Box>
    );
  }

  if (!note) {
    return (
      <Box sx={{ flex: 1, p: 4 }}>
        <Typography color="error">Note not found</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
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
          <DescriptionIcon sx={{ color: "primary.main", fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, flexGrow: 1 }}>
            {note.name}
          </Typography>
          <Chip
            label={note.status}
            size="small"
            color={getStatusColor(note.status)}
            sx={{ fontWeight: 600, textTransform: "capitalize" }}
          />
        </Box>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <Chip
            label={`Type: ${note.type}`}
            size="small"
            variant="outlined"
            sx={{ textTransform: "capitalize" }}
          />
          <Chip
            label={`Created: ${new Date(note.createdAt).toLocaleDateString()}`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={`Updated: ${new Date(note.updatedAt).toLocaleDateString()}`}
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{
            px: 2,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 48,
            },
          }}
        >
          <Tab icon={<InfoIcon />} iconPosition="start" label="Note Info" />
          <Tab
            icon={<ContentPasteSearchIcon />}
            iconPosition="start"
            label="Content Chunks"
          />
          <Tab icon={<StyleIcon />} iconPosition="start" label="Flashcards" />
          <Tab icon={<QuizIcon />} iconPosition="start" label="Quizzes" />
          <Tab
            icon={<AccountTreeIcon />}
            iconPosition="start"
            label="Mindmap"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ maxWidth: 600 }}>
          <TextField
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            sx={{ mb: 3 }}
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 3 }}
          />

          {/* Tags */}
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, color: "text.secondary" }}
          >
            Tags
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                onDelete={() => handleDeleteTag(tag)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
          <TextField
            label="Add tag (press Enter)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onBlur={handleAddTag}
            fullWidth
            size="small"
            sx={{ mb: 3 }}
          />

          {/* Content or URL based on type */}
          {note.type === "url" && (
            <TextField
              label="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              fullWidth
              sx={{ mb: 3 }}
            />
          )}

          {note.type === "text" && (
            <TextField
              label="Content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              multiline
              rows={6}
              sx={{ mb: 3 }}
            />
          )}

          {note.type === "file" && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                border: `1px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.action.hover, 0.04),
              }}
            >
              <Typography variant="body2" color="text.secondary">
                File uploaded — content is processed server-side
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => setGenerateModalOpen(true)}
              disabled={generating || note.status === NoteStatusEnum.PROCESSING}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                px: 3,
              }}
            >
              {generating ? "Generating..." : "Generate"}
            </Button>
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
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <ContentChunksTab noteId={noteId} />
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <FlashcardsTab noteId={noteId} />
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <QuizzesTab noteId={noteId} />
      </TabPanel>

      <TabPanel value={tabValue} index={4}>
        <MindmapTab noteId={noteId} />
      </TabPanel>

      <Dialog
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Generate study material</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Choose one or more outputs to generate from this note.
          </Typography>
          <FormGroup>
            {GENERATE_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.type}
                control={
                  <Checkbox
                    checked={selectedGenerateTypes.includes(option.type)}
                    onChange={() => handleToggleGenerateType(option.type)}
                  />
                }
                label={option.label}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setGenerateModalOpen(false)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<AutoAwesomeIcon />}
            onClick={handleGenerate}
            disabled={selectedGenerateTypes.length === 0 || generating}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
