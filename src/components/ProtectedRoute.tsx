import {
    Navigate,
    Outlet,
    useLocation,
} from "react-router-dom";

function ProtectedRoute() {
    const location = useLocation();

    const accessToken =
        localStorage.getItem("access_token");

    const loginType =
        localStorage.getItem("login_type")
            ?.trim()
            .toLowerCase() ?? "";

    if (!accessToken) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    const isAdmin =
        loginType === "admin" ||
        loginType === "sysadmin" ||
        loginType === "administrator";

    /*
     * ADMIN / SYSADMIN
     *
     * Home is allowed
     * Tasks is not allowed
     */
    if (
        isAdmin &&
        location.pathname === "/tasks"
    ) {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    /*
     * NORMAL USERS
     *
     * Tasks is allowed
     * Home is not allowed
     */
    if (
        !isAdmin &&
        location.pathname === "/"
    ) {
        return (
            <Navigate
                to="/tasks"
                replace
            />
        );
    }

    return <Outlet />;
}

export default ProtectedRoute;