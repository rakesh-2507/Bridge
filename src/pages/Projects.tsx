import { useState } from "react";
import ProjectTable from "../components/ProjectTable";
import AddProjectForm from "../components/forms/AddProjectForm";

function Projects() {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const projects = [
    {
      id: 1,
      projectName: "Techonomy",
      coordinator: "John Doe",
      startDate: "01/08/2026",
      endDate: "30/09/2026",
      status: "In Progress",
    },
    {
      id: 2,
      projectName: "AISTGS",
      coordinator: "Jane Smith",
      startDate: "05/08/2026",
      endDate: "15/09/2026",
      status: "Completed",
    },
    {
      id: 3,
      projectName: "Management Portal",
      coordinator: "Alex Kumar",
      startDate: "10/08/2026",
      endDate: "20/10/2026",
      status: "Pending",
    },
    {
      id: 4,
      projectName: "Business Portal",
      coordinator: "Rahul Kumar",
      startDate: "12/08/2026",
      endDate: "25/09/2026",
      status: "In Progress",
    },
    {
      id: 5,
      projectName: "CRM System",
      coordinator: "Michael Smith",
      startDate: "15/08/2026",
      endDate: "30/10/2026",
      status: "Pending",
    },
    {
      id: 6,
      projectName: "Inventory Management",
      coordinator: "Priya Sharma",
      startDate: "20/08/2026",
      endDate: "15/11/2026",
      status: "In Progress",
    },
    {
      id: 7,
      projectName: "HR Portal",
      coordinator: "David Wilson",
      startDate: "01/09/2026",
      endDate: "30/11/2026",
      status: "Completed",
    },
    {
      id: 8,
      projectName: "Finance Dashboard",
      coordinator: "Anita Rao",
      startDate: "05/09/2026",
      endDate: "20/11/2026",
      status: "In Progress",
    },
    {
      id: 9,
      projectName: "Analytics Platform",
      coordinator: "Robert Brown",
      startDate: "10/09/2026",
      endDate: "25/12/2026",
      status: "Pending",
    },
    {
      id: 10,
      projectName: "Customer Portal",
      coordinator: "Sarah Johnson",
      startDate: "15/09/2026",
      endDate: "30/12/2026",
      status: "Completed",
    },

    // Page 2
    {
      id: 11,
      projectName: "Mobile Application",
      coordinator: "James Anderson",
      startDate: "01/10/2026",
      endDate: "31/12/2026",
      status: "In Progress",
    },
    {
      id: 12,
      projectName: "E-Commerce Platform",
      coordinator: "Neha Patel",
      startDate: "05/10/2026",
      endDate: "15/01/2027",
      status: "Pending",
    },
    {
      id: 13,
      projectName: "Learning Management System",
      coordinator: "Chris Evans",
      startDate: "10/10/2026",
      endDate: "20/01/2027",
      status: "In Progress",
    },
    {
      id: 14,
      projectName: "Attendance System",
      coordinator: "Kiran Reddy",
      startDate: "15/10/2026",
      endDate: "30/12/2026",
      status: "Completed",
    },
    {
      id: 15,
      projectName: "Document Management",
      coordinator: "Daniel Lee",
      startDate: "20/10/2026",
      endDate: "15/01/2027",
      status: "Pending",
    },
    {
      id: 16,
      projectName: "Task Management",
      coordinator: "Meera Singh",
      startDate: "01/11/2026",
      endDate: "20/01/2027",
      status: "In Progress",
    },
    {
      id: 17,
      projectName: "Reporting System",
      coordinator: "William Taylor",
      startDate: "05/11/2026",
      endDate: "25/01/2027",
      status: "Completed",
    },
    {
      id: 18,
      projectName: "Payment Gateway",
      coordinator: "Sanjay Kumar",
      startDate: "10/11/2026",
      endDate: "30/01/2027",
      status: "In Progress",
    },
    {
      id: 19,
      projectName: "Notification Service",
      coordinator: "Emily Davis",
      startDate: "15/11/2026",
      endDate: "15/02/2027",
      status: "Pending",
    },
    {
      id: 20,
      projectName: "API Management",
      coordinator: "Arjun Patel",
      startDate: "20/11/2026",
      endDate: "20/02/2027",
      status: "Completed",
    },

    // Page 3
    {
      id: 21,
      projectName: "Employee Portal",
      coordinator: "Tom Wilson",
      startDate: "01/12/2026",
      endDate: "28/02/2027",
      status: "In Progress",
    },
    {
      id: 22,
      projectName: "Vendor Management",
      coordinator: "Pooja Nair",
      startDate: "05/12/2026",
      endDate: "15/03/2027",
      status: "Pending",
    },
    {
      id: 23,
      projectName: "Sales Dashboard",
      coordinator: "Mark Thomas",
      startDate: "10/12/2026",
      endDate: "20/03/2027",
      status: "Completed",
    },
    {
      id: 24,
      projectName: "Marketing Platform",
      coordinator: "Divya Kumar",
      startDate: "15/12/2026",
      endDate: "25/03/2027",
      status: "In Progress",
    },
    {
      id: 25,
      projectName: "Support Portal",
      coordinator: "Steve Miller",
      startDate: "20/12/2026",
      endDate: "30/03/2027",
      status: "Pending",
    },
    {
      id: 26,
      projectName: "Feedback System",
      coordinator: "Ravi Kumar",
      startDate: "01/01/2027",
      endDate: "15/04/2027",
      status: "Completed",
    },
    {
      id: 27,
      projectName: "Order Management",
      coordinator: "Laura White",
      startDate: "05/01/2027",
      endDate: "20/04/2027",
      status: "In Progress",
    },
    {
      id: 28,
      projectName: "Warehouse System",
      coordinator: "Vijay Rao",
      startDate: "10/01/2027",
      endDate: "30/04/2027",
      status: "Pending",
    },
    {
      id: 29,
      projectName: "Delivery Tracking",
      coordinator: "Kevin Martin",
      startDate: "15/01/2027",
      endDate: "15/05/2027",
      status: "In Progress",
    },
    {
      id: 30,
      projectName: "Logistics Portal",
      coordinator: "Swathi Reddy",
      startDate: "20/01/2027",
      endDate: "20/05/2027",
      status: "Completed",
    },

    // Page 4
    {
      id: 31,
      projectName: "Healthcare Portal",
      coordinator: "Amit Shah",
      startDate: "01/02/2027",
      endDate: "30/05/2027",
      status: "Pending",
    },
    {
      id: 32,
      projectName: "Appointment System",
      coordinator: "Lisa Johnson",
      startDate: "05/02/2027",
      endDate: "15/06/2027",
      status: "In Progress",
    },
    {
      id: 33,
      projectName: "Education Portal",
      coordinator: "Ramesh Kumar",
      startDate: "10/02/2027",
      endDate: "20/06/2027",
      status: "Completed",
    },
    {
      id: 34,
      projectName: "Student Management",
      coordinator: "Grace Brown",
      startDate: "15/02/2027",
      endDate: "30/06/2027",
      status: "Pending",
    },
    {
      id: 35,
      projectName: "Library Management",
      coordinator: "Suresh Rao",
      startDate: "20/02/2027",
      endDate: "15/07/2027",
      status: "In Progress",
    },
    {
      id: 36,
      projectName: "Event Management",
      coordinator: "Olivia Smith",
      startDate: "01/03/2027",
      endDate: "20/07/2027",
      status: "Completed",
    },
    {
      id: 37,
      projectName: "Booking System",
      coordinator: "Nikhil Kumar",
      startDate: "05/03/2027",
      endDate: "30/07/2027",
      status: "In Progress",
    },
    {
      id: 38,
      projectName: "Travel Portal",
      coordinator: "Emma Wilson",
      startDate: "10/03/2027",
      endDate: "15/08/2027",
      status: "Pending",
    },
    {
      id: 39,
      projectName: "Hotel Management",
      coordinator: "Rohit Sharma",
      startDate: "15/03/2027",
      endDate: "20/08/2027",
      status: "Completed",
    },
    {
      id: 40,
      projectName: "Restaurant Management",
      coordinator: "Sophia Davis",
      startDate: "20/03/2027",
      endDate: "30/08/2027",
      status: "In Progress",
    },

    // Page 5
    {
      id: 41,
      projectName: "Real Estate Portal",
      coordinator: "Vikram Singh",
      startDate: "01/04/2027",
      endDate: "15/09/2027",
      status: "Pending",
    },
    {
      id: 42,
      projectName: "Property Management",
      coordinator: "Maya Patel",
      startDate: "05/04/2027",
      endDate: "20/09/2027",
      status: "In Progress",
    },
    {
      id: 43,
      projectName: "Insurance Platform",
      coordinator: "Andrew Clark",
      startDate: "10/04/2027",
      endDate: "30/09/2027",
      status: "Completed",
    },
    {
      id: 44,
      projectName: "Banking Dashboard",
      coordinator: "Anjali Rao",
      startDate: "15/04/2027",
      endDate: "15/10/2027",
      status: "Pending",
    },
    {
      id: 45,
      projectName: "Investment Portal",
      coordinator: "Matthew Lewis",
      startDate: "20/04/2027",
      endDate: "20/10/2027",
      status: "In Progress",
    },
    {
      id: 46,
      projectName: "Analytics Dashboard",
      coordinator: "Kavya Reddy",
      startDate: "01/05/2027",
      endDate: "30/10/2027",
      status: "Completed",
    },
    {
      id: 47,
      projectName: "Cloud Management",
      coordinator: "Ryan Walker",
      startDate: "05/05/2027",
      endDate: "15/11/2027",
      status: "Pending",
    },
    {
      id: 48,
      projectName: "Security Platform",
      coordinator: "Aditya Kumar",
      startDate: "10/05/2027",
      endDate: "20/11/2027",
      status: "In Progress",
    },
    {
      id: 49,
      projectName: "Automation System",
      coordinator: "Chloe Martin",
      startDate: "15/05/2027",
      endDate: "30/11/2027",
      status: "Completed",
    },
    {
      id: 50,
      projectName: "AI Platform",
      coordinator: "Arun Kumar",
      startDate: "20/05/2027",
      endDate: "15/12/2027",
      status: "In Progress",
    },
  ];

  const filteredProjects = projects.filter((project) =>
    project.projectName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto text-gray-900 dark:text-white">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Projects
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
            Manage and view all your projects.
          </p>
        </div>

        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Add Project
          </button>
        )}

      </div>

      {showAddForm ? (

        <AddProjectForm
          onCancel={() => setShowAddForm(false)}
          onSuccess={(data) => {
            console.log("Project created:", data);
            setShowAddForm(false);
          }}
        />

      ) : (

        <>
          {/* Search */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">

            <div className="relative w-full sm:max-w-md">

              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 6.05 6.05a7.5 7.5 0 0 0 10.6 10.6Z"
                />
              </svg>

              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
              />

            </div>

            <button
              type="button"
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
            >
              Search
            </button>

          </div>

          <ProjectTable projects={filteredProjects} />
        </>

      )}

    </div>
  );
}

export default Projects;