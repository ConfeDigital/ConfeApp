// medicalSchema.js
import * as yup from "yup";

const medicalSchema = yup.object().shape({
  has_disability_certificate: yup.boolean(),
  has_interdiction_judgment: yup.boolean(),
  receives_pension: yup.string().nullable(),
  receives_psychological_care: yup.boolean(),
  receives_psychiatric_care: yup.boolean(),
  has_seizures: yup.boolean(),
  last_seizure: yup.string().nullable(),
  blood_type: yup
    .string()
    .oneOf(
      ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "", undefined],
      "Tipo de sangre inválido"
    )
    .nullable(),
  allergies: yup.string().nullable(),
  dietary_restrictions: yup.string().nullable(),
  physical_restrictions: yup.string().nullable(),
  // Validación de 'medications' como array
  medications: yup.array().of(
    yup.object().shape({
      name: yup.string().required("El nombre del medicamento es requerido"),
      dose: yup.string().nullable(),
      reason: yup.string().nullable(),
    })
  ),
});

export default medicalSchema;
