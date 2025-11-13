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

const DashboardContainer = styled(Box)({
  minHeight: "100vh",
  backgroundColor: "#f5f5f5",
  marginRight: "20px",
});

const HeaderBox = styled(Box)({
  display: "flex",
  justifyContent: "center",
});

const HeaderContent = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "100%",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: (theme.palette.warning as any).A400,
  padding: "1rem 1.5rem",
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
  borderRadius: "8px",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  border: "1px solid #e0e0e0",
  "& .MuiCardContent-root": {
    padding: "16px",
  },
}));

const CalendarContainer = styled(Box)({
  marginTop: "16px",
});

const HorizontalCalendarScroll = styled(Box)({
  display: "flex",
  overflowX: "auto",
  gap: "8px",
  padding: "8px 0",
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
});

const CalendarCell = styled(Box)(({ theme }) => ({
  position: "relative",
  height: "3.5rem",
  width: "3rem",
  minWidth: "3rem",
  padding: "4px",
  overflow: "hidden",
  fontSize: "0.875em",
  border: `1px solid ${(theme.palette.warning as any).A100}`,
  borderRadius: "4px",
  cursor: "pointer",
  transition: "0.25s ease-out",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "center",
  backgroundColor: "#fff",
  "&:hover": {
    backgroundColor: "#f5f5f5",
  },
}));

const DateNumber = styled(Typography)({
  fontSize: "0.875em",
  fontWeight: "500",
  lineHeight: 1,
  marginTop: "2px",
});

