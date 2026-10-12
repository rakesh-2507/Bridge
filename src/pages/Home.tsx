import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  FolderKanban,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { getCoordinatorProjects } from "../api/projects";

type ProjectResponse = unknown;

function normalizeProjects(response: ProjectResponse): unknown[] {
  let result: unknown = response;

  if (result && typeof result === "object" && !Array.isArray(result)) {
    const record = result as Record<string, unknown>;

    if (Array.isArray(record.projects)) {
      result = record.projects;
    } else if (record.data !== undefined) {
      result = record.data;

      if (
        result &&
        typeof result === "object" &&
        !Array.isArray(result)
      ) {
        const data = result as Record<string, unknown>;

        if (Array.isArray(data.projects)) {
          result = data.projects;
        }
      }
    }
  }

  if (!Array.isArray(result)) {
    throw new Error("The server returned an unexpected projects response.");
  }

  return result;
}

export default function WelcomePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [hasProjects, setHasProjects] = useState(false);
  const [error, setError] = useState("");

  const checkProjects = useCallback(async (isMounted?: () => boolean) => {
    try {
      const response: unknown = await getCoordinatorProjects();
      if (isMounted && !isMounted()) return;

      const projects = normalizeProjects(response);

      setHasProjects(projects.length > 0);
      setError("");
    } catch (err) {
      if (isMounted && !isMounted()) return;

      setError(
        err instanceof Error
          ? err.message
          : "Unable to check your assigned projects."
      );
      setHasProjects(false);
    } finally {
      if (!isMounted || isMounted()) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Defer the initial request so the effect does not synchronously
    // invoke the state-updating function.
    const startCheck = async () => {
      await Promise.resolve();

      if (!cancelled) {
        void checkProjects(() => !cancelled);
      }
    };

    void startCheck();

    return () => {
      cancelled = true;
    };
  }, [checkProjects]);

  useEffect(() => {
    if (!loading && hasProjects && !error) {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, hasProjects, error, navigate]);

  const handleRetry = () => {
    setLoading(true);
    setError("");
    void checkProjects();
  };

  if (loading || (!error && hasProjects)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {loading ? "Checking your projects..." : "Opening your projects..."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-5 py-10">
      <div className="w-full max-w-xl text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/30">
          <BriefcaseBusiness
            size={38}
            className="text-blue-600 dark:text-blue-400"
          />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
          Welcome to BridgeWorkflow!
        </h1>

        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-gray-600 dark:text-gray-300">
          Welcome aboard. Your workspace is ready, but you don't have
          any projects assigned yet. Once a project is assigned to you,
          it will appear here.
        </p>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        ) : (
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            <FolderKanban size={17} />
            Waiting for project assignment
          </div>
        )}
      </div>
    </div>
  );
}