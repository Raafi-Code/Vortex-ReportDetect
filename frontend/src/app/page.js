"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  Forward,
  Users,
  Hash,
  Mail,
  Image as ImageIcon,
  TrendingUp,
} from "lucide-react";
import {
  getMessageStats,
  getMessageActivityOverTime,
  getTopGroups,
  getTopKeywords,
} from "@/lib/api";
import { useLanguage } from "@/contexts/language-context";
import MessageActivityChart from "@/components/charts/MessageActivityChart";
import TopGroupsChart from "@/components/charts/TopGroupsChart";
import TopKeywordsChart from "@/components/charts/TopKeywordsChart";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [topGroups, setTopGroups] = useState(null);
  const [topKeywords, setTopKeywords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState("week");
  const [customDates, setCustomDates] = useState({ start: "", end: "" });
  const { text } = useLanguage();

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Calculate date range based on timePeriod
        const now = new Date();
        let startDate;

        if (timePeriod === "week") {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (timePeriod === "month") {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (timePeriod === "year") {
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        } else if (timePeriod === "custom") {
          startDate = new Date(customDates.start);
        }

        const dateRange = {
          start_date: startDate.toISOString().split("T")[0],
          end_date:
            timePeriod === "custom"
              ? customDates.end
              : now.toISOString().split("T")[0],
          granularity:
            timePeriod === "week"
              ? "daily"
              : timePeriod === "month"
                ? "monthly"
                : timePeriod === "year"
                  ? "yearly"
                  : "daily",
        };

        const [statsRes, activityRes, groupsRes, keywordsRes] =
          await Promise.all([
            getMessageStats(),
            getMessageActivityOverTime(dateRange),
            getTopGroups(dateRange),
            getTopKeywords(dateRange),
          ]);

        setStats(statsRes.data);
        setActivityData(activityRes.data);
        setTopGroups(groupsRes.data);
        setTopKeywords(keywordsRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [timePeriod, customDates]);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  const statCards = [
    {
      label: text.dashboard.stats.totalMessages,
      value: stats?.totalMessages || 0,
      icon: MessageSquare,
      color: "emerald",
    },
    {
      label: text.dashboard.stats.unreadMessages,
      value: stats?.unreadMessages || 0,
      icon: Mail,
      color: "blue",
    },
    {
      label: text.dashboard.stats.forwardedMessages,
      value: stats?.forwardedMessages || 0,
      icon: Forward,
      color: "purple",
    },
    {
      label: text.dashboard.stats.todayMessages,
      value: stats?.todayMessages || 0,
      icon: TrendingUp,
      color: "orange",
    },
  ];

  const infoCards = [
    {
      label: text.dashboard.info.activeGroups,
      value: stats?.activeGroups || 0,
      icon: Users,
      color: "emerald",
    },
    {
      label: text.dashboard.info.activeKeywords,
      value: stats?.activeKeywords || 0,
      icon: Hash,
      color: "blue",
    },
    {
      label: text.dashboard.info.mediaMessages,
      value: stats?.mediaMessages || 0,
      icon: ImageIcon,
      color: "purple",
    },
  ];

  return (
    <div className="animate-fade-in space-y-4 md:space-y-6">
      <header className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          {text.dashboard.title}
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          {text.dashboard.subtitle}
        </p>
      </header>

      <section className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-3 sm:p-4"
            >
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-tertiary)] text-[var(--accent)] sm:mb-3 sm:h-10 sm:w-10 sm:rounded-xl">
                <Icon size={16} />
              </div>
              <p className="text-xl font-extrabold leading-none sm:text-3xl">
                {card.value}
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-muted)] sm:mt-2 sm:text-sm">
                {card.label}
              </p>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {infoCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4"
            >
              <div className="mb-2 inline-flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Icon size={15} />
                {card.label}
              </div>
              <p className="text-2xl font-bold">{card.value}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-secondary)]">
            {text.dashboard.filter}
          </span>
          {["week", "month", "year", "custom"].map((period) => (
            <button
              key={period}
              onClick={() => {
                setTimePeriod(period);
                setLoading(true);
              }}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                timePeriod === period
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {text.dashboard.periods[period]}
            </button>
          ))}
        </div>

        {timePeriod === "custom" && (
          <div className="mb-4 flex gap-2">
            <input
              type="date"
              value={customDates.start}
              onChange={(e) =>
                setCustomDates({ ...customDates, start: e.target.value })
              }
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-1 text-sm text-[var(--text-primary)]"
            />
            <span className="text-[var(--text-secondary)]">to</span>
            <input
              type="date"
              value={customDates.end}
              onChange={(e) =>
                setCustomDates({ ...customDates, end: e.target.value })
              }
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] px-3 py-1 text-sm text-[var(--text-primary)]"
            />
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text-secondary)]">
            Message Report Activity
          </h3>
          {activityData && <MessageActivityChart data={activityData} />}
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
          <h3 className="mb-4 text-sm font-semibold text-[var(--text-secondary)]">
            Top Groups
          </h3>
          {topGroups && <TopGroupsChart data={topGroups} />}
        </section>
      </div>

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 md:p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--text-secondary)]">
          Top Keywords
        </h3>
        {topKeywords && <TopKeywordsChart data={topKeywords} />}
      </section>
    </div>
  );
}
