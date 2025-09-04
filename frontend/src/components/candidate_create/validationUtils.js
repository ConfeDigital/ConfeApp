/**
 * Utility functions for handling form validation and accordion management
 */

/**
 * Maps field names to their corresponding accordion sections
 */
export const fieldToAccordionMap = {
  // Personal Info fields
  email: 'personal',
  first_name: 'personal',
  last_name: 'personal',
  second_last_name: 'personal',
  password: 'personal',
  birth_date: 'personal',
  gender: 'personal',
  blood_type: 'personal',
  curp: 'personal',
  phone_number: 'personal',
  stage: 'personal',
  cycle: 'personal',
  photo: 'personal',

  // Address fields
  address_PC: 'address',
  address_road: 'address',
  address_number: 'address',
  address_number_int: 'address',
  address_municip: 'address',
  address_col: 'address',
  address_state: 'address',
  address_city: 'address',
  address_lat: 'address',
  address_lng: 'address',
  residence_type: 'address',

  // Emergency contacts fields
  emergency_contacts: 'contacts',

  // Medical info fields
  has_disability_certificate: 'medical',
  has_interdiction_judgment: 'medical',
  receives_pension: 'medical',
  social_security: 'medical',
  receives_psychological_care: 'medical',
  receives_psychiatric_care: 'medical',
  has_seizures: 'medical',
  medications: 'medical',
  allergies: 'medical',
  dietary_restrictions: 'medical',
  physical_restrictions: 'medical',
  disability: 'medical',
};

/**
 * Maps accordion keys to user-friendly section names
 */
export const accordionSectionNames = {
  personal: 'Información Personal',
  address: 'Domicilio',
  contacts: 'Contactos',
  medical: 'Detalles Médicos y Emergencia',
};

/**
 * Processes validation errors and determines which accordions should be opened
 * @param {Object} errors - React Hook Form errors object or Yup validation errors object
 * @returns {Object} Object containing error messages and accordions to open
 */
export const processValidationErrors = (errors) => {
  const accordionsToOpen = new Set();
  const errorMessages = [];
  const fieldErrors = {};
  const accordionErrors = {};

  const processError = (path, message) => {
    // Handle nested field paths (e.g., "emergency_contacts[0].first_name")
    const rootField = path.split('[')[0].split('.')[0];
    const accordion = fieldToAccordionMap[rootField];
    
    if (accordion) {
      accordionsToOpen.add(accordion);
      
      // Count errors per accordion
      if (!accordionErrors[accordion]) {
        accordionErrors[accordion] = 0;
      }
      accordionErrors[accordion]++;
    }

    // Create user-friendly error messages
    const sectionName = accordionSectionNames[accordion] || 'Formulario';
    errorMessages.push(`${sectionName}: ${message}`);
    fieldErrors[path] = message;
  };

  // Recursively process errors object (handles both RHF and Yup error formats)
  const processErrorsRecursively = (errorsObj, parentPath = '') => {
    Object.keys(errorsObj).forEach(key => {
      const fullPath = parentPath ? `${parentPath}.${key}` : key;
      const error = errorsObj[key];

      if (typeof error === 'string') {
        processError(fullPath, error);
      } else if (error && typeof error === 'object') {
        // Handle React Hook Form error format
        if (error.message) {
          processError(fullPath, error.message);
        } 
        // Handle array errors (like emergency_contacts)
        else if (Array.isArray(error)) {
          error.forEach((item, index) => {
            if (item && typeof item === 'object') {
              processErrorsRecursively(item, `${fullPath}[${index}]`);
            }
          });
        }
        // Handle nested object errors
        else {
          processErrorsRecursively(error, fullPath);
        }
      }
    });
  };

  processErrorsRecursively(errors);

  return {
    accordionsToOpen: Array.from(accordionsToOpen),
    errorMessages,
    fieldErrors,
    accordionErrors,
  };
};

/**
 * Creates a formatted error message for display in alerts
 * @param {Array} errorMessages - Array of error messages
 * @returns {string} Formatted error message
 */
export const formatErrorMessage = (errorMessages) => {
  if (errorMessages.length === 0) return '';
  
  if (errorMessages.length === 1) {
    return errorMessages[0];
  }

  return `Se encontraron ${errorMessages.length} errores:\n${errorMessages.map((msg, index) => `${index + 1}. ${msg}`).join('\n')}`;
};

/**
 * Hook to handle form validation with accordion management
 * @param {Object} schema - Yup validation schema
 * @param {Function} setExpandedAccordions - Function to update accordion state
 * @param {Function} setError - Function to set error message
 * @param {Function} setAccordionErrors - Function to set accordion error counts (optional)
 * @returns {Function} Validation function
 */
export const useFormValidation = (schema, setExpandedAccordions, setError, setAccordionErrors = null) => {
  return async (formData) => {
    try {
      await schema.validate(formData, { abortEarly: false });
      // Clear errors on successful validation
      if (setAccordionErrors) {
        setAccordionErrors({});
      }
      return true; // Validation passed
    } catch (validationError) {
      const errorObj = validationError.inner.reduce((acc, err) => {
        acc[err.path] = err.message;
        return acc;
      }, {});

      const { accordionsToOpen, errorMessages, accordionErrors } = processValidationErrors(errorObj);

      // Open accordions with errors
      setExpandedAccordions(prev => {
        const newState = { ...prev };
        accordionsToOpen.forEach(accordion => {
          newState[accordion] = true;
        });
        return newState;
      });

      // Set accordion error counts
      if (setAccordionErrors) {
        setAccordionErrors(accordionErrors);
      }
      
      // Show error message
      setError(formatErrorMessage(errorMessages));
      return false; // Validation failed
    }
  };
};