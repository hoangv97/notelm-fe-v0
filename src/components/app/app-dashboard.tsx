"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import { AppContext, SelectedItem } from "./app-context";
import FolderTreePanel from "./folder-tree-panel";
import ContentPanel from "./content-panel";
import CreateNoteModal from "./create-note-modal";
import NoteProgress from "./note-progress";

export default function AppDashboard() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);
  const [createNoteModalOpen, setCreateNoteModalOpen] = useState(false);
  const [createNoteFolderId, setCreateNoteFolderId] = useState<string | null>(
    null
  );
  const [activeJobs, setActiveJobs] = useState<
    Array<{ jobId: string; noteName: string }>
  >([]);
  const [selectionLoaded, setSelectionLoaded] = useState(false);

  useEffect(() => {
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if ((type === "folder" || type === "note") && id) {
      setSelectedItem({ type, id });
    } else {
      const savedSelection = window.localStorage.getItem(
        "notelm:selected-item"
      );
      if (savedSelection) {
        try {
          const parsed = JSON.parse(savedSelection) as SelectedItem;
          if (
            parsed &&
            (parsed.type === "folder" || parsed.type === "note") &&
            parsed.id
          ) {
            setSelectedItem(parsed);
            const params = new URLSearchParams(searchParams.toString());
            params.set("type", parsed.type);
            params.set("id", parsed.id);
            router.replace(`${pathname}?${params.toString()}`, {
              scroll: false,
            });
          }
        } catch {
          window.localStorage.removeItem("notelm:selected-item");
        }
      }
    }

    setSelectionLoaded(true);
  }, [pathname, router, searchParams]);

  const handleSelectedItemChange = useCallback(
    (item: SelectedItem) => {
      setSelectedItem(item);

      const params = new URLSearchParams(searchParams.toString());
      if (item) {
        params.set("type", item.type);
        params.set("id", item.id);
        window.localStorage.setItem(
          "notelm:selected-item",
          JSON.stringify(item)
        );
      } else {
        params.delete("type");
        params.delete("id");
        window.localStorage.removeItem("notelm:selected-item");
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

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
      setSelectedItem: handleSelectedItemChange,
      treeRefreshKey,
      refreshTree,
      createNoteModalOpen,
      setCreateNoteModalOpen,
      createNoteFolderId,
      setCreateNoteFolderId,
      activeJobs,
      addActiveJob,
      removeActiveJob,
    }),
    [
      selectedItem,
      handleSelectedItemChange,
      treeRefreshKey,
      refreshTree,
      createNoteModalOpen,
      createNoteFolderId,
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
        {selectionLoaded && <ContentPanel />}
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
