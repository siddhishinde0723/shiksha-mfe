export const getTodayDate = () => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const shortDateFormat = (date: Date | string) => {
  // Handle both Date objects and date strings
  let dateObj: Date;
  if (typeof date === "string") {
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Otherwise, try to parse it
    dateObj = new Date(date);
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.error("Invalid date string:", date);
      return getTodayDate(); // Return today's date as fallback
    }
  } else {
    dateObj = date;
  }
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getDayMonthYearFormat = (dateString: string) => {
  const [year, monthIndex, day] = dateString.split("-");
  const date = new Date(
    parseInt(year, 10),
    parseInt(monthIndex, 10) - 1,
    parseInt(day, 10)
  );
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

const getLocalStorageValue = (key: string) => {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(key) || "";
  } catch (error) {
    console.warn(`[attendance.helper] Unable to read localStorage key ${key}`, error);
    return "";
  }
};

export const getCurrentUserIdentifiers = () => {
  const userId = getLocalStorageValue("userId");
  const userName =
    getLocalStorageValue("userName") ||
    getLocalStorageValue("username") ||
    "";
  return {
    userId,
    userName: userName.toLowerCase(),
  };
};

type MemberWithUserIdentifiers = {
  userId?: string;
  username?: string;
  userName?: string;
};

export const filterMembersExcludingCurrentUser = <T extends MemberWithUserIdentifiers>(
  members: T[] = []
): T[] => {
  const { userId: currentUserId, userName: currentUserName } = getCurrentUserIdentifiers();

  if (!currentUserId && !currentUserName) {
    return members;
  }

  return members.filter((member) => {
    const matchesUserId = currentUserId && member.userId === currentUserId;
    const memberUserName = (member.username || member.userName || "").toLowerCase();
    const matchesUserName = currentUserName && memberUserName === currentUserName;
    return !matchesUserId && !matchesUserName;
  });
};

