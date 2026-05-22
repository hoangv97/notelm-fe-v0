"use client";

import Box from "@mui/material/Box";
import { DataGrid, GridColDef, GridValidRowModel } from "@mui/x-data-grid";
import type { DataGridProps } from "@mui/x-data-grid";

type DataGridTableProps<R extends GridValidRowModel> = Omit<
  DataGridProps<R>,
  "columns" | "rows"
> & {
  columns: GridColDef<R>[];
  rows: R[];
  height?: number;
  noRowsLabel?: string;
  tableMinWidth?: number | string;
};

export default function DataGridTable<R extends GridValidRowModel>({
  columns,
  rows,
  height = 520,
  noRowsLabel = "No rows found.",
  tableMinWidth = 1100,
  initialState,
  pageSizeOptions = [5, 10, 25],
  sx,
  ...props
}: DataGridTableProps<R>) {
  return (
    <Box sx={{ height, width: "100%", overflowX: "auto" }}>
      <Box sx={{ height: "100%", minWidth: tableMinWidth, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          checkboxSelection
          disableRowSelectionOnClick
          showToolbar
          pageSizeOptions={pageSizeOptions}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
            ...initialState,
          }}
          localeText={{
            noRowsLabel,
            ...props.localeText,
          }}
          sx={{
            borderColor: "divider",
            bgcolor: "background.paper",
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
              outline: "none",
            },
            ...sx,
          }}
          {...props}
        />
      </Box>
    </Box>
  );
}
