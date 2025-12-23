export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  columnId: string;
  tags: string[]; // Now just labels, not full Tag objects
}

export interface Tag {
  label: string;
  color: TagColor;
}

export type TagColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'pink';

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface Board {
  id: string;
  title: string;
  columns: Column[];
  tasks: Record<string, Task>;
  globalTags: Record<string, Tag>; // Global tag registry: label -> Tag
}

export type DeadlineStatus = 'green' | 'yellow' | 'red' | 'none';
