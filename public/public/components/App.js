import Navbar from './Navbar.js';
import EventCard from './EventCard.js';

export default function App() {
  const [events, setEvents] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // State variables for form updates
  const [editingEventId, setEditingEventId] = React.useState(null);
  const [formTitle, setFormTitle] = React.useState('');
  const [formCategory, setFormCategory] = React.useState('');
  const [formDate, setFormDate] = React.useState('');

  // Fetch helper loop
  const fetchAllEvents = () => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error('Error fetching data rows:', err));
  };

  React.useEffect(() => {
    fetchAllEvents();
  }, []);

  // DELETE ENTITY OPERATION
  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campus event listing?")) return;

    try {
      const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (response.ok) {
        alert("Event deleted successfully from storage.");
        fetchAllEvents(); // Reload layout
      } else {
        alert("Failed to delete event entity context.");
      }
    } catch (err) {
      console.error("Delete operation connectivity error:", err);
    }
  };

  // Populate form fields to trigger UPDATE mode
  const startEditEvent = (event) => {
    setEditingEventId(event.id);
    setFormTitle(event.title);
    setFormCategory(event.category);
    setFormDate(event.date);
  };

  // PUT ENTITY UPDATE OPERATION
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/events/${editingEventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          category: formCategory,
          date: formDate
        })
      });

      if (response.ok) {
        alert("Event entity context modified successfully.");
        setEditingEventId(null); // Clear editing mode state
        fetchAllEvents(); // Synchronize listing interface
      } else {
        alert("Failed to save event parameters.");
      }
    } catch (err) {
      console.error("Update operation connectivity error:", err);
    }
  };

  const filteredEvents = events.filter((event) =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return React.createElement(
    'div',
    { style: { background: '#f4f6f9', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '3rem' } },
    React.createElement(Navbar, { searchTerm, setSearchTerm }),
    
    React.createElement(
      'div',
      { style: { maxWidth: '800px', margin: '2rem auto', padding: '1rem', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' } },
      
      // Dynamic rendering header condition: Show update form or standard greeting
      editingEventId 
        ? React.createElement('div', null,
            React.createElement('h3', { style: { color: '#007bff' } }, '✏️ Edit Event Management Console'),
            React.createElement('form', { onSubmit: handleUpdateSubmit, style: { display: 'flex', flexDirection: 'column', gap: '0.8rem' } },
              React.createElement('input', { type: 'text', required: true, value: formTitle, onChange: (e) => setFormTitle(e.target.value), placeholder: 'Event Title', style: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' } }),
              React.createElement('input', { type: 'text', required: true, value: formCategory, onChange: (e) => setFormCategory(e.target.value), placeholder: 'Category', style: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' } }),
              React.createElement('input', { type: 'date', required: true, value: formDate, onChange: (e) => setFormDate(e.target.value), style: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' } }),
              React.createElement('div', { style: { display: 'flex', gap: '0.5rem' } },
                React.createElement('button', { type: 'submit', style: { padding: '0.5rem 1rem', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' } }, 'Save Updates'),
                React.createElement('button', { type: 'button', onClick: () => setEditingEventId(null), style: { padding: '0.5rem 1rem', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' } }, 'Cancel')
              )
            )
          )
        : React.createElement('p', { style: { textAlign: 'center', color: '#666', fontStyle: 'italic' } }, '💡 Click Edit or Delete on any campus event card to manage global directory data items.')
    ),

    React.createElement(
      'div',
      { style: { maxWidth: '800px', margin: '0 auto', padding: '0 1rem' } },
      React.createElement('h2', { style: { textAlign: 'center', color: '#333' } }, 'Available Campus Events Directory'),
      filteredEvents.length === 0
        ? React.createElement('p', { style: { textAlign: 'center' } }, 'No matching records found.')
        : filteredEvents.map((event) =>
            React.createElement('div', { key: event.id, style: { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', padding: '1rem', margin: '1rem 0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' } },
              React.createElement(EventCard, { event: event, onRegisterClick: (e) => alert(`Initiating registration lookup parameters for: ${e.title}`) }),
              
              // Administration management action buttons layout panel block
              React.createElement('div', { style: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingLeft: '1rem' } },
                React.createElement('button', {
                  onClick: () => startEditEvent(event),
                  style: { padding: '0.4rem 0.8rem', background: '#ffc107', color: '#212529', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }
                }, '✏️ Edit Entity Parameters'),
                React.createElement('button', {
                  onClick: () => handleDeleteEvent(event.id),
                  style: { padding: '0.4rem 0.8rem', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }
                }, '🗑️ Delete Entity Context')
              )
            )
          )
    )
  );
}
