import { useEffect } from "react";
import { APP_NAME } from "@/constants";

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);
}
