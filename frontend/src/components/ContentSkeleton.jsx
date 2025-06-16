import React from "react";
import { Box, Skeleton, Stack } from "@mui/material";

function ContentSkeleton() {
  return (
    <Box sx={{ width: "100%" }}>
      <Stack spacing={2}>
        <Skeleton variant="text" width="30%" height={80} />
        <Skeleton variant="rectangular" width="100%" height={500} />
      </Stack>
    </Box>
  );
}

export default ContentSkeleton;