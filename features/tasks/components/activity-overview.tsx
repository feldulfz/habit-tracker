import { ActivityCalendar, type Activity } from "react-activity-calendar";

type ActivityOverviewProps = {
  activity: Activity[];
  completedToday: number;
  streak: number;
  lastSevenCount: number;
};

export function ActivityOverview({
  activity,
  completedToday,
  streak,
  lastSevenCount,
}: ActivityOverviewProps) {
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
          colorScheme="light"
          data={activity}
          fontSize={12}
          labels={{
            totalCount: "{{count}} completions in the last year",
            legend: { less: "Less", more: "More" },
          }}
          maxLevel={4}
          showColorLegend={false}
          showTotalCount={false}
          showWeekdayLabels
          theme={{
            light: ["#e8e7df", "#c6e3bf", "#79b985", "#36805b", "#174c39"],
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
          <span>marks this week</span>
        </div>
      </div>
    </section>
  );
}
