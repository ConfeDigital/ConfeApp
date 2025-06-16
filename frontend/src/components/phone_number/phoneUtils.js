// phoneUtils.js

// Define the countries that you'll support.
export const countries = [
    { code: "mx", dialCode: "+52", name: "México", flag: "🇲🇽" },
    { code: "es", dialCode: "+34", name: "España", flag: "🇪🇸" },
    { code: "us", dialCode: "+1", name: "United States", flag: "🇺🇸" },
    { code: "gb", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧" },
    // Add more countries as needed...
  ];
  
  // For the yup schema, you may also export the expected number of local digits.
  export const expectedLocalDigits = {
    mx: 10,
    es: 9,
    us: 10,
    gb: 10,
  };
  
  // Formats the local part based on the country.
  // - México: XXX-XXX-XXXX  
  // - US: (XXX) XXX-XXXX  
  // - España: XXX XXX XXX (assumes 9 digits)  
  // - UK: XXXX XXXXXX (assumes 10 digits for mobile numbers)
  export const formatLocalNumber = (countryCode, inputValue) => {
    const digits = inputValue.replace(/\D/g, "");
    if (countryCode === "mx") {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
    } else if (countryCode === "us") {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (countryCode === "es") {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
    } else if (countryCode === "gb") {
      if (digits.length <= 5) return digits;
      return `${digits.slice(0, 4)} ${digits.slice(4, 10)}`;
    }
    return digits;
  };
  
  // Parses a canonical phone number (e.g. "+525555555555") and returns an object with 
  // the selected country and the local number.
  export const getInitialState = (value) => {
    let selectedCountry = countries.find((c) => value && value.startsWith(c.dialCode));
    if (!selectedCountry) {
      selectedCountry = countries.find((c) => c.code === "mx"); // default to México
    }
    const localNumber = value ? value.replace(selectedCountry.dialCode, "").trim() : "";
    return { selectedCountry, localNumber };
  };
  
  // Builds the canonical value from state (dial code plus local digits only).
  export const getCanonicalNumber = (selectedCountry, localNumber) => {
    const digits = localNumber.replace(/\D/g, "");
    return `${selectedCountry.dialCode}${digits}`;
  };
  
  // Formats a canonical phone number for display.
  // For example, it transforms "+525555555555" into "+52 555-555-5555" (for México).
  export const formatCanonicalPhoneNumber = (canonical) => {
    if (!canonical) return "";
    const country = countries.find((c) => canonical.startsWith(c.dialCode));
    if (!country) return canonical;
    const local = canonical.replace(country.dialCode, "").trim();
    const formattedLocal = formatLocalNumber(country.code, local);
    return `${country.dialCode} ${formattedLocal}`;
  };
  