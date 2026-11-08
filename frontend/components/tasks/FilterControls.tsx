"use client";
import { ArrowUpDown, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useStore } from "@/lib/store";
import { Menu, MenuCheckItem, MenuLabel, MenuSeparator } from "@/components/ui/menu";
import { Kbd } from "@/components/ui/kbd";

export function FilterMenu({
  status,
  priority,
  overdue,
  onStatus,
  onPriority,
  onOverdue,
  onClear,
}: {
  status: string;
  priority: string;
  overdue: boolean;
  onStatus: (value: string) => void;
  onPriority: (value: string) => void;
  onOverdue: (value: boolean) => void;
  onClear: () => void;
}) {
  const { t } = useStore();
  const activeCount =
    (status !== "all" ? 1 : 0) + (priority !== "all" ? 1 : 0) + (overdue ? 1 : 0);

  return (
    <Menu
      ariaLabel={t("filters.filter")}
      label={
        <span className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-muted hover:bg-hover hover:text-ink">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t("filters.filter")}
          {activeCount > 0 && (
            <span className="rounded-full bg-accent px-1.5 text-[10px] font-medium text-white">
              {activeCount}
            </span>
          )}
        </span>
      }
      panelClassName="w-56"
    >
      {(close) => (
        <>
          <MenuLabel>{t("filters.status")}</MenuLabel>
          {[
            { value: "all", label: t("filters.all") },
            { value: "todo", label: t("tasks.todo") },
            { value: "in_progress", label: t("tasks.inProgress") },
            { value: "done", label: t("tasks.done") },
          ].map((item) => (
            <MenuCheckItem
              key={item.value}
              label={item.label}
              checked={status === item.value}
              onClick={() => {
                onStatus(item.value);
                close();
              }}
            />
          ))}

          <MenuSeparator />
          <MenuLabel>{t("filters.priority")}</MenuLabel>
          {[
            { value: "all", label: t("filters.all") },
            { value: "high", label: t("tasks.high") },
            { value: "medium", label: t("tasks.medium") },
            { value: "low", label: t("tasks.low") },
          ].map((item) => (
            <MenuCheckItem
              key={item.value}
              label={item.label}
              checked={priority === item.value}
              onClick={() => {
                onPriority(item.value);
                close();
              }}
            />
          ))}

          <MenuSeparator />
          <MenuCheckItem
            label={t("filters.overdueOnly")}
            checked={overdue}
            onClick={() => {
              onOverdue(!overdue);
              close();
            }}
          />
          {activeCount > 0 && (
            <>
              <MenuSeparator />
              <button
                onClick={() => {
                  onClear();
                  close();
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-[13px] text-muted hover:bg-hover hover:text-ink"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("filters.clear")}
              </button>
            </>
          )}
        </>
      )}
    </Menu>
  );
}

export function SortMenu({
  sort,
  onSort,
}: {
  sort: string;
  onSort: (value: string) => void;
}) {
  const { t } = useStore();
  return (
    <Menu
      ariaLabel={t("filters.sort")}
      label={
        <span className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-muted hover:bg-hover hover:text-ink">
          <ArrowUpDown className="h-3.5 w-3.5" />
          {t("filters.sort")}
        </span>
      }
      panelClassName="w-48"
    >
      {(close) => (
        <>
          <MenuLabel>{t("filters.sort")}</MenuLabel>
          {[
            { value: "created_at", label: t("filters.newest") },
            { value: "due_date", label: t("filters.dueDate") },
            { value: "priority", label: t("filters.prioritySort") },
          ].map((item) => (
            <MenuCheckItem
              key={item.value}
              label={item.label}
              checked={sort === item.value}
              onClick={() => {
                onSort(item.value);
                close();
              }}
            />
          ))}
        </>
      )}
    </Menu>
  );
}

export function SearchHint() {
  const { t } = useStore();
  return (
    <button
      onClick={() => {
        const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
        window.dispatchEvent(event);
      }}
      className="hidden items-center gap-2 rounded-md bg-hover px-2.5 py-1 text-[11px] text-faint hover:bg-active hover:text-muted lg:flex"
    >
      {t("nav.searchPlaceholder")}
      <Kbd className="bg-surface">⌘K</Kbd>
    </button>
  );
}
