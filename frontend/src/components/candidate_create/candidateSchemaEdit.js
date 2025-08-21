import * as yup from 'yup';
import phoneNumberSchema from '../phone_number/phoneYupSchema';

const medicationSchema = yup.object().shape({
  name: yup.string().required('El nombre del medicamento es obligatorio'),
  dose: yup.string().nullable(),
  reason: yup.string().nullable(),
});

const candidateSchema = yup.object().shape({
  email: yup.string().email('Debe ser un correo válido').required('El correo es obligatorio'),
  first_name: yup.string().required('El nombre es obligatorio'),
  last_name: yup.string().required('Los apellidos son obligatorios'),
  second_last_name: yup.string().required('Los apellidos son obligatorios'),
  birth_date: yup.date().nullable().required('La fecha de nacimiento es obligatoria'),
  gender: yup.string().oneOf(['M', 'F', 'O']).required('El género es obligatorio'),
  blood_type: yup.string().nullable(),
  curp: yup.string().nullable(),
  phone_number: phoneNumberSchema,
  stage: yup.string().nullable(),
  address_PC: yup.string().nullable(),
  address_road: yup.string().nullable(),
  address_number: yup.string().nullable(),
  address_number_int: yup.string().nullable(),
  address_municip: yup.string().nullable(),
  address_state: yup.string().nullable(),
  address_city: yup.string().nullable(),
  address_col: yup.string().nullable(),
  residence_type: yup.string().nullable(),
  has_disability_certificate: yup.boolean(),
  has_interdiction_judgment: yup.boolean(),
  receives_pension: yup.string().nullable(),
  social_security: yup.string().nullable(),
  receives_psychological_care: yup.boolean(),
  receives_psychiatric_care: yup.boolean(),
  has_seizures: yup.boolean(),
  medications: yup.array().of(medicationSchema).nullable(),
  allergies: yup.string().nullable(),
  dietary_restrictions: yup.string().nullable(),
  physical_restrictions: yup.string().nullable(),
  disability: yup.array().of(yup.number()).nullable(),
  cycle: yup.number().nullable(),

  emergency_contacts: yup.array().of(
    yup.object().shape({
      first_name: yup.string().required('El nombre del contacto es obligatorio'),
      last_name: yup.string().required('Los apellidos del contacto son obligatorios'),
      second_last_name: yup.string().required('Los apellidos del contacto son obligatorios'),
      phone_number: phoneNumberSchema,
      email: yup.string().email('Debe ser un correo válido').required('El correo del contacto es obligatorio'),
      relationship: yup.string().required('La relación con el contacto es obligatoria'),
      lives_at_same_address: yup.boolean(),
      // Conditionally validate the domicile field
      domicile: yup.object().when('lives_at_same_address', {
        is: false, // Condition: lives_at_same_address is false
        then: (schema) => schema.shape({ // If the condition is met, apply this schema
          address_PC: yup.string().required('El código postal del domicilio es obligatorio'),
          address_road: yup.string().required('La calle del domicilio es obligatorio'),
          address_number: yup.string().required('El número del domicilio es obligatorio'),
          address_number_int: yup.string().nullable(),
          address_municip: yup.string().nullable(),
          address_state: yup.string().nullable(),
          address_city: yup.string().nullable(),
          address_col: yup.string().nullable(),// required('La colonia del domicilio es obligatoria'),
        }).required('El domicilio del contacto es obligatorio'), // Ensure the entire object is required
        otherwise: (schema) => schema.notRequired(), // If the condition is NOT met, don't require the domicile object
      }),
    })
  ).required('Se requiere al menos un contacto de emergencia')
});

export default candidateSchema;