import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  const cards = [
    {
      title: "Total Projects",
      value: "50",
      description: "View all projects →",
      path: "/projects",
      clickable: true,
    },
    {
      title: "Project Types",
      value: "6",
      description: "Project categories",
      clickable: false,
    },
    {
      title: "Templates",
      value: "18",
      description: "Available templates",
      clickable: false,
    },
    {
      title: "Folders",
      value: "12",
      description: "Project folders",
      clickable: false,
    },
    {
      title: "Companies",
      value: "8",
      description: "Registered companies",
      clickable: false,
    },
    {
      title: "Users",
      value: "12",
      description: "Active users",
      path: "/members",
      clickable: true,
    },
  ];

  return (
    <div className="mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Welcome to Bridge.
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

        {cards.map((card) => {
          const CardContent = (
            <>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {card.title}
              </p>

              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>

              <p
                className={`mt-2 text-xs transition ${card.clickable
                    ? "text-gray-400 opacity-0 group-hover:opacity-100 dark:text-gray-500"
                    : "text-gray-400 dark:text-gray-500"
                  }`}
              >
                {card.description}
              </p>
            </>
          );

          if (card.clickable) {
            return (
              <button
                key={card.title}
                type="button"
                onClick={() => navigate(card.path!)}
                className="group rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-950 dark:hover:border-gray-600"
              >
                {CardContent}
              </button>
            );
          }

          return (
            <div
              key={card.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-950"
            >
              {CardContent}
            </div>
          );
        })}

      </div>

    </div>
  );
}

export default Home;