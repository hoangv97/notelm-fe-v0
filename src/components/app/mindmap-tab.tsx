"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import SaveIcon from "@mui/icons-material/Save";
import ReactFlow, {
  Background,
  Controls,
  Edge,
  MiniMap,
  Node,
  NodeMouseHandler,
  useEdgesState,
  useNodesState,
} from "reactflow";
import { alpha, useTheme } from "@mui/material/styles";
import {
  useGetMindmapsService,
  useUpdateMindmapService,
} from "@/services/api/services/study";
import { Mindmap, MindmapTreeNode } from "@/services/api/types/study-types";

const PAGE_LIMIT = 10;
const NODE_WIDTH = 220;
const NODE_X_GAP = 280;
const NODE_Y_GAP = 140;

type MindmapTabProps = {
  noteId: string;
};

type EditableNodeData = {
  label: string;
  type: string;
};

function parseTree(tree: string): MindmapTreeNode | null {
  try {
    const parsed = JSON.parse(tree) as Partial<MindmapTreeNode>;

    if (!parsed.label) return null;

    return {
      label: parsed.label,
      type: parsed.type,
      children: Array.isArray(parsed.children)
        ? parsed.children.map(normalizeTreeNode)
        : [],
    };
  } catch {
    return null;
  }
}

function normalizeTreeNode(node: Partial<MindmapTreeNode>): MindmapTreeNode {
  return {
    label: node.label ?? "Untitled",
    type: node.type,
    children: Array.isArray(node.children)
      ? node.children.map(normalizeTreeNode)
      : [],
  };
}

function getNodeId(path: number[]) {
  return path.length ? path.join("-") : "root";
}

function treeToFlow(tree: MindmapTreeNode) {
  const nodes: Node<EditableNodeData>[] = [];
  const edges: Edge[] = [];
  let leafCursor = 0;

  function walk(node: MindmapTreeNode, path: number[], depth: number): number {
    const id = getNodeId(path);
    const childCenters = node.children.map((child, index) => {
      const childPath = [...path, index];
      edges.push({
        id: `${id}-${getNodeId(childPath)}`,
        source: id,
        target: getNodeId(childPath),
        type: "smoothstep",
      });
      return walk(child, childPath, depth + 1);
    });

    const x = childCenters.length
      ? childCenters.reduce((sum, center) => sum + center, 0) /
        childCenters.length
      : leafCursor++ * NODE_X_GAP;

    nodes.push({
      id,
      data: { label: node.label, type: node.type ?? "" },
      position: { x, y: depth * NODE_Y_GAP },
      style: {
        width: NODE_WIDTH,
        borderRadius: 8,
        border: "1px solid #d0d7de",
        fontSize: 13,
        fontWeight: path.length ? 500 : 700,
        padding: 12,
      },
    });

    return x;
  }

  walk(tree, [], 0);

  return { nodes, edges };
}

function updateTreeNode(
  node: MindmapTreeNode,
  id: string,
  updates: Partial<Pick<MindmapTreeNode, "label" | "type">>,
  path: number[] = []
): MindmapTreeNode {
  const currentId = getNodeId(path);

  if (currentId === id) {
    return {
      ...node,
      ...updates,
      type: updates.type?.trim() ? updates.type : undefined,
    };
  }

  return {
    ...node,
    children: node.children.map((child, index) =>
      updateTreeNode(child, id, updates, [...path, index])
    ),
  };
}

