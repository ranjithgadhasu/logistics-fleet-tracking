import { Link } from "react-router-dom";
import { MapPinOff } from "lucide-react";
import { Card } from "@/components/ui";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <Card className="flex flex-col items-center px-6 py-20 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <MapPinOff className="h-8 w-8" />
      </div>
      <p className="text-sm font-semibold text-indigo-600">404</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">This route doesn't exist</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">Looks like this delivery took a wrong turn. Let's get you back on track.</p>
      <Link to="/" className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
        Back to dashboard
      </Link>
    </Card>
  );
}
