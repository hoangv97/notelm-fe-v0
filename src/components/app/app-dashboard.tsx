"use client";

import { useState, useCallback, useMemo } from "react";
import Box from "@mui/material/Box";
import { AppContext, SelectedItem } from "./app-context";
import FolderTreePanel from "./folder-tree-panel";
import ContentPanel from "./content-panel";
import CreateNoteModal from "./create-note-modal";
import NoteProgress from "./note-progress";

export default function AppDashboard() {
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);
  const [createNoteModalOpen, setCreateNoteModalOpen] = useState(false);
  const [activeJobs, setActiveJobs] = useState<
    Array<{ jobId: string; noteName: string }>
  >([]);

  const refreshTree = useCallback(() => {
    setTreeRefreshKey((prev) => prev + 1);
  }, []);

  const addActiveJob = useCallback((jobId: string, noteName: string) => {
    setActiveJobs((prev) => [...prev, { jobId, noteName }]);
  }, []);

  const removeActiveJob = useCallback((jobId: string) => {
    setActiveJobs((prev) => prev.filter((j) => j.jobId !== jobId));
  }, []);

  const contextValue = useMemo(
    () => ({
      selectedItem,
      setSelectedItem,
      treeRefreshKey,
      refreshTree,
      createNoteModalOpen,
      setCreateNoteModalOpen,
      activeJobs,
      addActiveJob,
      removeActiveJob,
    }),
    [
      selectedItem,
      treeRefreshKey,
      refreshTree,
      createNoteModalOpen,
      activeJobs,
      addActiveJob,
      removeActiveJob,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      <Box
        sx={{
          display: "flex",
          height: "calc(100vh - 64px)",
          overflow: "hidden",
        }}
      >
        <FolderTreePanel />
        <ContentPanel />
      </Box>

      <CreateNoteModal />

      {activeJobs.map((job) => (
        <NoteProgress
          key={job.jobId}
          jobId={job.jobId}
          noteName={job.noteName}
        />
      ))}
    </AppContext.Provider>
  );
}
