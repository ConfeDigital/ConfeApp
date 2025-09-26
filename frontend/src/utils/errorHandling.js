/**
 * Utility functions for handling API errors with improved Spanish error messages
 */

/**
 * Extract error message from API response
 * @param {Object} error - The error object from axios
 * @returns {string} - Formatted error message
 */
export const getErrorMessage = (error) => {
  if (!error) return 'Error desconocido';

  // Handle network errors
  if (!error.response) {
    return 'Error de conexión. Verifique su conexión a internet.';
  }

  const { response } = error;
  const { data, status } = response;

  // Handle structured error responses from our new error handling system
  if (data && typeof data === 'object') {
    // New structured error format
    if (data.success === false && data.message) {
      return data.message;
    }

    // Handle validation errors with field translations
    if (data.errors && typeof data.errors === 'object') {
      const errorMessages = [];
      
      Object.entries(data.errors).forEach(([field, errors]) => {
        if (Array.isArray(errors)) {
          errors.forEach(error => {
            if (typeof error === 'string') {
              errorMessages.push(error);
            } else if (typeof error === 'object') {
              // Handle nested errors (like emergency contacts)
              Object.entries(error).forEach(([nestedField, nestedErrors]) => {
                if (Array.isArray(nestedErrors)) {
                  nestedErrors.forEach(nestedError => {
                    errorMessages.push(`${nestedField}: ${nestedError}`);
                  });
                } else {
                  errorMessages.push(`${nestedField}: ${nestedErrors}`);
                }
              });
            }
          });
        } else if (typeof errors === 'string') {
          errorMessages.push(errors);
        }
      });

      if (errorMessages.length > 0) {
        return errorMessages.join('\n');
      }
    }

    // Handle detail field (common in DRF)
    if (data.detail) {
      return data.detail;
    }

    // Handle non_field_errors
    if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
      return data.non_field_errors.join('\n');
    }
  }

  // Handle HTTP status codes
  switch (status) {
    case 400:
      return 'Datos inválidos. Por favor, revise la información ingresada.';
    case 401:
      return 'No autorizado. Por favor, inicie sesión nuevamente.';
    case 403:
      return 'No tiene permisos para realizar esta acción.';
    case 404:
      return 'Recurso no encontrado.';
    case 422:
      return 'Error de validación. Por favor, revise los datos ingresados.';
    case 500:
      return 'Error interno del servidor. Por favor, intente más tarde.';
    default:
      return `Error del servidor (${status}). Por favor, intente más tarde.`;
  }
};

/**
 * Extract field-specific errors for form validation
 * @param {Object} error - The error object from axios
 * @returns {Object} - Object with field names as keys and error messages as values
 */
export const getFieldErrors = (error) => {
  if (!error?.response?.data?.errors) {
    return {};
  }

  const { errors } = error.response.data;
  const fieldErrors = {};

  Object.entries(errors).forEach(([field, fieldError]) => {
    if (Array.isArray(fieldError)) {
      fieldErrors[field] = fieldError.join(' ');
    } else if (typeof fieldError === 'string') {
      fieldErrors[field] = fieldError;
    }
  });

  return fieldErrors;
};

/**
 * Check if error is a validation error
 * @param {Object} error - The error object from axios
 * @returns {boolean} - True if it's a validation error
 */
export const isValidationError = (error) => {
  if (!error?.response) return false;
  
  const { status, data } = error.response;
  
  // Check status codes that typically indicate validation errors
  if ([400, 422].includes(status)) {
    return true;
  }
  
  // Check if response has structured errors
  if (data?.errors && typeof data.errors === 'object') {
    return true;
  }
  
  return false;
};

/**
 * Format error for display in UI components
 * @param {Object} error - The error object from axios
 * @param {Object} options - Display options
 * @returns {Object} - Formatted error object with message and field errors
 */
export const formatErrorForDisplay = (error, options = {}) => {
  const {
    showFieldErrors = true,
    maxErrors = 5
  } = options;

  const message = getErrorMessage(error);
  const fieldErrors = showFieldErrors ? getFieldErrors(error) : {};
  
  // Limit the number of errors shown
  const limitedFieldErrors = {};
  let errorCount = 0;
  
  Object.entries(fieldErrors).forEach(([field, errorMsg]) => {
    if (errorCount < maxErrors) {
      limitedFieldErrors[field] = errorMsg;
      errorCount++;
    }
  });

  return {
    message,
    fieldErrors: limitedFieldErrors,
    isValidationError: isValidationError(error),
    status: error?.response?.status,
    success: error?.response?.data?.success || false
  };
};

/**
 * Create a standardized error handler for API calls
 * @param {Function} setError - Function to set error state
 * @param {Function} setFieldErrors - Function to set field errors state
 * @param {Object} options - Error handling options
 * @returns {Function} - Error handler function
 */
export const createErrorHandler = (setError, setFieldErrors = null, options = {}) => {
  return (error) => {
    console.error('API Error:', error);
    
    const formattedError = formatErrorForDisplay(error, options);
    
    // Set main error message
    setError(formattedError.message);
    
    // Set field errors if handler provided
    if (setFieldErrors && Object.keys(formattedError.fieldErrors).length > 0) {
      setFieldErrors(formattedError.fieldErrors);
    }
    
    return formattedError;
  };
};

/**
 * Handle success responses from API
 * @param {Object} response - The response object from axios
 * @param {Function} setSuccess - Function to set success message
 * @param {string} defaultMessage - Default success message
 */
export const handleSuccessResponse = (response, setSuccess, defaultMessage = 'Operación exitosa') => {
  const { data } = response;
  
  if (data?.success && data?.message) {
    setSuccess(data.message);
  } else if (data?.message) {
    setSuccess(data.message);
  } else {
    setSuccess(defaultMessage);
  }
};

/**
 * Clear all error states
 * @param {Function} setError - Function to clear error state
 * @param {Function} setFieldErrors - Function to clear field errors state
 * @param {Function} setSuccess - Function to clear success state
 */
export const clearErrorStates = (setError, setFieldErrors = null, setSuccess = null) => {
  setError('');
  if (setFieldErrors) setFieldErrors({});
  if (setSuccess) setSuccess('');
};
