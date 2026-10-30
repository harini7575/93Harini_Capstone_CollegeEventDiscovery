
import React from "react";

export default function EventCard({ event, onRegisterClick }) {
  return React.createElement(
    'div',
    {
      style: {
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1rem',
        margin: '1rem 0',
        background: '#fff',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
      }
    },
    React.createElement('h3', null, event.title || 'Untitled Event'),
    React.createElement(
      'p',
      { style: { color: '#666', fontSize: '0.9rem' } },
      `📅 ${event.date} | 📍 ${event.location}`
    ),
    React.createElement('p', null, event.description),
    React.createElement(
      'button',
      {
        onClick: () => onRegisterClick(event),
        style: {
          background: '#007bff',
          color: '#fff',
          border: 'none',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      },
      'Register Now'
    )
  );
}
