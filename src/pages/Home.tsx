function Home() {
  return (
    <div className="mx-auto">

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Welcome to Bridge.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Projects
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            24
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Active Projects
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            12
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Completed
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-900">
            8
          </p>
        </div>

      </div>

    </div>
  );
}

export default Home;