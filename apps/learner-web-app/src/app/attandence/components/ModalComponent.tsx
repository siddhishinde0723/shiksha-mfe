"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import CloseSharpIcon from "@mui/icons-material/CloseSharp";
import React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  heading: string;
  SubHeading?: string;
  children?: React.ReactNode;
  btnText: string;
  handlePrimaryAction: () => void;
  secondaryBtnText?: string;
  handleSecondaryAction?: () => void;
  selectedDate?: Date;
}

const ModalComponent: React.FC<ModalProps> = ({
  open,
  onClose,
  heading,
  SubHeading,
  children,
  btnText,
  handlePrimaryAction,
  secondaryBtnText = "Back",
  handleSecondaryAction,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}
      >
        <Typography component="div" variant="h6">
          {heading}
        </Typography>
        <CloseSharpIcon
          sx={{ cursor: "pointer" }}
          onClick={onClose}
          aria-label="Close"
        />
      </DialogTitle>
      <DialogContent dividers>
        {SubHeading ? (
          <Typography variant="body2" mb={1.5}>
            {SubHeading}
          </Typography>
        ) : null}
        <Box>{children}</Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {secondaryBtnText ? (
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleSecondaryAction ?? onClose}
          >
            {secondaryBtnText}
          </Button>
        ) : null}
        <Button variant="contained" onClick={handlePrimaryAction}>
          {btnText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ModalComponent;

