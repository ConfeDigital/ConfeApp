import React from "react";
import { 
  Box, 
  Paper, 
  Skeleton, 
  Grid, 
  useTheme, 
  useMediaQuery 
} from "@mui/material";

const DatasheetSkeleton = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box m={{ xs: "16px", md: "40px" }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: "20px", md: "40px" }, 
          borderRadius: "12px" 
        }}
      >
        {/* Header Section Skeleton */}
        <Box 
          display="flex" 
          flexDirection={{ xs: "column", sm: "row" }} 
          alignItems="center" 
          justifyContent="space-between" 
          mb={3}
        >
          <Box 
            display="flex" 
            flexDirection={{ xs: "column", sm: "row" }} 
            alignItems="center" 
            gap={2} 
            mb={{ xs: 2, sm: 0 }}
          >
            <Skeleton 
              variant="circular" 
              width={isSmallScreen ? 120 : 180} 
              height={isSmallScreen ? 120 : 180} 
            />
            <Box textAlign={{ xs: "center", sm: "left" }}>
              <Skeleton variant="text" width={200} height={40} />
              <Skeleton variant="text" width={150} />
              <Skeleton variant="text" width={250} />
            </Box>
          </Box>
          {/* Edit Button & Status Skeleton */}
          <Box>
            <Box 
              display="flex" 
              flexDirection={{ xs: "column", sm: "row" }} 
              alignItems="center" 
              gap={1}
            >
              <Skeleton variant="rectangular" width={120} height={36} />
              <Skeleton variant="rectangular" width={120} height={36} />
            </Box>
            <Box 
              display="flex" 
              flexDirection="row" 
              alignItems="center" 
              gap={1}
              mt={1}
            >
              <Skeleton variant="rectangular" width={120} height={36} />
              <Skeleton variant="rectangular" width={120} height={36} />
            </Box>
          </Box>
        </Box>

        {/* Details Section Skeleton */}
        <Box mb={3}>
          <Grid container spacing={2}>
            {[...Array(4)].map((_, col) => (
              <Grid item xs={12} sm={6} md={3} key={col}>
                {[...Array(4)].map((_, row) => (
                  <Box 
                    key={row} 
                    sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
                  >
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="55%" />
                  </Box>
                ))}
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* PDF Download Button Skeleton */}
        <Box display="flex" justifyContent="center" mb={{ xs: 2, md: 3 }}>
          <Skeleton variant="rectangular" width={180} height={40} />
        </Box>

        {/* Timeline Stepper Skeleton */}
        <Box mb={3}>
          {isSmallScreen ? (
            <>
              {/* Top row */}
              <Box display="flex" justifyContent="space-around" mb={1}>
                {[...Array(3)].map((_, index) => (
                  <Skeleton 
                    key={index} 
                    variant="rectangular" 
                    width="28%" 
                    height={36} 
                  />
                ))}
              </Box>
              {/* Bottom row */}
              <Box display="flex" justifyContent="space-around">
                {[...Array(3)].map((_, index) => (
                  <Skeleton 
                    key={index} 
                    variant="rectangular" 
                    width="28%" 
                    height={36} 
                  />
                ))}
              </Box>
            </>
          ) : (
            <Box display="flex" justifyContent="space-around">
              {[...Array(6)].map((_, index) => (
                <Skeleton 
                  key={index} 
                  variant="rectangular" 
                  width="14%" 
                  height={36} 
                />
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default DatasheetSkeleton;
