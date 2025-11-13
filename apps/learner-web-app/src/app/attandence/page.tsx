/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Divider,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Radio,
  styled,
  Tabs,
  Tab,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import {
  classesMissedAttendancePercentList,
  getAllCenterAttendance,
  getCohortAttendance,
  markAttendance,
  getLearnerAttendanceStatus,
} from "../../utils/API/services/AttendanceService";
import { ShowSelfAttendance } from "../../../app.config";
import { getCohortList } from "../../utils/API/services/CohortServices";
import { getMyCohortMemberList } from "../../utils/API/services/MyClassDetailsService";
import { getUserDetails } from "../../utils/API/services/ProfileService";
import { ICohort } from "@learner/utils/attendance/interfaces";
import { getTodayDate, shortDateFormat } from "@learner/utils/attendance/helper";
import { ATTENDANCE_ENUM } from "@learner/utils/attendance/constants";
import ModalComponent from "./components/ModalComponent";
import MarkBulkAttendance from "./components/MarkBulkAttendance";
import { showToastMessage } from "./toast";
import { fetchAttendanceDetails } from "./fetchAttendanceDetails";
import LocationModal from "./LocationModal";
import useGeolocation from "./useGeoLocation";
import { ensureAcademicYearForTenant } from "../../utils/API/ProgramService";
import Layout from "@learner/components/Layout";
import { AccountCircleOutlined } from "@mui/icons-material";
import ProfileMenu from "../../components/ProfileMenu/ProfileMenu";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import { usePathname } from "next/navigation";
import { gredientStyle } from "@learner/utils/style";

const DashboardContainer = styled(Box)(({ theme }) => ({
  minHeight: "100vh",
  backgroundColor: "#f5f5f5",
  marginRight: "20px",
  [theme.breakpoints.down("sm")]: {
    marginRight: "0",
  },
  [theme.breakpoints.between("sm", "md")]: {
    marginRight: "10px",
  },
}));

const MainContent = styled(Box)({
  display: "flex",
  justifyContent: "center",
});

const ContentWrapper = styled(Box)({
  paddingBottom: "25px",
  width: "100%",
  background: "linear-gradient(180deg, #fffdf7 0%, #f8efda 100%)",
  borderRadius: "8px",
});

const StatusCard = styled(Card)(({ theme }) => ({
  height: "100%",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  border: "1px solid rgba(0,0,0,0.08)",
  backgroundColor: "#fff",
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
  },
  "& .MuiCardContent-root": {
    padding: "20px",
  },
}));

const CalendarContainer = styled(Box)(({ theme }) => ({
  marginTop: "20px",
  padding: "16px 20px",
  backgroundColor: "#fffdf7",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  [theme.breakpoints.down("md")]: {
    marginTop: "12px",
    padding: "12px 8px",
    borderRadius: "8px",
  },
  [theme.breakpoints.between("sm", "md")]: {
    padding: "14px 16px",
  },
}));

const HorizontalCalendarScroll = styled(Box)(({ theme }) => ({
  display: "flex",
  overflowX: "auto",
  gap: "8px",
  padding: "8px 0",
  [theme.breakpoints.down("sm")]: {
    gap: "6px",
    padding: "6px 0",
  },
  [theme.breakpoints.between("sm", "md")]: {
    gap: "7px",
  },
  "&::-webkit-scrollbar": {
    height: "4px",
  },
  "&::-webkit-scrollbar-track": {
    background: "#f1f1f1",
    borderRadius: "2px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "#c1c1c1",
    borderRadius: "2px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "#a8a8a8",
  },
}));

const CalendarCell = styled(Box)(({ theme }) => ({
  position: "relative",
  height: "4rem",
  width: "3.5rem",
  minWidth: "3.5rem",
  padding: "6px",
  overflow: "hidden",
  fontSize: "0.875em",
  border: `2px solid ${(theme.palette.warning as any).A100}`,
  borderRadius: "8px",
  cursor: "pointer",
  backgroundColor: "#fff",
  boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
  transition: "all 0.2s ease-out",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "center",
  [theme.breakpoints.down("sm")]: {
    height: "3rem",
    width: "2.5rem",
    minWidth: "2.5rem",
    padding: "4px",
    fontSize: "0.75em",
    borderRadius: "6px",
  },
  [theme.breakpoints.between("sm", "md")]: {
    height: "3.5rem",
    width: "3rem",
    minWidth: "3rem",
    padding: "5px",
    fontSize: "0.8em",
  },
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 8px rgba(0,0,0,0.12)",
    borderColor: (theme.palette.warning as any).A200,
    backgroundColor: "#f5f5f5",
    [theme.breakpoints.down("md")]: {
      transform: "none",
    },
  },
}));

const DateNumber = styled(Typography)(({ theme }) => ({
  fontSize: "1em",
  fontWeight: "600",
  lineHeight: 1,
  marginTop: "2px",
  color: "#1F1B13",
  [theme.breakpoints.down("sm")]: {
    fontSize: "0.85em",
    marginTop: "1px",
  },
  [theme.breakpoints.between("sm", "md")]: {
    fontSize: "0.9em",
  },
}));

