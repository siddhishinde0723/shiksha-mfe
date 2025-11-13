"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Layout from "@learner/components/Layout";
import { AccountCircleOutlined } from "@mui/icons-material";
import { getCohortList } from "@learner/utils/API/services/CohortServices";
import { getUserDetails } from "@learner/utils/API/services/ProfileService";
import {
  getCohortAttendance,
  classesMissedAttendancePercentList,
} from "@learner/utils/API/services/AttendanceService";
import { getMyCohortMemberList } from "@learner/utils/API/services/MyClassDetailsService";
import { AttendanceAPILimit } from "../../../app.config";
import { ICohort } from "@learner/utils/attendance/interfaces";
import { getTodayDate, shortDateFormat } from "@learner/utils/attendance/helper";

const AttendanceOverviewPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClassId = searchParams.get("classId");
  
  const [classId, setClassId] = useState(initialClassId || "");
  const [cohortsData, setCohortsData] = useState<Array<ICohort>>([]);
  const [centersData, setCentersData] = useState<Array<any>>([]);
  const [batchesData, setBatchesData] = useState<Array<any>>([]);
  const [selectedCenterId, setSelectedCenterId] = useState("");
  const [loading, setLoading] = useState(false);
  const [presentPercentage, setPresentPercentage] = useState<string | number>("");
  const [lowAttendanceLearnerList, setLowAttendanceLearnerList] = useState<any[]>([]);
  const [learnerData, setLearnerData] = useState<Array<any>>([]);

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
    if (classId) {
      fetchAttendanceData();
    }
  }, [classId]);

  const fetchAttendanceData = async () => {
    if (!classId) return;

    try {
      setLoading(true);
      
      // Get cohort members
      const memberResponse = await getMyCohortMemberList({
        limit: 300,
        page: 0,
        filters: { cohortId: classId },
        includeArchived: true,
      });

      const members = memberResponse?.result?.userDetails || [];
      const nameUserIdArray = members.map((entry: any) => ({
        userId: entry.userId,
        name: `${entry.firstName || ""} ${entry.lastName || ""}`.trim(),
        memberStatus: entry.status,
      }));

      // Get attendance statistics
      const todayFormatted = getTodayDate();
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 6);
      const fromDate = shortDateFormat(last7Days);

      const attendanceFilters: any = {
        scope: "student",
        contextId: classId,
        fromDate,
        toDate: todayFormatted,
      };

      // Get cohort attendance percentage
      const cohortAttendanceData = {
        limit: AttendanceAPILimit,
        page: 0,
        filters: attendanceFilters,
        facets: ["contextId"],
        sort: ["present_percentage", "asc"],
      };

      const cohortRes = await getCohortAttendance(cohortAttendanceData);
      const contextData = cohortRes?.data?.result?.contextId?.[classId];
      
      if (contextData?.present_percentage) {
        setPresentPercentage(contextData.present_percentage);
      } else if (contextData?.absent_percentage) {
        setPresentPercentage(0);
      } else {
        setPresentPercentage("No Attendance");
      }

      // Get low attendance learners
      const lowAttendanceResponse = await classesMissedAttendancePercentList({
        filters: attendanceFilters,
        facets: ["userId"],
        sort: ["present_percentage", "asc"],
      });

      const userIdData = lowAttendanceResponse?.data?.result?.userId || {};
      const filteredData = Object.keys(userIdData).map((userId) => ({
        userId,
        absent: userIdData[userId]?.absent || "0",
        present: userIdData[userId]?.present || "0",
        present_percent: userIdData[userId]?.present_percentage || "0",
        absent_percent: userIdData[userId]?.absent_percentage || "0",
      }));

      const mergedArray = filteredData.map((attendance) => {
        const user = nameUserIdArray.find(
          (user: { userId: string }) => user.userId === attendance.userId
        );
        return {
          ...attendance,
          name: user ? user.name : "Unknown",
          memberStatus: user ? user.memberStatus : "Unknown",
        };
      }).filter((item) => item.name !== "Unknown");

      setLearnerData(mergedArray);

      // Get low attendance learners (less than 50%)
      const lowAttendance = mergedArray.filter(
        (user) => parseFloat(user.present_percent) < 50
      );
      setLowAttendanceLearnerList(
        lowAttendance.map((student) => student.name)
      );
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      _topAppBar={{
        navLinks: [
          {
            title: "Profile",
            icon: <AccountCircleOutlined sx={{ width: 28, height: 28 }} />,
            to: () => router.push("/profile"),
            isActive: false,
            customStyle: {},
          },
        ],
      }}
    >
      <Box sx={{ p: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push("/attandence")}
          sx={{ mb: 2 }}
        >
          Back to Attendance
        </Button>

        <Box
          sx={{
            backgroundColor: "#fffdf7",
            borderRadius: "8px",
            p: 3,
            mb: 3,
          }}
        >
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 500 }}>
            Attendance Overview
          </Typography>

          {/* Center and Batch Dropdowns */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            {centersData.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
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
              <FormControl size="small" sx={{ minWidth: 200 }}>
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

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Overview Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Center Attendance
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        {typeof presentPercentage === "number"
                          ? `${presentPercentage}%`
                          : presentPercentage}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={8}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Low Attendance Learners
                      </Typography>
                      <Typography variant="body1">
                        {lowAttendanceLearnerList.length > 0
                          ? lowAttendanceLearnerList.slice(0, 3).join(", ") +
                            (lowAttendanceLearnerList.length > 3
                              ? ` and ${lowAttendanceLearnerList.length - 3} more`
                              : "")
                          : "No learners with low attendance"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Learner List */}
              {learnerData.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Learner Attendance Details
                  </Typography>
                  <Box sx={{ maxHeight: "500px", overflowY: "auto" }}>
                    {learnerData.map((learner) => (
                      <Card key={learner.userId} sx={{ mb: 1 }}>
                        <CardContent>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography variant="body1" fontWeight="500">
                              {learner.name}
                            </Typography>
                            <Box sx={{ textAlign: "right" }}>
                              <Typography variant="body2" color="textSecondary">
                                Present: {learner.present} | Absent: {learner.absent}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {Math.floor(parseFloat(learner.present_percent))}%
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>
    </Layout>
  );
};

export default AttendanceOverviewPage;
