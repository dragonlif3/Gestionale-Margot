import { Link } from 'react-router-dom';

// Una tessera colorata con un numero grande: tocchi e vai alla pagina giusta.
//  - colore: viola | verde | sole | arancio | lilla (vedi dashboard.css)
function TileRiepilogo({ to, colore, etichetta, numero, extra }) {
  return (
    <Link to={to} className={`dash-tile dash-tile--${colore}`}>
      <span className="dash-tile-etichetta">{etichetta}</span>
      <span className="dash-tile-numero">{numero}</span>
      {extra}
    </Link>
  );
}

export default TileRiepilogo;
