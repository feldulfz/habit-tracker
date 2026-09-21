import { ActivityCalendar, type Activity } from "react-activity-calendar";

type ActivityOverviewProps = {
  activity: Activity[];
  completedToday: number;
  totalHabits: number;
  streak: number;
  lastSevenCount: number;
};

export function ActivityOverview({
  activity,
  completedToday,
  totalHabits,
  streak,
  lastSevenCount,
}: ActivityOverviewProps) {
  const remainingToday = Math.max(0, totalHabits - completedToday);
  const progress = totalHabits
    ? Math.round((completedToday / totalHabits) * 100)
    : 0;

  return (
    <section className="activity-card">
      <div className="card-heading">
        <div>
          <p className="section-label">THE LAST 365 DAYS</p>
          <h2>Your year in small wins</h2>
        </div>
        <div className="legend" aria-label="Activity legend">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <i className={`legend-cell level-${level}`} key={level} />
          ))}
          <span>More</span>
        </div>
      </div>
      <div className="calendar-wrap">
        <ActivityCalendar
          blockMargin={4}
          blockRadius={3}
          blockSize={12}
          className="overall-calendar"
          colorScheme="light"
          data={activity}
          fontSize={12}
          labels={{
            totalCount: "{{count}} minutes in the last year",
            legend: { less: "Less", more: "More" },
          }}
          maxLevel={4}
          showColorLegend={false}
          showTotalCount={false}
          showWeekdayLabels
          theme={{
            light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
          }}
          weekStart={1}
        />
      </div>
      <div className="stats-row">
        <div>
          <strong>{completedToday}</strong>
          <span>completed today</span>
        </div>
        <div>
          <strong>{streak}</strong>
          <span>day streak</span>
        </div>
        <div>
          <strong>{lastSevenCount}</strong>
          <span>goals met this week</span>
        </div>
      </div>
      <div className="today-progress-panel">
        <div
          aria-label={`${progress}% of today's habits completed`}
          className="progress-ring"
          role="img"
          style={{
            background: `conic-gradient(var(--green) ${progress}%, var(--muted) 0)`,
          }}
        >
          <div>
            <strong>{progress}%</strong>
            <span>complete</span>
          </div>
        </div>
        <div className="progress-copy">
          <p className="section-label">TODAY&apos;S PROGRESS</p>
          <h3>
            {totalHabits === 0
              ? "Start with one small promise."
              : remainingToday === 0
                ? "Everything is marked for today."
                : "One small check-in builds momentum."}
          </h3>
          <p>
            {totalHabits === 0
              ? "Add your first habit when you’re ready."
              : `${completedToday} completed and ${remainingToday} remaining.`}
          </p>
          <div className="progress-counts">
            <span>
              <strong>{completedToday}</strong> done
            </span>
            <span>
              <strong>{remainingToday}</strong> remaining
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
