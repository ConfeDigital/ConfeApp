import { Box, Paper, Grid, TableContainer, Table, TableBody, TableRow, TableCell, Skeleton, Typography, Chip } from "@mui/material";
import { useMediaQuery } from "@mui/material";

// Helper function to render a skeleton for a single stats table
const renderSkeletonTable = () => {
  return (
    <Paper elevation={3} sx={{ p: 2, minWidth: 250 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
        <Skeleton variant="text" width="60%" />
        <Chip label={<Skeleton variant="text" width={20} />} size="small" color="primary" sx={{ ml: 1 }} />
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton variant="text" width="80%" />
                </TableCell>
                <TableCell align="right">
                  <Skeleton variant="text" width={30} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

const DashboardSkeleton = () => {
  return (
    <Box m="20px">

      {/* Stats panels skeleton */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          {renderSkeletonTable()}
        </Grid>
        <Grid item xs={12} sm={4}>
          {renderSkeletonTable()}
        </Grid>
        <Grid item xs={12} sm={4}>
          {renderSkeletonTable()}
        </Grid>
        <Grid item xs={12}>
          {renderSkeletonTable()}
        </Grid>
        <Grid item xs={12} sm={6}>
          {renderSkeletonTable()}
        </Grid>
        <Grid item xs={12} sm={6}>
          {renderSkeletonTable()}
        </Grid>
        <Grid item xs={12}>
          {renderSkeletonTable()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardSkeleton;