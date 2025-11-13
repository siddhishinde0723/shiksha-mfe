"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import React from "react";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Enable Location</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="textSecondary">
          We need your device location to verify your attendance. Please enable
          location access when prompted.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          No, go back
        </Button>
        <Button onClick={onConfirm} variant="contained" color="primary">
          Turn On
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationModal;

