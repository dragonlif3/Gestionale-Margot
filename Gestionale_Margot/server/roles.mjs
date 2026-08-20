/**
 * I 5 ruoli previsti per il personale di Margot.
 * Unica fonte di verità lato backend: importalo ovunque serva
 * validare o confrontare un ruolo, invece di scrivere le stringhe a mano.
 */
export const RUOLI = ['amministrazione', 'bar', 'eventi', 'grafica', 'volontari'];

export const RUOLI_LABEL = {
  amministrazione: 'Amministrazione',
  bar: 'Bar',
  eventi: 'Eventi',
  grafica: 'Grafica',
  volontari: 'Volontari'
};

export const isRuoloValido = (ruolo) => RUOLI.includes(ruolo);
