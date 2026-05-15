"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Snackbar from "@mui/material/Snackbar";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { alpha, useTheme } from "@mui/material/styles";
import { useAppContext } from "./app-context";
import { useGetJobStatusService } from "@/services/api/services/folders-notes";
import { JobStatusEnum } from "@/services/api/types/note-types";

type NoteProgressProps = {
  jobId: string;
  noteName: string;
};

export default function NoteProgress({ jobId, noteName }: NoteProgressProps) {
  const theme = useTheme();
  const { removeActiveJob, refreshTree } = useAppContext();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<JobStatusEnum>(JobStatusEnum.QUEUED);
  const [message, setMessage] = useState("Queued for processing...");
  const [open, setOpen] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getJobStatus = useGetJobStatusService();

  const pollStatus = useCallback(async () => {
    try {
      const result = await getJobStatus(jobId);
      const job = result.data;
      setProgress(job.progress);
      setStatus(job.status);
      setMessage(job.message || "");

      if (
        job.status === JobStatusEnum.COMPLETED ||
        job.status === JobStatusEnum.FAILED
      ) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        refreshTree();
        // Auto-close after 4s on completion
        setTimeout(() => {
          setOpen(false);
          removeActiveJob(jobId);
        }, 4000);
      }
    } catch {
      // ignore
    }
  }, [jobId, getJobStatus, refreshTree, removeActiveJob]);

  useEffect(() => {
    // Initial poll
    pollStatus();
    // Poll every 2s
    intervalRef.current = setInterval(pollStatus, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [pollStatus]);

  const handleClose = () => {
    setOpen(false);
    removeActiveJob(jobId);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const isComplete = status === JobStatusEnum.COMPLETED;
  const isFailed = status === JobStatusEnum.FAILED;

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Box
        sx={{
          minWidth: 340,
          maxWidth: 400,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: theme.shadows[8],
          border: `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
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
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: isComplete
              ? alpha(theme.palette.success.main, 0.06)
              : isFailed
                ? alpha(theme.palette.error.main, 0.06)
                : alpha(theme.palette.primary.main, 0.04),
          }}
        >
          {isComplete && (
            <CheckCircleIcon fontSize="small" sx={{ color: "success.main" }} />
          )}
          {isFailed && (
            <ErrorIcon fontSize="small" sx={{ color: "error.main" }} />
          )}
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, flexGrow: 1 }}
            noWrap
          >
            {noteName}
          </Typography>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Progress */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
          >
            <Typography variant="caption" color="text.secondary">
              {message}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {progress}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            color={isComplete ? "success" : isFailed ? "error" : "primary"}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
            }}
          />
        </Box>
      </Box>
    </Snackbar>
  );
}
