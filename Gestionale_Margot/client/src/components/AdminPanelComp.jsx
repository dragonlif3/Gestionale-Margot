import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { API_URL } from '../config';
import { RUOLI } from '../roles';

export default function AdminPanel({ show, handleClose }) {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    
    const formData = new FormData(e.target);
    const newUser = {
      username: formData.get('username'),
      password: formData.get('password'),
      ruolo: formData.get('ruolo')
    };

    try {
      const response = await fetch(`${API_URL}/api/sessions/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newUser)
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Errore di registrazione');
      
      setMessage(data.message);
      e.target.reset(); // Svuota il form dopo il successo
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>
          <i className="bi bi-person-badge me-2"></i>Registra Personale
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleRegister}>
        <Modal.Body>
          {message && <Alert variant="success">{message}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form.Group className="mb-3" controlId="formUsername">
            <Form.Label>Username</Form.Label>
            <Form.Control 
              name="username" 
              type="text" 
              required 
              placeholder="Inserisci username"
            />
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Password Provvisoria</Form.Label>
            <Form.Control 
              name="password" 
              type="password" 
              required 
              minLength={6} 
              placeholder="Minimo 6 caratteri"
            />
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="formRuolo">
            <Form.Label>Ruolo</Form.Label>
            <Form.Select name="ruolo" required defaultValue="">
              <option value="" disabled>Seleziona un ruolo...</option>
              {RUOLI.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Chiudi
          </Button>
          <Button variant="primary" type="submit">
            Crea Account
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
    )};