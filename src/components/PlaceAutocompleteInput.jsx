import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Plus } from 'lucide-react';
import { searchPlaces } from '../utils/mappls';

export default function PlaceAutocompleteInput({
  value = '',
  onChange,
  onSelectLocation,
  placeholder = 'Search places or enter any location…',
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
    if (!val || val.trim().length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(val);
      
      // Always include a custom location option so ANY small place/shop/hotel can be added instantly
      const customOption = {
        isCustom: true,
        placeName: val.trim(),
        placeAddress: 'Custom Location (pin manually on map or save to itinerary)',
        latitude: null,
        longitude: null,
      };

      const finalSuggestions = [customOption, ...results.slice(0, 6)];
      setSuggestions(finalSuggestions);
      setShowDropdown(true);
      setIsSearching(false);
    }, 200);
  }

  function handleSelect(s) {
    const name = s.placeName || value;
    const address = s.placeAddress || '';
    const lat = s.latitude ? parseFloat(s.latitude) : null;
    const lng = s.longitude ? parseFloat(s.longitude) : null;

    if (onChange) onChange(name);
    if (onSelectLocation) onSelectLocation({ name, address, lat, lng, isCustom: !!s.isCustom, raw: s });

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
          onFocus={() => (suggestions.length > 0 || value.trim().length > 0) && setShowDropdown(true)}
          placeholder={placeholder}
          autoComplete="off"
        />
        {isSearching && (
          <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: 'var(--em)', borderColor: 'var(--g200)' }} />
          </div>
        )}
      </div>

      {/* Suggestion Dropdown matching Google/Mappls Native UI */}
      {showDropdown && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          background: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 14px 40px rgba(0, 0, 0, 0.22), 0 2px 10px rgba(0, 0, 0, 0.12)',
          border: '1px solid #CBD5E1',
          zIndex: 999999,
          overflow: 'hidden',
          padding: '6px 0',
          maxHeight: '280px',
          overflowY: 'auto',
        }}>
          {suggestions.map((s, idx) => {
            const title = s.placeName;
            const subtitle = s.placeAddress;

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
                  background: s.isCustom ? '#F0FDF4' : '#FFFFFF',
                  transition: 'background 120ms ease',
                }}
                onMouseEnter={e => e.currentTarget.style.background = s.isCustom ? '#DCFCE7' : '#F8FAFC'}
                onMouseLeave={e => e.currentTarget.style.background = s.isCustom ? '#F0FDF4' : '#FFFFFF'}
              >
                {/* Icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: s.isCustom ? '#10B981' : '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: s.isCustom ? '#FFFFFF' : '#10B981',
                }}>
                  {s.isCustom ? <Plus size={16} strokeWidth={2.5} /> : <MapPin size={16} strokeWidth={2} />}
                </div>

                {/* Text Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', color: '#0F172A', lineHeight: '1.3', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.isCustom ? <span>Use "<strong>{title}</strong>"</span> : renderHighlightedName(title, value)}
                  </div>
                  {subtitle && (
                    <div style={{ fontSize: '12px', color: s.isCustom ? '#047857' : '#64748B', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
