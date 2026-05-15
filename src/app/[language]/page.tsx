"use client";

import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { alpha, useTheme } from "@mui/material/styles";
import useAuth from "@/services/auth/use-auth";
import Link from "@/components/link";

export default function Home() {
  const theme = useTheme();
  const { user, isLoaded } = useAuth();

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: "calc(100vh - 120px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 3,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            mb: 1,
          }}
        >
          <AutoAwesomeIcon
            sx={{
              fontSize: 40,
              color: "primary.main",
            }}
          />
        </Box>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Notelm
        </Typography>

        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: 480, fontWeight: 400 }}
        >
          Your AI-powered note-taking companion. Transform content into
          flashcards, quizzes, and mindmaps.
        </Typography>

        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
          🚧 Landing page coming soon — stay tuned!
        </Typography>

        {isLoaded && user && (
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForwardIcon />}
            component={Link}
            href="/app"
            sx={{
              mt: 2,
              borderRadius: 3,
              textTransform: "none",
              fontWeight: 700,
              px: 4,
              py: 1.5,
              fontSize: "1rem",
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              "&:hover": {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                transform: "translateY(-1px)",
                boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
              },
              transition: "all 0.2s",
            }}
          >
            Go to App
          </Button>
        )}
      </Box>
    </Container>
  );
}
