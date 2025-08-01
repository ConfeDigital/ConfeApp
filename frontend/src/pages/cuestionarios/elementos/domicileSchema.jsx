import * as yup from "yup";

const domicileSchema = yup.object().shape({
  address_road: yup.string().required("La calle es requerida"),
  address_number: yup.string().required("El número es requerido"),
  address_number_int: yup.string().nullable(),
  address_PC: yup
    .string()
    .matches(/^\d{5}$/, "Debe ser un código postal válido de 5 dígitos")
    .required("El código postal es requerido"),
  address_municip: yup.string().required("El municipio es requerido"),
  address_col: yup.string().required("La colonia es requerida"),
  address_state: yup.string().required("El estado es requerido"),
  address_city: yup.string().required("La ciudad es requerida"),
  residence_type: yup.string().required("El tipo de residencia es requerido"),
});

export default domicileSchema;
