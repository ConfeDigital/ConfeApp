import * as yup from "yup";
import { countries } from "./phoneUtils"; // adjust the path as needed

// Map the expected number of local digits (excluding dial code) for each country.
export const expectedLocalDigits = {
  mx: 10,
  es: 9,
  us: 10,
  gb: 10,
};

const phoneNumberSchema = yup
  .string()
  .required("El teléfono es obligatorio")
  .matches(
    /^\+\d{1,3}\d+$/,
    "Formato inválido, debe comenzar con un código de país (ej. +52, +34, +1, +44) y contener el número"
  )
  .test(
    "phone-length",
    "El número de teléfono no tiene la longitud correcta para el país seleccionado",
    function (value) {
      if (!value) return false;
      const country = countries.find((c) => value.startsWith(c.dialCode));
      if (!country) {
        return this.createError({ message: "Código de país no reconocido" });
      }
      const localDigits = value.replace(country.dialCode, "");
      const expected = expectedLocalDigits[country.code];
      if (!expected) return true;
      return localDigits.length === expected;
    }
  );

export default phoneNumberSchema;
