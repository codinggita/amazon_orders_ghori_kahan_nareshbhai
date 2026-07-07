import { useGoogleLogin } from '@react-oauth/google';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { googleLogin } from '../features/authSlice';

/* ── Google "G" SVG Logo ────────────────────────────────────────── */
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════
   GoogleAuthButton
   Uses useGoogleLogin with responseType 'code' (auth-code flow) to
   exchange a server-side authorization code for tokens via backend.
   Falls back to token flow which gives an access_token we exchange
   for user info and our own JWT on the backend.
═══════════════════════════════════════════════════════════════════ */
const GoogleAuthButton = ({ label = 'Continue with Google' }) => {
  const dispatch      = useDispatch();
  const navigate      = useNavigate();
  const { isLoading } = useSelector((state) => state.auth);

  // useGoogleLogin opens a popup and returns a tokenResponse with
  // access_token — we send this to our backend's /auth/google endpoint.
  const openGooglePopup = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch the user's profile from Google using the access_token
        const profileRes = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo`,
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        const profile = await profileRes.json();

        // Send to our backend — we pass the sub (Google user ID) + profile
        // The backend will find-or-create the user and return a JWT
        const result = await dispatch(
          googleLogin({
            googleId:       profile.sub,
            email:          profile.email,
            name:           profile.name,
            emailVerified:  profile.email_verified,
            accessToken:    tokenResponse.access_token,
          })
        ).unwrap();

        if (result.success) {
          toast.success(`Welcome, ${result.data.user.name}! 🎉`);
          navigate('/');
        }
      } catch (err) {
        toast.error(typeof err === 'string' ? err : 'Google sign-in failed. Please try again.');
      }
    },
    onError: () => toast.error('Google sign-in was cancelled or failed.'),
    scope: 'openid email profile',
  });

  return (
    <div className="space-y-3">
      {/* OR divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[11px] text-slate-600 font-medium uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Styled Google button */}
      <div className="relative group">
        {/* Hover glow ring */}
        <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-blue-500/20 via-red-500/10 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm pointer-events-none" />

        <button
          type="button"
          onClick={() => openGooglePopup()}
          disabled={isLoading}
          className="relative flex items-center justify-center gap-3 w-full py-[13px] px-4 rounded-xl
                     border border-white/[0.09] bg-white/[0.04] hover:bg-white/[0.07]
                     text-slate-300 text-sm font-semibold
                     transition-all duration-200
                     hover:border-white/[0.18] hover:text-white
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <GoogleLogo />
              <span>{label}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GoogleAuthButton;
