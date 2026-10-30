
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { login, getCurrentUser } from "../api/auth";
import loginTeam from "../assets/login_team.jpg";

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

            // Use the returned user first, then the saved profile.
            const user = result?.user ?? getCurrentUser();

            if (!user) {
                throw new Error(
                    "Login succeeded, but user details could not be loaded. Please sign in again."
                );
            }

            const userType = String(
                user.mtype ?? user.role ?? ""
            )
                .trim()
                .toLowerCase();

            if (userType === "sysadmin") {
                navigate("/masters", { replace: true });
            } else {
                // All authenticated non-admin users use the coordinator workflow.
                navigate("/dashboard", { replace: true });
            }
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to connect to the server. Please try again."
            );
        } finally {
            setLoading(false);
        }

    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-950">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">

                <div className="relative hidden flex-col justify-between overflow-hidden text-white md:flex">

                    <img
                        src={loginTeam}
                        alt="Bridge Team"
                        className="absolute inset-0 h-full w-full object-cover"
                    />

                    {/* Optional dark overlay */}
                    <div className="absolute inset-0 bg-slate-900/30" />

                    <div className="relative z-10 p-10">
                        <div className="flex h-12 w-12 items-center justify-center  rounded-tl-xl rounded-br-xl   bg-white/15">
                            <LockKeyhole size={26} />
                        </div>
                    </div>

                </div>

                {/* Login form */}
                <div className="p-6 sm:p-10 md:p-12">

                    <div className="mb-8 flex flex-wrap justify-center">
                        <span className="bridge-logo text-6xl text-primary dark:text-white">
                            Bridge
                        </span>

                        <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-gray-400">
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
                                    className="w-full  rounded-tl-xl rounded-br-xl   border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                                    className="w-full  rounded-tl-xl rounded-br-xl   border border-slate-300 bg-white py-3 pl-10 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
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
                            className="flex w-full items-center justify-center gap-2  rounded-tl-xl rounded-br-xl   bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900"
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