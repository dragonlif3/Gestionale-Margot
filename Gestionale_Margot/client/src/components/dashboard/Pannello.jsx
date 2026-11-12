import { Link } from 'react-router-dom';

// Un riquadro bianco con titolo, un elenco di righe (o un messaggio se è vuoto) e un link in fondo.
function Pannello({ titolo, vuoto, link, children, haRighe }) {
  return (
    <section className="dash-pannello">
      <h3 className="dash-pannello-titolo">{titolo}</h3>
      {haRighe ? <ul className="dash-lista">{children}</ul> : <p className="dash-vuoto">{vuoto}</p>}
      {link && (
        <div className="dash-pannello-piede">
          <Link to={link.to}>{link.testo}</Link>
        </div>
      )}
    </section>
  );
}

export default Pannello;
