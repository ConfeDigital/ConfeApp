import * as yup from 'yup';
import phoneNumberSchema from '../phone_number/phoneYupSchema';

const medicationSchema = yup.object().shape({
  name: yup.string().max(100, 'El nombre del medicamento es demasiado largo').required('El nombre del medicamento es obligatorio'),
  dose: yup.string().max(100, 'La dosis es demasiado larga').nullable(),
  reason: yup.string().nullable(),
});

const candidateSchema = yup.object().shape({
  email: yup.string().email('Debe ser un correo válido').max(100, 'El correo es demasiado largo').required('El correo es obligatorio'),
  first_name: yup.string().max(150, 'El nombre es demasiado largo').required('El nombre es obligatorio'), // Assuming User model has max_length=150
  last_name: yup.string().max(150, 'El apellido es demasiado largo').required('Los apellidos son obligatorios'), // Assuming User model has max_length=150
  second_last_name: yup.string().max(150, 'El apellido es demasiado largo').required('Los apellidos son obligatorios'), // Assuming User model has max_length=150
  birth_date: yup.date().nullable().required('La fecha de nacimiento es obligatoria'),
  gender: yup.string().oneOf(['M', 'F', 'O']).max(1, 'El género es demasiado largo').required('El género es obligatorio'),
  blood_type: yup.string().max(3, 'El tipo de sangre es demasiado largo').nullable(),
  curp: yup.string().max(18, 'El CURP es demasiado largo').nullable(),
  phone_number: phoneNumberSchema.max(15, 'El número de teléfono es demasiado largo'),
  stage: yup.string().max(3, 'La etapa es demasiado larga').nullable(),
  address_PC: yup.string().matches(/^\d{5}$/, "Debe ser un código postal válido de 5 dígitos").max(5, "El código postal es demasiado largo").nullable(),
  address_road: yup.string().max(50, 'La calle es demasiado larga').nullable(),
  address_number: yup.string().max(8, 'El número es demasiado largo').nullable(),
  address_number_int: yup.string().max(8, 'El número interior es demasiado largo').nullable(),
  address_municip: yup.string().max(128, 'El municipio es demasiado largo').nullable(),
  address_state: yup.string().max(128, 'El estado es demasiado largo').nullable(),
  address_city: yup.string().max(128, 'La ciudad es demasiado larga').nullable(),
  address_col: yup.string().max(128, 'La colonia es demasiado larga').nullable(),
  residence_type: yup.string().max(50, 'El tipo de residencia es demasiado largo').nullable(),
  has_disability_certificate: yup.boolean(),
  has_interdiction_judgment: yup.boolean(),
  receives_pension: yup.string().max(3, 'La pensión es demasiado larga').nullable(),
  social_security: yup.string().max(20, 'La seguridad social es demasiado larga').nullable(),
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
      first_name: yup.string().max(100, 'El nombre del contacto es demasiado largo').required('El nombre del contacto es obligatorio'),
      last_name: yup.string().max(100, 'El apellido del contacto es demasiado largo').required('Los apellidos del contacto son obligatorios'),
      second_last_name: yup.string().max(100, 'El apellido del contacto es demasiado largo').nullable(),
      phone_number: phoneNumberSchema.max(15, 'El número de teléfono es demasiado largo'),
      email: yup.string().email('Debe ser un correo válido').max(100, 'El correo del contacto es demasiado largo').nullable(),
      relationship: yup.string().max(20, 'La relación es demasiado larga').required('La relación con el contacto es obligatoria'),
      lives_at_same_address: yup.boolean(),
      domicile: yup.object().when('lives_at_same_address', {
        is: false,
        then: (schema) => schema.shape({
          address_PC: yup.string().matches(/^\d{5}$/, "Debe ser un código postal válido de 5 dígitos").max(5, "El código postal es demasiado largo").required('El código postal del domicilio es obligatorio'),
          address_road: yup.string().max(50, 'La calle del domicilio es demasiado larga').required('La calle del domicilio es obligatorio'),
          address_number: yup.string().max(8, 'El número del domicilio es demasiado largo').required('El número del domicilio es obligatorio'),
          address_number_int: yup.string().max(8, 'El número interior del domicilio es demasiado largo').nullable(),
          address_municip: yup.string().max(128, 'El municipio del domicilio es demasiado largo').required('El municipio es requerido'),
          address_state: yup.string().max(128, 'El estado del domicilio es demasiado largo').required('El estado es requerido'),
          address_city: yup.string().max(128, 'La ciudad del domicilio es demasiado larga').required('La ciudad es requerida'),
          address_col: yup.string().max(128, 'La colonia del domicilio es demasiado larga').required('La colonia es requerida'),
        }).required('El domicilio del contacto es obligatorio'),
        otherwise: (schema) => schema.nullable(),
      }),
    })
  ).required('Se requiere al menos un contacto de emergencia')
});

export default candidateSchema;