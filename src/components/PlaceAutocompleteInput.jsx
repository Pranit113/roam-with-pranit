import React, { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { searchPlaces } from '../utils/mappls';

export default function PlaceAutocompleteInput({
  value = '',
  onChange,
  onSelectLocation,
  placeholder = 'Search places in India…',
  className = 'input',
  style = {},
  id,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching]   = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleInputChange(e) {
    const val = e.target.value;
    if (onChange) onChange(val);

    clearTimeout(debounceRef.current);
    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(val);
      setSuggestions(results.slice(0, 6));
      setShowDropdown(results.length > 0);
      setIsSearching(false);
    }, 250);
  }

  function handleSelect(s) {
    const name = s.placeName || s.placeAddress || value;
    const address = s.placeAddress || '';
    const lat = parseFloat(s.latitude) || null;
    const lng = parseFloat(s.longitude) || null;

    if (onChange) onChange(name);
    if (onSelectLocation) onSelectLocation({ name, address, lat, lng, raw: s });

    setSuggestions([]);
    setShowDropdown(false);
  }

  function renderHighlightedName(name, query) {
    if (!query || !name) return name;
    const idx = name.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return <span>{name}</span>;
    const before = name.substring(0, idx);
    const match  = name.substring(idx, idx + query.length);
    const after  = name.substring(idx + query.length);
    return (
      <span>
        {before}
        <strong style={{ fontWeight: 800, color: '#0F172A' }}>{match}</strong>
        {after}
      </span>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type="text"
          className={className}
          style={style}
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {isSearching && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'var(--em)', borderColor: 'var(--g200)' }} />
          </div>
        )}
      </div>

      {/* Suggestion Dropdown matching Mappls Native UI */}
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.22), 0 2px 10px rgba(0, 0, 0, 0.12)',
          border: '1px solid #CBD5E1',
          zIndex: 999999,
          overflow: 'hidden',
          padding: '6px 0',
          maxHeight: '260px',
          overflowY: 'auto',
        }}>
          {suggestions.map((s, idx) => {
            const title = s.placeName || s.placeAddress;
            const subtitle = s.placeAddress && s.placeAddress !== title ? s.placeAddress : '';

            return (
              <div
                key={idx}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: idx < suggestions.length - 1 ? '1px solid #F1F5F9' : 'none',
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
              >
                {/* Location Pin Circle */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#10B981',
                }}>
                  <MapPin size={16} strokeWidth={2} />
                </div>

                {/* Text Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', color: '#0F172A', lineHeight: '1.3', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {renderHighlightedName(title, value)}
                  </div>
                  {subtitle && (
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {subtitle}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
