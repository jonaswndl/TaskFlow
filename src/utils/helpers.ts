import type { DeadlineStatus } from '../types';

export const getDeadlineStatus = (endDate: string): DeadlineStatus => {
  if (!endDate) return 'none';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(endDate);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'red'; // Überfällig
  if (diffDays === 0) return 'red'; // Heute
  if (diffDays <= 3) return 'yellow'; // 1-3 Tage
  return 'green'; // > 3 Tage
};

export const getDeadlineColor = (status: DeadlineStatus): string => {
  switch (status) {
    case 'red':
      return 'bg-red-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'green':
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
