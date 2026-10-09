import { useFleetStore } from "@/store/fleetStore";
import { Card } from "./Card";
import { ErrorState, PageSkeleton } from "./States";

/**
 * Wraps a page and renders the right UI for the global data status:
 * skeleton while loading, error with retry on failure, content on success.
 */
export function DataBoundary({ children, skeleton }) {
  const status = useFleetStore((s) => s.status);
  const error = useFleetStore((s) => s.error);
  const fetchAll = useFleetStore((s) => s.fetchAll);

  if (status === "idle" || status === "loading") return <>{skeleton ?? <PageSkeleton />}</>;
  if (status === "error")
    return (
      <Card>
        <ErrorState message={error ?? "Unknown error"} onRetry={fetchAll} />
      </Card>
    );
  return <>{children}</>;
}
