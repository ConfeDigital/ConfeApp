import * as yup from 'yup';

// Schema for individual medication entries
const medicationSchema = yup.object().shape({
  name: yup.string().required('El nombre del medicamento es obligatorio'),
  dose: yup.string().nullable(),
  reason: yup.string().nullable(),
});

// Main medical and legal status schema
const medicalSchema = yup.object().shape({
  // Disability fields
  disability: yup.array().of(yup.number()).nullable(), // Array of numbers (disability IDs)

  has_disability_certificate: yup.boolean(), // Boolean, usually has a default value (false)
  disability_certificate_details: yup.string().nullable(),
  // disability_certificate_details: yup.string().when('has_disability_certificate', {
  //   is: true,
  //   then: (schema) => schema.required('El diagnóstico del certificado es obligatorio si tiene certificado'),
  //   otherwise: (schema) => schema.nullable(),
  // }),

  has_disability_history: yup.boolean(), // Boolean, usually has a default value (false)
  disability_history_details: yup.string().nullable(),
  // disability_history_details: yup.string().when('has_disability_history', {
  //   is: true,
  //   then: (schema) => schema.required('Especifique el parentesco y diagnóstico si tiene historial'),
  //   otherwise: (schema) => schema.nullable(),
  // }),

  // Legal status fields
  receives_pension: yup.string().nullable(), // Select field, can be nullable (e.g., "No sé")
  social_security: yup.string().nullable(), // Select field, can be nullable (e.g., "No sé")
  has_interdiction_judgment: yup.boolean(), // Boolean, usually has a default value (false)

  // Psychological/Psychiatric care fields
  receives_psychological_care: yup.boolean(), // Boolean, usually has a default value (false)
  psychological_care_details: yup.string().nullable(),
  // psychological_care_details: yup.string().when('receives_psychological_care', {
  //   is: true,
  //   then: (schema) => schema.required('Especifique el motivo de la terapia psicológica'),
  //   otherwise: (schema) => schema.nullable(),
  // }),

  receives_psychiatric_care: yup.boolean(), // Boolean, usually has a default value (false)
  psychiatric_care_details: yup.string().nullable(),
  // psychiatric_care_details: yup.string().when('receives_psychiatric_care', {
  //   is: true,
  //   then: (schema) => schema.required('Especifique el motivo de la terapia psiquiátrica'),
  //   otherwise: (schema) => schema.nullable(),
  // }),

  // Seizure fields
  has_seizures: yup.boolean(), // Boolean, usually has a default value (false)
  last_seizure: yup.string().nullable(),
  // last_seizure: yup.string().when('has_seizures', {
  //   is: true,
  //   then: (schema) => schema.required('Indique cuándo fue su última convulsión'),
  //   otherwise: (schema) => schema.nullable(),
  // }),

  // Other medical details
  blood_type: yup.string().nullable(), // Select field, can be nullable (e.g., "No sé")
  medications: yup.array().of(medicationSchema).nullable(), // Array of medication objects
  allergies: yup.string().nullable(), // Text field, can be nullable
  dietary_restrictions: yup.string().nullable(), // Text field, can be nullable
  physical_restrictions: yup.string().nullable(), // Text field, can be nullable
});

export default medicalSchema;
