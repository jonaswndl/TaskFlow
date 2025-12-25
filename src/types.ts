export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  columnId: string;
  tags: string[]; // Now just labels, not full Tag objects
  priority?: 'Hoch' | 'Mittel' | 'Gering';
  activityLog: ActivityLogEntry[];
  assignedMembers?: string[]; // Array of TeamMember IDs
}

export interface ActivityLogEntry {
  id: string;
  timestamp: string; // ISO string
  action: 'created' | 'title_changed' | 'description_changed' | 'dates_changed' | 'column_changed' | 'tags_changed' | 'priority_changed';
  oldValue?: string | string[];
  newValue?: string | string[];
  details?: string; // Human readable description
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
  teamIds?: string[]; // IDs of teams assigned to this board
}

export interface BoardMetadata {
  id: string;
  title: string;
  createdAt: string;
  lastModified: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
}

export interface Team {
  id: string;
  title: string;
  members: TeamMember[];
}

export interface TeamMetadata {
  id: string;
  title: string;
  createdAt: string;
  lastModified: string;
}

export type DeadlineStatus = 'green' | 'yellow' | 'red' | 'none';

export interface ListViewState {
  boardId: string;
  expandedColumns: string[]; // IDs of expanded columns
}
