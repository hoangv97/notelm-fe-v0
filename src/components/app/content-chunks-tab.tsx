"use client";

import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/Edit";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import SaveIcon from "@mui/icons-material/Save";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { alpha, useTheme } from "@mui/material/styles";
import {
  useGetContentChunksService,
  useUpdateContentChunkService,
} from "@/services/api/services/content-chunks";
import { ContentChunk } from "@/services/api/types/content-chunk-types";

const PAGE_LIMIT = 1;

type ContentChunksTabProps = {
  noteId: string;
};

export default function ContentChunksTab({ noteId }: ContentChunksTabProps) {
  const theme = useTheme();
  const getContentChunks = useGetContentChunksService();
  const updateContentChunk = useUpdateContentChunkService();

  const [chunk, setChunk] = useState<ContentChunk | null>(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [draftMetadata, setDraftMetadata] = useState("");
  const [draftText, setDraftText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadChunk = useCallback(async () => {
    setLoading(true);
    setSaved(false);
    try {
      const result = await getContentChunks({
        noteId,
        page,
        limit: PAGE_LIMIT,
      });
      const nextChunk = result.data.data[0] ?? null;

      setChunk(nextChunk);
      setDraftMetadata(nextChunk?.metadata ?? "");
      setDraftText(nextChunk?.text ?? "");
      setHasNextPage(result.data.hasNextPage);
      setIsEditing(false);
    } catch {
      setChunk(null);
      setDraftMetadata("");
      setDraftText("");
      setHasNextPage(false);
    } finally {
      setLoading(false);
    }
  }, [getContentChunks, noteId, page]);

  useEffect(() => {
    loadChunk();
  }, [loadChunk]);

  useEffect(() => {
    setPage(1);
  }, [noteId]);

  const handleEdit = () => {
    setDraftMetadata(chunk?.metadata ?? "");
    setDraftText(chunk?.text ?? "");
    setIsEditing(true);
    setSaved(false);
  };

  const handleView = () => {
    setDraftMetadata(chunk?.metadata ?? "");
    setDraftText(chunk?.text ?? "");
    setIsEditing(false);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!chunk) return;

    setSaving(true);
    setSaved(false);
    try {
      const result = await updateContentChunk(chunk.id, {
        metadata: draftMetadata,
        text: draftText,
      });
      setChunk(result.data);
      setDraftMetadata(result.data.metadata);
      setDraftText(result.data.text);
      setIsEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
          Content Chunks
        </Typography>
        {chunk && (
          <Chip
            label={`Chunk ${chunk.chunkIndex + 1}`}
            size="small"
            variant="outlined"
          />
        )}
        {saved && (
          <Typography
            variant="body2"
            sx={{ color: "success.main", fontWeight: 500 }}
          >
            Saved
          </Typography>
        )}
        {chunk &&
          (isEditing ? (
            <>
              <Button
                startIcon={<VisibilityIcon />}
                onClick={handleView}
                disabled={saving}
                sx={{ textTransform: "none" }}
              >
                View
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                sx={{ textTransform: "none", fontWeight: 600 }}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEdit}
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Edit
            </Button>
          ))}
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 360,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          bgcolor: alpha(theme.palette.background.paper, 0.72),
          overflow: "auto",
        }}
      >
        {loading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="text" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={220} />
          </Box>
        ) : !chunk ? (
          <Box
            sx={{
              minHeight: 280,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 3,
            }}
          >
            <Typography color="text.secondary">
              No content chunks found for this note.
            </Typography>
          </Box>
        ) : isEditing ? (
          <Box sx={{ p: 3 }}>
            <TextField
              label="Metadata"
              value={draftMetadata}
              onChange={(event) => setDraftMetadata(event.target.value)}
              fullWidth
              multiline
              minRows={2}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Markdown"
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
              fullWidth
              multiline
              minRows={14}
              sx={{
                "& textarea": {
                  fontFamily: "monospace",
                  fontSize: 14,
                  lineHeight: 1.7,
                },
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              p: 3,
              color: "text.primary",
              "& h1, & h2, & h3": {
                mt: 2,
                mb: 1,
                fontWeight: 700,
              },
              "& h1:first-of-type, & h2:first-of-type, & h3:first-of-type": {
                mt: 0,
              },
              "& p": {
                my: 1.25,
                lineHeight: 1.75,
              },
              "& ul, & ol": {
                pl: 3,
              },
              "& pre": {
                p: 2,
                overflow: "auto",
                borderRadius: 1,
                bgcolor: alpha(theme.palette.common.black, 0.06),
              },
              "& code": {
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                bgcolor: alpha(theme.palette.common.black, 0.06),
              },
              "& pre code": {
                p: 0,
                bgcolor: "transparent",
              },
              "& blockquote": {
                m: 0,
                pl: 2,
                borderLeft: `4px solid ${theme.palette.divider}`,
                color: "text.secondary",
              },
            }}
          >
            {chunk.metadata && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.action.hover, 0.08),
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 0.5, fontWeight: 700 }}
                >
                  Metadata
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
                >
                  {chunk.metadata}
                </Typography>
              </Box>
            )}
            <ReactMarkdown>{chunk.text || "No content."}</ReactMarkdown>
          </Box>
        )}
      </Box>

      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "center", mt: 2 }}
      >
        <Tooltip title="Previous chunk">
          <span>
            <IconButton
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || page === 1}
            >
              <NavigateBeforeIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Typography variant="body2" color="text.secondary">
          Page {page}
        </Typography>
        <Tooltip title="Next chunk">
          <span>
            <IconButton
              onClick={() => setPage((current) => current + 1)}
              disabled={loading || !hasNextPage}
            >
              <NavigateNextIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Box>
  );
}
