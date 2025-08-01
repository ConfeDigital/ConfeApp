// src/components/candidate_create/DomicileForm.jsx
import React from 'react';
import AddressAutoCompleteForm from '../AddressAutoCompleteForm';

const DomicileForm = ({ setDomicileFormLoaded }) => {
  return (
    <AddressAutoCompleteForm 
      prefix="" 
      setDomicileFormLoaded={setDomicileFormLoaded} 
      domicile={true}
    />
  );
};

export default DomicileForm;