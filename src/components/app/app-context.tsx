"use client";

import { createContext, useContext } from "react";

export type SelectedItem = {
  type: "folder" | "note";
  id: string;
} | null;

export type AppContextType = {
  selectedItem: SelectedItem;
  setSelectedItem: (item: SelectedItem) => void;
  treeRefreshKey: number;
  refreshTree: () => void;
  createNoteModalOpen: boolean;
  setCreateNoteModalOpen: (open: boolean) => void;
  activeJobs: Array<{ jobId: string; noteName: string }>;
  addActiveJob: (jobId: string, noteName: string) => void;
  removeActiveJob: (jobId: string) => void;
};

export const AppContext = createContext<AppContextType>({
  selectedItem: null,
  setSelectedItem: () => {},
  treeRefreshKey: 0,
  refreshTree: () => {},
  createNoteModalOpen: false,
  setCreateNoteModalOpen: () => {},
  activeJobs: [],
  addActiveJob: () => {},
  removeActiveJob: () => {},
});

export function useAppContext() {
  return useContext(AppContext);
}
