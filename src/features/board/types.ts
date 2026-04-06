export interface KanbanCard {
  id: string;
  title: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  done?: boolean;
}

export interface Column {
  id: string;
  title: string;
  cards: KanbanCard[];
}
