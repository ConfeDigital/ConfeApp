import * as yup from "yup";

const domicileSchema = yup.object().shape({
  alias: yup.string().max(50, "El alias es demasiado largo").nullable(),
  address_road: yup.string().max(50, "La calle es demasiado larga").required("La calle es requerida"),
  address_number: yup.string().max(8, "El número es demasiado largo").required("El número es requerido"),
  address_number_int: yup.string().max(8, "El número interior es demasiado largo").nullable(),
  address_PC: yup
    .string()
    .required("El código postal es requerido")
    .max(5, "El código postal es demasiado largo"),
  address_municip: yup.string().required('Ingresa un código postal válido'),
  address_col: yup.string().nullable(),
  address_state: yup.string().required('Ingresa un código postal válido'),
  address_city: yup.string().required('Ingresa un código postal válido'),
  residence_type: yup.string().nullable(),
});

export default domicileSchema;
