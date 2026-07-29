

interface BusinessContextInput {
  organisation?: any;
  accounts?: any[];
  campaigns?: any[];
  activities?: any[];
  projects?: any[];
  tasks?: any[];
  contacts?: any[];
  bookings?: any[];
  calendar?: any[];
}

export function buildClarityContext(data: BusinessContextInput) {
  const overdueTasks = (data.tasks ?? []).filter(
    (task) => task.status !== "completed" && task.due_date && new Date(task.due_date) < new Date()
  );

  const upcomingBookings = (data.bookings ?? []).filter((booking) => {
    if (!booking.start_time) return false;
    return new Date(booking.start_time) >= new Date();
  });

  const completedProjects = (data.projects ?? []).filter(
    (project) => project.status === "completed"
  );

  const activeCampaigns = (data.campaigns ?? []).filter(
    (campaign) => campaign.status === "active" || campaign.status === "sending"
  );

  return `
TOTS-OS Business Overview

Organisation:
${data.organisation?.name ?? "Unknown organisation"}

Customers / Accounts:
${data.accounts?.length ?? 0}

Contacts:
${data.contacts?.length ?? 0}

Projects:
Total: ${data.projects?.length ?? 0}
Completed: ${completedProjects.length}

Tasks:
Total: ${data.tasks?.length ?? 0}
Overdue: ${overdueTasks.length}

Marketing:
Total campaigns: ${data.campaigns?.length ?? 0}
Active campaigns: ${activeCampaigns.length}

Activity:
Recent activity records: ${data.activities?.length ?? 0}

Bookings:
Upcoming bookings: ${upcomingBookings.length}

Calendar:
Calendar events loaded: ${data.calendar?.length ?? 0}

Use this information to provide useful business insights. Never invent values that are not available.
`;
}