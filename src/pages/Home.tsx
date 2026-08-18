import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto">

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Welcome to Bridge.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="group rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-950 dark:hover:border-gray-600"
        >
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Total Projects
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            24
          </p>

          <p className="mt-2 text-xs text-gray-400 opacity-0 transition group-hover:opacity-100 dark:text-gray-500">
            View all projects →
          </p>
        </button>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-950">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Active Projects
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            12
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-950">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            8
          </p>
        </div>

      </div>

    </div>
  );
}

export default Home;