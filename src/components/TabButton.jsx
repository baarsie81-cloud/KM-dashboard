import React from 'react';

export default function TabButton({ id, label, activeTab, onSelect }) {
  const isActive = activeTab === id;

  return (
    <button
      className={`tab-button ${isActive ? 'is-active' : ''}`}
      type="button"
      onClick={() => onSelect(id)}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </button>
  );
}
