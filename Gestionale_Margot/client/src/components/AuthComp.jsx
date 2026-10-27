import React, { useActionState } from 'react';
import { Form, Button, Row, Col, Container, Nav, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function LoginForm(props) {
  // useActionState gestisce automaticamente il pending e il risultato della funzione
  const [state, formAction, isPending] = useActionState(loginFunction, { error: null });
  
  async function loginFunction(prevState, formData) {
    const credentials = {
      username: formData.get('username'),
      password: formData.get('password'),
    };

    try {
      // Chiama la funzione passata come prop da App.jsx (che farà la vera fetch al backend)
      await props.handleLogin(credentials);
      return { success: true };
    } catch (error) {
        if (error.status === 429) {
          return { error: 'Troppi tentativi di accesso. Riprova tra qualche minuto.' };
        }
        return { error: 'Login fallito. Controlla le tue credenziali.' };
      }
  }

  return (
    <Container className="login-container screen mb-4 p-4">
      <Row className="justify-content-center">
        <Col md={6}>
          <h1 className="text-center mb-4 text-warning">
            <i className="bi bi-person-circle"></i> Login
          </h1>
          
          <div className="mb-4 p-4 border rounded shadow-sm bg-light">
            {isPending && <Alert variant="warning">Attendi la risposta dal server...</Alert>}
            {state?.error && <Alert variant="danger">{state.error}</Alert>}

            <Form action={formAction}>
              <Form.Group controlId="username" className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control 
                  name="username" 
                  type="text" 
                  required 
                  minLength={2}
                  placeholder="Inserisci username" 
                />
              </Form.Group>
              
              <Form.Group controlId="password" className="mb-4">
                <Form.Label>Password</Form.Label>
                <Form.Control 
                  name="password" 
                  type="password" 
                  required 
                  minLength={6}
                  placeholder="Inserisci password" 
                />
              </Form.Group>
              
              <div className="d-flex justify-content-between">
                <Button 
                  variant="warning" 
                  type="submit" 
                  disabled={isPending}
                  className="px-4"
                > 
                  {isPending ? 'Accesso...' : 'Login'}
                </Button>
                
                <Link className="btn btn-secondary px-4" to={'/'}>
                  Annulla
                </Link>
              </div>
            </Form>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

function LogoutButton(props) {
  return (
    <Nav.Link as={Link} onClick={props.logout} className="navbar-link text-danger fw-bold" to="/">
      <i className="bi bi-box-arrow-right me-1"></i> Logout
    </Nav.Link>
  );
}

export { LoginForm, LogoutButton };