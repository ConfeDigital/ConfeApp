import React from 'react';
import {
  Box,
  Skeleton,
  Grid,
  Paper,
  Chip,
  Avatar,
  Typography,
} from '@mui/material';

const EmploymentDashboardSkeleton = () => {
  return (
    <Box sx={{ p: 2 }}>
      {/* Skeleton para el encabezado con información básica */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Skeleton variant="circular" width={100} height={100}>
              <Avatar />
            </Skeleton>
          </Grid>
          <Grid item xs>
            <Box display='flex' justifyContent='space-between' alignItems='center'>
              <Skeleton variant="text" width="60%" height={40} />
              <Skeleton variant="rectangular" width={140} height={36} />
            </Box>
            <Skeleton variant="text" width="40%" height={30} sx={{ mt: 1 }} />
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item>
                <Skeleton variant="rectangular" width={100} height={24}>
                  <Chip />
                </Skeleton>
              </Grid>
              <Grid item>
                <Skeleton variant="rectangular" width={100} height={24}>
                  <Chip />
                </Skeleton>
              </Grid>
              <Grid item>
                <Skeleton variant="rectangular" width={120} height={24}>
                  <Chip />
                </Skeleton>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Skeleton para la sección de botones */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} alignItems="center" justifyContent="center" gap={2} flexWrap="wrap">
          <Skeleton variant="rectangular" width={140} height={36} />
          <Skeleton variant="rectangular" width={140} height={36} />
          <Skeleton variant="rectangular" width={140} height={36} />
          <Skeleton variant="rectangular" width={140} height={36} />
        </Box>
      </Box>

      {/* Esqueleto para la sección de empleo actual o mensaje de "Bolsa de Trabajo" */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Skeleton variant="text" width="30%" height={30} />
          <Box>
            <Skeleton variant="rectangular" width={180} height={36} sx={{ mr: 1 }} />
            <Skeleton variant="circular" width={36} height={36} />
          </Box>
        </Box>
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" />

        {/* Skeleton para la sección de comentarios */}
        <Box sx={{ mt: 2, pt: 2 }}>
          <Skeleton variant="text" width="20%" height={24} sx={{ mb: 1 }} />
          <Box>
            <Box display="flex" alignItems="center" gap={1} sx={{ pl: 1, mb: 0.5 }}>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="text" width="80%" />
            </Box>
            <Box display="flex" alignItems="center" gap={1} sx={{ pl: 1, mb: 0.5 }}>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="text" width="70%" />
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default EmploymentDashboardSkeleton;