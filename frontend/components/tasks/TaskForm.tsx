"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Task, TaskPriority, TaskStatus } from "@/lib/api";
import { useStore } from "@/lib/store";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal, ModalHeader } from "@/components/ui/modal";

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional().or(z.literal("")),
  status: z.enum(["todo", "in_progress", "done"]),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

export function TaskForm({
  open,
  onClose,
  onSave,
  defaultStatus = "todo",
  defaultDue = null,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Task>) => Promise<void>;
  defaultStatus?: TaskStatus;
  defaultDue?: string | null;
}) {
  const { t } = useStore();
  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      status: defaultStatus,
      priority: "medium",
      due_date: defaultDue ?? "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      title: "",
      description: "",
      status: defaultStatus,
      priority: "medium",
      due_date: defaultDue ?? "",
    });
    window.setTimeout(() => setFocus("title"), 60);
  }, [open, defaultStatus, defaultDue, reset, setFocus]);

  const submit = async (values: FormValues) => {
    await onSave({
      title: values.title.trim(),
      description: values.description?.trim() ? values.description.trim() : null,
      status: values.status as TaskStatus,
      priority: values.priority as TaskPriority,
      due_date: values.due_date || null,
    });
  };

  return (
    <Modal open={open} onClose={onClose} className="max-w-[520px]" labelledBy="task-composer-title">
      <ModalHeader
        id="task-composer-title"
        title={t("tasks.create")}
        onClose={onClose}
        closeLabel={t("common.close")}
      />
      <form onSubmit={handleSubmit(submit)}>
        <div className="space-y-3 px-5 py-4">
          <div>
            <Input
              {...register("title")}
              placeholder={t("tasks.titlePlaceholder")}
              className="h-10 border-transparent bg-transparent px-0 text-[16px] font-medium hover:border-transparent focus:border-transparent focus:ring-0"
              aria-label={t("tasks.title")}
            />
            {errors.title && (
              <p className="mt-1 text-[11px] text-danger">{t("tasks.titlePlaceholder")}</p>
            )}
          </div>

          <Textarea
            {...register("description")}
            rows={3}
            placeholder={t("tasks.descriptionPlaceholder")}
            className="border-transparent bg-hover/40 hover:border-line"
            aria-label={t("tasks.description")}
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <label className="text-[11px] font-medium text-muted">
              {t("tasks.status")}
              <select
                {...register("status")}
                className="mt-1 h-8 w-full rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                <option value="todo">{t("tasks.todo")}</option>
                <option value="in_progress">{t("tasks.inProgress")}</option>
                <option value="done">{t("tasks.done")}</option>
              </select>
            </label>

            <label className="text-[11px] font-medium text-muted">
              {t("tasks.priority")}
              <select
                {...register("priority")}
                className="mt-1 h-8 w-full rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                <option value="high">{t("tasks.high")}</option>
                <option value="medium">{t("tasks.medium")}</option>
                <option value="low">{t("tasks.low")}</option>
              </select>
            </label>

            <label className="text-[11px] font-medium text-muted">
              {t("tasks.due")}
              <input
                type="date"
                {...register("due_date")}
                className="mt-1 h-8 w-full rounded-md border border-line bg-surface px-2 text-[12px] text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" size="sm" loading={isSubmitting}>
            {t("tasks.create")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
