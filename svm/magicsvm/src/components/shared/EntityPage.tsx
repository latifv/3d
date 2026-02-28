import { useState, type ReactNode } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Note, TimelineEvent } from "@/types";
import { generateNotes, generateTimeline } from "@/mock/factories";
import { PageShell } from "./PageShell";
import { DataTable } from "./DataTable";
import { RightPanel } from "./RightPanel";

export interface EntityPageProps<T> {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  columns: ColumnDef<T, unknown>[];
  data: T[];
  searchKey?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  onCreate?: () => void;
  createLabel?: string;
  notes?: Note[];
  timeline?: TimelineEvent[];
  toolbar?: ReactNode;
  enableSelection?: boolean;
  rightPanelDefaultOpen?: boolean;
  extraActions?: ReactNode;
  onRefresh?: () => void;
}

const defaultNotes = generateNotes();
const defaultTimeline = generateTimeline();

export function EntityPage<T>({
  title,
  description,
  breadcrumbs,
  columns,
  data,
  searchKey,
  searchPlaceholder,
  loading,
  onRowClick,
  onCreate,
  createLabel = "Create",
  notes,
  timeline,
  toolbar,
  enableSelection = true,
  rightPanelDefaultOpen = false,
  extraActions,
  onRefresh,
}: EntityPageProps<T>) {
  const [rightPanelOpen, setRightPanelOpen] = useState(rightPanelDefaultOpen);

  const panelNotes = notes ?? defaultNotes;
  const panelTimeline = timeline ?? defaultTimeline;

  return (
    <PageShell
      title={title}
      description={description}
      breadcrumbs={breadcrumbs}
      actions={
        <div className="flex items-center gap-2">
          {extraActions}
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={onRefresh}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          {onCreate && (
            <Button size="sm" className="h-9 gap-1.5" onClick={onCreate}>
              <Plus className="h-3.5 w-3.5" />
              {createLabel}
            </Button>
          )}
        </div>
      }
    >
      <div className="flex gap-0">
        <div className="flex-1 min-w-0">
          <DataTable
            columns={columns}
            data={data}
            searchKey={searchKey}
            searchPlaceholder={searchPlaceholder}
            loading={loading}
            onRowClick={onRowClick}
            toolbar={toolbar}
            enableSelection={enableSelection}
          />
        </div>

        <RightPanel
          notes={panelNotes}
          timeline={panelTimeline}
          open={rightPanelOpen}
          onToggle={() => setRightPanelOpen((prev) => !prev)}
        />
      </div>
    </PageShell>
  );
}
