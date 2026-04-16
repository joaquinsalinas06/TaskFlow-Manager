'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from '@/providers/I18nProvider';
import { Priority, Group, Task, TaskType, UserSettings, ChecklistItem } from '@/types/index';
import PriorityColumn from '@/components/priority/PriorityColumn';
import TaskCalendarView from "@/components/dashboard/TaskCalendarView";
import CustomSelect from "@/components/shared/CustomSelect";
import DatePicker from "@/components/shared/DatePicker";
import CreateTaskTypeModal from "@/components/task-type/CreateTaskTypeModal";
import {
  Plus,
  CheckSquare,
  Target,
  ListTodo,
  Calendar as CalendarIcon,
  Mail,
  ChevronUp,
  ChevronDown,
  FileText,
  Link as LinkIcon,
  X as XIcon,
  ExternalLink,
  PlusCircle,
  Menu,
  Sparkles,
  LayoutGrid,
} from "lucide-react";
import AITaskImportModal from "./AITaskImportModal";
import { motion, AnimatePresence } from "framer-motion";

interface MainContentProps {
  priorities: Priority[];
  groups: Group[];
  taskTypes: TaskType[];
  groupedTasks: Record<string, Record<string, Task[]>>;
  onCreateTask: (
    title: string,
    priorityId: string,
    groupId: string,
    dueDate: string | null,
    sendEmailReminder: boolean | null,
    addCalendar: boolean | null,
    description?: string | null,
    links?: string[],
    checklistItems?: ChecklistItem[],
    priorityName?: string,
    groupName?: string,
    typeId?: string | null,
    typeName?: string,
  ) => Promise<Task>;
  onCreateTaskType: (name: string) => Promise<TaskType>;
  onCreateGroup: (name: string) => Promise<Group>;
  onDeleteTask: (id: string) => Promise<void>;
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<Task>) => Promise<void>;
  userSettings: UserSettings | null;
  dashboardLayout: "board" | "calendar";
  onChangeDashboardLayout: (layout: "board" | "calendar") => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isMobile: boolean;
}

