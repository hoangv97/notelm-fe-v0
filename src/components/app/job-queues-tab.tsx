"use client";

import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import DataGridTable from "@/components/table/data-grid-table";
import { useGetJobQueuesService } from "@/services/api/services/folders-notes";
import { JobQueue } from "@/services/api/types/note-types";
import { GridColDef } from "@mui/x-data-grid";

const FETCH_LIMIT = 100;

type JobQueuesTabProps = {
  noteId: string;
};

function formatDateTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function truncate(value: unknown, maxLength = 120) {
  const text = stringifyValue(value);
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export default function JobQueuesTab({ noteId }: JobQueuesTabProps) {
  const getJobQueues = useGetJobQueuesService();
  const [rows, setRows] = useState<JobQueue[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const nextRows: JobQueue[] = [];
      let currentPage = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const result = await getJobQueues({
          noteId,
          page: currentPage,
          limit: FETCH_LIMIT,
        });
        const pageRows = result.data.data;
        nextRows.push(...pageRows);
        hasNextPage = result.data.hasNextPage && pageRows.length > 0;
        currentPage += 1;
      }

      setRows(
        nextRows.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      );
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [getJobQueues, noteId]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const columns: GridColDef<JobQueue>[] = [
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => (
        <Chip label={params.row.status} size="small" variant="outlined" />
      ),
    },
    { field: "jobType", headerName: "Job type", minWidth: 180, flex: 0.8 },
    {
      field: "attemptCount",
      headerName: "Attempts",
      type: "number",
      width: 110,
    },
    { field: "id", headerName: "ID", minWidth: 220, flex: 1 },
    { field: "noteId", headerName: "Note ID", minWidth: 220, flex: 1 },
    { field: "userId", headerName: "User ID", minWidth: 220, flex: 1 },
    {
      field: "bullmqJobId",
      headerName: "BullMQ job ID",
      minWidth: 180,
      flex: 0.8,
      renderCell: (params) => stringifyValue(params.row.bullmqJobId),
    },
    {
      field: "idempotencyKey",
      headerName: "Idempotency key",
      minWidth: 220,
      flex: 1,
      renderCell: (params) => stringifyValue(params.row.idempotencyKey),
    },
    {
      field: "payload",
      headerName: "Payload",
      minWidth: 260,
      flex: 1.2,
      renderCell: (params) => truncate(params.row.payload, 180),
    },
    {
      field: "resultSummary",
      headerName: "Result summary",
      minWidth: 240,
      flex: 1,
      renderCell: (params) => truncate(params.row.resultSummary, 160),
    },
    {
      field: "errorMessage",
      headerName: "Error message",
      minWidth: 240,
      flex: 1,
      renderCell: (params) => truncate(params.row.errorMessage, 160),
    },
    {
      field: "startedAt",
      headerName: "Started at",
      width: 180,
      renderCell: (params) => formatDateTime(params.row.startedAt),
    },
    {
      field: "completedAt",
      headerName: "Completed at",
      width: 180,
      renderCell: (params) => formatDateTime(params.row.completedAt),
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
      field: "deletedAt",
      headerName: "Deleted at",
      width: 180,
      renderCell: (params) => stringifyValue(params.row.deletedAt),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, flexGrow: 1 }}>
          Jobs
        </Typography>
      </Box>

      <DataGridTable
        rows={rows}
        columns={columns}
        loading={loading}
        noRowsLabel="No jobs found for this note."
        tableMinWidth={3000}
        onRefresh={loadJobs}
        initialState={{
          sorting: {
            sortModel: [{ field: "updatedAt", sort: "desc" }],
          },
        }}
      />
    </Box>
  );
}
