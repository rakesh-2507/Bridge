import { useState } from "react";
import type { SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
    login,
    getJwtPayload,
    getLoginType,
    isAdminUser,
} from "../api/auth"; function Login() {
    const navigate = useNavigate();

    const [loginname, setLoginname] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(
        e: SubmitEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const data = await login({
                loginname,
                password,
            });

            console.log(
                "LOGIN API RESPONSE:",
                data
            );
            const jwtPayload =
                getJwtPayload(data.access_token);

            console.log(
                "JWT PAYLOAD:",
                jwtPayload
            );

            const loginType =
                getLoginType(data.access_token);

            const admin =
                isAdminUser(data.access_token);

            console.log(
                "LOGIN TYPE FROM JWT:",
                loginType
            );

            console.log(
                "IS ADMIN:",
                admin
            );

            // Store authentication
            localStorage.setItem(
                "access_token",
                data.access_token
            );

            localStorage.setItem(
                "refresh_token",
                data.refresh_token
            );

            localStorage.setItem(
                "token_type",
                data.token_type
            );

            localStorage.setItem(
                "login_type",
                loginType
            );

            // Redirect
            if (admin) {
                navigate("/", {
                    replace: true,
                });
            } else {
                navigate("/tasks", {
                    replace: true,
                });
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Invalid login credentials"
            );
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">

            <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900">

                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Bridge
                    </h1>

                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Sign in to your account
                    </p>
                </div>

                {error && (
                    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                        {error}
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >
                    {/* Login Name */}
                    <div>
                        <label
                            htmlFor="loginname"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Login Name
                        </label>

                        <input
                            id="loginname"
                            type="text"
                            value={loginname}
                            onChange={(e) =>
                                setLoginname(e.target.value)
                            }
                            placeholder="Enter your login name"
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter your password"
                            required
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;