const SimpleTeacherDashboard = () => {
  const theme = useTheme();
  const [classId, setClassId] = useState("");
  const [yearSelect, setYearSelect] = useState("");
  const [academicYearList, setAcademicYearList] = useState<Array<any>>([]);
  const [cohortsData, setCohortsData] = useState<Array<ICohort>>([]);
  const [centersData, setCentersData] = useState<Array<any>>([]);
  const [batchesData, setBatchesData] = useState<Array<any>>([]);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [isRemoteCohort, setIsRemoteCohort] = useState(false);
  const [cohortPresentPercentage, setCohortPresentPercentage] =
    useState("No Attendance");
  const [lowAttendanceLearnerList, setLowAttendanceLearnerList] = useState<any>(
    "No Learners with Low Attendance"
  );
  const [allCenterAttendanceData, setAllCenterAttendanceData] = useState<any>(
    []
  );
  const [startDateRange, setStartDateRange] = useState("");
  const [endDateRange, setEndDateRange] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate());
  const [attendanceData, setAttendanceData] = useState({
    cohortMemberList: [],
    presentCount: 0,
    absentCount: 0,
    numberOfCohortMembers: 0,
    dropoutMemberList: [],
    dropoutCount: 0,
    bulkAttendanceStatus: "",
  });
  const [selfAttendanceData, setSelfAttendanceData] = useState<any[]>([]);
  const [selectedSelfAttendance, setSelectedSelfAttendance] = useState<
    string | null
  >(null);
  const [isSelfAttendanceModalOpen, setIsSelfAttendanceModalOpen] =
    useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [handleSaveHasRun, setHandleSaveHasRun] = useState(false);
  const [dayWiseAttendanceData, setDayWiseAttendanceData] = useState<{
    [date: string]: {
      presentCount: number;
      absentCount: number;
      totalCount: number;
      percentage: number;
    };
  }>({});
  const router = useRouter();
  const pathname = usePathname();
  const { getLocation } = useGeolocation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [firstName, setFirstName] = useState("");

  const today = new Date();
  const currentMonth = today.toLocaleString("default", {
    month: "long",
  });
  const currentYear = today.getFullYear();

  const handleModalToggle = () => {
    setOpen(!open);
  };

  const handleClose = () => {
    setOpen(false);
    setIsRemoteCohort(false);
  };

  const handleAttendanceDataUpdate = (data: any) => {
    setAttendanceData(data);
  };

  const handleRemoteSession = () => {
    try {
      const teacherApp = JSON.parse(
        localStorage.getItem("teacherApp") ?? "null"
      );
      const cohort = teacherApp?.state?.cohorts?.find?.(
        (c: any) => c.cohortId === classId
      );
      const REMOTE_COHORT_TYPE = "REMOTE" as const;

      if (cohort?.cohortType === REMOTE_COHORT_TYPE) {
        setIsRemoteCohort(true);
      } else {
        handleModalToggle();
      }
    } catch (error) {
      console.error("Error parsing teacher app data:", error);
      handleModalToggle();
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTenantId = localStorage.getItem("tenantId");
      // Check if academicYearList already exists in localStorage
      const existingAcademicYearList = JSON.parse(
        localStorage.getItem("academicYearList") || "[]"
      );
      if (existingAcademicYearList.length > 0) {
        setAcademicYearList(existingAcademicYearList);
        const activeYear = existingAcademicYearList.find(
          (year: any) => year.isActive
        );
        if (activeYear) {
          setYearSelect(activeYear.name);
        }
      } else if (storedTenantId) {
        ensureAcademicYearForTenant(storedTenantId).then(() => {
          const academicYearListData = JSON.parse(
            localStorage.getItem("academicYearList") || "[]"
          );
          setAcademicYearList(academicYearListData);
          const activeYear = academicYearListData.find(
            (year: any) => year.isActive
          );
          if (activeYear) {
            setYearSelect(activeYear.name);
          }
        });
      }
      setFirstName(localStorage.getItem("firstName") || "");
    }
    const initializeDashboard = async () => {
      if (typeof window !== "undefined" && window.localStorage) {
        const token = localStorage.getItem("token");
        const storedUserId = localStorage.getItem("userId");
        if (token) {
          await fetchUserCohorts(storedUserId);
        } else {
          router.push("/login");
        }
      }
    };

    initializeDashboard();
  }, [router]);

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

          // Extract batches from childData
          const batches = defaultCenter.childData.map((batch: any) => ({
            batchId: batch.cohortId,
            batchName: batch.name,
            parentId: batch.parentId,
          }));
          setBatchesData(batches);

          // Set default batch if available
          if (batches.length > 0) {
            setClassId(batches[0].batchId);
          } else {
            setClassId("");
          }
        } else {
          // If no centers, check if there are direct cohorts (batches without parent)
          const directCohorts = response.filter(
            (item: any) => item.type === "COHORT" && item.parentId !== null
          );
          if (directCohorts.length > 0) {
            setClassId(directCohorts[0].cohortId);
          } else {
            setClassId("");
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
    const calculateDateRange = () => {
      const endRangeDate = new Date();
      endRangeDate.setHours(23, 59, 59, 999);
      const startRangeDate = new Date(endRangeDate);
      startRangeDate.setDate(startRangeDate.getDate() - 6);
      startRangeDate.setHours(0, 0, 0, 0);

      const startDay = startRangeDate.getDate();
      const startDayMonth = startRangeDate.toLocaleString("default", {
        month: "long",
      });
      const endDay = endRangeDate.getDate();
      const endDayMonth = endRangeDate.toLocaleString("default", {
        month: "long",
      });

      if (startDayMonth === endDayMonth) {
        setDateRange(`(${startDay}-${endDay} ${endDayMonth})`);
      } else {
        setDateRange(`(${startDay} ${startDayMonth}-${endDay} ${endDayMonth})`);
      }

      const formattedStartDate = shortDateFormat(startRangeDate);
      const formattedEndDate = shortDateFormat(endRangeDate);
      setStartDateRange(formattedStartDate);
      setEndDateRange(formattedEndDate);
    };

    calculateDateRange();
  }, []);

  const getCurrentAttendanceStatusValue = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    if (selected > today) {
      return "futureDate";
    }

    const isAttendanceMarked =
      attendanceData.presentCount > 0 || attendanceData.absentCount > 0;

    return isAttendanceMarked ? "marked" : "notMarked";
  };

  const currentAttendance = getCurrentAttendanceStatusValue();

  const fetchSelfAttendance = async () => {
    if (!classId || classId === "all") return;

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) return;

      const limit = 300;
      const page = 0;

      let filters = {
        contextId: classId,
        userId: userId,
        scope: "self",
        toDate: selectedDate,
        fromDate: selectedDate,
      };

      let response = await getLearnerAttendanceStatus({
        limit,
        page,
        filters,
      });

      if (
        !response?.data?.attendanceList ||
        response.data.attendanceList.length === 0
      ) {
        filters = {
          ...filters,
          scope: "student",
        };
        response = await getLearnerAttendanceStatus({
          limit,
          page,
          filters,
        });
      }

      if (response?.data?.attendanceList) {
        if (response.data.attendanceList.length > 0) {
          setSelfAttendanceData(response.data.attendanceList);
          const attendanceValue = response.data.attendanceList[0]?.attendance;
          setSelectedSelfAttendance(
            attendanceValue ? attendanceValue.toLowerCase() : null
          );
        } else {
          setSelfAttendanceData([]);
          setSelectedSelfAttendance(null);
        }
      }
    } catch (error) {
      console.error("Error fetching self attendance:", error);
      setSelfAttendanceData([]);
      setSelectedSelfAttendance(null);
    }
  };

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      showToastMessage("Geolocation is not supported by your browser", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocationModalOpen(false);
        const currentAttendance = selfAttendanceData?.[0]?.attendance;
        setSelectedSelfAttendance(
          currentAttendance ? currentAttendance.toLowerCase() : null
        );
        setIsSelfAttendanceModalOpen(true);
      },
      (error) => {
        console.error("Error getting location:", error);
        showToastMessage(
          "Failed to get location. Please enable location services.",
          "error"
        );
        setIsLocationModalOpen(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleMarkSelfAttendance = async () => {
    if (!selectedSelfAttendance) return;

    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        showToastMessage("User ID not found", "error");
        return;
      }

      const locationData = await getLocation(true);

      const data: any = {
        userId: userId,
        attendance: selectedSelfAttendance?.toLowerCase(),
        attendanceDate: selectedDate,
        contextId: classId,
        scope: "self",
        context: "cohort",
        absentReason: "",
        lateMark: true,
        validLocation: false,
      };

      if (locationData) {
        data.latitude = locationData.latitude;
        data.longitude = locationData.longitude;
      }
      const response = await markAttendance(data);

      if (
        (response?.responseCode === 200 || response?.responseCode === 201) &&
        response?.params?.status === "successful"
      ) {
        const successMessage =
          response?.params?.successmessage || "Attendance marked successfully";
        showToastMessage(successMessage, "success");
        setIsSelfAttendanceModalOpen(false);
        setSelectedSelfAttendance(null);

        if (response?.data?.attendance) {
          const attendanceValue = response.data.attendance.toLowerCase();
          setSelectedSelfAttendance(attendanceValue);

          const updatedSelfAttendance = [
            {
              attendance: response.data.attendance,
              attendanceDate: response.data.attendanceDate,
              ...response.data,
            },
          ];
          setSelfAttendanceData(updatedSelfAttendance);
        }

        await fetchSelfAttendance();
        fetchAttendanceData();
      } else if (response?.responseCode === 400 || response?.params?.err) {
        const errorMessage =
          response?.params?.errmsg ||
          response?.params?.err ||
          "Something went wrong";
        showToastMessage(errorMessage, "error");
      } else {
        showToastMessage("Something went wrong", "error");
      }
    } catch (error) {
      console.error("Error marking self attendance:", error);
      showToastMessage("Something went wrong", "error");
    }
  };

  useEffect(() => {
    if (classId && classId !== "all") {
      fetchAttendanceData();
      fetchDayWiseAttendanceData();
      if (ShowSelfAttendance) {
        fetchSelfAttendance();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, selectedDate, startDateRange, endDateRange, handleSaveHasRun]);

  const fetchDayWiseAttendanceData = async () => {
    if (!classId || classId === "all") return;

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(classId)) {
      console.warn(
        "fetchDayWiseAttendanceData: Invalid UUID format for classId:",
        classId
      );
      return;
    }

    try {
      const calendarDays = generateCalendarData();
      if (calendarDays.length === 0) return;

      const firstDate = calendarDays[calendarDays.length - 1].dateString;
      const lastDate = calendarDays[0].dateString;

      const cohortAttendanceData: any = {
        limit: 1000,
        page: 0,
        filters: {
          scope: "student",
          fromDate: firstDate,
          toDate: lastDate,
          contextId: classId,
        },
        facets: ["attendanceDate"],
        sort: ["present_percentage", "asc"],
      };

      const response = await getCohortAttendance(cohortAttendanceData);
      const attendanceDateData = response?.data?.result?.attendanceDate || {};

      const processedData: {
        [date: string]: {
          presentCount: number;
          absentCount: number;
          totalCount: number;
          percentage: number;
        };
      } = {};

      const limit = 300;
      const page = 0;
      const filters = { cohortId: classId };
      const memberResponse = await getMyCohortMemberList({
        limit,
        page,
        filters,
        includeArchived: true,
      });
      const members = memberResponse?.result?.userDetails || [];
      const totalMembers = members.length;

      Object.keys(attendanceDateData).forEach((dateStr) => {
        const dateData = attendanceDateData[dateStr];
        const present = dateData.present || 0;
        const absent = dateData.absent || 0;
        const total = present + absent;
        const percentage =
          totalMembers > 0 ? (present / totalMembers) * 100 : 0;

        processedData[dateStr] = {
          presentCount: present,
          absentCount: absent,
          totalCount: total,
          percentage: Math.round(percentage),
        };
      });

      setDayWiseAttendanceData(processedData);
    } catch (error) {
      console.error("Error fetching day-wise attendance data:", error);
    }
  };

  const fetchAttendanceData = async () => {
    if (!classId) return;

    setLoading(true);
    try {
      if (classId !== "all") {
        await fetchSingleCenterAttendance();
      } else {
        await fetchAllCentersAttendance();
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleCenterAttendance = async () => {
    try {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(classId)) {
        console.warn(
          "fetchAttendanceData: Invalid UUID format for classId:",
          classId
        );
        return;
      }

      const limit = 300;
      const page = 0;
      const filters = { cohortId: classId };
      const response = await getMyCohortMemberList({
        limit,
        page,
        filters,
        includeArchived: true,
      });

      const resp = response?.result?.userDetails;
      if (resp) {
        const nameUserIdArray = resp
          ?.map((entry: any) => ({
            userId: entry.userId,
            name: entry.firstName,
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
            const currentDate = new Date(selectedDate);
            currentDate.setHours(0, 0, 0, 0);

            if (
              member.memberStatus === "ARCHIVED" &&
              updatedAt <= currentDate
            ) {
              return false;
            }
            return createdAt <= new Date(selectedDate);
          });

        if (nameUserIdArray && selectedDate && classId) {
          await fetchAttendanceDetails(
            nameUserIdArray,
            selectedDate,
            classId,
            handleAttendanceDataUpdate
          );
        }

        const fromDate = startDateRange;
        const toDate = endDateRange;
        const attendanceFilters = {
          contextId: classId,
          fromDate,
          toDate,
          scope: "student",
        };

        const attendanceResponse = await classesMissedAttendancePercentList({
          filters: attendanceFilters,
          facets: ["userId"],
          sort: ["absent_percentage", "asc"],
        });
        const attendanceData = attendanceResponse?.data?.result?.userId;
        if (attendanceData) {
          const filteredData = Object.keys(attendanceData).map((userId) => ({
            userId,
            absent: attendanceData[userId].absent,
            present_percent: attendanceData[userId].present_percentage,
          }));

          let mergedArray = filteredData.map((attendance) => {
            const user = nameUserIdArray.find(
              (user: { userId: string }) => user.userId === attendance.userId
            );
            return Object.assign({}, attendance, {
              name: user ? user.name : "Unknown",
            });
          });

          mergedArray = mergedArray.filter((item) => item.name !== "Unknown");

          const LOW_ATTENDANCE_THRESHOLD = 75;
          const studentsWithLowestAttendance = mergedArray.filter((user) => {
            const hasAbsence = user.absent && user.absent > 0;
            const percentNum = parseFloat(user.present_percent || "0");
            const isLowAttendance = percentNum < LOW_ATTENDANCE_THRESHOLD;
            return (
              hasAbsence &&
              (isLowAttendance || user.present_percent === undefined)
            );
          });

          if (studentsWithLowestAttendance.length) {
            const namesOfLowestAttendance = studentsWithLowestAttendance.map(
              (student) => student.name
            );
            setLowAttendanceLearnerList(namesOfLowestAttendance);
          } else {
            setLowAttendanceLearnerList([]);
          }
        }

        const cohortAttendanceData: any = {
          limit: 1000,
          page: 0,
          filters: {
            scope: "student",
            fromDate: startDateRange,
            toDate: endDateRange,
            contextId: classId,
          },
          facets: ["contextId"],
          sort: ["present_percentage", "asc"],
        };

        const cohortRes = await getCohortAttendance(cohortAttendanceData);
        const cohortResponse = cohortRes?.data?.result;
        const contextData = cohortResponse?.contextId?.[classId];

        if (contextData?.present_percentage) {
          const presentPercent = parseFloat(contextData.present_percentage);
          const percentageString = presentPercent.toFixed(1);
          setCohortPresentPercentage(percentageString);
        } else if (contextData?.absent_percentage) {
          setCohortPresentPercentage("0");
        } else {
          setCohortPresentPercentage("No Attendance");
        }
      }
    } catch (error) {
      console.error("Error fetching single center attendance:", error);
    }
  };

  const fetchAllCentersAttendance = async () => {
    try {
      const cohortIds = cohortsData.map((cohort) => cohort.cohortId);
      const limit = 300;
      const page = 0;
      const facets = ["contextId"];

      const fetchPromises = cohortIds.map(async (cohortId) => {
        const filters = {
          fromDate: startDateRange,
          toDate: endDateRange,
          scope: "student",
          contextId: cohortId,
        };

        try {
          const response = await getAllCenterAttendance({
            limit,
            page,
            filters,
            facets,
          });
          return { cohortId, data: response?.data?.result };
        } catch (error) {
          console.error(`Error fetching data for cohortId ${cohortId}:`, error);
          return { cohortId, error };
        }
      });

      const results = await Promise.all(fetchPromises);
      const nameIDAttendanceArray = results
        .filter((result) => !result?.error && result?.data?.contextId)
        .map((result) => {
          const cohortId = result?.cohortId;
          const contextData = result?.data?.contextId[cohortId] || {};
          const presentPercentage = contextData.present_percentage || null;
          const absentPercentage = contextData?.absent_percentage
            ? 100 - contextData?.absent_percentage
            : null;
          const percentage = presentPercentage || absentPercentage;

          const cohortItem = cohortsData.find(
            (cohort) => cohort?.cohortId === cohortId
          );

          return {
            userId: cohortId,
            name: cohortItem ? cohortItem.name : null,
            presentPercentage: percentage ? percentage.toFixed(1) : null,
          };
        })
        .filter((item) => item.presentPercentage !== null);

      setAllCenterAttendanceData(nameIDAttendanceArray);
    } catch (error) {
      console.error("Error fetching all centers attendance:", error);
    }
  };

  const generateCalendarData = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const days = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      if (date <= today) {
        const dayName = ["S", "M", "T", "W", "T", "F", "S"][date.getDay()];
        const dateStr = shortDateFormat(date);
        days.push({
          date: date.getDate(),
          day: dayName,
          fullDate: date,
          dateString: dateStr,
          isToday: i === 0,
        });
      }
    }

    return days;
  };

  const calendarDays = generateCalendarData();

  const handleDateClick = (dateString: string) => {
    setSelectedDate(dateString);
  };

  const handleCalendarClick = () => {
    if (classId && classId !== "all") {
      router.push(`/attendance-history?classId=${classId}`);
    } else {
      router.push("/attendance-history");
    }
  };

  const handlePreviousMonth = () => {
    handleCalendarClick();
  };

  const handleNextMonth = () => {
    handleCalendarClick();
  };

  const handleChangeYear = (event: any) => {
    setYearSelect(event.target.value);
  };

  const handleSaveSuccess = (isModified?: boolean) => {
    if (isModified) {
      showToastMessage("Attendance modified successfully", "success");
    } else {
      showToastMessage("Attendance marked successfully", "success");
    }
    setHandleSaveHasRun(!handleSaveHasRun);
    handleClose();
  };

  const t = (key: string) => {
    const translations: { [key: string]: string } = {
      "COMMON.MARK_CENTER_ATTENDANCE": "Mark Center Attendance",
      "COMMON.CANCEL": "Cancel",
      "COMMON.YES_MANUALLY": "Yes, Manually",
      "COMMON.ARE_YOU_SURE_MANUALLY":
        "Are you sure you want to manually mark attendance?",
      "COMMON.ATTENDANCE_IS_USUALLY":
        "Attendance is usually marked automatically for remote cohorts.",
      "COMMON.USE_MANUAL":
        "Use manual marking only if automatic attendance failed.",
      "COMMON.NOTE_MANUALLY":
        "Note: Manual attendance will override automatic attendance.",
    };
    return translations[key] || key;
  };
  const clickAttendanceOverview = () => {
    if (classId && classId !== "all") {
      router.push(`/attendance-overview?classId=${classId}`);
    } else {
      router.push("/attendance-overview");
    }
  };

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

  const handleTopTabChange = (
    _: React.SyntheticEvent,
    value: string
  ) => {
    switch (value) {
      case "Course":
        router.push("/dashboard?tab=0");
        break;
      case "content":
        router.push("/dashboard?tab=1");
        break;
      case "groups":
        router.push("/dashboard?tab=2");
        break;
      default:
        break;
    }
  };
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
      <Box
        sx={{
          height: 24,
          display: "flex",
          alignItems: "center",
          py: "36px",
          px: "34px",
          bgcolor: "#fff",
        }}
      >
        <Typography
          variant="body1"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: 500,
            color: "#1F1B13",
            textTransform: "capitalize",
          }}
        >
          <span role="img" aria-label="wave">
            👋
          </span>
          Welcome, {firstName}!
        </Typography>
        <Select
          value={yearSelect || ""}
          onChange={handleChangeYear}
          size="small"
          displayEmpty
          sx={{
            backgroundColor: "white",
            borderRadius: "8px",
            fontWeight: 500,
            "& .MuiSelect-select": {
              display: "flex",
              alignItems: "center",
              gap: "4px",
            },
          }}
        >
          {academicYearList.length === 0 ? (
            <MenuItem value="" disabled>
              Loading...
            </MenuItem>
          ) : (
            academicYearList.map((year: any) => (
              <MenuItem key={year.id} value={year.name}>
                {year.name}
                {year.isActive && (
                  <span style={{ color: "green", marginLeft: "6px" }}>
                    (Active)
                  </span>
                )}
              </MenuItem>
            ))
          )}
        </Select>
      </Box>
      <Box>
        <Tabs
          value="attendance"
          onChange={handleTopTabChange}
          aria-label="Dashboard Tabs"
        >
          <Tab label="Courses" value="Course" />
          <Tab label="Content" value="content" />
          <Tab label="Groups" value="groups" />
          <Tab label="Attendance" value="attendance" />
        </Tabs>
        <Grid container style={gredientStyle}>
          <Grid item xs={12}>
            <DashboardContainer>
              <MainContent>
        <ContentWrapper>
          <Box>
            <Box
              display={"flex"}
              flexDirection={"column"}
              padding={{ xs: "1rem 1rem 1rem 1rem", md: "2rem 2.5rem 1.5rem 1.5rem" }}
              sx={{
                backgroundColor: "#fffdf7",
                borderRadius: "12px 12px 0 0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <Box
                display={"flex"}
                flexDirection={{ xs: "column", md: "row" }}
                justifyContent={"space-between"}
                alignItems={{ xs: "flex-start", md: "center" }}
                marginBottom={"16px"}
                marginRight={{ xs: 0, md: "25px" }}
                gap={{ xs: 2, md: 0 }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: "18px", md: "20px" },
                    fontWeight: "700",
                    color: "#1F1B13",
                    letterSpacing: "0.3px",
                  }}
                >
                  Day-Wise Attendance
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: { xs: "0.5rem", md: "1rem" },
                    alignItems: "center",
                    flexDirection: { xs: "column", sm: "row" },
                    width: { xs: "100%", md: "auto" },
                  }}
                >
                  {/* Center Selection */}
                  {centersData.length > 0 && (
                    <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                      <FormControl
                        fullWidth
                        size="small"
                        sx={{
                          minWidth: { xs: "100%", sm: "150px" },
                          maxWidth: { xs: "100%", md: "200px" },
                          backgroundColor: "white",
                          borderRadius: "8px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          "& .MuiOutlinedInput-root": {
                            "&:hover fieldset": {
                              borderColor: (theme.palette.warning as any)?.["A200"] || "#fdbe16",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: (theme.palette.warning as any)?.["A200"] || "#fdbe16",
                            },
                          },
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
                            <MenuItem
                              key={center.centerId}
                              value={center.centerId}
                            >
                              {center.centerName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}

                  {/* Batch Selection */}
                  {batchesData.length > 0 && (
                    <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                      <FormControl
                        fullWidth
                        size="small"
                        sx={{
                          minWidth: { xs: "100%", sm: "150px" },
                          maxWidth: { xs: "100%", md: "200px" },
                          backgroundColor: "white",
                          borderRadius: "8px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          "& .MuiOutlinedInput-root": {
                            "&:hover fieldset": {
                              borderColor: (theme.palette.warning as any)?.["A200"] || "#fdbe16",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: (theme.palette.warning as any)?.["A200"] || "#fdbe16",
                            },
                          },
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
                    </Box>
                  )}
                </Box>

                <Box
                  display={"flex"}
                  sx={{
                    cursor: "pointer",
                    color: theme.palette.secondary.main,
                    gap: { xs: "4px", sm: "6px", md: "8px" },
                    alignItems: "center",
                    backgroundColor: "white",
                    padding: { xs: "6px 12px", sm: "7px 14px", md: "8px 16px" },
                    borderRadius: { xs: "6px", md: "8px" },
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid rgba(0,0,0,0.05)",
                    transition: "all 0.2s",
                    width: { xs: "100%", sm: "auto" },
                    justifyContent: { xs: "space-between", sm: "flex-start" },
                    "&:hover": {
                      boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                      transform: { xs: "none", md: "translateY(-1px)" },
                    },
                  }}
                  onClick={handleCalendarClick}
                >
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviousMonth();
                    }}
                    sx={{
                      minWidth: "auto",
                      padding: { xs: "2px 4px", md: "4px 8px" },
                      color: "#1F1B13",
                      fontWeight: "600",
                      fontSize: { xs: "16px", sm: "17px", md: "18px" },
                      "&:hover": {
                        backgroundColor: "rgba(253, 190, 22, 0.1)",
                      },
                    }}
                  >
                    ‹
                  </Button>
                  <Typography
                    sx={{
                      fontWeight: "600",
                      minWidth: { xs: "auto", sm: "120px", md: "140px" },
                      textAlign: "center",
                      fontSize: { xs: "13px", sm: "14px", md: "15px" },
                      color: "#1F1B13",
                      flex: { xs: 1, sm: "none" },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCalendarClick();
                    }}
                  >
                    {currentMonth} {currentYear}
                  </Typography>
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextMonth();
                    }}
                    sx={{
                      minWidth: "auto",
                      padding: { xs: "2px 4px", md: "4px 8px" },
                      color: "#1F1B13",
                      fontWeight: "600",
                      fontSize: { xs: "16px", sm: "17px", md: "18px" },
                      "&:hover": {
                        backgroundColor: "rgba(253, 190, 22, 0.1)",
                      },
                    }}
                  >
                    ›
                  </Button>
                  <CalendarMonthIcon
                    sx={{
                      fontSize: { xs: "14px", sm: "15px", md: "16px" },
                      ml: { xs: 0, sm: 0.5 },
                      cursor: "pointer",
                      color: "#1F1B13",
                      display: { xs: "none", sm: "block" },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCalendarClick();
                    }}
                  />
                </Box>
              </Box>

              <CalendarContainer>
                <HorizontalCalendarScroll>
                  {calendarDays.map((dayData, index) => {
                    const dateAttendance =
                      dayWiseAttendanceData[dayData.dateString] || null;
                    const isSelected = dayData.dateString === selectedDate;
                    const isMarked =
                      dateAttendance && dateAttendance.totalCount > 0;
                    const attendancePercentage =
                      dateAttendance?.percentage || 0;

                    const currentDate = new Date();
                    currentDate.setHours(0, 0, 0, 0);
                    const dayDate = new Date(dayData.fullDate);
                    dayDate.setHours(0, 0, 0, 0);
                    const isToday =
                      dayDate.getTime() === currentDate.getTime();

                    return (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "2px",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: { xs: "0.65em", sm: "0.7em", md: "0.75em" },
                            fontWeight: "700",
                            color: isToday ? "#fdbe16" : "#1F1B13",
                            lineHeight: 1,
                            marginBottom: { xs: "2px", md: "4px" },
                            textTransform: "uppercase",
                            letterSpacing: { xs: "0.3px", md: "0.5px" },
                          }}
                        >
                          {isToday ? "Today" : dayData.day}
                        </Typography>
                        <CalendarCell
                          onClick={() => handleDateClick(dayData.dateString)}
                          sx={{
                            backgroundColor: isSelected
                              ? "#fbbc13"
                              : isToday
                              ? "#fffdf7"
                              : "#fff",
                            borderColor: isSelected
                              ? "#fbbc13"
                              : isToday
                              ? "#fdbe16"
                              : (theme.palette.warning as any).A100,
                            borderWidth: isSelected || isToday ? "2px" : "1px",
                          }}
                        >
                          <DateNumber variant="body2">
                            {dayData.date}
                          </DateNumber>
                          {isMarked ? (
                            <Box
                              sx={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: { xs: "16px", sm: "18px", md: "20px" },
                                height: { xs: "16px", sm: "18px", md: "20px" },
                                marginTop: { xs: "1px", md: "2px" },
                              }}
                            >
                              <CircularProgress
                                variant="determinate"
                                value={attendancePercentage}
                                size={20}
                                thickness={10}
                                sx={{
                                  color: "#4caf50",
                                  position: "absolute",
                                  width: { xs: "16px", sm: "18px", md: "20px" },
                                  height: { xs: "16px", sm: "18px", md: "20px" },
                                  "& .MuiCircularProgress-circle": {
                                    strokeLinecap: "round",
                                  },
                                }}
                              />
                            </Box>
                          ) : null}
                        </CalendarCell>
                      </Box>
                    );
                  })}
                </HorizontalCalendarScroll>
              </CalendarContainer>
            </Box>

            <Box sx={{ padding: { xs: "0 10px", sm: "0 15px", md: "0 20px" } }}>
              <Divider sx={{ borderBottomWidth: "0.1rem" }} />
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              margin: { xs: "15px 10px", md: "20px 35px 20px 25px" },
              flexWrap: { xs: "wrap", md: "nowrap" },
            }}
          >
          <Box
            height={"auto"}
            flex={1}
            minWidth={{ xs: "100%", md: 0 }}
            padding={{ xs: "1rem 1.5rem", md: "1.5rem 2rem" }}
            borderRadius={"16px"}
            bgcolor={"#E8E8E8"}
            textAlign={"left"}
            sx={{
              opacity: classId === "all" ? 0.5 : 1,
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
              transition: "transform 0.2s, box-shadow 0.2s",
              background: "linear-gradient(135deg, #E8E8E8 0%, #F5F5F5 100%)",
              "&:hover": {
                transform: { xs: "none", md: "translateY(-3px)" },
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              },
            }}
            justifyContent={"space-between"}
            display={"flex"}
            flexDirection={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={{ xs: 2, sm: 0 }}
          >
            <Box display="flex" alignItems="center" gap="12px">
              {currentAttendance !== "notMarked" &&
                currentAttendance !== "futureDate" && (
                  <>
                    <Box sx={{ width: { xs: "24px", sm: "28px", md: "30px" }, height: { xs: "24px", sm: "28px", md: "30px" } }}>
                      <CircularProgressbar
                        value={
                          attendanceData?.numberOfCohortMembers &&
                          attendanceData.numberOfCohortMembers !== 0
                            ? (attendanceData.presentCount /
                                attendanceData.numberOfCohortMembers) *
                              100
                            : 0
                        }
                        styles={buildStyles({
                          pathColor: "#4caf50",
                          trailColor: "#E6E6E6",
                          strokeLinecap: "round",
                          backgroundColor: "#fff",
                        })}
                        strokeWidth={20}
                        background
                        backgroundPadding={6}
                      />
                    </Box>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: { xs: "12px", sm: "13px", md: "14px" },
                          fontWeight: "700",
                          color: "#1F1B13",
                          letterSpacing: "0.3px",
                        }}
                        variant="h6"
                      >
                        {attendanceData?.numberOfCohortMembers &&
                        attendanceData.numberOfCohortMembers !== 0
                          ? (
                              (attendanceData.presentCount /
                                attendanceData.numberOfCohortMembers) *
                              100
                            ).toFixed(2)
                          : "0"}
                        % Attendance
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: { xs: "11px", sm: "12px", md: "13px" },
                          fontWeight: "500",
                          color: "#666",
                          marginTop: "2px",
                        }}
                        variant="body2"
                      >
                        ({attendanceData.presentCount}/
                        {attendanceData.numberOfCohortMembers} present)
                      </Typography>
                    </Box>
                  </>
                )}
              {currentAttendance === "notMarked" && (
                <Typography
                  sx={{
                    color: "#666",
                    fontWeight: "500",
                  }}
                  fontSize={"0.9rem"}
                >
                  Not started
                </Typography>
              )}
              {currentAttendance === "futureDate" && (
                <Typography
                  sx={{
                    color: "#666",
                  }}
                  fontSize={"0.9rem"}
                  fontStyle={"italic"}
                  fontWeight={"500"}
                >
                  Future date - can't mark
                </Typography>
              )}
            </Box>
            <Button
              className="btn-mark-width"
              variant="contained"
              color="primary"
              sx={{
                minWidth: { xs: "100%", sm: "100px", md: "120px" },
                height: { xs: "2.25rem", sm: "2.5rem", md: "2.75rem" },
                padding: { xs: theme.spacing(1), sm: theme.spacing(1.25), md: theme.spacing(1.5) },
                fontWeight: "600",
                fontSize: { xs: "12px", sm: "13px", md: "14px" },
                borderRadius: { xs: "6px", md: "8px" },
                boxShadow: "0 4px 12px rgba(251, 188, 19, 0.4)",
                "&:hover": {
                  boxShadow: "0 6px 16px rgba(251, 188, 19, 0.5)",
                  transform: { xs: "none", md: "translateY(-1px)" },
                },
                transition: "all 0.2s",
              }}
              disabled={classId === "all"}
              onClick={handleRemoteSession}
            >
              {currentAttendance === "notMarked" ? "Mark" : "Modify"}
            </Button>
          </Box>
          {ShowSelfAttendance && (
            <Box
              height={"auto"}
              flex={1}
              minWidth={{ xs: "100%", md: 0 }}
              padding={{ xs: "1rem 1.5rem", md: "1.5rem 2rem" }}
              borderRadius={"16px"}
              bgcolor={"#E8E8E8"}
              textAlign={"left"}
              sx={{
                opacity: classId === "all" ? 0.5 : 1,
                boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
                transition: "transform 0.2s, box-shadow 0.2s",
                background: "linear-gradient(135deg, #E8E8E8 0%, #F5F5F5 100%)",
                "&:hover": {
                  transform: { xs: "none", md: "translateY(-3px)" },
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                },
              }}
              justifyContent={"space-between"}
              display={"flex"}
              flexDirection={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              gap={{ xs: 2, sm: 0 }}
            >
              <Box display="flex" alignItems="center" gap="12px">
                {selfAttendanceData?.length > 0 ? (
                  <Box display={"flex"} alignItems={"center"}>
                    <Typography
                      sx={{
                        color: "#1F1B13",
                        fontWeight: "600",
                        fontSize: { xs: "0.85rem", sm: "0.9rem", md: "0.95rem" },
                      }}
                    >
                      {selfAttendanceData[0]?.attendance?.toLowerCase() ===
                      ATTENDANCE_ENUM.PRESENT
                        ? "Present"
                        : selfAttendanceData[0]?.attendance?.toLowerCase() ===
                          ATTENDANCE_ENUM.ABSENT
                        ? "Absent"
                        : selfAttendanceData[0]?.attendance}
                    </Typography>
                    {selfAttendanceData[0]?.attendance?.toLowerCase() ===
                    ATTENDANCE_ENUM.PRESENT ? (
                      <CheckCircleOutlineIcon
                        fontSize="small"
                        sx={{
                          color: theme.palette.success.main,
                          marginLeft: "4px",
                        }}
                      />
                    ) : selfAttendanceData[0]?.attendance?.toLowerCase() ===
                      ATTENDANCE_ENUM.ABSENT ? (
                      <WarningAmberIcon
                        fontSize="small"
                        sx={{
                          color: theme.palette.error.main,
                          marginLeft: "4px",
                        }}
                      />
                    ) : null}
                  </Box>
                ) : (
                  <Typography
                    sx={{
                      color: "#666",
                      fontWeight: "500",
                    }}
                    fontSize={"0.9rem"}
                  >
                    Not Marked For Self
                  </Typography>
                )}
              </Box>
              <Button
                className="btn-mark-width"
                variant="contained"
                color="primary"
                sx={{
                  minWidth: { xs: "100%", sm: "100px", md: "120px" },
                  height: { xs: "2.25rem", sm: "2.5rem", md: "2.75rem" },
                  padding: { xs: theme.spacing(1), sm: theme.spacing(1.25), md: theme.spacing(1.5) },
                  fontWeight: "600",
                  fontSize: { xs: "12px", sm: "12px", md: "13px" },
                  borderRadius: { xs: "6px", md: "8px" },
                  boxShadow: "0 4px 12px rgba(251, 188, 19, 0.4)",
                  "&:hover": {
                    boxShadow: "0 6px 16px rgba(251, 188, 19, 0.5)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.2s",
                }}
                disabled={classId === "all"}
                onClick={() => {
                  setIsLocationModalOpen(true);
                }}
              >
                {selfAttendanceData?.length > 0 &&
                (selfAttendanceData[0]?.attendance?.toLowerCase() ===
                  ATTENDANCE_ENUM.PRESENT ||
                  selfAttendanceData[0]?.attendance?.toLowerCase() ===
                    ATTENDANCE_ENUM.ABSENT)
                  ? "Modify For Self"
                  : "Mark For Self"}
              </Button>
            </Box>
          )}
          </Box>
          <Box
            sx={{
              padding: { xs: "1rem", md: "1.5rem 1.5rem" },
              backgroundColor: "#fffdf7",
              borderRadius: "12px",
              margin: { xs: "0 10px 15px", md: "0 20px 20px" },
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <Box
              mb={3}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                paddingBottom: "12px",
                borderBottom: "2px solid rgba(253, 190, 22, 0.2)",
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  fontWeight="700"
                  color="#1F1B13"
                  sx={{ fontSize: "18px", mb: 0.5 }}
                >
                  Overview
                </Typography>
                <Typography variant="body2" color="#666" sx={{ fontSize: "13px" }}>
                  Last 7 Days {dateRange}
                </Typography>
              </Box>

              <Link href="/attendance-overview" legacyBehavior>
                <a
                  onClick={(e) => {
                    e.preventDefault();
                    clickAttendanceOverview();
                  }}
                  style={{
                    color: "#1890ff",
                    textDecoration: "none",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    fontSize: "14px",
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#40a9ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#1890ff";
                  }}
                >
                  More Details →
                </a>
              </Link>
            </Box>
            {loading ? (
              <Typography>Loading...</Typography>
            ) : (
              <Grid container spacing={2}>
                {classId && classId !== "all" ? (
                  <>
                    <Grid item xs={12} md={4}>
                      <StatusCard>
                        <CardContent sx={{ pt: 2 }}>
                          <Box textAlign="center" mb={2} p={2}>
                            <Typography
                              fontSize={"14px"}
                              fontWeight="600"
                              color="#1F1B13"
                              sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: "0.5px" }}
                            >
                              Center Attendance
                            </Typography>
                            <Typography
                              fontWeight="700"
                              color="#4caf50"
                              sx={{ fontSize: "28px", lineHeight: 1.2, mb: 0.5 }}
                            >
                              {cohortPresentPercentage === "No Attendance"
                                ? cohortPresentPercentage
                                : `${cohortPresentPercentage}%`}
                            </Typography>
                            {cohortPresentPercentage !== "No Attendance" && (
                              <Typography
                                variant="caption"
                                color="#666"
                                sx={{ fontSize: "11px" }}
                              >
                                Overall attendance
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                      </StatusCard>
                    </Grid>

                    <Grid item xs={12} md={8}>
                      <StatusCard>
                        <CardContent sx={{ pt: 2 }}>
                          <Box textAlign="center" mb={2} p={2}>
                            <Typography
                              fontSize={"14px"}
                              fontWeight="600"
                              color="#1F1B13"
                              sx={{ mb: 1.5, textTransform: "uppercase", letterSpacing: "0.5px" }}
                            >
                              Low Attendance Learners
                            </Typography>
                            <Typography
                              fontWeight="500"
                              color="rgb(124, 118, 111)"
                              sx={{ fontSize: "15px", lineHeight: 1.6 }}
                            >
                              {Array.isArray(lowAttendanceLearnerList) &&
                              lowAttendanceLearnerList.length > 0 ? (
                                <>
                                  {lowAttendanceLearnerList
                                    .slice(0, 2)
                                    .join(", ")}
                                  {lowAttendanceLearnerList.length > 2 && (
                                    <>
                                      {" "}
                                      and{" "}
                                      <Link
                                        href="/attendance-overview"
                                        legacyBehavior
                                      >
                                        <a
                                          onClick={(e) => {
                                            e.preventDefault();
                                            clickAttendanceOverview();
                                          }}
                                          style={{
                                            color: "#1890ff",
                                            textDecoration: "none",
                                            fontWeight: "600",
                                            cursor: "pointer",
                                          }}
                                        >
                                          more
                                        </a>
                                      </Link>
                                    </>
                                  )}
                                </>
                              ) : (
                                <Typography
                                  sx={{
                                    color: "#4caf50",
                                    fontWeight: "500",
                                    fontStyle: "italic",
                                  }}
                                >
                                  No Learners with Low Attendance
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                        </CardContent>
                      </StatusCard>
                    </Grid>
                  </>
                ) : (
                  allCenterAttendanceData.map((item: any) => (
                    <Grid item xs={12} md={6} key={item.userId}>
                      <StatusCard>
                        <CardContent sx={{ pt: 0 }}>
                          <Box textAlign="center" mb={2} p={2}>
                            <Typography
                              fontSize={"11px"}
                              color="rgb(124, 118, 111)"
                            >
                              {item.name}
                            </Typography>
                            <Typography
                              fontWeight="700"
                              color="#000000"
                              sx={{ fontSize: "16px", lineHeight: 1 }}
                            >
                              {item.presentPercentage}%
                            </Typography>
                          </Box>
                        </CardContent>
                      </StatusCard>
                    </Grid>
                  ))
                )}
              </Grid>
            )}
          </Box>
        </ContentWrapper>
      </MainContent>
      {open && (
        <MarkBulkAttendance
          open={open}
          onClose={handleClose}
          classId={classId}
          selectedDate={new Date(selectedDate)}
          onSaveSuccess={handleSaveSuccess}
          memberList={attendanceData?.cohortMemberList}
          presentCount={attendanceData?.presentCount}
          absentCount={attendanceData?.absentCount}
          numberOfCohortMembers={attendanceData?.numberOfCohortMembers}
          dropoutMemberList={attendanceData?.dropoutMemberList}
          dropoutCount={attendanceData?.dropoutCount}
          bulkStatus={attendanceData?.bulkAttendanceStatus}
        />
      )}
      {isRemoteCohort && (
        <ModalComponent
          open={isRemoteCohort}
          heading={t("COMMON.MARK_CENTER_ATTENDANCE")}
          secondaryBtnText={t("COMMON.CANCEL")}
          btnText={t("COMMON.YES_MANUALLY")}
          selectedDate={selectedDate ? new Date(selectedDate) : undefined}
          onClose={handleClose}
          handlePrimaryAction={() => handleModalToggle()}
        >
          <Box sx={{ padding: "0 16px" }}>
            <Box
              sx={{
                color: (theme?.palette?.warning as any)?.["300"],
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              {t("COMMON.ARE_YOU_SURE_MANUALLY")}
            </Box>
            <Box
              sx={{
                color: (theme?.palette?.warning as any)?.["300"],
                fontSize: "14px",
                fontWeight: "400",
                mt: "10px",
              }}
            >
              {t("COMMON.ATTENDANCE_IS_USUALLY")}
            </Box>
            <Box
              sx={{
                color: (theme?.palette?.warning as any)?.["300"],
                fontSize: "14px",
                fontWeight: "400",
                mt: "10px",
              }}
            >
              {t("COMMON.USE_MANUAL")}
            </Box>
            <Box
              sx={{
                color: (theme?.palette?.warning as any)?.["300"],
                fontSize: "14px",
                fontWeight: "500",
                mt: "10px",
              }}
            >
              {t("COMMON.NOTE_MANUALLY")}
            </Box>
          </Box>
        </ModalComponent>
      )}
      {isLocationModalOpen && (
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          onConfirm={requestLocationPermission}
        />
      )}
      {isSelfAttendanceModalOpen && (
        <ModalComponent
          open={isSelfAttendanceModalOpen}
          heading="Attendance"
          secondaryBtnText="Cancel"
          btnText="Mark"
          selectedDate={selectedDate ? new Date(selectedDate) : undefined}
          onClose={() => {
            setIsSelfAttendanceModalOpen(false);
            const currentAttendance = selfAttendanceData?.[0]?.attendance;
            setSelectedSelfAttendance(
              currentAttendance ? currentAttendance.toLowerCase() : null
            );
          }}
          handlePrimaryAction={() => {
            if (selectedSelfAttendance) {
              handleMarkSelfAttendance();
            }
          }}
        >
          <Box sx={{ padding: "0 16px" }}>
            <Box
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              mb={2}
            >
              <Typography
                variant="h2"
                sx={{
                  color: (theme.palette.warning as any).A200,
                  fontSize: "14px",
                }}
                component="h2"
              >
                Present
              </Typography>
              <Radio
                onChange={() =>
                  setSelectedSelfAttendance(ATTENDANCE_ENUM.PRESENT)
                }
                value={ATTENDANCE_ENUM.PRESENT}
                checked={selectedSelfAttendance === ATTENDANCE_ENUM.PRESENT}
              />
            </Box>
            <Divider />
            <Box
              display={"flex"}
              justifyContent={"space-between"}
              alignItems={"center"}
              mb={2}
              mt={2}
            >
              <Typography
                variant="h2"
                sx={{
                  color: (theme.palette.warning as any).A200,
                  fontSize: "14px",
                }}
                component="h2"
              >
                Absent
              </Typography>
              <Radio
                onChange={() =>
                  setSelectedSelfAttendance(ATTENDANCE_ENUM.ABSENT)
                }
                value={ATTENDANCE_ENUM.ABSENT}
                checked={selectedSelfAttendance === ATTENDANCE_ENUM.ABSENT}
              />
            </Box>
          </Box>
        </ModalComponent>
      )}
            </DashboardContainer>
          </Grid>
        </Grid>
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
    </Layout>
  );
};

export default SimpleTeacherDashboard;

