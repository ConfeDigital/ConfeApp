import React from "react";
import { Box, Grid2 as Grid, Skeleton } from "@mui/material";

function DashboardSkeleton() {
  return (
    <Box sx={{ display: "flex", width: "100%", height: "100%" }}>
      {/* Left Sidebar */}
      <Box sx={{ width: 100, p: 2 }}>
        {/* Simulate a few menu items */}
        <Skeleton variant="text" width="100%" height={30} />
        <Skeleton variant="text" width="100%" height={30} />
        <Skeleton variant="text" width="100%" height={30} />
        
        {/* Maybe a rectangular placeholder for a bigger element */}
        <Skeleton variant="rectangular" width="100%" height="100vh" sx={{ mt: 2 }} />
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 1, mr: 2 }}>
        {/* Page Title */}
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
          <Skeleton variant="circular"  width={25} height={25}/>
          <Box display="flex" >
            <Skeleton variant="circular" width={25} height={25} sx={{ ml: 1 }}/>
            <Skeleton variant="circular" width={25} height={25} sx={{ ml: 1 }}/>
            <Skeleton variant="circular" width={25} height={25} sx={{ ml: 1 }}/>
            <Skeleton variant="circular" width={25} height={25} sx={{ ml: 1 }}/>
            <Skeleton variant="circular" width={25} height={25} sx={{ ml: 1 }}/>
          </Box>
        </Box>
        {/* Filter / Status Bar */}
        <Skeleton variant="rectangular" width="50%" height={40} sx={{ mt: 9, mb: 2 }} />

        {/* Calendar Grid (7 columns x 6 rows = 42 cells) */}
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </Box>
    </Box>
  );
}

export default DashboardSkeleton;
