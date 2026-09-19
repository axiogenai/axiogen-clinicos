import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Check, X, Building2 } from 'lucide-react';
import type { VillageLocation } from '../data/maharashtraVillages';
import {
  searchMaharashtraVillages,
  POPULAR_NEARBY_CENTERS,
  MAHARASHTRA_VILLAGES,
} from '../data/maharashtraVillages';

interface VillageAutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  onSelect?: (village: VillageLocation) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  disabled?: boolean;
  error?: string | boolean;
  autoFocus?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
}

export default function VillageAutocompleteInput({
  value,
  onChange,
  onSelect,
  onKeyDown,
  placeholder = 'e.g. Vadgaon, Vita, Karad...',
  className = '',
  inputRef,
  disabled = false,
  error = false,
  autoFocus = false,
  id,
  name,
  required = false,
}: VillageAutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<VillageLocation[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Merge forwarded ref and internal ref
  const setRefs = useCallback(
    (node: HTMLInputElement | null) => {
      internalInputRef.current = node;
      if (typeof inputRef === 'function') {
        inputRef(node);
      } else if (inputRef && 'current' in inputRef) {
        (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    },
    [inputRef]
  );

  // Update suggestions whenever value changes
  useEffect(() => {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      // If empty, show popular centers for quick pick
      const popular = MAHARASHTRA_VILLAGES.filter((v) =>
        POPULAR_NEARBY_CENTERS.includes(v.name)
      ).slice(0, 12);
      setSuggestions(popular);
      setHighlightedIndex(-1);
    } else {
      const results = searchMaharashtraVillages(trimmed, 15);
      setSuggestions(results);
      setHighlightedIndex(results.length > 0 ? 0 : -1);
    }
  }, [value]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listboxRef.current && highlightedIndex >= 0) {
      const activeEl = listboxRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelectVillage = (village: VillageLocation) => {
    onChange(village.name);
    if (onSelect) {
      onSelect(village);
    }
    setIsOpen(false);
    internalInputRef.current?.focus();
  };

  const handleCustomSelect = (text: string) => {
    onChange(text.trim());
    setIsOpen(false);
    internalInputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permit English, Marathi/Devanagari, spaces, hyphens, dots
    const cleanVal = e.target.value.replace(/[^a-zA-Z\u0900-\u097F\s\.\-']/g, '');
    onChange(cleanVal);
    setIsOpen(true);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        return;
      }
      if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          e.preventDefault();
          handleSelectVillage(suggestions[highlightedIndex]);
          // After selecting, optionally pass enter down to move to next input
          if (onKeyDown) {
            setTimeout(() => {
              if (internalInputRef.current) {
                const syntheticEvent = {
                  ...e,
                  key: 'Enter',
                  preventDefault: () => {},
                } as React.KeyboardEvent<HTMLInputElement>;
                onKeyDown(syntheticEvent);
              }
            }, 50);
          }
          return;
        } else if (value.trim().length > 0) {
          // Closed on enter if custom text typed
          setIsOpen(false);
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        return;
      }
      if (e.key === 'Tab') {
        // If an item is highlighted, select it on Tab
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          onChange(suggestions[highlightedIndex].name);
          if (onSelect) {
            onSelect(suggestions[highlightedIndex]);
          }
        }
        setIsOpen(false);
      }
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const getDistrictBadgeColor = (district: string) => {
    switch (district) {
      case 'Kolhapur':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Sangli':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      case 'Satara':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-stone-50 text-stone-700 border-stone-200';
    }
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const q = query.trim().toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    const before = text.substring(0, idx);
    const match = text.substring(idx, idx + q.length);
    const after = text.substring(idx + q.length);
    return (
      <>
        {before}
        <span className="font-extrabold text-[#047857] underline decoration-emerald-400 underline-offset-2">
          {match}
        </span>
        {after}
      </>
    );
  };

  const queryTrimmed = (value || '').trim();

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center">
        <MapPin className="w-4 h-4 text-[#7c766d] absolute left-3 pointer-events-none transition-colors" />
        <input
          ref={setRefs}
          type="text"
          id={id}
          name={name}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          required={required}
          autoComplete="off"
          spellCheck={false}
          className={`form-input !pl-9 !pr-8 ${
            error ? 'error' : ''
          } ${className}`}
        />
        {value && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              onChange('');
              setIsOpen(true);
              internalInputRef.current?.focus();
            }}
            className="absolute right-2.5 p-1 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
            title="Clear"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Floating Suggestions Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#cdc6ba] rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header Bar */}
          <div className="px-3 py-1.5 bg-[#faf9f6] border-b border-[#ece8df] flex items-center justify-between text-[11px] font-semibold text-[#7c766d]">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#047857]" />
              {queryTrimmed
                ? `Nearby suggestions (${suggestions.length} found)`
                : 'Popular nearby cities & talukas (Kolhapur • Sangli • Satara)'}
            </span>
            <span className="text-[10px] text-stone-400 hidden sm:inline">
              Use ↑↓ to navigate, Enter to select
            </span>
          </div>

          {/* Listbox */}
          <ul
            ref={listboxRef}
            role="listbox"
            className="max-h-64 overflow-y-auto py-1 divide-y divide-[#f4f2ee]"
          >
            {suggestions.length > 0 ? (
              suggestions.map((village, idx) => {
                const isSelected =
                  value.trim().toLowerCase() === village.name.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <li
                    key={`${village.name}-${village.district}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectVillage(village)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between transition-colors ${
                      isHighlighted
                        ? 'bg-[#f3f8f5] text-[#047857]'
                        : 'text-[#2e2a24] hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold truncate text-[#1a1c1a]">
                          {highlightMatch(village.name, queryTrimmed)}
                        </span>
                        {village.marathiName && (
                          <span className="text-xs text-stone-500 font-medium truncate">
                            ({village.marathiName})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#7c766d] mt-0.5">
                        <span>Taluka: {village.taluka}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getDistrictBadgeColor(
                          village.district
                        )}`}
                      >
                        {village.district}
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#047857] ml-1" />
                      )}
                    </div>
                  </li>
                );
              })
            ) : (
              <li className="px-4 py-3 text-xs text-stone-500 text-center">
                <p className="font-medium text-stone-700">
                  No predefined village found for "{queryTrimmed}"
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  You can keep typing any custom name. It will be saved as entered.
                </p>
                {queryTrimmed.length >= 2 && (
                  <button
                    type="button"
                    onClick={() => handleCustomSelect(queryTrimmed)}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <Check className="w-3 h-3 text-emerald-700" />
                    Use "{queryTrimmed}" as Village
                  </button>
                )}
              </li>
            )}
          </ul>

          {/* Quick Info Footer */}
          <div className="px-3 py-1 bg-[#fbfaf8] border-t border-[#ece8df] text-[10px] text-stone-400 flex items-center justify-between">
            <span>Covering Kolhapur, Sangli & Satara</span>
            <span className="italic">Type letters (e.g. "VA" for Vadgaon, Vita)</span>
          </div>
        </div>
      )}
    </div>
  );
}
