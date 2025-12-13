import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

function SellerApplicationView({
  user,
  sellerForm,
  sellerError,
  sellerInputClasses,
  languageOptions,
  competencyLevels,
  onCancel,
  onSellerFormChange,
  onClearProfilePicture,
  onAddSkill,
  onRemoveSkill,
  onAddLanguage,
  onRemoveLanguage,
  onSubmit,
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const profilePreviewUrl = useMemo(() => {
    if (!sellerForm.profilePicture) return ''
    return URL.createObjectURL(sellerForm.profilePicture)
  }, [sellerForm.profilePicture])

  useEffect(
    () => () => {
      if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl)
    },
    [profilePreviewUrl],
  )

  return (
    <section className="w-full rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Become a seller</p>
          <h2 className="text-2xl font-semibold text-slate-900">Complete your profile</h2>
          <p className="text-sm text-slate-500">
            We review this info before unlocking seller tools for your account.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="text-sm text-slate-500 hover:text-slate-900"
          onClick={onCancel}
        >
          Back to hub
        </Button>
      </div>

      {user ? (
        <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex sm:items-center sm:gap-6">
          <p>
            <span className="font-semibold text-slate-900">Username:</span> {user.email.split('@')[0]}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Email:</span> {user.email}
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
          Please sign in to submit your seller profile.
        </div>
      )}

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Full Name (Private)</label>
          <input
            className={sellerInputClasses}
            placeholder="e.g., Tan Wei Ming"
            value={sellerForm.fullName}
            onChange={onSellerFormChange('fullName')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Display Name</label>
          <input
            className={sellerInputClasses}
            placeholder="e.g., Wei — Product Photographer"
            value={sellerForm.displayName}
            onChange={onSellerFormChange('displayName')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={onSellerFormChange('profilePicture')}
            className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-full file:border-0 file:bg-purple-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-purple-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
          />
          {sellerForm.profilePicture && (
            <div className="mt-2 flex items-center gap-3">
              {profilePreviewUrl && (
                <img
                  src={profilePreviewUrl}
                  alt="Profile preview"
                  className="h-14 w-14 cursor-pointer rounded-full border border-slate-200 object-cover transition hover:ring-2 hover:ring-purple-200"
                  onClick={() => setIsPreviewOpen(true)}
                />
              )}
              <div className="flex flex-col">
                <p className="text-xs text-slate-500">
                  Selected: {sellerForm.profilePicture?.name ?? '1 file'}
                </p>
                <button
                  type="button"
                  className="w-fit text-xs font-semibold text-rose-600 hover:text-rose-700"
                  onClick={onClearProfilePicture}
                >
                  Remove file
                </button>
              </div>
            </div>
          )}
        </div>

        {isPreviewOpen && profilePreviewUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4"
            onClick={() => setIsPreviewOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div className="relative max-h-[80vh] max-w-[90vw] overflow-hidden rounded-2xl bg-white shadow-2xl">
              <img
                src={profilePreviewUrl}
                alt="Profile preview enlarged"
                className="max-h-[80vh] max-w-[90vw] object-contain"
                onClick={(event) => event.stopPropagation()}
              />
              <button
                type="button"
                className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow hover:bg-white"
                onClick={() => setIsPreviewOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Description</label>
          <textarea
            rows={4}
            className={`${sellerInputClasses} resize-none`}
            placeholder="Share your experience, notable projects, and what you specialise in."
            value={sellerForm.description}
            onChange={onSellerFormChange('description')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Personal Website</label>
          <input
            type="text"
            inputMode="url"
            autoComplete="url"
            className={sellerInputClasses}
            placeholder="https:// or www.yourdomain.com"
            value={sellerForm.website}
            onChange={onSellerFormChange('website')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Instagram</label>
          <input
            type="text"
            inputMode="url"
            autoComplete="url"
            className={sellerInputClasses}
            placeholder="https://instagram.com/yourusername"
            value={sellerForm.instagram}
            onChange={onSellerFormChange('instagram')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Other Social Media</label>
          <input
            type="text"
            inputMode="url"
            autoComplete="url"
            className={sellerInputClasses}
            placeholder="https://linkedin.com/in/yourname"
            value={sellerForm.otherSocial}
            onChange={onSellerFormChange('otherSocial')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Phone Number</label>
          <input
            type="tel"
            className={sellerInputClasses}
            placeholder="+65 9123 4567"
            value={sellerForm.phone}
            onChange={onSellerFormChange('phone')}
          />
        </div>
        <div className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-sm font-semibold text-slate-700">Skills</label>
            <span className="text-xs text-slate-400">Add at least 1 skill, up to 5.</span>
          </div>
          <input
            className={sellerInputClasses}
            placeholder="e.g., Product Photography"
            value={sellerForm.skillInput}
            onChange={onSellerFormChange('skillInput')}
          />
          <button
            type="button"
            className="h-11 rounded-full bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-500"
            onClick={onAddSkill}
          >
            Add Skill
          </button>
          {sellerForm.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {sellerForm.skills.map((skill) => (
                <span
                  key={skill}
                  className="flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700"
                >
                  {skill}
                  <button
                    type="button"
                    className="text-purple-500 hover:text-purple-700"
                    onClick={() => onRemoveSkill(skill)}
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-3">
          <p className="text-base font-semibold text-slate-900">Languages and Competency Levels</p>
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className={sellerInputClasses}
              value={sellerForm.languageSelection}
              onChange={onSellerFormChange('languageSelection')}
            >
              <option value="">Select Language</option>
              {languageOptions.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
            <select
              className={sellerInputClasses}
              value={sellerForm.levelSelection}
              onChange={onSellerFormChange('levelSelection')}
            >
              <option value="">Select Level</option>
              {competencyLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="h-11 rounded-full bg-purple-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-500"
            onClick={onAddLanguage}
          >
            Add Language
          </button>
          {sellerForm.languages.length > 0 && (
            <ul className="space-y-2">
              {sellerForm.languages.map((entry) => (
                <li
                  key={entry.language}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm text-slate-600"
                >
                  <div>
                    <p className="font-semibold text-slate-900">{entry.language}</p>
                    <p className="text-xs text-slate-500">{entry.level}</p>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-rose-500"
                    onClick={() => onRemoveLanguage(entry.language)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-purple-600 px-4 py-3 text-base font-semibold text-white shadow transition hover:bg-purple-500"
        >
          Submit
        </button>
      </form>
      {sellerError && <p className="mt-4 text-sm font-semibold text-rose-600">{sellerError}</p>}
    </section>
  )
}

export default SellerApplicationView
