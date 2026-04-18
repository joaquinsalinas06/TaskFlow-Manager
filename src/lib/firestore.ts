import {
  collection,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Priority, Group, Task, TaskType, UserSettings } from '@/types/index';

// ============================================================
// PRIORITIES
// ============================================================

export const getPrioritiesByUser = async (userId: string): Promise<Priority[]> => {
  // No orderBy — sort client-side to avoid composite index requirement
  const q = query(
    collection(db, 'priorities'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Priority[];
  // Sort by the `order` field ascending
  return docs.sort((a, b) => a.order - b.order);
};

const DEFAULT_COLORS = ['#ef4444', '#f97316', '#f59e0b', '#22c55e', '#06b6d4', '#6366f1', '#a855f7', '#ec4899'];
const getRandomColor = () => DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];

export const createPriority = async (
  userId: string,
  name: string
): Promise<Priority> => {
  const priorities = await getPrioritiesByUser(userId);
  const maxOrder = priorities.length > 0
    ? Math.max(...priorities.map((p) => p.order))
    : -1;

  const color = getRandomColor();
  const docRef = doc(collection(db, 'priorities'));
  
  const priorityData = {
    userId,
    name,
    order: maxOrder + 1,
    color,
    createdAt: Timestamp.now(),
  };

  setDoc(docRef, priorityData).catch((err) => console.error('Error in optimistic creation:', err));

  return {
    id: docRef.id,
    ...priorityData,
  } as Priority;
};

export const updatePriority = async (
  priorityId: string,
  data: Partial<Priority>
): Promise<void> => {
  await updateDoc(doc(db, 'priorities', priorityId), data);
};

export const updatePriorityOrder = async (
  priorities: Priority[]
): Promise<void> => {
  const batch = writeBatch(db);
  priorities.forEach((priority, index) => {
    const docRef = doc(db, 'priorities', priority.id);
    batch.update(docRef, { order: index });
  });
  await batch.commit();
};

export const deletePriority = async (priorityId: string): Promise<void> => {
  await deleteDoc(doc(db, 'priorities', priorityId));

  // Also delete all tasks that belonged to this priority
  const tasksQ = query(
    collection(db, 'tasks'),
    where('priorityId', '==', priorityId)
  );
  const snapshot = await getDocs(tasksQ);
  snapshot.docs.forEach((d) => deleteDoc(d.ref));
};

// ============================================================
// USER SETTINGS
// ============================================================

const DEFAULT_SETTINGS = (uid: string, email: string): Omit<UserSettings, 'updatedAt'> => ({
  uid,
  notificationEmail: email,
  emailReminders: false,
  reminderLeadDays: 1,
  calendarIntegration: false,
  googleRefreshToken: null,
  googleAccessToken: null,
  googleTokenExpiry: null,
  googleEmail: null,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  language: typeof window !== 'undefined' && navigator.language.startsWith('es') ? 'es' : 'en',
  priorityFilter: [],
  groupFilter: [],
  weekStartsOn: 1,
});

export const getUserSettings = async (
  uid: string,
  email: string
): Promise<UserSettings> => {
  const ref = doc(db, 'userSettings', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { ...snap.data(), uid } as UserSettings;
  }
  // Auto-create defaults for new users
  const defaults = {
    ...DEFAULT_SETTINGS(uid, email),
    updatedAt: Timestamp.now(),
  };
  await setDoc(ref, defaults);
  return { ...defaults, uid } as UserSettings;
};

export const updateUserSettings = async (
  uid: string,
  data: Partial<Omit<UserSettings, 'uid'>>
): Promise<void> => {
  await updateDoc(doc(db, 'userSettings', uid), {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

// ============================================================
// GROUPS
// ============================================================

export const getGroupsByUser = async (userId: string): Promise<Group[]> => {
  // No orderBy — sort client-side by order, fallback to createdAt descending
  const q = query(
    collection(db, 'groups'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Group[];
  return docs.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    const aMs = a.createdAt?.toMillis?.() ?? 0;
    const bMs = b.createdAt?.toMillis?.() ?? 0;
    return aMs - bMs; // Older groups at top if missing order
  });
};

export const createGroup = async (
  userId: string,
  name: string
): Promise<Group> => {
  const groups = await getGroupsByUser(userId);
  const maxOrder = groups.length > 0 
    ? Math.max(...groups.map((g) => g.order || 0))
    : -1;

  const color = getRandomColor();
  const docRef = doc(collection(db, 'groups'));
  
  const groupData = {
    userId,
    name,
    order: maxOrder + 1,
    color,
    createdAt: Timestamp.now(),
  };

  setDoc(docRef, groupData).catch((err) => console.error('Error in optimistic creation:', err));

  return {
    id: docRef.id,
    ...groupData,
  } as Group;
};

export const updateGroup = async (
  groupId: string,
  data: Partial<Group>
): Promise<void> => {
  await updateDoc(doc(db, 'groups', groupId), data);
};

export const updateGroupOrder = async (
  groups: Group[]
): Promise<void> => {
  const batch = writeBatch(db);
  groups.forEach((group, index) => {
    const docRef = doc(db, 'groups', group.id);
    batch.update(docRef, { order: index });
  });
  await batch.commit();
};

export const deleteGroup = async (groupId: string): Promise<void> => {
  await deleteDoc(doc(db, 'groups', groupId));

// Also delete all tasks that belonged to this group
  const tasksQ = query(
    collection(db, 'tasks'),
    where('groupId', '==', groupId)
  );
  const snapshot = await getDocs(tasksQ);
  snapshot.docs.forEach((d) => deleteDoc(d.ref));
};

// ============================================================
// TASK TYPES
// ============================================================

export const getTaskTypesByUser = async (userId: string): Promise<TaskType[]> => {
  const q = query(
    collection(db, 'taskTypes'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as TaskType[];
  return docs.sort((a, b) => a.order - b.order);
};

export const createTaskType = async (
  userId: string,
  name: string
): Promise<TaskType> => {
  const types = await getTaskTypesByUser(userId);
  const maxOrder = types.length > 0 ? Math.max(...types.map((t) => t.order)) : -1;
  const color = getRandomColor();
  const docRef = doc(collection(db, 'taskTypes'));
  
  const typeData = {
    userId,
    name,
    order: maxOrder + 1,
    color,
    createdAt: Timestamp.now(),
  };

  setDoc(docRef, typeData).catch((err) => console.error('Error creating task type:', err));

  return { id: docRef.id, ...typeData } as TaskType;
};

export const updateTaskType = async (
  typeId: string,
  data: Partial<TaskType>
): Promise<void> => {
  await updateDoc(doc(db, 'taskTypes', typeId), data);
};

export const updateTaskTypeOrder = async (
  types: TaskType[]
): Promise<void> => {
  const batch = writeBatch(db);
  types.forEach((type, index) => {
    const docRef = doc(db, 'taskTypes', type.id);
    batch.update(docRef, { order: index });
  });
  await batch.commit();
};

export const deleteTaskType = async (typeId: string): Promise<void> => {
  await deleteDoc(doc(db, 'taskTypes', typeId));
  // Orphan the tasks (set typeId to null) instead of deleting them
  const q = query(collection(db, 'tasks'), where('typeId', '==', typeId));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((d) => batch.update(d.ref, { typeId: null }));
  await batch.commit();
};

// ============================================================
// TASKS
// ============================================================

export const getTasksByUser = async (userId: string): Promise<Task[]> => {
  // No orderBy — sort client-side by createdAt descending
  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Task[];
  // Newest first
  return docs.sort((a, b) => {
    const aMs = a.createdAt?.toMillis?.() ?? 0;
    const bMs = b.createdAt?.toMillis?.() ?? 0;
    return bMs - aMs;
  });
};

export const createTask = async (
  userId: string,
  title: string,
  priorityId: string,
  groupId: string,
  typeId: string | null = null,
  dueDate: string | null = null,
  sendEmailReminder: boolean | null = null,
  addToCalendar: boolean | null = null,
  description: string | null = null,
  links: string[] = [],
  checklistItems: any[] = [],
): Promise<Task> => {
  const docRef = doc(collection(db, 'tasks'));
  
  const taskData = {
    userId,
    title,
    priorityId,
    groupId,
    typeId,
    dueDate,
    completed: false,
    completedAt: null,
    createdAt: Timestamp.now(),
    description,
    links,
    checklistItems,
    sendEmailReminder,
    addToCalendar,
    calendarEventId: null,
    emailReminderSent: false,
  };

  setDoc(docRef, taskData).catch((err) => console.error('Error in optimistic creation:', err));

  return {
    id: docRef.id,
    ...taskData,
  } as Task;
};

export const updateTask = async (
  taskId: string,
  data: Partial<Task>
): Promise<void> => {
  await updateDoc(doc(db, 'tasks', taskId), data);
};

export const toggleTaskCompletion = async (
  taskId: string,
  completed: boolean
): Promise<void> => {
  await updateDoc(doc(db, 'tasks', taskId), {
    completed: !completed,
    completedAt: completed ? null : Timestamp.now(),
  });
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await deleteDoc(doc(db, 'tasks', taskId));
};
