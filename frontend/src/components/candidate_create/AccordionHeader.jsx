import React from 'react';
import { Typography, Box, Chip } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

const AccordionHeader = ({ title, hasErrors = false, errorCount = 0 }) => {
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="h6">{title}</Typography>
      {hasErrors && (
        <Chip
          icon={<ErrorIcon />}
          label={errorCount === 1 ? '1 error' : `${errorCount} errores`}
          color="error"
          size="small"
          variant="outlined"
        />
      )}
    </Box>
  );
};

export default AccordionHeader;