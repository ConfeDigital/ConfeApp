// contactsSchema.js
import * as yup from 'yup';
import phoneNumberSchema from '../phone_number/phoneYupSchema';

const emergencyContactSchema = yup.object().shape({
  first_name: yup.string().max(100, 'El nombre del contacto es demasiado largo').required('El nombre del contacto es obligatorio'),
  last_name: yup.string().max(100, 'El apellido del contacto es demasiado largo').required('Los apellidos del contacto son obligatorios'),
  second_last_name: yup.string().max(100, 'El apellido del contacto es demasiado largo').nullable(),
  phone_number: phoneNumberSchema,
  email: yup.string().email('Debe ser un correo válido').max(100, 'El correo del contacto es demasiado largo').nullable(),
  relationship: yup.string().max(20, 'La relación es demasiado larga').required('La relación con el contacto es obligatoria'),
  lives_at_same_address: yup.boolean(),
  domicile: yup.object().when('lives_at_same_address', {
    is: false,
    then: (schema) => schema.shape({
      address_PC: yup.string().max(5, "El código postal es demasiado largo").nullable(),
      address_road: yup.string().max(50, 'La calle del domicilio es demasiado larga').nullable(),
      address_number: yup.string().max(8, 'El número del domicilio es demasiado largo').nullable(),
      address_number_int: yup.string().max(8, 'El número interior del domicilio es demasiado largo').nullable(),
      address_municip: yup.string().nullable(),
      address_state: yup.string().nullable(),
      address_city: yup.string().nullable(),
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