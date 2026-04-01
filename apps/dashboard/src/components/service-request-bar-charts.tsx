"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export type ServiceChartSeries = {
  tenantId: string;
  serviceId: string;
  labels: string[];
  days: string[];
  success: number[];
  unauthorized: number[];
  clientError: number[];
  serverError: number[];
};

const COLORS = {
  success: "rgba(16, 185, 129, 0.85)",
  unauthorized: "rgba(245, 158, 11, 0.9)",
  clientError: "rgba(249, 115, 22, 0.9)",
  serverError: "rgba(244, 63, 94, 0.9)",
} as const;

function useChartTheme() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = () =>
      root.classList.contains("dark") || window.matchMedia("(prefers-color-scheme: dark)").matches;
    setIsDark(read());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => setIsDark(read());
    const obs = new MutationObserver(() => setIsDark(read()));
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    mq.addEventListener("change", onMq);
    return () => {
      obs.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, []);
  const tickColor = isDark ? "#a3a3a3" : "#525252";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  return { tickColor, gridColor };
}

function ServiceChartCard({
  s,
  tickColor,
  gridColor,
}: {
  s: ServiceChartSeries;
  tickColor: string;
  gridColor: string;
}) {

  const data: ChartData<"bar"> = useMemo(
    () => ({
      labels: s.labels,
      datasets: [
        { label: "2xx", data: s.success, backgroundColor: COLORS.success, stack: "req" },
        { label: "401", data: s.unauthorized, backgroundColor: COLORS.unauthorized, stack: "req" },
        {
          label: "4xx (excl. 401)",
          data: s.clientError,
          backgroundColor: COLORS.clientError,
          stack: "req",
        },
        { label: "5xx", data: s.serverError, backgroundColor: COLORS.serverError, stack: "req" },
      ],
    }),
    [s]
  );

  const options: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        title: {
          display: true,
          text: `${s.serviceId} · ${s.tenantId}`,
          color: tickColor,
          font: { size: 15, weight: "bold" },
        },
        legend: {
          position: "top",
          labels: { color: tickColor, boxWidth: 12, padding: 12 },
        },
        tooltip: {
          callbacks: {
            footer: (items) => {
              const i = items[0]?.dataIndex ?? 0;
              const total =
                s.success[i] + s.unauthorized[i] + s.clientError[i] + s.serverError[i];
              return `Total requests: ${total}`;
            },
          },
        },
      },
      scales: {
        x: {
          stacked: true,
          ticks: { color: tickColor, maxRotation: 45, minRotation: 0 },
          grid: { color: gridColor },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: { color: tickColor },
          grid: { color: gridColor },
          title: { display: true, text: "Requests", color: tickColor },
        },
      },
    }),
    [s, tickColor, gridColor]
  );

  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="h-80 min-h-[16rem] w-full min-w-0 rounded-xl border border-neutral-200 bg-white p-3 sm:p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <Bar data={data} options={options} />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
        <span className="font-medium text-neutral-600 dark:text-neutral-300">Drill down:</span>
        {s.days.map((day, i) => {
          const tenantQ = encodeURIComponent(s.tenantId);
          const svcQ = encodeURIComponent(s.serviceId);
          const href = `/services/${svcQ}/day/${day}?tenant=${tenantQ}`;
          return (
            <Link key={day} className="text-blue-600 underline hover:text-blue-800 dark:text-blue-400" href={href}>
              {s.labels[i]}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function ServiceRequestBarCharts({ series }: { series: ServiceChartSeries[] }) {
  const { tickColor, gridColor } = useChartTheme();
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-8 xl:grid-cols-3 xl:gap-10">
      {series.map((s) => (
        <ServiceChartCard
          key={`${s.tenantId}-${s.serviceId}`}
          s={s}
          tickColor={tickColor}
          gridColor={gridColor}
        />
      ))}
    </div>
  );
}
