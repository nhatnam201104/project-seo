import { useEffect, useState } from "react";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function formatClock(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const zone = `GMT${sign}${Math.floor(Math.abs(offsetMinutes) / 60)}`;
  const date = `${WEEKDAYS[now.getDay()]} ${MONTHS[now.getMonth()]} ${now.getDate()} ${now.getFullYear()}`;
  return `${time} (${zone}) ${date}`;
}

/**
 * Đồng hồ live cho header — tick mỗi giây, căn theo ranh giới giây thực để
 * không bị trôi. SSR trả về chuỗi rỗng (client điền sau khi hydrate để
 * tránh mismatch).
 */
export function useClock(): string {
  const [label, setLabel] = useState("");

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = new Date();
      setLabel(formatClock(now));
      // Hẹn đúng vào đầu giây kế tiếp thay vì interval cố định (tránh drift).
      timeoutId = setTimeout(tick, 1000 - now.getMilliseconds());
    };
    tick();
    return () => clearTimeout(timeoutId);
  }, []);

  return label;
}
