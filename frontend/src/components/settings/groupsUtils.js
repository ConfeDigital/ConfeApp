// Translate group names
export const translateGroupName = name => ({
  personal: 'Personal',
  agencia_laboral: 'Agencia Laboral',
  gerente: 'Gerente',
  empleador: 'Empleador'
}[name] || name);