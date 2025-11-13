"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  InputBase,
  IconButton,
  Stack,
  CircularProgress,
} from "@mui/material";
import KeyboardBackspaceOutlinedIcon from "@mui/icons-material/KeyboardBackspaceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { AccountCircleOutlined } from "@mui/icons-material";
import Layout from "@learner/components/Layout";
import ProfileMenu from "@learner/components/ProfileMenu/ProfileMenu";
import ConfirmationModal from "@learner/components/ConfirmationModal/ConfirmationModal";
import { getCohortList } from "@learner/utils/API/services/CohortServices";
import { getUserDetails } from "@learner/utils/API/services/ProfileService";
import {
  attendanceStatusList,
  getCohortAttendance,
} from "@learner/utils/API/services/AttendanceService";
import { getMyCohortMemberList } from "@learner/utils/API/services/MyClassDetailsService";
import { ICohort } from "@learner/utils/attendance/interfaces";
import { getTodayDate, shortDateFormat } from "@learner/utils/attendance/helper";
import { fetchAttendanceDetails } from "@learner/app/attandence/fetchAttendanceDetails";
import { useTheme } from "@mui/material/styles";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { format } from "date-fns";
import MarkBulkAttendance from "@learner/app/attandence/components/MarkBulkAttendance";
import "../global.css";

const AttendanceHistoryPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const initialClassId = searchParams.get("classId");
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [classId, setClassId] = useState(initialClassId || "");
  const [cohortsData, setCohortsData] = useState<Array<ICohort>>([]);
  const [centersData, setCentersData] = useState<Array<any>>([]);
  const [batchesData, setBatchesData] = useState<Array<any>>([]);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchWord, setSearchWord] = useState("");
  const [displayStudentList, setDisplayStudentList] = useState<Array<any>>([]);
  const [cohortMemberList, setCohortMemberList] = useState<Array<any>>([]);
  const [percentageAttendance, setPercentageAttendance] = useState<any>({});
  const [attendanceProgressBarData, setAttendanceProgressBarData] = useState<any>({});
  const [openMarkAttendance, setOpenMarkAttendance] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [attendanceData, setAttendanceData] = useState({
    cohortMemberList: [] as any[],
    presentCount: 0,
    absentCount: 0,
    numberOfCohortMembers: 0,
    dropoutMemberList: [] as any[],
    dropoutCount: 0,
    bulkAttendanceStatus: "",
  });

  const handleProfileClick = () => {
    router.push("/profile");
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
    setAnchorEl(null);
  };

  const performLogout = () => {
    router.push("/logout");
  };

  useEffect(() => {
    const initializePage = async () => {
      if (typeof window !== "undefined" && window.localStorage) {
        const token = localStorage.getItem("token");
        const storedUserId = localStorage.getItem("userId");
        
        if (!token) {
          router.push("/login");
          return;
        }

        if (storedUserId) {
          await fetchUserCohorts(storedUserId);
          if (initialClassId) {
            setClassId(initialClassId);
          }
        }
      }
    };

    initializePage();
  }, [router, initialClassId]);

  const fetchUserCohorts = async (userId: string | null) => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await getCohortList(userId, {
        customField: "true",
        children: "true",
      });
      await getUserDetails(userId, true);
      
      if (response && response.length > 0) {
        setCohortsData(response);
        
        // Filter centers: items with parentId === null (SCHOOL type)
        const centers = response
          .filter((item: any) => item.parentId === null && item.type === "SCHOOL")
          .map((center: any) => ({
            centerId: center.cohortId,
            centerName: center.cohortName,
            childData: center.childData || [],
          }));
        
        setCentersData(centers);
        
        if (centers.length > 0) {
          const defaultCenter = centers[0];
          setSelectedCenterId(defaultCenter.centerId);

          const batches = defaultCenter.childData.map((batch: any) => ({
            batchId: batch.cohortId,
            batchName: batch.name,
            parentId: batch.parentId,
          }));
          setBatchesData(batches);

          if (batches.length > 0 && !initialClassId) {
            setClassId(batches[0].batchId);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching cohorts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCenterChange = (event: any) => {
    const centerId = event.target.value;
    setSelectedCenterId(centerId);

    const selectedCenter = centersData.find(
      (center) => center.centerId === centerId
    );
    if (selectedCenter) {
      const batches = selectedCenter.childData.map((batch: any) => ({
        batchId: batch.cohortId,
        batchName: batch.name,
        parentId: batch.parentId,
      }));
      setBatchesData(batches);

      if (batches.length > 0) {
        setClassId(batches[0].batchId);
      } else {
        setClassId("");
      }
    }
  };

  const handleBatchChange = (event: any) => {
    const batchId = event.target.value;
    setClassId(batchId);
  };

  useEffect(() => {
    if (classId && selectedDate) {
      fetchAttendanceForDate();
      fetchAttendanceStats();
    }
  }, [classId, selectedDate]);

  const fetchAttendanceStats = async () => {
    if (!classId) return;

    try {
      const currentDate = selectedDate || new Date();
      const firstDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const lastDayOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      const fromDate = shortDateFormat(firstDayOfMonth);
      const toDate = shortDateFormat(lastDayOfMonth);

      // Get cohort members count
      const memberResponse = await getMyCohortMemberList({
        limit: 300,
        page: 0,
        filters: { cohortId: classId },
        includeArchived: true,
      });
      const totalMembers = memberResponse?.result?.userDetails?.length || 0;

      // Get attendance data for the month
      const attendanceRequest = {
        limit: 300,
        page: 0,
        filters: {
          contextId: classId,
          fromDate,
          toDate,
          scope: "student",
        },
        facets: ["attendanceDate"],
      };

      // Fetch attendance percentage for each date
      const attendanceRes = await getCohortAttendance(attendanceRequest);
      const attendanceDateData = attendanceRes?.data?.result?.attendanceDate || {};

      // Process attendance data for calendar
      const processedData: any = {};
      Object.keys(attendanceDateData).forEach((dateStr) => {
        const dateData = attendanceDateData[dateStr];
        const present = dateData.present || 0;
        const total = present + (dateData.absent || 0);
        const percentage = totalMembers > 0 ? (present / totalMembers) * 100 : 0;
        processedData[dateStr] = {
          present_percentage: Math.round(percentage),
          totalcount: totalMembers,
          present_students: present,
        };
      });

      setPercentageAttendance(processedData);
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      setPercentageAttendance({});
    }
  };

  const fetchAttendanceForDate = async () => {
    if (!classId || !selectedDate) return;

    try {
      setLoading(true);
      const selectedDateStr = shortDateFormat(selectedDate);
      
      // Get cohort members
      const memberResponse = await getMyCohortMemberList({
        limit: 300,
        page: 0,
        filters: { cohortId: classId },
        includeArchived: true,
      });

      const members = memberResponse?.result?.userDetails || [];
      const nameUserIdArray = members
        .map((entry: any) => ({
          userId: entry.userId,
          name: `${entry.firstName || ""} ${entry.lastName || ""}`.trim() || entry.firstName,
          memberStatus: entry.status,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          userName: entry.username,
        }))
        .filter((member: any) => {
          const createdAt = new Date(member.createdAt);
          createdAt.setHours(0, 0, 0, 0);
          const updatedAt = new Date(member.updatedAt);
          updatedAt.setHours(0, 0, 0, 0);
          const currentDate = new Date(selectedDateStr);
          currentDate.setHours(0, 0, 0, 0);

          if (
            member.memberStatus === "ARCHIVED" &&
            updatedAt <= currentDate
          ) {
            return false;
          }
          return createdAt <= new Date(selectedDateStr);
        });

      // Get attendance status list
      const attendanceStatusData = {
        limit: 300,
        page: 0,
        filters: {
          fromDate: selectedDateStr,
          toDate: selectedDateStr,
          contextId: classId,
          scope: "student",
        },
      };

      const attendanceResponse = await attendanceStatusList(attendanceStatusData);
      const attendanceList = attendanceResponse?.data?.attendanceList || [];

      // Merge member data with attendance
      const mergedList = nameUserIdArray.map((member: any) => {
        const attendance = attendanceList.find(
          (a: any) => a.userId === member.userId
        );
        return {
          ...member,
          attendance: attendance?.attendance || "",
        };
      });

      setCohortMemberList(mergedList);
      setDisplayStudentList(mergedList);

      // Fetch attendance details for progress bar
      if (nameUserIdArray.length > 0) {
        await fetchAttendanceDetails(
          nameUserIdArray,
          selectedDateStr,
          classId,
          (data: any) => {
            setAttendanceData(data);
            const attendanceInfo = {
              present_students: data.presentCount,
              totalcount: data.numberOfCohortMembers,
              present_percentage:
                data.numberOfCohortMembers === 0
                  ? 0
                  : parseFloat(((data.presentCount / data.numberOfCohortMembers) * 100).toFixed(2)),
            };
            setAttendanceProgressBarData({
              [selectedDateStr]: attendanceInfo,
            });
          }
        );
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchWord(value);
    if (value.trim() === "") {
      setDisplayStudentList(cohortMemberList);
    } else {
      const filtered = cohortMemberList.filter((user: any) =>
        user.name.toLowerCase().includes(value.toLowerCase())
      );
      setDisplayStudentList(filtered);
    }
  };

  const handleSearchClear = () => {
    setSearchWord("");
    setDisplayStudentList(cohortMemberList);
  };

  const handleDateChange = (date: Date | Date[] | null) => {
    if (date && !Array.isArray(date)) {
      setSelectedDate(date);
    }
  };

  const handleActiveStartDateChange = ({ activeStartDate }: any) => {
    // Handle month change
  };

  const handleOpen = () => {
    setOpenMarkAttendance(true);
  };

  const handleClose = () => {
    setOpenMarkAttendance(false);
    fetchAttendanceForDate();
  };

  const selectedDateStr = shortDateFormat(selectedDate);
  const attendanceInfo = attendanceProgressBarData[selectedDateStr];
  const presentPercentage = attendanceInfo?.present_percentage
    ? parseFloat(attendanceInfo.present_percentage)
    : 0;

  const determinePathColor = (percentage: number) => {
    if (percentage >= 75) return "#4caf50";
    if (percentage >= 50) return "#ff9800";
    return "#f44336";
  };

  const pathColor = determinePathColor(presentPercentage);

  return (
    <Layout
      _topAppBar={{
        navLinks: [
          {
            title: "Profile",
            icon: <AccountCircleOutlined sx={{ width: 28, height: 28 }} />,
            to: (e: React.MouseEvent<HTMLElement>) =>
              setAnchorEl(e.currentTarget),
            isActive: pathname === "/profile",
            customStyle: {
              backgroundColor:
                pathname === "/profile" ? "#e0f7fa" : "transparent",
              borderRadius: 8,
            },
          },
        ],
      }}
    >
      <Box minHeight="100vh" textAlign="center" sx={{ backgroundColor: "#f5f5f5" }}>
        {loading && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        <Box display="flex" justifyContent="center">
          <Box
            sx={{
              width: "100%",
              maxWidth: "1400px",
              "@media (max-width: 700px)": {
                width: "100%",
              },
            }}
          >
            {/* Header */}
            <Box
              display="flex"
              flexDirection="column"
              gap="1rem"
              padding="1.5rem 20px 1rem"
              alignItems="center"
              sx={{
                backgroundColor: "#fffdf7",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                borderRadius: "0 0 12px 12px",
              }}
            >
              <Box
                display="flex"
                sx={{ color: (theme.palette.warning as any)?.A200 || "#666" }}
                gap="10px"
                width="100%"
                paddingTop="10px"
              >
                <Box className="d-md-flex w-100 space-md-between min-align-md-center">
                  <Box display="flex" gap="10px" alignItems="center">
                    <Box
                      onClick={() => {
                        router.push("/attandence");
                      }}
                      sx={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        padding: "4px",
                        borderRadius: "50%",
                        "&:hover": {
                          backgroundColor: "rgba(0,0,0,0.05)",
                        },
                      }}
                    >
                      <KeyboardBackspaceOutlinedIcon
                        sx={{
                          color: (theme.palette.warning as any)?.["A200"] || "#666",
                          fontSize: "24px",
                        }}
                      />
                    </Box>
                    <Typography
                      marginBottom="0px"
                      fontSize="24px"
                      fontWeight={600}
                      color={(theme.palette.warning as any)?.["A200"] || "#666"}
                      className="flex-basis-md-30"
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      Day-Wise Attendance
                    </Typography>
                  </Box>

                  <Box className="w-100 d-md-flex flex-md-end">
                    <Box sx={{ display: "flex", gap: 2 }}>
                      {centersData.length > 0 && (
                        <FormControl
                          size="small"
                          sx={{
                            minWidth: 150,
                            backgroundColor: "white",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                        >
                          <InputLabel>Center</InputLabel>
                          <Select
                            value={selectedCenterId}
                            label="Center"
                            onChange={handleCenterChange}
                            disabled={loading}
                          >
                            {centersData.map((center) => (
                              <MenuItem key={center.centerId} value={center.centerId}>
                                {center.centerName}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}

                      {batchesData.length > 0 && (
                        <FormControl
                          size="small"
                          sx={{
                            minWidth: 150,
                            backgroundColor: "white",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          }}
                        >
                          <InputLabel>Batch</InputLabel>
                          <Select
                            value={classId}
                            label="Batch"
                            onChange={handleBatchChange}
                            disabled={loading || !selectedCenterId}
                          >
                            {batchesData.map((batch) => (
                              <MenuItem key={batch.batchId} value={batch.batchId}>
                                {batch.batchName}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

          {/* Sticky Header with Attendance Status */}
          <Box
            pl={3}
            pr={3}
            sx={{
              position: "sticky",
              top: 0,
              zIndex: 1000,
              backgroundColor: "#fffdf7",
              boxShadow: "0px 4px 16px rgba(0,0,0,0.12)",
              borderTop: "2px solid rgba(253, 190, 22, 0.2)",
              borderBottom: "2px solid rgba(253, 190, 22, 0.2)",
              padding: "18px 24px",
              marginTop: "12px",
              borderRadius: "12px 12px 0 0",
            }}
          >
            <Grid container display="flex" justifyContent="space-between" alignItems="center">
              <Grid item xs={12} md={8}>
                <Box display="flex" width="100%" alignItems="center" gap={3} flexWrap="wrap">
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      backgroundColor: "white",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                    }}
                  >
                    <Typography
                      fontSize="16px"
                      fontWeight="700"
                      color="#1F1B13"
                      sx={{ letterSpacing: "0.3px" }}
                    >
                      {format(selectedDate, "dd MMMM yyyy")}
                    </Typography>
                  </Box>
                  {attendanceInfo && (
                    <Box
                      display="flex"
                      gap="8px"
                      alignItems="center"
                      sx={{
                        backgroundColor: "white",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
                      }}
                    >
                      <Box width="32px" height="32px">
                        <CircularProgressbar
                          value={presentPercentage}
                          styles={buildStyles({
                            textColor: pathColor,
                            pathColor: pathColor,
                            trailColor: "#E6E6E6",
                            strokeLinecap: "round",
                          })}
                          strokeWidth={18}
                        />
                      </Box>
                      <Box display="flex" flexDirection="column">
                        <Typography
                          fontSize="14px"
                          fontWeight="700"
                          color="#1F1B13"
                          sx={{ lineHeight: 1.2 }}
                        >
                          {presentPercentage}%
                        </Typography>
                        <Typography
                          fontSize="11px"
                          fontWeight="500"
                          color="#666"
                          sx={{ lineHeight: 1.2 }}
                        >
                          Present
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={4} display="flex" justifyContent="flex-end" mt={{ xs: 2, md: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpen}
                  sx={{
                    minWidth: "140px",
                    height: "2.75rem",
                    fontWeight: "600",
                    fontSize: "14px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(251, 188, 19, 0.4)",
                    "&:hover": {
                      boxShadow: "0 6px 16px rgba(251, 188, 19, 0.5)",
                      transform: "translateY(-1px)",
                    },
                    transition: "all 0.2s",
                  }}
                >
                  Mark Attendance
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Calendar */}
          <Box
            className="calender-container"
            sx={{
              padding: "28px 24px",
              backgroundColor: "#fffdf7",
              marginTop: "12px",
              borderRadius: "0 0 12px 12px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            }}
          >
            <Box className="day-tile-wrapper custom-calendar-container">
              <Calendar
                onChange={handleDateChange}
                value={selectedDate}
                calendarType="gregory"
                className="calender-body"
                formatShortWeekday={(locale, date) => {
                  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
                  return weekdays[date.getDay()];
                }}
                onActiveStartDateChange={handleActiveStartDateChange}
                tileContent={({ date, view }) => {
                  if (view === "month") {
                    const dateStr = shortDateFormat(date);
                    const attendance = percentageAttendance[dateStr];
                    if (attendance && attendance.present_percentage !== undefined) {
                      const pathColor = determinePathColor(attendance.present_percentage || 0);
                      return (
                        <div className="circularProgressBar">
                          <CircularProgressbar
                            value={attendance.present_percentage || 0}
                            styles={buildStyles({
                              textColor: pathColor,
                              pathColor: pathColor,
                              trailColor: "#E6E6E6",
                              strokeLinecap: "round",
                            })}
                            strokeWidth={20}
                          />
                        </div>
                      );
                    }
                  }
                  return null;
                }}
                tileClassName={({ date, view }) => {
                  if (view !== "month") return null;
                  const classes = ["tile-day"];
                  if (date.toDateString() === new Date().toDateString()) {
                    classes.push("today");
                  }
                  const dateStr = shortDateFormat(date);
                  if (dateStr === selectedDateStr) {
                    classes.push("react-calendar__tile--active");
                  }
                  return classes.join(" ");
                }}
              />
            </Box>
          </Box>

          {/* Search and Student List */}
          <Box
            mt={3}
            sx={{
              backgroundColor: "#fffdf7",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
            }}
          >
            <Stack mr={1} ml={1}>
              <Box
                mt="16px"
                mb={3}
                sx={{ padding: "0 10px" }}
                boxShadow="none"
              >
                <Grid
                  container
                  alignItems="center"
                  display="flex"
                  justifyContent="space-between"
                >
                  <Grid item xs={12} md={8}>
                    <Paper
                      component="form"
                      onSubmit={(e) => {
                        e.preventDefault();
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        borderRadius: "100px",
                        background: "white",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        border: "2px solid rgba(253, 190, 22, 0.2)",
                        transition: "all 0.2s",
                        "&:hover": {
                          boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                          borderColor: "rgba(253, 190, 22, 0.4)",
                        },
                      }}
                    >
                      <InputBase
                        ref={inputRef}
                        value={searchWord}
                        sx={{
                          flex: 1,
                          mb: "0",
                          fontSize: "14px",
                          color: (theme.palette.warning as any)?.["A200"] || "#666",
                          px: "16px",
                        }}
                        placeholder="Search student.."
                        inputProps={{ "aria-label": "search student" }}
                        onChange={handleSearch}
                      />
                      <IconButton
                        type="button"
                        sx={{ p: "10px", color: (theme.palette.warning as any)?.["A200"] || "#666" }}
                        aria-label="search"
                      >
                        <SearchIcon />
                      </IconButton>
                      {searchWord?.length > 0 && (
                        <IconButton
                          type="button"
                          aria-label="Clear"
                          onClick={handleSearchClear}
                        >
                          <ClearIcon
                            sx={{
                              color: (theme.palette.warning as any)?.["A200"] || "#666",
                            }}
                          />
                        </IconButton>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Student List Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "18px 24px",
                  borderBottom: `3px solid ${(theme.palette.warning as any)?.["A200"] || "#fdbe16"}`,
                  bgcolor: "white",
                  borderRadius: "12px 12px 0 0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  background: "linear-gradient(180deg, #fffdf7 0%, #ffffff 100%)",
                }}
              >
                <Typography
                  sx={{
                    color: "#1F1B13",
                    fontSize: "14px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Learner Name
                </Typography>
                <Box sx={{ display: "flex", gap: "32px" }}>
                  <Typography
                    sx={{
                      color: "#1F1B13",
                      fontSize: "14px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Present
                  </Typography>
                  <Typography
                    sx={{
                      color: "#1F1B13",
                      fontSize: "14px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      paddingRight: "10px",
                    }}
                  >
                    Absent
                  </Typography>
                </Box>
              </Box>

              {/* Student List */}
              {displayStudentList.length > 0 ? (
                <Box
                  sx={{
                    backgroundColor: "white",
                    borderRadius: "0 0 12px 12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    overflow: "hidden",
                  }}
                >
                  {displayStudentList.map((user: any, index: number) => (
                    <Box
                      key={user.userId}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "18px 24px",
                        borderBottom: index < displayStudentList.length - 1
                          ? `1px solid ${(theme.palette.warning as any)?.["A100"] || "#e8e8e8"}`
                          : "none",
                        "&:hover": {
                          backgroundColor: "rgba(253, 190, 22, 0.08)",
                          transform: "translateX(4px)",
                        },
                        transition: "all 0.2s ease",
                        cursor: "pointer",
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          color: "#1F1B13",
                          fontWeight: 600,
                          fontSize: "16px",
                          letterSpacing: "0.2px",
                        }}
                      >
                        {user.name}
                      </Typography>
                      <Box sx={{ display: "flex", gap: "32px", alignItems: "center" }}>
                        {user.attendance?.toLowerCase() === "present" ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              backgroundColor: "rgba(76, 175, 80, 0.1)",
                            }}
                          >
                            <CheckCircleIcon
                              sx={{
                                color: theme.palette.success.main,
                                fontSize: "26px",
                              }}
                            />
                            <Typography
                              sx={{
                                color: theme.palette.success.main,
                                fontSize: "13px",
                                fontWeight: 600,
                              }}
                            >
                              Present
                            </Typography>
                          </Box>
                        ) : user.attendance?.toLowerCase() === "absent" ? (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              backgroundColor: "rgba(244, 67, 54, 0.1)",
                            }}
                          >
                            <CancelIcon
                              sx={{
                                color: theme.palette.error.main,
                                fontSize: "26px",
                              }}
                            />
                            <Typography
                              sx={{
                                color: theme.palette.error.main,
                                fontSize: "13px",
                                fontWeight: 600,
                              }}
                            >
                              Absent
                            </Typography>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 12px",
                              borderRadius: "20px",
                              backgroundColor: "rgba(158, 158, 158, 0.1)",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#9e9e9e",
                                fontSize: "13px",
                                fontWeight: 500,
                                fontStyle: "italic",
                              }}
                            >
                              Not Marked
                            </Typography>
                          </Box>
                        )}
                        <Box width="40px" />
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    padding: "80px 40px",
                    backgroundColor: "white",
                    borderRadius: "0 0 12px 12px",
                  }}
                >
                  <Typography
                    color="textSecondary"
                    sx={{ fontSize: "18px", fontWeight: 500, color: "#666" }}
                  >
                    No students found
                  </Typography>
                </Box>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>
      </Box>

      <ProfileMenu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        onProfileClick={handleProfileClick}
        onLogout={handleLogoutClick}
      />

      <ConfirmationModal
        modalOpen={logoutModalOpen}
        handleCloseModal={() => setLogoutModalOpen(false)}
        handleAction={performLogout}
        message="Are you sure you want to logout?"
        buttonNames={{ primary: "Logout", secondary: "Cancel" }}
      />

      {/* Mark Attendance Modal */}
      {openMarkAttendance && (
        <MarkBulkAttendance
          open={openMarkAttendance}
          onClose={handleClose}
          classId={classId}
          selectedDate={selectedDateStr}
          onSaveSuccess={() => {
            fetchAttendanceForDate();
            fetchAttendanceStats();
          }}
          memberList={attendanceData.cohortMemberList}
          presentCount={attendanceData.presentCount}
          absentCount={attendanceData.absentCount}
          numberOfCohortMembers={attendanceData.numberOfCohortMembers}
          dropoutMemberList={attendanceData.dropoutMemberList}
          dropoutCount={attendanceData.dropoutCount}
          bulkStatus={attendanceData.bulkAttendanceStatus}
        />
      )}
    </Layout>
  );
};

export default AttendanceHistoryPage;
