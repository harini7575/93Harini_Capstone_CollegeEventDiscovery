import Navbar from './Navbar.js';
import EventCard from './EventCard.js';

export default function App() {
  const [token, setToken] = React.useState(localStorage.getItem('authToken') || '');
  const [user, setUser] = React.useState(JSON.parse(localStorage.getItem('authUser')) || null);
  const [authEmail, setAuthEmail] = React.useState('');
  const [authPassword, setAuthPassword] = React.useState('');
  
  const [events, setEvents] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // State variables for form updates
  const [editingEventId, setEditingEventId] = React.useState(null);
  const [formTitle, setFormTitle] = React.useState('');
  const [formCategory, setFormCategory] = React.useState('');
  const [formDate, setFormDate] = React.useState('');
  const [formImageUrl, setFormImageUrl] = React.useState('');
  const [isUploading, setIsSubmittingFile] = React.useState(false);

  const fetchAllEvents = () => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
      })
      .catch((err) => console.error('Error fetching data rows:', err));
  };

  React.useEffect(() => {
    fetchAllEvents();
  }, []);

  // MULTI-PART FORMDATA IMAGE UPLOAD METHOD
  const handleImageFileChange = async (e) => {
    const targetFile = e.target.files[0];
    if (!targetFile) return;

    setIsSubmittingFile(true);
    const formPayload = new FormData();
    formPayload.append('event_banner', targetFile);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formPayload
      });
      const data = await response.json();
      
      if (response.ok) {
        setFormImageUrl(data.imageUrl);
        alert("Event banner image asset uploaded successfully!");
      } else {
        alert(data.error || "Failed to process image upload on disk.");
      }
    } catch (err) {
      console.error("Upload endpoint communication failure:", err);
    } finally {
      setIsSubmittingFile(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        alert("Sign-in authentication successful!");
        fetchAllEvents();
      } else {
        alert(data.error || "Authentication rejection error.");
      }
    } catch (err) {
      console.error("Login route connectivity error:", err);
    }
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setToken('');
    setUser(null);
    alert("Logged out successfully.");
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this campus event listing?")) return;

    try {
      const response = await fetch(`/api/events/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        alert("Event deleted successfully from storage.");
        fetchAllEvents();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete event entity context.");
      }
    } catch (err) {
      console.error("Delete operation connectivity error:", err);
    }
  };

  const startEditEvent = (event) => {
    setEditingEventId(event.id);
    setFormTitle(event.title);
    setFormCategory(event.category);
    setFormDate(event.date);
    setFormImageUrl(event.image_url || '');
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/events/${editingEventId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formTitle,
          category: formCategory,
          date: formDate,
          image_url: formImageUrl
        })
      });

      if (response.ok) {
        alert("Event modified successfully with image layout asset mapping!");
        setEditingEventId(null);
        fetchAllEvents();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to save event parameters.");
      }
    } catch (err) {
      console.error("Update operation connectivity error:", err);
    }
  };

  const filteredEvents = events.filter((event) =>
    event.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return React.createElement(
      'div',
      { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#e9ecef', fontFamily: 'sans-serif' } },
      React.createElement(
        'div',
        { style: { background: '#fff', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '100%', maxWidth: '360px' } },
        React.createElement('h2', { style: { textAlign: 'center', margin: '0 0 1.5rem 0', color: '#1e1e24' } }, '🎓 Coordinator Sign In'),
        React.createElement(
          'form',
          { onSubmit: handleLoginSubmit, style: { display: 'flex', flexDirection: 'column', gap: '1rem' } },
          React.createElement('input', {
            type: 'email',
            required: true,
            placeholder: 'admin@college.edu',
            value: authEmail,
            onChange: (e) => setAuthEmail(e.target.value),
            style: { padding: '0.6rem', border: '1px solid #ccc', borderRadius: '6px' }
          }),
          React.createElement('input', {
            type: 'password',
            required: true,
            placeholder: 'Password',
            value: authPassword,
            onChange: (e) => setAuthPassword(e.target.value),
            style: { padding: '0.6rem', border: '1px solid #ccc', borderRadius: '6px' }
          }),
          React.createElement('button', {
            type: 'submit',
            style: { padding: '0.7rem', background: '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
          }, 'Authenticate Account')
        )
      )
    );
  }

  return React.createElement(
    'div',
    { style: { background: '#f4f6f9', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '3rem' } },
    React.createElement(Navbar, { searchTerm, setSearchTerm }),
    
    React.createElement(
      'div',
      { style: { maxWidth: '800px', margin: '1rem auto', padding: '0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#e2e3e5', borderRadius: '6px' } },
      React.createElement('span', { style: { color: '#383d41', fontWeight: 'bold' } }, `👤 Logged in as: ${user.name} (${user.role})`),
      React.createElement('button', {
        onClick: handleLogoutClick,
        style: { padding: '0.3rem 0.7rem', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }
      }, 'Sign Out')
    ),
    
    React.createElement(
      'div',
      { style: { maxWidth: '800px', margin: '2rem auto', padding: '1rem', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' } },
      
      editingEventId 
        ? React.createElement('div', null,
            React.createElement('h3', { style: { color: '#007bff' } }, '✏️ Edit Event Management Console'),
            React.createElement('form', { onSubmit: handleUpdateSubmit, style: { display: 'flex', flexDirection: 'column', gap: '0.8rem' } },
              React.createElement('input', { type: 'text', required: true, value: formTitle, onChange: (e) => setFormTitle(e.target.value), placeholder: 'Event Title', style: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' } }),
              React.createElement('input', { type: 'text', required: true, value: formCategory, onChange: (e) => setFormCategory(e.target.value), placeholder: 'Category', style: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' } }),
              React.createElement('input', { type: 'date', required: true, value: formDate, onChange: (e) => setFormDate(e.target.value), style: { padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' } }),
              
              // NEW INTERACTIVE FORM FILE INPUT LAYOUT
              React.createElement('label', { style: { fontWeight: 'bold', fontSize: '0.9rem', marginTop: '0.2rem' } }, 'Update Event Banner Graphic:'),
              React.createElement('input', { type: 'file', accept: 'image/*', disabled: isUploading, onChange: handleImageFileChange, style: { padding: '0.2rem 0' } }),
              formImageUrl && React.createElement('p', { style: { color: 'green', fontSize: '0.85rem', margin: 0 } }, `✓ Graphic bound location: ${formImageUrl}`),

              React.createElement('div', { style: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem' } },
                React.createElement('button', { type: 'submit', disabled: isUploading, style: { padding: '0.5rem 1rem', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' } }, 'Save Updates'),
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
// Render uploaded image banner graphic context conditionally if tracking location data string points to a file path asset
event.image_url && React.createElement('img', { src: event.image_url, alt: 'Event banner', style: { width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '6px', marginBottom: '1rem' } }),
React.createElement(EventCard, { event: event, onRegisterClick: () => {} }),
user.role === 'admin' && React.createElement('div', { style: { display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingLeft: '1rem' } },
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

