import React from "react";
import { Box, Skeleton, IconButton } from "@mui/material";

const NavBarSkeleton = () => {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 2,
        px: 4,
      }}
    >
      {/* Logo Placeholder */}
      <Skeleton variant="rectangular" width={60} height={60} sx={{ borderRadius: "10%" }} />

      {/* Buttons Placeholder */}
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Skeleton variant="rectangular" width={120} height={40} sx={{ mr: 2 }} />
        <Skeleton variant="rectangular" width={120} height={40} sx={{ mr: 2 }} />
        <Skeleton variant="rectangular" width={120} height={40} sx={{ mr: 2 }} />

        {/* Theme Toggle Placeholder */}
        <IconButton sx={{ ml: 2 }}>
          <Skeleton variant="circular" width={40} height={40} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default NavBarSkeleton;
