// Unica fonte di verità lato frontend per i 5 ruoli del personale.
// Deve restare allineata a backend/roles.mjs.
export const RUOLI = [
  { value: 'amministrazione', label: 'Amministrazione' },
  { value: 'bar', label: 'Bar' },
  { value: 'eventi', label: 'Eventi' },
  { value: 'grafica', label: 'Grafica' },
  { value: 'volontari', label: 'Volontari' }
];

export const RUOLI_LABEL = Object.fromEntries(RUOLI.map((r) => [r.value, r.label]));
