import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Tag } from '../types';
import { TAG_COLORS } from '../utils/tagColors';

interface FilterBarProps {
  globalTags: Record<string, Tag>;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  globalTags,
  selectedTags,
  onTagsChange,
}) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.trim()) {
      const availableTags = Object.keys(globalTags).filter(
        (label) => !selectedTags.includes(label) && label.toLowerCase().includes(input.toLowerCase())
      );
      setSuggestions(availableTags);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [input, globalTags, selectedTags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // Handle comma-separated input
    if (value.includes(',')) {
      const tags = value.split(',').map((t) => t.trim()).filter((t) => t);
      const newTags = [...selectedTags];
      
      tags.forEach((tag) => {
        if (globalTags[tag] && !newTags.includes(tag)) {
          newTags.push(tag);
        }
      });
      
      onTagsChange(newTags);
      setInput('');
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const trimmedInput = input.trim();
      
      if (globalTags[trimmedInput] && !selectedTags.includes(trimmedInput)) {
        onTagsChange([...selectedTags, trimmedInput]);
      }
      
      setInput('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (label: string) => {
    if (!selectedTags.includes(label)) {
      onTagsChange([...selectedTags, label]);
    }
    setInput('');
    setShowSuggestions(false);
  };

  const handleRemoveTag = (label: string) => {
    onTagsChange(selectedTags.filter((t) => t !== label));
  };

  return (
    <div className="bg-gradient-to-b from-white to-gray-50/50 border-b border-gray-100 px-6 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => input && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full border-0 bg-gray-50/80 rounded-full px-4 py-2 text-sm focus:ring-1 focus:ring-gray-200 focus:bg-white transition-all placeholder-gray-400"
            placeholder="🔍 Nach Tags filtern..."
          />

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-xl z-10 max-h-48 overflow-y-auto">
              {suggestions.map((label) => {
                const tag = globalTags[label];
                const colors = TAG_COLORS[tag.color];
                return (
                  <div
                    key={label}
                    onClick={() => handleSuggestionClick(label)}
                    className="px-4 py-2.5 hover:bg-gray-50/80 cursor-pointer flex items-center transition-colors first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                      {tag.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedTags.map((label) => {
              const tag = globalTags[label];
              if (!tag) return null;
              
              const colors = TAG_COLORS[tag.color];
              return (
                <span
                  key={label}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} flex items-center gap-1.5 transition-all hover:opacity-80`}
                >
                  {tag.label}
                  <button
                    onClick={() => handleRemoveTag(label)}
                    className="hover:scale-110 transition-transform"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
