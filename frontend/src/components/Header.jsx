import { Typography, Box, useTheme } from "@mui/material";
import { tokens } from "../theme";

const Header = ({ title, subtitle, actionButton, titleColor, subtitleColor }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <Box 
      sx={{
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: 2,
      }}
    >
      <Box>
        <Typography
          variant="h2"
          color={titleColor ? titleColor: colors.grey[100]}
          fontWeight="bold"
          sx={{ m: "0 0 1 0" }}
        >
          {title}
        </Typography>
        <Typography variant="h4" color={subtitleColor ? subtitleColor: colors.greenAccent[400]}>
          {subtitle}
        </Typography>
      </Box>
      {actionButton}
    </Box>
  );
};

export default Header;