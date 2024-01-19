import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import PlayCircleFilledIcon from "@mui/icons-material/PlayCircleFilled";

const Header = () => {
  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <PlayCircleFilledIcon
            fontSize="large"
            sx={{ display: "flex", mr: 1 }}
          />
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: "flex",
              fontFamily: "monospace",
              fontWeight: 700,
              letterSpacing: { xs: ".2rem", md: ".3rem" },
              color: "inherit",
              textDecoration: "none",
            }}
          >
            Mp4ToGether
          </Typography>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