export default function MindmapTab({ noteId }: MindmapTabProps) {
  const theme = useTheme();
  const getMindmaps = useGetMindmapsService();
  const updateMindmap = useUpdateMindmapService();

  const [mindmaps, setMindmaps] = useState<Mindmap[]>([]);
  const [selectedMindmapId, setSelectedMindmapId] = useState("");
  const [title, setTitle] = useState("");
  const [layout, setLayout] = useState("tree");
  const [tree, setTree] = useState<MindmapTreeNode | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<EditableNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const selectedMindmap = useMemo(
    () => mindmaps.find((mindmap) => mindmap.id === selectedMindmapId),
    [mindmaps, selectedMindmapId]
  );

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId]
  );

  const loadMindmaps = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMindmaps({
        noteId,
        page: 1,
        limit: PAGE_LIMIT,
      });
      const data = result.data.data;
      const firstMindmap = data[0];

      setMindmaps(data);
      setSelectedMindmapId((current) => current || firstMindmap?.id || "");
    } catch {
      setMindmaps([]);
      setSelectedMindmapId("");
      setTree(null);
    } finally {
      setLoading(false);
    }
  }, [getMindmaps, noteId]);

  useEffect(() => {
    loadMindmaps();
  }, [loadMindmaps]);

  useEffect(() => {
    if (!selectedMindmap) {
      setTitle("");
      setLayout("tree");
      setTree(null);
      setSelectedNodeId(null);
      return;
    }

    setTitle(selectedMindmap.title);
    setLayout(selectedMindmap.layout || "tree");
    setTree(parseTree(selectedMindmap.tree));
    setSelectedNodeId(null);
  }, [selectedMindmap]);

  useEffect(() => {
    if (!tree) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const flow = treeToFlow(tree);
    setNodes(flow.nodes);
    setEdges(flow.edges);
  }, [setEdges, setNodes, tree]);

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    setSelectedNodeId(node.id);
  };

  const handleNodeChange = (key: keyof EditableNodeData, value: string) => {
    if (!tree || !selectedNodeId) return;

    setTree(updateTreeNode(tree, selectedNodeId, { [key]: value }));
  };

  const handleSave = async () => {
    if (!selectedMindmap || !tree) return;

    setSaving(true);
    setSaved(false);
    try {
      const result = await updateMindmap(selectedMindmap.id, {
        title,
        layout,
        tree: JSON.stringify(tree),
      });

      setMindmaps((current) =>
        current.map((mindmap) =>
          mindmap.id === result.data.id ? result.data : mindmap
        )
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={520} />
      </Box>
    );
  }

  if (!selectedMindmap || !tree) {
    return (
      <Box
        sx={{
          py: 8,
          textAlign: "center",
          color: "text.secondary",
        }}
      >
        <Typography>No mindmap found for this note.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", md: "center" },
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        <TextField
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          size="small"
          sx={{ flexGrow: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="mindmap-select-label">Mindmap</InputLabel>
          <Select
            labelId="mindmap-select-label"
            label="Mindmap"
            value={selectedMindmapId}
            onChange={(event) => setSelectedMindmapId(event.target.value)}
          >
            {mindmaps.map((mindmap) => (
              <MenuItem key={mindmap.id} value={mindmap.id}>
                {mindmap.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Layout"
          value={layout}
          onChange={(event) => setLayout(event.target.value)}
          size="small"
          sx={{ width: { xs: "100%", md: 140 } }}
        />
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ textTransform: "none", whiteSpace: "nowrap" }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 320px" },
          gap: 2,
          minHeight: 560,
        }}
      >
        <Box
          sx={{
            height: 560,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: alpha(theme.palette.background.paper, 0.78),
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        </Box>

        <Box
          sx={{
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            p: 2,
            bgcolor: "background.paper",
            alignSelf: "stretch",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Node editor
          </Typography>
          {selectedNode ? (
            <Box sx={{ display: "grid", gap: 2 }}>
              <Chip
                label={
                  selectedNode.id === "root" ? "Root node" : selectedNode.id
                }
                size="small"
                sx={{ justifySelf: "flex-start" }}
              />
              <TextField
                label="Label"
                value={selectedNode.data.label}
                onChange={(event) =>
                  handleNodeChange("label", event.target.value)
                }
                fullWidth
                multiline
                minRows={2}
              />
              {/* <TextField
                label="Type"
                value={selectedNode.data.type}
                onChange={(event) =>
                  handleNodeChange("type", event.target.value)
                }
                fullWidth
                placeholder="concept, detail..."
              /> */}
              <Typography variant="body2" color="text.secondary">
                Drag nodes to inspect the map. Label and type changes are saved
                to the mindmap tree when you click Save.
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Select a node on the mindmap to edit its label and type.
            </Typography>
          )}
          {saved && (
            <Typography
              variant="body2"
              sx={{ mt: 2, color: "success.main", fontWeight: 600 }}
            >
              Saved successfully
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}
