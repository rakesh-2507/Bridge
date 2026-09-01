// src/pages/tasks/CreateTaskPage.tsx

import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import TaskForm from "../../components/tasks/TaskForm";

function CreateTaskPage() {
    const navigate = useNavigate();

    const handleSuccess = () => {
        navigate("/tasks");
    };

    const handleCancel = () => {
        navigate("/tasks");
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-950">
            <div className="mx-auto max-w-4xl">

                {/* Header */}
                <div className="mb-6 flex items-center gap-3">

                    <button
                        type="button"
                        onClick={handleCancel}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800"
                        aria-label="Back to tasks"
                    >
                        <ArrowLeft size={19} />
                    </button>

                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            Create Task
                        </h1>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Create a new task and assign it to a user.
                        </p>
                    </div>

                </div>

                {/* Form */}
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">

                    <TaskForm
                        onCancel={handleCancel}
                        onSuccess={handleSuccess}
                    />

                </div>

            </div>
        </div>
    );
}

export default CreateTaskPage;