import type { TaskPriority } from "./api";
import { addDaysISO, todayISO, toISODate } from "./dates";

export interface ParsedQuickAdd {
  title: string;
  due_date: string | null;
  priority: TaskPriority;
  /** True when the parser recognised at least one metadata token. */
  matched: boolean;
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
  الأحد: 0,
  الاثنين: 1,
  الإثنين: 1,
  الثلاثاء: 2,
  الأربعاء: 3,
  الخميس: 4,
  الجمعة: 5,
  السبت: 6,
};

const PRIORITY_WORDS: Array<[RegExp, TaskPriority]> = [
  [/(^|\s)!(high|h|1)(?=\s|$)/gi, "high"],
  [/(^|\s)!(medium|m|2)(?=\s|$)/gi, "medium"],
  [/(^|\s)!(low|l|3)(?=\s|$)/gi, "low"],
  [/(^|\s)!(عالية|عالي)(?=\s|$)/g, "high"],
  [/(^|\s)!(متوسطة|متوسط)(?=\s|$)/g, "medium"],
  [/(^|\s)!(منخفضة|منخفض)(?=\s|$)/g, "low"],
];

function nextWeekday(target: number): string {
  const now = new Date();
  let delta = (target - now.getDay() + 7) % 7;
  if (delta === 0) delta = 7;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + delta);
  return toISODate(d);
}

function stripPattern(text: string, pattern: RegExp): { text: string; matched: boolean } {
  if (!pattern.test(text)) return { text, matched: false };
  return { text: text.replace(pattern, " "), matched: true };
}

/**
 * Lightweight Todoist-style natural language parsing (EN + AR).
 *
 * Examples:
 *   "Pay electricity bill tomorrow !high"
 *   "Review PR next monday"
 *   "اتصل بالعميل غدا !عالية"
 *   "Plan sprint next week"
 */
export function parseQuickAdd(
  raw: string,
  opts: { defaultDue?: string | null } = {}
): ParsedQuickAdd {
  let text = raw.trim();
  let priority: TaskPriority = "medium";
  let due: string | null = null;
  let matched = false;

  for (const [pattern, value] of PRIORITY_WORDS) {
    if (pattern.test(text)) {
      priority = value;
      text = text.replace(pattern, " ");
      matched = true;
    }
    pattern.lastIndex = 0;
  }

  // "day after tomorrow" / "بعد غد" before plain tomorrow/غداً.
  let result = stripPattern(text, /\bday\s+after\s+tomorrow\b/i);
  if (result.matched) {
    due = addDaysISO(todayISO(), 2);
    text = result.text;
    matched = true;
  } else {
    result = stripPattern(text, /(^|\s)بعد\s+غد(اً|ا)?(?=\s|$)/);
    if (result.matched) {
      due = addDaysISO(todayISO(), 2);
      text = result.text;
      matched = true;
    }
  }

  if (!due) {
    result = stripPattern(text, /\bnext\s+week\b/i);
    if (result.matched) {
      due = addDaysISO(todayISO(), 7);
      text = result.text;
      matched = true;
    } else {
      result = stripPattern(text, /(^|\s)الأسبوع\s+(القادم|المقبل)(?=\s|$)/);
      if (result.matched) {
        due = addDaysISO(todayISO(), 7);
        text = result.text;
        matched = true;
      }
    }
  }

  if (!due) {
    const nextMatch = text.match(/\bnext\s+([a-z]+)\b/i);
    if (nextMatch) {
      const target = WEEKDAYS[nextMatch[1].toLowerCase()];
      if (target !== undefined) {
        due = nextWeekday(target);
        text = text.replace(/\bnext\s+[a-z]+\b/i, " ");
        matched = true;
      }
    }
  }

  if (!due) {
    const arabicNext = text.match(/(^|\s)(الأحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الخميس|الجمعة|السبت)(?=\s|$)/);
    if (arabicNext) {
      const target = WEEKDAYS[arabicNext[2]];
      if (target !== undefined) {
        due = nextWeekday(target);
        text = text.replace(arabicNext[2], " ").replace(/\s+/g, " ");
        matched = true;
      }
    }
  }

  if (!due) {
    const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (iso) {
      due = iso[0];
      text = text.replace(iso[0], " ");
      matched = true;
    }
  }

  if (!due) {
    result = stripPattern(text, /\btomorrow\b/i);
    if (result.matched) {
      due = addDaysISO(todayISO(), 1);
      text = result.text;
      matched = true;
    } else {
      result = stripPattern(text, /(^|\s)غد(اً|ا)?(?=\s|$)/);
      if (result.matched) {
        due = addDaysISO(todayISO(), 1);
        text = result.text;
        matched = true;
      }
    }
  }

  if (!due) {
    result = stripPattern(text, /\btoday\b/i);
    if (result.matched) {
      due = todayISO();
      text = result.text;
      matched = true;
    } else {
      result = stripPattern(text, /(^|\s)اليوم(?=\s|$)/);
      if (result.matched) {
        due = todayISO();
        text = result.text;
        matched = true;
      }
    }
  }

  const title = text.replace(/\s+/g, " ").trim();
  return {
    title,
    due_date: due ?? opts.defaultDue ?? null,
    priority,
    matched: matched || !!opts.defaultDue,
  };
}