export default function MainContent({
  priorities,
  groups,
  taskTypes,
  groupedTasks,
  onCreateTask,
  onCreateGroup,
  onCreateTaskType,
  onDeleteTask,
  onToggleTask,
  onUpdateTask,
  userSettings,
  dashboardLayout,
  onChangeDashboardLayout,
  sidebarCollapsed,
  onToggleSidebar,
  isMobile,
}: MainContentProps) {
  const { t } = useTranslation();
  const priorityCollapseKey = "taskflow.main.priorityCollapsed";
  const groupCollapseKey = "taskflow.main.groupCollapsed";
  const [priorityCollapsedMap, setPriorityCollapsedMap] = useState<
    Record<string, boolean>
  >({});
  const [groupCollapsedMap, setGroupCollapsedMap] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    try {
      const savedPriorities = localStorage.getItem(priorityCollapseKey);
      const savedGroups = localStorage.getItem(groupCollapseKey);

      if (savedPriorities) {
        setPriorityCollapsedMap(JSON.parse(savedPriorities));
      }
      if (savedGroups) {
        setGroupCollapsedMap(JSON.parse(savedGroups));
      }
    } catch {
      // Ignore malformed localStorage and use defaults.
    }
  }, []);

  const togglePriorityCollapsed = useCallback((priorityId: string) => {
    setPriorityCollapsedMap((prev) => {
      const next = { ...prev, [priorityId]: !(prev[priorityId] ?? false) };
      localStorage.setItem(priorityCollapseKey, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggleGroupCollapsed = useCallback(
    (priorityId: string, groupId: string) => {
      const key = `${priorityId}:${groupId}`;
      setGroupCollapsedMap((prev) => {
        const next = { ...prev, [key]: !(prev[key] ?? true) };
        localStorage.setItem(groupCollapseKey, JSON.stringify(next));
        return next;
      });
    },
    [],
  );

  // Keep completed tasks fetched in memory, but hide them from the main board.
  const visibleGroupedTasks = useMemo(() => {
    const filtered: Record<string, Record<string, Task[]>> = {};

    Object.entries(groupedTasks).forEach(([priorityId, groupsMap]) => {
      filtered[priorityId] = {};
      Object.entries(groupsMap).forEach(([groupId, tasks]) => {
        filtered[priorityId][groupId] = tasks.filter((task) => !task.completed);
      });
    });

    return filtered;
  }, [groupedTasks]);

  const visibleTasks = useMemo(() => {
    return Object.values(visibleGroupedTasks).flatMap((groupMap) =>
      Object.values(groupMap).flat(),
    );
  }, [visibleGroupedTasks]);

  const allTasks = useMemo(() => {
    return Object.values(groupedTasks).flatMap((groupMap) =>
      Object.values(groupMap).flat(),
    );
  }, [groupedTasks]);

  // Base task state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskPriorityId, setTaskPriorityId] = useState(priorities[0]?.id || "");
  const [taskGroupId, setTaskGroupId] = useState(groups[0]?.id || "");
  const [taskTypeId, setTaskTypeId] = useState<string | null>(null);
  const [showTypeCreateModal, setShowTypeCreateModal] = useState(false);
  const [taskSendEmail, setTaskSendEmail] = useState<boolean | null>(null);
  const [taskAddCalendar, setTaskAddCalendar] = useState<boolean | null>(null);
  const [showAIImportModal, setShowAIImportModal] = useState(false);

  // Extended task state
  const [taskDescription, setTaskDescription] = useState("");
  const [taskLinks, setTaskLinks] = useState<string[]>([]);
  const [taskChecklistItems, setTaskChecklistItems] = useState<ChecklistItem[]>(
    [],
  );
  const [showMore, setShowMore] = useState(false);
  const [newLink, setNewLink] = useState("");
  const [newCheckItem, setNewCheckItem] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalTasks = Object.values(groupedTasks)
    .flatMap((g) => Object.values(g))
    .flat().length;
  const completedTasks = Object.values(groupedTasks)
    .flatMap((g) => Object.values(g))
    .flat()
    .filter((t) => t.completed).length;

  const openModal = (presetDueDate = "") => {
    setTaskTitle("");
    setTaskPriorityId(priorities[0]?.id || "");
    setTaskGroupId(groups[0]?.id || "");
    setTaskTypeId(null);
    setTaskDueDate(presetDueDate);
    setTaskDescription("");
    setTaskLinks([]);
    setTaskChecklistItems([]);
    setShowMore(false);
    setNewLink("");
    setNewCheckItem("");
    setError("");
    // Default toggles from user settings (null = inherit)
    setTaskSendEmail(userSettings?.emailReminders ?? null);
    setTaskAddCalendar(userSettings?.calendarIntegration ?? null);
    setShowTaskModal(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskPriorityId || !taskGroupId) {
      setError("Please fill in all fields");
      return;
    }
    setSaving(true);
    try {
      const _priority = priorities.find((p) => p.id === taskPriorityId);
      const _group = groups.find((g) => g.id === taskGroupId);
      const _type = taskTypes.find((t) => t.id === taskTypeId);

      const created = await onCreateTask(
        taskTitle.trim(),
        taskPriorityId,
        taskGroupId,
        taskDueDate ? taskDueDate : null,
        taskDueDate ? taskSendEmail : null,
        taskDueDate ? taskAddCalendar : null,
        taskDescription.trim() || null,
        taskLinks.length > 0 ? taskLinks : undefined,
        taskChecklistItems.length > 0 ? taskChecklistItems : undefined,
        _priority?.name,
        _group?.name,
        taskTypeId,
        _type?.name,
      );

      setShowTaskModal(false);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  // ── Handlers for extended state ──────────────────────────────────────────

  const addLink = () => {
    const trimmed = newLink.trim();
    if (!trimmed) return;
    setTaskLinks([...taskLinks, trimmed]);
    setNewLink("");
  };
  const removeLink = (i: number) => {
    setTaskLinks(taskLinks.filter((_, idx) => idx !== i));
  };

  const addCheckItem = () => {
    const trimmed = newCheckItem.trim();
    if (!trimmed) return;
    const item: ChecklistItem = {
      id: Date.now().toString(),
      text: trimmed,
      done: false,
    };
    setTaskChecklistItems([...taskChecklistItems, item]);
    setNewCheckItem("");
  };
  const removeCheckItem = (id: string) => {
    setTaskChecklistItems(taskChecklistItems.filter((c) => c.id !== id));
  };

  // ── Inline styles ─────────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: "100%",
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    color: "var(--color-text-base)",
    fontSize: "0.875rem",
    padding: "0.5rem 0.75rem",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };
  const lbl: React.CSSProperties = {
    fontSize: "0.68rem",
    fontWeight: 700,
    color: "var(--color-text-faint)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: "0.3rem",
    display: "block",
  };

  // ── Empty States ──────────────────────────────────────────────────────────

  if (priorities.length === 0) {
    return (
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "360px" }}>
          <div
            style={{
              width: "4rem",
              height: "4rem",
              borderRadius: "var(--radius-xl)",
              background: "rgba(99,102,241,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <Target size={28} color="var(--color-primary-light)" />
          </div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            {t("no_priorities_yet")}
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {t("create_first_priority")}
          </p>
        </div>
      </main>
    );
  }

  if (groups.length === 0) {
    return (
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "360px" }}>
          <div
            style={{
              width: "4rem",
              height: "4rem",
              borderRadius: "var(--radius-xl)",
              background: "rgba(99,102,241,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}
          >
            <ListTodo size={28} color="var(--color-primary-light)" />
          </div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
            }}
          >
            {t("no_groups_yet")}
          </h2>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            {t("create_first_group")}
          </p>
        </div>
      </main>
    );
  }

  const checklistDone = taskChecklistItems.filter((c) => c.done).length;
  const hasRichContent =
    !!taskDescription || taskLinks.length > 0 || taskChecklistItems.length > 0;

  return (
    <>
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          background: "var(--color-surface-0)",
          position: "relative",
          marginLeft: isMobile ? 0 : sidebarCollapsed ? "68px" : "0px",
          paddingLeft: isMobile ? 0 : 0,
          transition: "margin-left 0.3s ease",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "var(--color-surface-1)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "1rem" : "2rem 2rem 1.5rem",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {isMobile && (
              <button
                onClick={onToggleSidebar}
                className="btn btn-ghost btn-icon"
                style={{ background: "var(--color-surface-2)" }}
              >
                <Menu size={20} />
              </button>
            )}
            <div>
              <h1
                style={{
                  fontSize: isMobile ? "1.25rem" : "1.6rem",
                  fontWeight: 800,
                  marginBottom: "0.15rem",
                }}
              >
                {t("dashboard")}
              </h1>
              {!isMobile && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {priorities.length} {t("priorities").toLowerCase()}
                  </span>
                  <span
                    style={{ color: "var(--color-border)", fontSize: "1rem" }}
                  >
                    ·
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {groups.length} {t("groups").toLowerCase()}
                  </span>
                  {totalTasks > 0 && (
                    <>
                      <span
                        style={{
                          color: "var(--color-border)",
                          fontSize: "1rem",
                        }}
                      >
                        ·
                      </span>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {completedTasks}/{totalTasks} {t("tasks_done")}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() =>
                onChangeDashboardLayout(
                  dashboardLayout === "board" ? "calendar" : "board",
                )
              }
              className="btn btn-ghost"
              style={{
                gap: "0.35rem",
                background:
                  dashboardLayout === "calendar"
                    ? "var(--color-surface-3)"
                    : "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                color:
                  dashboardLayout === "calendar"
                    ? "var(--color-primary-light)"
                    : "var(--color-text-muted)",
                padding: isMobile ? "0.5rem" : "0.5rem 0.75rem",
              }}
              title={
                dashboardLayout === "calendar"
                  ? "Switch to board"
                  : "Switch to calendar"
              }
            >
              {dashboardLayout === "calendar" ? (
                <LayoutGrid size={isMobile ? 18 : 15} />
              ) : (
                <CalendarIcon size={isMobile ? 18 : 15} />
              )}
              {!isMobile &&
                (dashboardLayout === "calendar"
                  ? t("board_view")
                  : t("calendar"))}
            </button>
            <button
              onClick={() => setShowAIImportModal(true)}
              className="btn btn-ghost"
              style={{
                gap: "0.4rem",
                background: "rgba(99,102,241,0.05)",
                border: "1px solid rgba(99,102,241,0.1)",
                color: "var(--color-primary-light)",
                padding: isMobile ? "0.5rem" : "0.5rem 0.85rem",
              }}
            >
              <Sparkles size={isMobile ? 18 : 15} />
              {!isMobile && t("ia_import")}
            </button>
            <button
              onClick={() => openModal()}
              className="btn btn-primary"
              style={{
                gap: isMobile ? "0" : "0.4rem",
                padding: isMobile ? "0.5rem" : undefined,
              }}
            >
              <Plus size={isMobile ? 20 : 16} />
              {!isMobile && t("new_task")}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {dashboardLayout === "calendar" ? (
            <motion.section
              key="calendar-view"
              initial={{ opacity: 0, y: 18, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              style={{ padding: isMobile ? "1rem" : "1.25rem 2rem 2rem" }}
            >
              <TaskCalendarView
                tasks={allTasks}
                groups={groups}
                priorities={priorities}
                taskTypes={taskTypes}
                userSettings={userSettings}
                isMobile={isMobile}
                onCreateTaskAtDate={(date) => openModal(date)}
                onDeleteTask={onDeleteTask}
                onToggleTask={onToggleTask}
                onUpdateTask={onUpdateTask}
                onCreateTaskType={onCreateTaskType}
              />
            </motion.section>
          ) : (
            <motion.section
              key="board-view"
              initial={{ opacity: 0, y: 14, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                padding: "1.5rem 2rem 2rem",
              }}
            >
              {priorities.map((priority, i) => (
                <motion.div
                  key={priority.id}
                  className="animate-slideUp"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.035, duration: 0.28, ease: "easeOut" }}
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <PriorityColumn
                    priorities={priorities}
                    priority={priority}
                    groups={groups}
                    taskTypes={taskTypes}
                    tasks={visibleGroupedTasks[priority.id] || {}}
                    collapsed={priorityCollapsedMap[priority.id] ?? false}
                    onToggleCollapsed={() => togglePriorityCollapsed(priority.id)}
                    userSettings={userSettings}
                    onDeleteTask={onDeleteTask}
                    onToggleTask={onToggleTask}
                    onUpdateTask={onUpdateTask}
                    onCreateTaskType={onCreateTaskType}
                    getGroupCollapsed={(groupId: string) =>
                      groupCollapsedMap[`${priority.id}:${groupId}`] ?? true
                    }
                    onToggleGroupCollapsed={(groupId: string) =>
                      toggleGroupCollapsed(priority.id, groupId)
                    }
                  />
                </motion.div>
              ))}
            </motion.section>
          )}
        </AnimatePresence>

        <CreateTaskTypeModal
          isOpen={showTypeCreateModal}
          onClose={() => setShowTypeCreateModal(false)}
          onCreate={onCreateTaskType}
          onSuccess={(type) => setTaskTypeId(type.id)}
        />

        <AITaskImportModal
          isOpen={showAIImportModal}
          onClose={() => setShowAIImportModal(false)}
          priorities={priorities}
          groups={groups}
          taskTypes={taskTypes}
          userSettings={userSettings}
          onCreateTask={onCreateTask}
          onCreateGroup={onCreateGroup}
          onCreateTaskType={onCreateTaskType}
        />
      </main>

      {/* ── New Task Modal ── */}
      {showTaskModal && (
        <div className="modal-backdrop" onClick={() => setShowTaskModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "540px",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              padding: 0,
            }}
          >
            <div
              className="modal-header"
              style={{
                padding: "0.85rem 1.5rem",
                borderBottom: "1px solid var(--color-border)",
                flexShrink: 0,
                marginBottom: 0,
              }}
            >
              <span className="modal-title">{t("new_task")}</span>
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={() => setShowTaskModal(false)}
                aria-label={t("cancel")}
              >
                <XIcon size={16} />
              </button>
            </div>

            <div
              style={{
                padding:
                  taskTypes.length > 0
                    ? "0.5rem 1.5rem 1.5rem"
                    : "1rem 1.5rem 1.5rem",
                flex: 1,
                overflowY: "auto",
              }}
            >
              {error && (
                <div
                  style={{
                    marginBottom: "1rem",
                    padding: "0.65rem 0.9rem",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: "var(--radius-md)",
                    color: "#fca5a5",
                    fontSize: "0.82rem",
                  }}
                >
                  {error}
                </div>
              )}

              <form
                id="create-task-form"
                onSubmit={handleCreateTask}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {/* Task Type Tags (At the top) */}
                {taskTypes.length > 0 && (
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}
                  >
                    <button
                      type="button"
                      onClick={() => setTaskTypeId(null)}
                      style={{
                        padding: "0.3rem 0.75rem",
                        borderRadius: "999px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        border: `1.5px solid ${taskTypeId === null ? "var(--color-primary-light)" : "var(--color-border)"}`,
                        background:
                          taskTypeId === null
                            ? "rgba(99,102,241,0.1)"
                            : "transparent",
                        color:
                          taskTypeId === null
                            ? "var(--color-primary-light)"
                            : "var(--color-text-muted)",
                      }}
                    >
                      {t("no_type")}
                    </button>
                    {taskTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setTaskTypeId(type.id)}
                        style={{
                          padding: "0.3rem 0.75rem",
                          borderRadius: "999px",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s",
                          border: `1.5px solid ${taskTypeId === type.id ? type.color || "var(--color-primary-light)" : "var(--color-border)"}`,
                          background:
                            taskTypeId === type.id
                              ? `${type.color || "var(--color-primary-light)"}15`
                              : "transparent",
                          color:
                            taskTypeId === type.id
                              ? type.color || "var(--color-primary-light)"
                              : "var(--color-text-muted)",
                        }}
                      >
                        {type.name}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowTypeCreateModal(true)}
                      title={t("new_task_type")}
                      style={{
                        padding: "0.3rem 0.5rem",
                        borderRadius: "999px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        border: "1.5px dashed var(--color-border)",
                        background: "transparent",
                        color: "var(--color-text-faint)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--color-primary-light)";
                        e.currentTarget.style.color =
                          "var(--color-primary-light)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--color-border)";
                        e.currentTarget.style.color = "var(--color-text-faint)";
                      }}
                    >
                      <PlusCircle size={14} />
                    </button>
                  </div>
                )}

                <div>
                  <label className="label">{t("task_title_label")}</label>
                  <input
                    className="input"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    placeholder={t("task_title_placeholder")}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label">{t("due_date_label")}</label>
                  <DatePicker
                    value={taskDueDate === "" ? null : taskDueDate}
                    onChange={(val) => setTaskDueDate(val || "")}
                    placeholder={t("due_date_label")}
                    weekStartsOn={userSettings?.weekStartsOn}
                  />
                </div>

                {/* Notification micro-toggles */}
                {taskDueDate && (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      padding: "0.65rem 0.85rem",
                      background: "var(--color-surface-2)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {/* Email toggle */}
                    {userSettings?.emailReminders !== undefined && (
                      <button
                        type="button"
                        id="task-modal-email-toggle"
                        onClick={() =>
                          setTaskSendEmail((prev) =>
                            prev === null
                              ? (userSettings?.emailReminders ?? false)
                              : !prev,
                          )
                        }
                        title={t("send_reminder")}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "999px",
                          border: `1.5px solid ${(taskSendEmail ?? userSettings?.emailReminders) ? "#6366f1" : "var(--color-border)"}`,
                          background:
                            (taskSendEmail ?? userSettings?.emailReminders)
                              ? "rgba(99,102,241,0.12)"
                              : "transparent",
                          color:
                            (taskSendEmail ?? userSettings?.emailReminders)
                              ? "var(--color-primary-light)"
                              : "var(--color-text-faint)",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <Mail size={12} />
                        {t("send_reminder")}
                      </button>
                    )}

                    {/* Calendar toggle */}
                    {userSettings?.calendarIntegration !== undefined && (
                      <button
                        type="button"
                        id="task-modal-calendar-toggle"
                        onClick={() =>
                          setTaskAddCalendar((prev) =>
                            prev === null
                              ? (userSettings?.calendarIntegration ?? false)
                              : !prev,
                          )
                        }
                        title={t("add_to_calendar")}
                        disabled={!userSettings?.googleRefreshToken}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "999px",
                          border: `1.5px solid ${(taskAddCalendar ?? userSettings?.calendarIntegration) && userSettings?.googleRefreshToken ? "#22c55e" : "var(--color-border)"}`,
                          background:
                            (taskAddCalendar ??
                              userSettings?.calendarIntegration) &&
                            userSettings?.googleRefreshToken
                              ? "rgba(34,197,94,0.1)"
                              : "transparent",
                          color:
                            (taskAddCalendar ??
                              userSettings?.calendarIntegration) &&
                            userSettings?.googleRefreshToken
                              ? "#22c55e"
                              : "var(--color-text-faint)",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          cursor: userSettings?.googleRefreshToken
                            ? "pointer"
                            : "not-allowed",
                          opacity: userSettings?.googleRefreshToken ? 1 : 0.5,
                          transition: "all 0.15s",
                        }}
                      >
                        <CalendarIcon size={12} />
                        {t("add_to_calendar")}
                      </button>
                    )}
                  </div>
                )}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.75rem",
                  }}
                >
                  <CustomSelect
                    label={t("priority")}
                    options={priorities.map((p) => ({
                      value: p.id,
                      label: p.name,
                      color: p.color,
                    }))}
                    value={taskPriorityId}
                    onChange={setTaskPriorityId}
                  />

                  <CustomSelect
                    label={t("group")}
                    options={groups.map((g) => ({
                      value: g.id,
                      label: g.name,
                      color: g.color,
                    }))}
                    value={taskGroupId}
                    onChange={setTaskGroupId}
                  />
                </div>

                {/* ── MORE OPTIONS TOGGLE ── */}
                <div
                  style={{
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: "0.75rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowMore(!showMore)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "var(--radius-md)",
                      background: showMore
                        ? "var(--color-surface-2)"
                        : "transparent",
                      border: `1px solid ${showMore ? "var(--color-border)" : "var(--color-border)"}`,
                      color: "var(--color-text-muted)",
                      cursor: "pointer",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "var(--color-surface-2)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        showMore ? "var(--color-surface-2)" : "transparent";
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {showMore ? (
                        <ChevronUp size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      {showMore ? t("less_options") : t("more_options")}
                      {/* Rich content badges */}
                      {hasRichContent && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          {taskDescription && (
                            <FileText
                              size={12}
                              style={{ color: "var(--color-primary-light)" }}
                            />
                          )}
                          {taskLinks.length > 0 && (
                            <LinkIcon
                              size={12}
                              style={{ color: "var(--color-primary-light)" }}
                            />
                          )}
                          {taskChecklistItems.length > 0 && (
                            <span
                              style={{
                                fontSize: "0.65rem",
                                color:
                                  checklistDone === taskChecklistItems.length
                                    ? "#22c55e"
                                    : "var(--color-primary-light)",
                                fontWeight: 700,
                              }}
                            >
                              ✓ {checklistDone}/{taskChecklistItems.length}
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                  </button>
                </div>

                {/* ── Extended options (collapsed by default) ── */}
                <AnimatePresence>
                  {showMore && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.9rem",
                          paddingTop: "1rem",
                        }}
                      >
                        {/* Description */}
                        <div>
                          <label style={lbl}>
                            <FileText
                              size={10}
                              style={{
                                display: "inline",
                                marginRight: "0.3rem",
                                verticalAlign: "middle",
                              }}
                            />
                            {t("task_description_label")}
                          </label>
                          <textarea
                            style={
                              {
                                ...inp,
                                resize: "vertical",
                                minHeight: "72px",
                                lineHeight: 1.5,
                                fontSize: "0.85rem",
                                padding: "0.55rem 0.75rem",
                              } as React.CSSProperties
                            }
                            value={taskDescription}
                            onChange={(e) => setTaskDescription(e.target.value)}
                            placeholder={t("task_description_placeholder")}
                          />
                        </div>

                        {/* Links */}
                        <div>
                          <label style={lbl}>
                            <LinkIcon
                              size={10}
                              style={{
                                display: "inline",
                                marginRight: "0.3rem",
                                verticalAlign: "middle",
                              }}
                            />
                            {t("task_links_label")}
                          </label>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.3rem",
                              marginBottom:
                                taskLinks.length > 0 ? "0.45rem" : 0,
                            }}
                          >
                            {taskLinks.map((url, i) => (
                              <div
                                key={i}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.45rem",
                                  background: "var(--color-surface-2)",
                                  border: "1px solid var(--color-border)",
                                  borderRadius: "var(--radius-md)",
                                  padding: "0.3rem 0.6rem",
                                }}
                              >
                                <ExternalLink
                                  size={11}
                                  style={{
                                    color: "var(--color-primary-light)",
                                    flexShrink: 0,
                                  }}
                                />
                                <a
                                  href={
                                    url.startsWith("http")
                                      ? url
                                      : `https://${url}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.preventDefault()}
                                  style={{
                                    flex: 1,
                                    fontSize: "0.78rem",
                                    color: "var(--color-primary-light)",
                                    textDecoration: "none",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {url}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => removeLink(i)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--color-text-faint)",
                                    display: "flex",
                                    padding: "0.1rem",
                                    flexShrink: 0,
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.color =
                                      "var(--color-danger)")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.color =
                                      "var(--color-text-faint)")
                                  }
                                >
                                  <XIcon size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <input
                              style={{
                                ...inp,
                                flex: 1,
                                fontSize: "0.8rem",
                                padding: "0.38rem 0.65rem",
                              }}
                              value={newLink}
                              onChange={(e) => setNewLink(e.target.value)}
                              placeholder={t("task_links_placeholder")}
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                (e.preventDefault(), addLink())
                              }
                            />
                            <button
                              type="button"
                              onClick={addLink}
                              style={{
                                flexShrink: 0,
                                padding: "0.38rem 0.65rem",
                                borderRadius: "var(--radius-md)",
                                background: "var(--color-surface-3)",
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                fontSize: "0.75rem",
                              }}
                            >
                              <Plus size={12} />
                              {t("add_link")}
                            </button>
                          </div>
                        </div>

                        {/* Checklist */}
                        <div>
                          <label
                            style={{
                              ...lbl,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>
                              <CheckSquare
                                size={10}
                                style={{
                                  display: "inline",
                                  marginRight: "0.3rem",
                                  verticalAlign: "middle",
                                }}
                              />
                              {t("task_checklist_label")}
                            </span>
                            {taskChecklistItems.length > 0 && (
                              <span
                                style={{
                                  fontWeight: 700,
                                  color:
                                    checklistDone === taskChecklistItems.length
                                      ? "#22c55e"
                                      : "var(--color-text-faint)",
                                }}
                              >
                                {checklistDone}/{taskChecklistItems.length}
                              </span>
                            )}
                          </label>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.25rem",
                              marginBottom: "0.45rem",
                            }}
                          >
                            {taskChecklistItems.map((item) => (
                              <div
                                key={item.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.45rem",
                                  padding: "0.28rem 0.5rem",
                                  borderRadius: "var(--radius-sm)",
                                  background: "var(--color-surface-2)",
                                  border: "1px solid var(--color-border)",
                                }}
                              >
                                <span
                                  style={{
                                    flex: 1,
                                    fontSize: "0.8rem",
                                    color: "var(--color-text-base)",
                                    transition: "all 0.15s",
                                  }}
                                >
                                  {item.text}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeCheckItem(item.id)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--color-text-faint)",
                                    display: "flex",
                                    padding: "0.1rem",
                                  }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.color =
                                      "var(--color-danger)")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.color =
                                      "var(--color-text-faint)")
                                  }
                                >
                                  <XIcon size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <input
                              style={{
                                ...inp,
                                flex: 1,
                                fontSize: "0.8rem",
                                padding: "0.38rem 0.65rem",
                              }}
                              value={newCheckItem}
                              onChange={(e) => setNewCheckItem(e.target.value)}
                              placeholder={t("checklist_item_placeholder")}
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                (e.preventDefault(), addCheckItem())
                              }
                            />
                            <button
                              type="button"
                              onClick={addCheckItem}
                              style={{
                                flexShrink: 0,
                                padding: "0.38rem 0.65rem",
                                borderRadius: "var(--radius-md)",
                                background: "var(--color-surface-3)",
                                border: "1px solid var(--color-border)",
                                color: "var(--color-text-muted)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                fontSize: "0.75rem",
                              }}
                            >
                              <Plus size={12} />
                              {t("add_checklist_item")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            <div
              style={{
                padding: "1rem 1.5rem",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                gap: "0.75rem",
                flexShrink: 0,
              }}
            >
              <button
                type="submit"
                form="create-task-form"
                disabled={saving || !taskTitle.trim()}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                {saving ? t("creating") : t("create_task")}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowTaskModal(false)}
                style={{ flex: 1 }}
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
