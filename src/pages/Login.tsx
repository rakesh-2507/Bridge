
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { login } from "../api/auth";

export default function Login() {
    const navigate = useNavigate();

    const [loginname, setLoginname] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!loginname.trim() || !password) {
            setError("Please enter your username and password.");
            return;
        }

        setLoading(true);


        try {
            const result = await login({
                loginname: loginname.trim(),
                password,
            });

            if (!result.access_token || !result.refresh_token) {
                throw new Error("The server did not return valid authentication tokens.");
            }

            localStorage.setItem("access_token", result.access_token);
            localStorage.setItem("refresh_token", result.refresh_token);
            localStorage.setItem("token_type", result.token_type || "bearer");

            navigate("/masters", { replace: true });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to connect to the server. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-950">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
                {/* Branding panel */}
                <div className="relative hidden flex-col justify-between overflow-hidden bg-blue-700 p-10 text-white md:flex">
                    <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
                    <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-blue-400/20" />

                    <div className="relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                            <LockKeyhole size={26} />
                        </div>
                        <h1 className="mt-8 text-3xl font-bold tracking-tight">
                            Bridge
                        </h1>
                        <p className="mt-4 max-w-sm text-sm leading-7 text-blue-100">
                            Manage your projects, templates, users, and companies from one
                            centralized workspace.
                        </p>
                    </div>

                    <p className="relative text-xs text-blue-100">
                        Secure access to your workspace
                    </p>
                </div>

                {/* Login form */}
                <div className="p-6 sm:p-10 md:p-12">
                    <div className="mb-8 md:hidden">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                            <LockKeyhole size={24} />
                        </div>
                        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                            Bridge
                        </h1>
                    </div>

                    <div className="mb-8">
                        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                            Welcome back
                        </p>
                        <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                            Sign in to your account
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Enter your credentials to continue to your workspace.
                        </p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label
                                htmlFor="loginname"
                                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                                Username
                            </label>
                            <div className="relative">
                                <UserRound
                                    size={19}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    id="loginname"
                                    name="loginname"
                                    type="text"
                                    autoComplete="username"
                                    value={loginname}
                                    onChange={(event) => setLoginname(event.target.value)}
                                    placeholder="Enter your username"
                                    required
                                    disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <LockKeyhole
                                    size={19}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Enter your password"
                                    required
                                    disabled={loading}
                                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((current) => !current)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900"
                        >
                            {loading && <LoaderCircle size={18} className="animate-spin" />}
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-xs text-slate-400">
                        © {new Date().getFullYear()} Bridge. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}