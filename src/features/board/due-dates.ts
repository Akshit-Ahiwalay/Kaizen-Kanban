export type DueDateState = "none" | "overdue" | "today" | "soon";

const SOON_THRESHOLD_DAYS = 3;

const toLocalDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getDayDiff = (targetDate: Date, referenceDate: Date) => {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round(
    (startOfDay(targetDate).getTime() - startOfDay(referenceDate).getTime()) /
      millisecondsPerDay,
  );
};

export const formatDueDate = (dueDate?: string) => {
  if (!dueDate) {
    return undefined;
  }

  const parsedDate = toLocalDate(dueDate);

  if (!parsedDate) {
    return undefined;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsedDate);
};

export const getDueDateState = (
  dueDateValue?: string,
  now: Date = new Date(),
): DueDateState => {
  if (!dueDateValue) {
    return "none";
  }

  const parsedDate = toLocalDate(dueDateValue);

  if (!parsedDate) {
    return "none";
  }

  const dayDiff = getDayDiff(parsedDate, now);

  if (dayDiff < 0) {
    return "overdue";
  }

  if (dayDiff === 0) {
    return "today";
  }

  if (dayDiff <= SOON_THRESHOLD_DAYS) {
    return "soon";
  }

  return "none";
};
