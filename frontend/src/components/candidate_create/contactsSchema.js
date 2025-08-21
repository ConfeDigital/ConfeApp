// contactsSchema.js
import * as yup from 'yup';
import phoneNumberSchema from '../phone_number/phoneYupSchema';

const emergencyContactSchema = yup.object().shape({
  first_name: yup.string().required('El nombre del contacto es obligatorio'),
  last_name: yup.string().required('Los apellidos del contacto son obligatorios'),
  second_last_name: yup.string().required('Los apellidos del contacto son obligatorios'),
  phone_number: phoneNumberSchema,
  email: yup.string().email('Debe ser un correo válido').required('El correo del contacto es obligatorio'),
  relationship: yup.string().required('La relación con el contacto es obligatoria'),
  lives_at_same_address: yup.boolean(),
  domicile: yup.object().when('lives_at_same_address', {
    is: false,
    then: (schema) => schema.shape({
      address_PC: yup.string().required('El código postal del domicilio es obligatorio'),
      address_road: yup.string().required('La calle del domicilio es obligatorio'),
      address_number: yup.string().required('El número del domicilio es obligatorio'),
      address_number_int: yup.string().nullable(),
      address_municip: yup.string().required('Ingresa un código postal válido'),
      address_state: yup.string().required('Ingresa un código postal válido'),
      address_city: yup.string().required('Ingresa un código postal válido'),
      address_col: yup.string().nullable(),
    }).required('El domicilio del contacto es obligatorio'),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const contactsSchema = yup.object().shape({
  emergency_contacts: yup.array()
    .of(emergencyContactSchema)
    .min(2, 'Se requieren al menos dos contactos de emergencia') // <-- This message will be shown
    .required('Se requiere al menos un contacto de emergencia')
});

export default contactsSchema;