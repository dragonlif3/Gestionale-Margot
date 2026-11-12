import { useState, useActionState } from 'react';
import { Form, Button, Nav, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './auth.css';

function LoginForm(props) {
  const [mostraPassword, setMostraPassword] = useState(false);

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
      // Troppi tentativi: il server blocca l'account per qualche minuto (vedi il limite al login)
      if (error.status === 429) {
        return { error: 'Troppi tentativi di accesso. Riprova tra qualche minuto.' };
      }
      return { error: 'Login fallito. Controlla le tue credenziali.' };
    }
  }

  return (
    <main className="login-pagina">
      <div className="login-card">
        <div className="login-marchio">
          <span className="login-logo" aria-hidden="true">m</span>
          <span className="login-nome">Margot</span>
        </div>
        <p className="login-sotto">Circolo Arci · Gestionale</p>

        <h1 className="login-titolo">Accedi</h1>

        {isPending && <Alert variant="warning" role="status">Attendi la risposta dal server...</Alert>}
        {state?.error && <Alert variant="danger" role="alert">{state.error}</Alert>}

        <Form action={formAction}>
          <Form.Group controlId="username" className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              name="username"
              type="text"
              required
              minLength={2}
              placeholder="Inserisci username"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </Form.Group>

          <Form.Group controlId="password" className="mb-4">
            <Form.Label>Password</Form.Label>
            <div className="login-password">
              <Form.Control
                name="password"
                type={mostraPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="Inserisci password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-occhio"
                onClick={() => setMostraPassword((v) => !v)}
                aria-pressed={mostraPassword}
                aria-label={mostraPassword ? 'Nascondi password' : 'Mostra password'}
              >
                <i className={`bi ${mostraPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </Form.Group>

          <Button variant="warning" type="submit" disabled={isPending} className="login-invia">
            {isPending ? 'Accesso...' : 'Login'}
          </Button>
          <Link className="login-annulla" to={'/'}>
            Annulla
          </Link>
        </Form>
      </div>
    </main>
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
