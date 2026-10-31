
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  CalendarDays,
  Pencil,
  Save,
  X,
  Loader2,
  AtSign,
  BriefcaseBusiness,
  RefreshCw,
  ImagePlus,
} from "lucide-react";

import { getCurrentUser } from "../api/auth";
import { getUser, updateUser } from "../api/users";
import type { User } from "../api/users";
import { API_ORIGIN } from "../config";

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const ALLOWED_PHOTO_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

type ProfileForm = {
  title: string;
  firstname: string;
  lastname: string;
  loginname: string;
  email: string;
  mobile: string;
  gender: string;
};

const initialForm: ProfileForm = {
  title: "",
  firstname: "",
  lastname: "",
  loginname: "",
  email: "",
  mobile: "",
  gender: "",
};

const inputClass =
  "w-full  rounded-tl-xl rounded-br-xl   border border-primary/40 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-900 dark:text-white";

const labelClass =
  "mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function getUserId(): number {
  const currentUser = getCurrentUser() as
    | { uid?: number | string; id?: number | string }
    | null;

  return Number(currentUser?.uid ?? currentUser?.id);
}

function toProfileForm(user: User): ProfileForm {
  return {
    title: user.title ?? "",
    firstname: user.firstname ?? "",
    lastname: user.lastname ?? "",
    loginname: user.loginname ?? "",
    email: user.email ?? "",
    mobile: user.mobile ?? "",
    gender: user.gender ?? "",
  };
}

function getInitials(user: Partial<User>): string {
  const first = user.firstname?.trim().charAt(0) ?? "";
  const last = user.lastname?.trim().charAt(0) ?? "";

  return (first + last).toUpperCase() || "U";
}

function formatDate(value?: string | null): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// --------------------------------------------------
// Component
// --------------------------------------------------

