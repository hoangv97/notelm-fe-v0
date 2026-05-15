"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { alpha, useTheme } from "@mui/material/styles";
import { useAppContext } from "./app-context";
import FolderContent from "./folder-content";
import NoteContent from "./note-content";

export default function ContentPanel() {
  const theme = useTheme();
  const { selectedItem } = useAppContext();

  if (!selectedItem) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          bgcolor: alpha(theme.palette.background.paper, 0.3),
        }}
      >
        <FolderOpenIcon
          sx={{
            fontSize: 80,
            color: alpha(theme.palette.text.secondary, 0.2),
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: "text.secondary",
            fontWeight: 400,
          }}
        >
          Select a folder or note to view
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Browse the tree on the left panel to get started
        </Typography>
      </Box>
    );
  }

  if (selectedItem.type === "folder") {
    return <FolderContent key={selectedItem.id} folderId={selectedItem.id} />;
  }

  return <NoteContent key={selectedItem.id} noteId={selectedItem.id} />;
}
