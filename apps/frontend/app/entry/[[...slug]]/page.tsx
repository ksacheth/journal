import CalendarPage from "./CalendarPage";
import EntryPage from "./EntryPage";
import MonthSelectorPage from "./MonthSelectorPage";

// Generate static params for all months and days
// This is required for static export with catch-all routes
export function generateStaticParams() {
  const params: { slug: string[] }[] = [];
  const currentYear = new Date().getFullYear();
  
  // Generate for current year, previous year, and next year
  const years = [currentYear - 1, currentYear, currentYear + 1];
  
  for (const year of years) {
    for (let month = 1; month <= 12; month++) {
      const monthStr = String(month).padStart(2, "0");
      
      // Add month route (e.g., ["2025", "02"])
      params.push({ slug: [`${year}-${monthStr}`] });
      
      // Get number of days in this month
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Add date routes for each day (e.g., ["2025", "02", "15"])
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, "0");
        params.push({ slug: [`${year}-${monthStr}`, dayStr] });
      }
    }
  }
  
  // Add the root entry route (month selector)
  params.push({ slug: [] });
  
  return params;
}

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  // No slug (empty array or undefined): show month selector
  if (!slug || slug.length === 0) {
    return <MonthSelectorPage />;
  }

  // One segment (month): show calendar
  if (slug.length === 1) {
    return <CalendarPage />;
  }

  // Two segments (month + date): show entry page
  if (slug.length === 2) {
    return <EntryPage />;
  }

  // Invalid path - show month selector as fallback
  return <MonthSelectorPage />;
}
