import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import { useDebounce } from '@/lib/hooks';
import type { Tag } from '@/db/types';

interface TagInputProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

export function TagInput({ selectedTags, onTagsChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce the input value
  const debouncedInputValue = useDebounce(inputValue, 300);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for tags when debounced value changes
  useEffect(() => {
    if (!debouncedInputValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Remove # prefix if present for search
    const searchTerm = debouncedInputValue.startsWith('#')
      ? debouncedInputValue.slice(1)
      : debouncedInputValue;

    if (!searchTerm.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    async function searchTags() {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/tags/search?q=${encodeURIComponent(searchTerm)}`,
        );
        if (!response.ok) {
          throw new Error('Failed to search tags');
        }
        const result = await response.json();
        if (result.success) {
          // Filter out already selected tags
          const filteredTags = result.tags.filter(
            (tag: Tag) => !selectedTags.some((t) => t.id === tag.id),
          );
          setSuggestions(filteredTags);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error searching tags:', error);
      } finally {
        setIsLoading(false);
      }
    }

    searchTags();
  }, [debouncedInputValue, selectedTags]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const tagName = inputValue.startsWith('#')
        ? inputValue.slice(1).trim()
        : inputValue.trim();

      if (!tagName) return;

      // Check if tag already exists in suggestions
      const existingTag = suggestions.find(
        (tag) => tag.name.toLowerCase() === tagName.toLowerCase(),
      );

      if (existingTag) {
        // Add existing tag
        onTagsChange([...selectedTags, existingTag]);
      } else {
        // Create new tag (it will be created on backend when quiz is submitted)
        const newTag: Tag = {
          id: `temp-${Date.now()}`, // Temporary ID
          name: tagName,
          createdAt: new Date(),
        };
        onTagsChange([...selectedTags, newTag]);
      }

      setInputValue('');
      setSuggestions([]);
      setShowSuggestions(false);
    } else if (
      e.key === 'Backspace' &&
      !inputValue &&
      selectedTags.length > 0
    ) {
      // Remove last tag when backspace is pressed on empty input
      onTagsChange(selectedTags.slice(0, -1));
    }
  };

  const handleSuggestionClick = (tag: Tag) => {
    onTagsChange([...selectedTags, tag]);
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((tag) => tag.id !== tagId));
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex flex-wrap gap-2 p-3 rounded-md border min-h-[42px]"
        style={{
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border)',
        }}
        onClick={() => inputRef.current?.focus()}
      >
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="default"
            render={
              <span className="inline-flex items-center gap-1">
                #{tag.name}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 hover:opacity-70"
                  aria-label={`Remove ${tag.name} tag`}
                >
                  ×
                </button>
              </span>
            }
          />
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.trim() && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={
            selectedTags.length === 0 ? 'Add tags (e.g., #javascript)' : ''
          }
          className="flex-1 min-w-[120px] outline-none bg-transparent"
          style={{ color: 'var(--color-foreground)' }}
        />
      </div>

      {showSuggestions && (inputValue.trim() || isLoading) && (
        <div
          className="absolute z-10 w-full mt-1 rounded-md border shadow-lg max-h-60 overflow-y-auto"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          {isLoading ? (
            <div
              className="px-4 py-2 text-sm"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleSuggestionClick(tag)}
                  className="w-full text-left px-4 py-2 hover:bg-opacity-50 transition-colors"
                  style={{
                    color: 'var(--color-foreground)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      'var(--color-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  #{tag.name}
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-2">
              <div
                className="text-sm"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                No matching tags found
              </div>
              <div
                className="text-sm mt-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                Press{' '}
                <kbd className="px-1 py-0.5 text-xs border rounded">Enter</kbd>{' '}
                to create "
                {inputValue.startsWith('#')
                  ? inputValue.slice(1).trim()
                  : inputValue.trim()}
                "
              </div>
            </div>
          )}
        </div>
      )}

      <p
        className="mt-1 text-sm"
        style={{ color: 'var(--color-muted-foreground)' }}
      >
        Type tags starting with # and press Enter to add. Existing tags will be
        suggested.
      </p>
    </div>
  );
}
