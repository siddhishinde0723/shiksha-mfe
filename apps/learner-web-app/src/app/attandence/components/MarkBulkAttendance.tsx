"use client";

import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  CircularProgress,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  bulkAttendance,
} from "@learner/utils/API/services/AttendanceService";
import { shortDateFormat } from "@learner/utils/attendance/helper";
import { showToastMessage } from "../toast";

interface MarkBulkAttendanceProps {
  open: boolean;
  onClose: () => void;
  classId: string;
  selectedDate: Date;
  onSaveSuccess?: (isModified?: boolean) => void;
  memberList: Array<any>;
  presentCount: number;
  absentCount: number;
  numberOfCohortMembers: number;
  dropoutMemberList: Array<any>;
  dropoutCount: number;
  bulkStatus: string;
}

type AttendanceStatus = "present" | "absent" | "";

const MarkBulkAttendance: React.FC<MarkBulkAttendanceProps> = ({
  open,
  onClose,
  classId,
  selectedDate,
  onSaveSuccess,
  memberList,
  presentCount,
  absentCount,
  numberOfCohortMembers,
  dropoutMemberList,
  dropoutCount,
}) => {
  const [rows, setRows] = React.useState<Array<any>>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      const initialRows = (memberList || []).map((member: any) => ({
        ...member,
        attendance: member.attendance ?? "",
      }));
      setRows(initialRows);
    }
  }, [open, memberList]);

  const totalPresent = React.useMemo(
    () =>
      rows.filter((row) => row.attendance === "present").length,
    [rows]
  );
  const totalAbsent = React.useMemo(
    () =>
      rows.filter((row) => row.attendance === "absent").length,
    [rows]
  );

  const allMarked = React.useMemo(
    () => rows.length > 0 && rows.every((row) => row.attendance),
    [rows]
  );

  const handleAttendanceChange = (userId: string, value: AttendanceStatus) => {
    setRows((prev) =>
      prev.map((row) =>
        row.userId === userId ? { ...row, attendance: value } : row
      )
    );
  };

  const handleBulkAction = (value: AttendanceStatus) => {
    setRows((prev) => prev.map((row) => ({ ...row, attendance: value })));
  };

  const handleSave = async () => {
    const userAttendance = rows.map((row) => ({
      userId: row.userId,
      attendance: row.attendance,
    }));

    if (!allMarked) {
      showToastMessage("Please mark attendance for all learners", "warning");
      return;
    }

    const payload = {
      attendanceDate: shortDateFormat(selectedDate),
      contextId: classId,
      userAttendance,
    };

    try {
      setLoading(true);
      const response = await bulkAttendance(payload);
      if (response?.responses || response) {
        showToastMessage("Attendance updated successfully", "success");
        const originalMarked =
          presentCount + absentCount === numberOfCohortMembers;
        const newMarked = totalPresent + totalAbsent === rows.length;
        if (onSaveSuccess) {
          onSaveSuccess(originalMarked ? true : newMarked);
        }
        onClose();
      } else {
        showToastMessage("Something went wrong", "error");
      }
    } catch (error) {
      console.error("Failed to mark attendance", error);
      showToastMessage("Failed to mark attendance", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6" component="span">
          Mark Attendance
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={2}
          mb={2}
        >
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total learners: {rows.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Present: {totalPresent} | Absent: {totalAbsent}
            </Typography>
            {dropoutCount > 0 ? (
              <Typography variant="body2" color="text.secondary">
                Dropouts: {dropoutCount}
              </Typography>
            ) : null}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleBulkAction("")}
            >
              Clear All
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleBulkAction("present")}
            >
              Mark All Present
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => handleBulkAction("absent")}
            >
              Mark All Absent
            </Button>
          </Stack>
        </Stack>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="center">Attendance</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.userId}>
                <TableCell>
                  <Typography variant="body2">{row.name}</Typography>
                  {row.memberStatus === "dropout" ? (
                    <Typography variant="caption" color="error">
                      Dropout
                    </Typography>
                  ) : null}
                </TableCell>
                <TableCell align="center">
                  <ToggleButtonGroup
                    exclusive
                    value={row.attendance}
                    onChange={(_, value) =>
                      handleAttendanceChange(
                        row.userId,
                        value ?? ""
                      )
                    }
                    size="small"
                  >
                    <ToggleButton value="present">Present</ToggleButton>
                    <ToggleButton value="absent">Absent</ToggleButton>
                  </ToggleButtonGroup>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {dropoutMemberList?.length ? (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Learners marked as dropout earlier
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {dropoutMemberList.map((item: any) => item.name).join(", ")}
            </Typography>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!rows.length || loading}
        >
          {loading ? <CircularProgress size={20} /> : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MarkBulkAttendance;