export default function Profile() {
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<User | null>(null);
  const [form, setForm] = useState<ProfileForm>(initialForm);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoFailed, setPhotoFailed] = useState(false);

  const photoPath = profile?.photo_url || profile?.photo || "";

  function getPhotoUrl(path: string): string {
    const value = path.trim();

    if (!value) return "";

    // Local preview selected by the user
    if (value.startsWith("blob:") || value.startsWith("data:")) {
      return value;
    }

    // Absolute HTTP/HTTPS URLs
    if (/^https?:\/\//i.test(value)) {
      return value.replace(/^http:\/\//i, "https://");
    }

    // Relative server paths
    const normalizedPath = value.replace(/^\/+/, "");
    const imagePath = normalizedPath.startsWith("uploads/")
      ? normalizedPath
      : `uploads/${normalizedPath}`;

    return `${API_ORIGIN}/${imagePath}`;
  }

  const displayedPhoto = photoPreview || getPhotoUrl(photoPath);

  const fullName = profile
    ? `${profile.title ? `${profile.title} ` : ""}${profile.firstname ?? ""} ${profile.lastname ?? ""}`.trim()
    : "";

  // --------------------------------------------------
  // Load profile
  // --------------------------------------------------

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const uid = getUserId();

      if (!Number.isInteger(uid) || uid <= 0) {
        throw new Error(
          "Unable to identify the logged-in user. Please sign in again.",
        );
      }

      const user = await getUser(uid);

      setProfile(user);
      setForm(toProfileForm(user));
      setPhotoFile(null);
      setPhotoPreview("");
      setPhotoFailed(false);
      setEditing(false);

      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      try {
        const uid = getUserId();

        if (!Number.isInteger(uid) || uid <= 0) {
          throw new Error(
            "Unable to identify the logged-in user. Please sign in again.",
          );
        }

        const user = await getUser(uid);

        if (cancelled) return;

        setProfile(user);
        setForm(toProfileForm(user));
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your profile.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  // Release local preview URLs when a selected photo changes.
  useEffect(() => {
    if (!photoPreview) return;

    return () => {
      URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  // --------------------------------------------------
  // Form helpers
  // --------------------------------------------------

  function updateField<K extends keyof ProfileForm>(
    field: K,
    value: ProfileForm[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setError("The image must be 5 MB or smaller.");
      return;
    }

    setError("");
    setSuccess("");
    setPhotoFailed(false);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function clearSelectedPhoto() {
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoFailed(false);
    setError("");
    setSuccess("");

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function startEditing() {
    setForm(profile ? toProfileForm(profile) : initialForm);
    setPhotoFile(null);
    setPhotoPreview("");
    setPhotoFailed(false);
    setEditing(true);
    setError("");
    setSuccess("");

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function cancelEditing() {
    if (profile) {
      setForm(toProfileForm(profile));
    }

    setPhotoFile(null);
    setPhotoPreview("");
    setEditing(false);
    setError("");
    setSuccess("");
    setPhotoFailed(false);

    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  // --------------------------------------------------
  // Save profile
  // --------------------------------------------------

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!profile) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const uploadingPhoto = Boolean(photoFile);

    try {
      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("firstname", form.firstname.trim());
      formData.append("lastname", form.lastname.trim());
      formData.append("loginname", form.loginname.trim());
      formData.append("email", form.email.trim());
      formData.append("mobile", form.mobile.trim());
      formData.append("gender", form.gender);
      formData.append("mtype", profile.mtype ?? "");

      if (photoFile) {
        formData.append("photo", photoFile, photoFile.name);
      }

      const updated = await updateUser(profile.uid, formData);

      let nextProfile: User = {
        ...profile,
        ...updated,
        uid: profile.uid,
        photo: updated?.photo || profile.photo,
        photo_url: updated?.photo_url || profile.photo_url,
        status: updated?.status ?? profile.status,
        createddt: updated?.createddt ?? profile.createddt,
        updatedt: updated?.updatedt ?? profile.updatedt,
      };

      // Reload canonical server data, including the saved photo URL.
      try {
        const refreshed = await getUser(profile.uid);

        nextProfile = {
          ...nextProfile,
          ...refreshed,
          uid: profile.uid,
          photo: refreshed?.photo || nextProfile.photo,
          photo_url: refreshed?.photo_url || nextProfile.photo_url,
        };
      } catch (refreshError) {
        console.warn(
          "Profile saved, but reloading its latest details failed:",
          refreshError,
        );
      }

      setProfile(nextProfile);
      setForm(toProfileForm(nextProfile));
      setPhotoFile(null);
      setPhotoPreview("");
      setPhotoFailed(false);

      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }

      setEditing(false);

      setSuccess(
        uploadingPhoto
          ? "Your profile and photo were updated successfully."
          : "Your profile was updated successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // Photo display
  // --------------------------------------------------

  function renderProfilePhoto(size: "large" | "small") {
    const isLarge = size === "large";

    const containerClass = isLarge
      ? "flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden  rounded-tl-xl rounded-br-xl   border-4 border-white bg-primary text-2xl font-bold text-white shadow-md dark:border-gray-950"
      : "flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-primary";

    if (!displayedPhoto || photoFailed) {
      return (
        <div className={containerClass}>
          {isLarge ? getInitials(profile ?? {}) : <UserRound size={32} />}
        </div>
      );
    }

    return (
      <div className={containerClass}>
        <img
          key={displayedPhoto}
          src={displayedPhoto}
          alt={`${profile?.firstname ?? ""} ${profile?.lastname ?? ""}`}
          className="h-full w-full object-cover"
          onLoad={() => setPhotoFailed(false)}
          onError={(event) => {
            console.error("Profile image failed to load:", {
              originalPhotoUrl: photoPath,
              renderedPhotoUrl: displayedPhoto,
              actualRequestUrl: event.currentTarget.src,
              pageProtocol: window.location.protocol,
            });

            setPhotoFailed(true);
          }}
        />
      </div>
    );
  }

  // --------------------------------------------------
  // Loading and error states
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={30} />
        <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">
          Loading profile...
        </span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          {error || "Profile could not be loaded."}
        </div>

        <button
          type="button"
          onClick={() => void loadProfile()}
          className="mt-4 inline-flex items-center gap-2  rounded-tl-xl rounded-br-xl   bg-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  }

  // --------------------------------------------------
  // Main UI
  // --------------------------------------------------

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and manage your personal account information.
          </p>
        </div>

        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center justify-center gap-2  rounded-tl-xl rounded-br-xl   bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Pencil size={16} />
            Edit Profile
          </button>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300"
        >
          {success}
        </div>
      )}

      {/* Profile summary */}
      <section className="overflow-hidden  rounded-tl-xl rounded-br-xl   border border-primary/20 bg-white shadow-sm dark:bg-gray-950">
        <div className="h-32 bg-gradient-to-r from-primary/90 via-primary/70 to-orange-300 dark:from-primary/40 dark:via-primary/20 dark:to-orange-900/40" />

        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {renderProfilePhoto("large")}

              <div className="min-w-0 pb-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {fullName || profile.loginname}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  @{profile.loginname}
                </p>
              </div>
            </div>

            <span className="mb-1 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold capitalize text-primary">
              <ShieldCheck size={15} />
              {profile.mtype || "User"}
            </span>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 border-t border-primary/20 pt-5 sm:grid-cols-3">
            <InfoItem
              icon={<CalendarDays size={18} />}
              label="Joined"
              value={formatDate(profile.createddt)}
            />

            <InfoItem
              icon={<RefreshCw size={18} />}
              label="Last updated"
              value={formatDate(profile.updatedt)}
            />

            <InfoItem
              icon={<ShieldCheck size={18} />}
              label="Account status"
              value={profile.status || "Unknown"}
            />
          </div>
        </div>
      </section>

      {/* Editable form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-primary/20 bg-white p-5 shadow-sm sm:p-8 dark:bg-gray-950"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <UserRound size={21} />
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Personal Information
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your basic contact and account details.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FormField label="Title" htmlFor="profile-title">
            <select
              id="profile-title"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              disabled={!editing || saving}
              className={inputClass}
            >
              <option value="">Select title</option>
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Ms">Ms</option>
              <option value="Dr">Dr</option>
            </select>
          </FormField>

          <FormField label="Gender" htmlFor="profile-gender">
            <select
              id="profile-gender"
              value={form.gender}
              onChange={(e) => updateField("gender", e.target.value)}
              disabled={!editing || saving}
              className={inputClass}
            >
              <option value="">Prefer not to say</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </FormField>

          <FormField label="First name" htmlFor="profile-firstname">
            <input
              id="profile-firstname"
              required
              value={form.firstname}
              onChange={(e) => updateField("firstname", e.target.value)}
              disabled={!editing || saving}
              className={inputClass}
              autoComplete="given-name"
            />
          </FormField>

          <FormField label="Last name" htmlFor="profile-lastname">
            <input
              id="profile-lastname"
              required
              value={form.lastname}
              onChange={(e) => updateField("lastname", e.target.value)}
              disabled={!editing || saving}
              className={inputClass}
              autoComplete="family-name"
            />
          </FormField>

          <FormField label="Login name" htmlFor="profile-loginname">
            <div className="relative">
              <AtSign
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"
              />
              <input
                id="profile-loginname"
                required
                value={form.loginname}
                onChange={(e) => updateField("loginname", e.target.value)}
                disabled={!editing || saving}
                className={`${inputClass} pl-9`}
                autoComplete="username"
              />
            </div>
          </FormField>

          <FormField label="Email address" htmlFor="profile-email">
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"
              />
              <input
                id="profile-email"
                required
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                disabled={!editing || saving}
                className={`${inputClass} pl-9`}
                autoComplete="email"
              />
            </div>
          </FormField>

          <FormField label="Mobile number" htmlFor="profile-mobile">
            <div className="relative">
              <Phone
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"
              />
              <input
                id="profile-mobile"
                type="tel"
                value={form.mobile}
                onChange={(e) => updateField("mobile", e.target.value)}
                disabled={!editing || saving}
                className={`${inputClass} pl-9`}
                autoComplete="tel"
              />
            </div>
          </FormField>

          {/* Profile photo upload */}
          <FormField label="Profile Photo" htmlFor="profile-photo">
            <div className="flex flex-col gap-4  rounded-tl-xl rounded-br-xl   border border-primary/30 p-4 sm:flex-row sm:items-center">
              {renderProfilePhoto("small")}

              <div className="min-w-0 flex-1">
                <input
                  ref={photoInputRef}
                  id="profile-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  disabled={!editing || saving}
                  className="hidden"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={!editing || saving}
                    className="inline-flex items-center gap-2  rounded-tl-xl rounded-br-xl   border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ImagePlus size={16} />
                    Choose Photo
                  </button>

                  {photoFile && (
                    <button
                      type="button"
                      onClick={clearSelectedPhoto}
                      disabled={saving}
                      className="inline-flex items-center gap-2  rounded-tl-xl rounded-br-xl   border border-primary/30 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-primary/5 disabled:opacity-50 dark:text-gray-200"
                    >
                      <X size={15} />
                      Remove
                    </button>
                  )}
                </div>

                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  JPG, PNG, or WebP. Maximum size: 5 MB.
                </p>

                {photoFile && (
                  <p className="mt-1 break-all text-xs text-gray-600 dark:text-gray-300">
                    Selected: {photoFile.name}
                  </p>
                )}

                {editing && photoFile && (
                  <p className="mt-2 text-xs text-primary">
                    Your selected photo will be uploaded when you save changes.
                  </p>
                )}

                {photoFailed && photoPath && !photoPreview && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    Unable to display the saved photo. You can choose a new one.
                  </p>
                )}
              </div>
            </div>
          </FormField>

          <FormField label="Account role" htmlFor="profile-role">
            <div className="relative">
              <BriefcaseBusiness
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"
              />
              <input
                id="profile-role"
                value={profile.mtype || ""}
                disabled
                className={`${inputClass} pl-9`}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Your role is managed by an administrator.
            </p>
          </FormField>
        </div>

        {editing && (
          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-primary/20 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2  rounded-tl-xl rounded-br-xl   border border-primary/30 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-primary/5 disabled:opacity-50 dark:text-gray-200"
            >
              <X size={16} />
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2  rounded-tl-xl rounded-br-xl   bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

// --------------------------------------------------
// Reusable components
// --------------------------------------------------

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
        {icon}
      </div>

      <div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}
