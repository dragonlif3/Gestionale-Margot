import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <Container className="text-center mt-5 container-not-found">
      <Row>
        <Col>
          <h1 className="display-1">404</h1>
          <h2>Pagina non trovata</h2>
          <p className="lead">La pagina che stai cercando non esiste.</p>
          <Button as={Link} to="/" variant="warning">
            Torna alla Home
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default NotFound;