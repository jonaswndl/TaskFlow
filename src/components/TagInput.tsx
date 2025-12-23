import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';
import type { Tag, TagColor } from '../types';
import { TAG_COLORS, TAG_COLOR_SWATCHES } from '../utils/tagColors';

interface TagInputProps {
  tagLabels: string[]; // Just labels for this task
  globalTags: Record<string, Tag>; // All global tags
  onTagsChange: (labels: string[]) => void;
  onGlobalTagUpdate: (label: string, tag: Tag) => void;
}

export const TagInput: React.FC<TagInputProps> = ({ 
  tagLabels, 
  globalTags, 
  onTagsChange,
  onGlobalTagUpdate,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editingTagLabel, setEditingTagLabel] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get existing tag labels for suggestions
  const existingLabels = Object.keys(globalTags);
  const suggestions = existingLabels
    .filter((label) => label.toLowerCase().includes(inputValue.toLowerCase()) && inputValue.trim())
    .filter((label) => !tagLabels.includes(label)) // Don't suggest already added tags
    .slice(0, 5);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(value.trim().length > 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Escape') {
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const addTag = (label?: string) => {
    const tagLabel = (label || inputValue).trim().replace(/,$/, '');
    if (!tagLabel) return;

    // Check if tag already exists in this task
    if (tagLabels.includes(tagLabel)) {
      setInputValue('');
      setShowSuggestions(false);
      return;
    }

    // Add to global tags if it doesn't exist
    if (!globalTags[tagLabel]) {
      onGlobalTagUpdate(tagLabel, {
        label: tagLabel,
        color: 'blue',
      });
    }

    // Add label to task
    onTagsChange([...tagLabels, tagLabel]);
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (label: string) => {
    onTagsChange(tagLabels.filter((l) => l !== label));
    if (editingTagLabel === label) {
      setEditingTagLabel(null);
    }
  };

  const updateTagColor = (label: string, color: TagColor) => {
    const tag = globalTags[label];
    if (tag) {
      onGlobalTagUpdate(label, { ...tag, color });
    }
    setEditingTagLabel(null);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">🏷️ Tags</label>

      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(inputValue.trim().length > 0)}
          placeholder="Tag eingeben (mit Komma bestätigen)..."
          className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition-colors"
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowSuggestions(false)} />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-20 max-h-48 overflow-y-auto">
              {suggestions.map((label) => {
                const tag = globalTags[label];
                const colors = tag ? TAG_COLORS[tag.color] : TAG_COLORS.blue;
                return (
                  <button
                    key={label}
                    onClick={() => addTag(label)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center"
                  >
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}
                    >
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Tags List */}
      <div className="flex flex-wrap gap-2 mt-3">
        {tagLabels.map((label) => {
          const tag = globalTags[label];
          if (!tag) return null; // Skip if tag doesn't exist in global registry
          
          const colors = TAG_COLORS[tag.color];
          const isEditing = editingTagLabel === label;

          return (
            <div key={label} className="relative">
              <button
                onClick={() => setEditingTagLabel(isEditing ? null : label)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 ${colors.bg} ${colors.text} ${colors.border} hover:shadow-md`}
              >
                {tag.label}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTag(label);
                  }}
                  className="hover:bg-black/10 rounded p-0.5 transition-colors"
                >
                  <X size={12} />
                </button>
              </button>

              {/* Color Picker */}
              {isEditing && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setEditingTagLabel(null)}
                  />
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 p-2 z-30 flex gap-2">
                    {TAG_COLOR_SWATCHES.map(({ color, preview }) => (
                      <button
                        key={color}
                        onClick={() => updateTagColor(label, color)}
                        className={`w-6 h-6 rounded-lg ${preview} hover:scale-110 transition-transform ${
                          tag.color === color ? 'ring-2 ring-gray-800 ring-offset-2' : ''
                        }`}
                        title={color}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
