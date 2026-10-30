
import React from "react";

export default function Navbar({ searchTerm, setSearchTerm }) {
  return React.createElement(
    'nav',
    {
      style: {
        padding: '1rem',
        background: '#1e1e24',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }
    },
    React.createElement('h2', null, 'Campus Events Hub 🎓'),
    React.createElement('input', {
      type: 'text',
      placeholder: 'Search events...',
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      style: {
        padding: '0.5rem',
        borderRadius: '4px',
        border: '1px solid #ccc',
        width: '250px'
      }
    })
  );
}