const SimpleTeacherDashboard = () => {
  const theme = useTheme();
  const [classId, setClassId] = useState("1");
  const [yearSelect, setYearSelect] = useState("2025-2026");
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
  const { getLocation } = useGeolocation();

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
      if (storedTenantId) {
        ensureAcademicYearForTenant(storedTenantId);
      }
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
        setClassId(response[0]?.cohortId || "");
        const centers = response.map((center: any) => ({
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

          if (batches.length > 0) {
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
    <DashboardContainer>
      <HeaderBox>
        <HeaderContent>
          <Typography
            textAlign={"left"}
            fontSize={"22px"}
            m={"1.5rem 1.2rem 0.8rem"}
            color={(theme?.palette?.warning as any)?.["300"]}
          >
            Attendance
          </Typography>
          <Select
            value={yearSelect}
            onChange={handleChangeYear}
            size="small"
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
            <MenuItem value="2025-2026">2025-2026</MenuItem>
          </Select>
        </HeaderContent>
      </HeaderBox>
      <Box
        sx={{
          backgroundColor: "#fff",
          px: "2.5rem",
          pb: 1,
        }}
      >
        <Tabs
          value="attendance"
          onChange={handleTopTabChange}
          aria-label="Attendance navigation tabs"
        >
          <Tab label="Courses" value="Course" />
          <Tab label="Content" value="content" />
          <Tab label="Groups" value="groups" />
          <Tab label="Attendance" value="attendance" />
        </Tabs>
      </Box>

      <MainContent>
        <ContentWrapper>
          <Box>
            <Box
              display={"flex"}
              flexDirection={"column"}
              padding={"1.5rem 2.2rem 1rem 1.2rem"}
            >
              <Box
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                marginBottom={"16px"}
                marginRight={"25px"}
              >
                <Typography
                  variant="h2"
                  sx={{ fontSize: "14px" }}
                  color={(theme.palette.warning as any)["300"]}
                  fontWeight={"500"}
                >
                  Day-Wise Attendance
                </Typography>
                {centersData.length > 0 && (
                  <Box sx={{ padding: "0 1.2rem 1rem" }}>
                    <FormControl
                      fullWidth
                      size="small"
                      sx={{ maxWidth: "200px" }}
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

                {batchesData.length > 0 && (
                  <Box sx={{ padding: "0 1.2rem 1rem" }}>
                    <FormControl
                      fullWidth
                      size="small"
                      sx={{ maxWidth: "200px" }}
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

                <Box
                  display={"flex"}
                  sx={{
                    cursor: "pointer",
                    color: theme.palette.secondary.main,
                    gap: "4px",
                    alignItems: "center",
                  }}
                  onClick={handleCalendarClick}
                >
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviousMonth();
                    }}
                    sx={{ minWidth: "auto", padding: "4px" }}
                  >
                    ‹
                  </Button>
                  <Typography
                    style={{
                      fontWeight: "500",
                      minWidth: "100px",
                      textAlign: "center",
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
                    sx={{ minWidth: "auto", padding: "4px" }}
                  >
                    ›
                  </Button>
                  <CalendarMonthIcon
                    sx={{ fontSize: "12px", ml: 0.5, cursor: "pointer" }}
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
                            fontSize: "0.7em",
                            fontWeight: "600",
                            color: "#666",
                            lineHeight: 1,
                            marginBottom: "2px",
                          }}
                        >
                          {isToday ? "Today" : dayData.day}
                        </Typography>
                        <CalendarCell
                          onClick={() => handleDateClick(dayData.dateString)}
                          sx={{
                            backgroundColor: isSelected
                              ? theme.palette.primary.light
                              : "#fff",
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
                                width: "20px",
                                height: "20px",
                                marginTop: "2px",
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

            <Box sx={{ padding: "0 20px" }}>
              <Divider sx={{ borderBottomWidth: "0.1rem" }} />
            </Box>
          </Box>
          <Box
            height={"auto"}
            width={"auto"}
            padding={"1rem"}
            borderRadius={"1rem"}
            bgcolor={"#4A4640"}
            textAlign={"left"}
            margin={"15px 35px 15px 25px"}
            sx={{ opacity: classId === "all" ? 0.5 : 1 }}
            justifyContent={"space-between"}
            display={"flex"}
            alignItems={"center"}
          >
            <Box display="flex" alignItems="center" gap="12px">
              {currentAttendance !== "notMarked" &&
                currentAttendance !== "futureDate" && (
                  <>
                    <Box sx={{ width: "30px", height: "30px" }}>
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
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#F4F4F4",
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
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#F4F4F4",
                        }}
                        variant="h6"
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
                    color: (theme.palette.warning as any).A400,
                  }}
                  fontSize={"0.8rem"}
                >
                  Not started
                </Typography>
              )}
              {currentAttendance === "futureDate" && (
                <Typography
                  sx={{
                    color: (theme.palette.warning as any)["300"],
                  }}
                  fontSize={"0.8rem"}
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
                minWidth: "84px",
                height: "2.5rem",
                padding: theme.spacing(1),
                fontWeight: "500",
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
              width={"auto"}
              padding={"1rem"}
              borderRadius={"1rem"}
              bgcolor={"#4A4640"}
              textAlign={"left"}
              margin={"15px 35px 15px 25px"}
              sx={{ opacity: classId === "all" ? 0.5 : 1 }}
              justifyContent={"space-between"}
              display={"flex"}
              alignItems={"center"}
            >
              <Box display="flex" alignItems="center" gap="12px">
                {selfAttendanceData?.length > 0 ? (
                  <Box display={"flex"} alignItems={"center"}>
                    <Typography
                      sx={{
                        color: (theme.palette.warning as any).A400,
                      }}
                      fontSize={"0.9rem"}
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
                      color: (theme.palette.warning as any).A400,
                    }}
                    fontSize={"0.8rem"}
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
                  minWidth: "84px",
                  height: "2.5rem",
                  padding: theme.spacing(1),
                  fontWeight: "500",
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
          <Box
            sx={{
              padding: "1rem 1.2rem",
            }}
          >
            <Box
              mb={2}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight="600" color="#333">
                  Overview
                </Typography>
                <Typography variant="caption" color="#666">
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
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                >
                  More Details
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
                        <CardContent sx={{ pt: 0 }}>
                          <Box textAlign="center" mb={2} p={2}>
                            <Typography fontSize={"13px"} color="#000000">
                              Center Attendance
                            </Typography>
                            <Typography
                              fontWeight="500"
                              color="rgb(124, 118, 111)"
                              sx={{ fontSize: "16px", lineHeight: 1 }}
                            >
                              {cohortPresentPercentage === "No Attendance"
                                ? cohortPresentPercentage
                                : `${cohortPresentPercentage}%`}
                            </Typography>
                          </Box>
                        </CardContent>
                      </StatusCard>
                    </Grid>

                    <Grid item xs={12} md={8}>
                      <StatusCard>
                        <CardContent sx={{ pt: 0 }}>
                          <Box textAlign="center" mb={2} p={2}>
                            <Typography fontSize={"13px"} color="#000000">
                              Low Attendance Learners
                            </Typography>
                            <Typography
                              fontWeight="500"
                              color="rgb(124, 118, 111)"
                              sx={{ fontSize: "16px", lineHeight: 1 }}
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
                                            fontWeight: "500",
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
                                "No Learners with Low Attendance"
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
  );
};

export default SimpleTeacherDashboard;

