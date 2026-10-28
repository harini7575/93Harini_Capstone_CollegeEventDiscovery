export default function RegistrationModal({ event, onClose, onRegistrationSuccess }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    if (!name.trim() || !email.trim()) {
      setErrorMessage('Please fill in all input fields completely.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: event.id,
          student_name: name.trim(),
          student_email: email.trim().toLowerCase()
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Successfully registered for ${event.title}!`);
        if (onRegistrationSuccess) onRegistrationSuccess();
        onClose();
      } else {
        setErrorMessage(data.error || 'Server rejected registration parameters.');
      }
    } catch (err) {
      setErrorMessage('Network connection failure. Verify server configuration is live.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return React.createElement(
    'div',
    { style: { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 } },
    React.createElement(
      'div',
      { style: { background: '#fff', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '450px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' } },
      React.createElement('h3', { style: { margin: '0 0 0.5rem 0', color: '#1e1e24' } }, `Register for ${event.title}`),
      React.createElement('p', { style: { color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' } }, `📍 Location: ${event.venue || 'Campus'} | ⏰ Time: ${event.time}`),
      
      errorMessage && React.createElement('p', { style: { color: '#dc3545', background: '#ffeef0', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem' } }, errorMessage),
      
      React.createElement(
        'form',
        { onSubmit: handleFormSubmit },
        React.createElement('label', { style: { display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', color: '#333' } }, 'Full Name:'),
        React.createElement('input', {
          type: 'text',
          required: true,
          disabled: isSubmitting,
          placeholder: 'Enter full name',
          value: name,
          onChange: (e) => setName(e.target.value),
          style: { width: '100%', padding: '0.6rem', marginBottom: '1rem', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }
        }),
        
        React.createElement('label', { style: { display: 'block', fontWeight: 'bold', marginBottom: '0.4rem', color: '#333' } }, 'College Email Address:'),
        React.createElement('input', {
          type: 'email',
          required: true,
          disabled: isSubmitting,
          placeholder: 'student@college.edu',
          value: email,
          onChange: (e) => setEmail(e.target.value),
          style: { width: '100%', padding: '0.6rem', marginBottom: '1.5rem', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box' }
        }),
        
        React.createElement(
          'div',
          { style: { display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' } },
          React.createElement('button', {
            type: 'button',
            disabled: isSubmitting,
            onClick: onClose,
            style: { padding: '0.6rem 1.2rem', background: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            disabled: isSubmitting,
            style: { padding: '0.6rem 1.2rem', background: isSubmitting ? '#a0c4ff' : '#007bff', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }
          }, isSubmitting ? 'Processing...' : 'Confirm Registration')
        )
      )
    )
  );
}
