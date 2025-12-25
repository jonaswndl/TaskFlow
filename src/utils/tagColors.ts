import type { TagColor } from '../types';

export const TAG_COLORS: Record<TagColor, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
};

export const TAG_COLOR_SWATCHES: { color: TagColor; preview: string }[] = [
  { color: 'blue', preview: 'bg-blue-500' },
  { color: 'green', preview: 'bg-green-500' },
  { color: 'yellow', preview: 'bg-yellow-500' },
  { color: 'red', preview: 'bg-red-500' },
  { color: 'purple', preview: 'bg-purple-500' },
  { color: 'pink', preview: 'bg-pink-500' },
];

// Helper function to get solid background color for calendar view
export const getTagColor = (color: TagColor): string => {
  const colorMap: Record<TagColor, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
  };
  return colorMap[color];
};
