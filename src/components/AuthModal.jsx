import React, { useState } from 'react';
import { X, Mail, Lock, Phone, User as UserIcon, ArrowRight, ShieldCheck, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2, KeyRound, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGoogleLogin } from '@react-oauth/google';
import './AuthModal.css';

const SKIN_COLORS = ['edb98a', 'd08b5b', '614335', 'ffeacb', 'f8d25c', 'fd9841'];
const HAIR_BOY = ['shortFlat', 'shortRound', 'shortWaved', 'sides', 'theCaesar'];
const HAIR_GIRL = ['straight01', 'curly', 'miaWallace', 'bob', 'bun'];
const GLASSES = ['none', 'prescription01', 'prescription02', 'round', 'sunglasses'];
const BEARDS = ['none', 'beardLight', 'beardMedium', 'beardMajestic', 'moustacheFancy', 'moustacheMagnum'];
const EYES = ['default', 'happy', 'hearts', 'wink', 'surprised', 'cry'];
const MOUTHS = ['default', 'smile', 'serious', 'sad', 'grimace'];

const AuthModal = () => {
  const { isAuthModalOpen, closeAuthModal, loginUser, registerUser, loginGoogle, updateAvatar, setShouldOpenProfile, forgotPassword, resetPassword, resetToken, setResetToken } = useAuth();
  
  // If we have a resetToken from the URL, start in reset-password mode
  const [tab, setTab] = useState('signup');
  // 'form' | 'avatar' | 'success' | 'forgot' | 'forgot-sent' | 'reset-password'
  const [authStep, setAuthStep] = useState(resetToken ? 'reset-password' : 'form');
  const [isGoogleSignupFlow, setIsGoogleSignupFlow] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [gender, setGender] = useState('boy');
  const [skinIdx, setSkinIdx] = useState(0);
  const [hairIdx, setHairIdx] = useState(0);
  const [glassIdx, setGlassIdx] = useState(0);
  const [beardIdx, setBeardIdx] = useState(0);
  const [eyeIdx, setEyeIdx] = useState(0);
  const [mouthIdx, setMouthIdx] = useState(0);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const data = await loginGoogle(tokenResponse.access_token);
        if (data && data.isNewUser) {
           setIsGoogleSignupFlow(true);
           setAuthStep('avatar');
        } else {
           setAuthStep('success');
           setShouldOpenProfile(true); 
           setTimeout(() => resetState(), 1500);
        }
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setErrorMsg("Google login was cancelled.")
  });

  if (!isAuthModalOpen) return null;

  // --- Validation helpers ---
  const validatePhone = (p) => {
    if (!p || p.trim() === '') return true; // optional
    const digits = p.replace(/\D/g, '');
    return digits.length >= 10;
  };

  const validatePassword = (p) => p && p.length >= 6;

  const getAvatarUrl = () => {
    const hairArr = gender === 'boy' ? HAIR_BOY : HAIR_GIRL;
    let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email || 'Cadet'}`;
    url += `&skinColor=${SKIN_COLORS[skinIdx]}`;
    url += `&top=${hairArr[hairIdx]}`;
    url += `&eyes=${EYES[eyeIdx]}&mouth=${MOUTHS[mouthIdx]}`;
    if (GLASSES[glassIdx] !== 'none') {
      url += `&accessoriesProbability=100&accessories=${GLASSES[glassIdx]}`;
    } else {
      url += `&accessoriesProbability=0`;
    }
    if (gender === 'boy' && BEARDS[beardIdx] !== 'none') {
      url += `&facialHairProbability=100&facialHair=${BEARDS[beardIdx]}`;
    } else {
      url += `&facialHairProbability=0`;
    }
    return url;
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (tab === 'signup') {
      if (!validatePhone(phone)) {
        setErrorMsg('Phone number must contain at least 10 digits.');
        return;
      }
      if (!validatePassword(password)) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      setAuthStep('avatar');
      return;
    }

    // Login
    setIsLoading(true);
    try {
      await loginUser(email, password);
      setAuthStep('success');
      setShouldOpenProfile(true); 
      setTimeout(() => resetState(), 1500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeRegistration = async () => {
    setIsLoading(true);
    try {
      if (isGoogleSignupFlow) {
         await updateAvatar(getAvatarUrl(), phone);
      } else {
         await registerUser(firstName, email, phone, password, getAvatarUrl());
      }
      setAuthStep('success');
      setShouldOpenProfile(true); 
      setTimeout(() => resetState(), 1500);
    } catch (err) {
      setErrorMsg(err.message);
      setAuthStep('form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!email) { setErrorMsg('Please enter your email address.'); return; }
    setIsLoading(true);
    try {
      const data = await forgotPassword(email);
      setSuccessMsg(data.message);
      setAuthStep('forgot-sent');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!validatePassword(newPassword)) { setErrorMsg('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
    setIsLoading(true);
    try {
      const token = resetToken;
      await resetPassword(token, newPassword);
      setResetToken(null);
      setSuccessMsg('Password reset! You can now log in.');
      setAuthStep('success');
      setTimeout(() => { setAuthStep('form'); setTab('login'); setSuccessMsg(''); }, 2000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setTab('login');
    setAuthStep('form');
    setIsGoogleSignupFlow(false);
    setFirstName(''); setEmail(''); setPhone(''); setPassword('');
    setNewPassword(''); setConfirmPassword('');
    setErrorMsg(''); setSuccessMsg('');
    setSkinIdx(0); setHairIdx(0); setGlassIdx(0); setBeardIdx(0); setEyeIdx(0); setMouthIdx(0);
    setGender('boy');
    setResetToken(null);
  };

  const cycleArr = (val, setVal, arr, maxIdx) => setVal(val + 1 > maxIdx ? 0 : val + 1);
  const cycleArrBack = (val, setVal, arr, maxIdx) => setVal(val - 1 < 0 ? maxIdx : val - 1);

  const getHeaderText = () => {
    if (authStep === 'success') return 'ACCESS GRANTED';
    if (authStep === 'avatar') return 'DESIGN YOUR AVATAR';
    if (authStep === 'forgot') return 'FORGOT PASSWORD';
    if (authStep === 'forgot-sent') return 'CHECK YOUR EMAIL';
    if (authStep === 'reset-password') return 'RESET PASSWORD';
    return tab === 'login' ? 'WELCOME BACK' : 'JOIN THE CREW';
  };

  const getSubtitle = () => {
    if (authStep === 'success') return successMsg || 'Secure connection established...';
    if (authStep === 'avatar') return 'Stand out in the SPAR network!';
    if (authStep === 'forgot') return 'Enter your email to receive a reset link.';
    if (authStep === 'forgot-sent') return 'A password reset link has been sent if that email is registered.';
    if (authStep === 'reset-password') return 'Enter your new password below.';
    return tab === 'login' ? 'Sign in to access your digital tickets.' : 'Sign up to lock in your arcade rewards!';
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal glass-morphism pop-in flex flex-col">
        <div className="auth-roamers">
          <div className="a-roamer a-star-1">⭐</div>
          <div className="a-roamer a-star-2">🌟</div>
          <div className="a-roamer a-alien-1">👽</div>
          <div className="a-roamer a-alien-2">👾</div>
          <div className="a-roamer a-rocket">🚀</div>
          <div className="a-roamer a-ufo">🛸</div>
        </div>
        <button className="auth-close-btn" onClick={() => { closeAuthModal(); resetState(); }}>
          <X size={24} color="#fff" />
        </button>

        <div className="auth-header">
           <h2 className="text-white-shimmer-rtl">{getHeaderText()}</h2>
           <p className="auth-subtitle text-muted">{getSubtitle()}</p>
        </div>

        {/* SUCCESS */}
        {authStep === 'success' && (
           <div className="auth-success-view flex-center">
              <div className="shield-loader scale-in">
                <ShieldCheck size={80} color="#C7FF00" />
              </div>
           </div>
        )}

        {/* FORGOT-SENT CONFIRMATION */}
        {authStep === 'forgot-sent' && (
          <div className="auth-success-view flex-center flex-col gap-4">
            <div style={{ fontSize: '4rem' }}>📧</div>
            <p style={{ color: '#C7FF00', fontWeight: 800, textAlign: 'center' }}>Link sent! Check your inbox.</p>
            <button className="btn-primary auth-submit mt-2" onClick={() => { setAuthStep('form'); setTab('login'); }}>
              BACK TO LOGIN
            </button>
          </div>
        )}

        {/* RESET PASSWORD FORM */}
        {authStep === 'reset-password' && (
          <form className="auth-form fade-in" onSubmit={handleResetPassword}>
            {errorMsg && (
              <div className="auth-error glass-morphism mb-4 flex items-center gap-2 text-red-400 p-3 rounded-lg border border-red-500/30">
                <AlertCircle size={18} /><span className="text-sm font-bold">{errorMsg}</span>
              </div>
            )}
            <div className="input-group">
              <Lock size={18} className="input-icon" color="#94A3B8" />
              <input type="password" className="modern-input with-icon" placeholder="New Password (min 6 chars)"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <div className="input-group">
              <Lock size={18} className="input-icon" color="#94A3B8" />
              <input type="password" className="modern-input with-icon" placeholder="Confirm New Password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
            </div>
            <button type="submit" className="btn-primary auth-submit mt-4" disabled={isLoading}>
              {isLoading ? <div className="spinner"></div> : <><KeyRound size={18}/> SET NEW PASSWORD</>}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {authStep === 'forgot' && (
          <form className="auth-form fade-in" onSubmit={handleForgotPassword}>
            {errorMsg && (
              <div className="auth-error glass-morphism mb-4 flex items-center gap-2 text-red-400 p-3 rounded-lg border border-red-500/30">
                <AlertCircle size={18} /><span className="text-sm font-bold">{errorMsg}</span>
              </div>
            )}
            <div className="input-group">
              <Mail size={18} className="input-icon" color="#94A3B8" />
              <input type="email" className="modern-input with-icon" placeholder="Your registered email"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn-primary auth-submit mt-4" disabled={isLoading}>
              {isLoading ? <div className="spinner"></div> : <><Send size={18}/> SEND RESET LINK</>}
            </button>
            <button type="button" className="builder-nav-btn glass-morphism mt-3 w-full" onClick={() => { setAuthStep('form'); setTab('login'); setErrorMsg(''); }}>
              ← BACK TO LOGIN
            </button>
          </form>
        )}

        {/* AVATAR BUILDER */}
        {authStep === 'avatar' && (
           <div className="avatar-builder fade-in">
              <div className="avatar-preview-box">
                <img src={getAvatarUrl()} alt="Avatar Preview" className="avatar-preview-img" />
              </div>
              
              <div className="avatar-controls">
                <div className="builder-row">
                  <span className="builder-label">GENDER</span>
                  <div className="gender-toggles flex gap-2">
                     <button className={`builder-gender-btn ${gender === 'boy' ? 'active' : ''}`} onClick={() => { setGender('boy'); setHairIdx(0); }}>BOY</button>
                     <button className={`builder-gender-btn ${gender === 'girl' ? 'active' : ''}`} onClick={() => { setGender('girl'); setHairIdx(0); }}>GIRL</button>
                  </div>
                </div>

                {[
                  { label: 'SKIN COLOR', val: skinIdx, setVal: setSkinIdx, arr: SKIN_COLORS, display: `Variant ${skinIdx + 1}` },
                  { label: 'HAIR', val: hairIdx, setVal: setHairIdx, arr: gender === 'boy' ? HAIR_BOY : HAIR_GIRL, display: `Style ${hairIdx + 1}` },
                  { label: 'GLASSES', val: glassIdx, setVal: setGlassIdx, arr: GLASSES, display: GLASSES[glassIdx].toUpperCase() },
                  { label: 'EYES', val: eyeIdx, setVal: setEyeIdx, arr: EYES, display: EYES[eyeIdx].toUpperCase() },
                  { label: 'MOUTH', val: mouthIdx, setVal: setMouthIdx, arr: MOUTHS, display: MOUTHS[mouthIdx].toUpperCase() },
                ].map(({ label, val, setVal, arr, display }) => (
                  <div className="builder-row" key={label}>
                    <span className="builder-label">{label}</span>
                    <div className="builder-toggles">
                      <button onClick={() => cycleArrBack(val, setVal, arr, arr.length - 1)}><ChevronLeft size={16}/></button>
                      <span className="builder-val">{display}</span>
                      <button onClick={() => cycleArr(val, setVal, arr, arr.length - 1)}><ChevronRight size={16}/></button>
                    </div>
                  </div>
                ))}

                {gender === 'boy' && (
                  <div className="builder-row">
                    <span className="builder-label">BEARD</span>
                    <div className="builder-toggles">
                      <button onClick={() => cycleArrBack(beardIdx, setBeardIdx, BEARDS, BEARDS.length - 1)}><ChevronLeft size={16}/></button>
                      <span className="builder-val">{beardIdx === 0 ? 'NONE' : `STYLE ${beardIdx}`}</span>
                      <button onClick={() => cycleArr(beardIdx, setBeardIdx, BEARDS, BEARDS.length - 1)}><ChevronRight size={16}/></button>
                    </div>
                  </div>
                )}

                {isGoogleSignupFlow && (
                  <div className="builder-row google-extra-fields" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
                    <span className="builder-label" style={{ textAlign: 'left', opacity: 0.8 }}>Phone Number (Required for Bookings)</span>
                    <input type="tel" className="modern-input" placeholder="e.g. 9876543210"
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      style={{ padding: '10px 14px', fontSize: '14px', borderRadius: '8px' }} />
                    {phone && !validatePhone(phone) && (
                      <span style={{ color: '#FF0055', fontSize: '0.75rem', fontWeight: 700 }}>⚠ Must be at least 10 digits</span>
                    )}
                  </div>
                )}
              </div>

              {errorMsg && (
                <div className="auth-error glass-morphism mt-3 flex items-center gap-2 text-red-400 p-3 rounded-lg border border-red-500/30 w-full">
                  <AlertCircle size={18} /><span className="text-sm font-bold">{errorMsg}</span>
                </div>
              )}

              <div className="flex gap-2 mt-6 builder-actions">
                <button className="builder-nav-btn glass-morphism" onClick={() => setAuthStep('form')}>BACK</button>
                <button className="builder-nav-btn glass-morphism" style={{opacity: 0.7}} onClick={handleFinalizeRegistration} disabled={isLoading}>SKIP</button>
                <button className="btn-primary builder-finish-btn flex-1 shrink-0" onClick={handleFinalizeRegistration} disabled={isLoading}>
                  {isLoading ? <div className="spinner"></div> : <><CheckCircle2 size={18}/> FINALIZE</>}
                </button>
              </div>
           </div>
        )}

        {/* MAIN LOGIN / SIGNUP FORM */}
        {authStep === 'form' && (
          <>
            <div className="auth-tabs">
              <button type="button" className={`tab-btn ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setErrorMsg(''); }}>LOGIN</button>
              <button type="button" className={`tab-btn ${tab === 'signup' ? 'active' : ''}`} onClick={() => { setTab('signup'); setErrorMsg(''); }}>SIGN UP</button>
            </div>

            {errorMsg && (
              <div className="auth-error glass-morphism mb-4 flex items-center gap-2 text-red-400 p-3 rounded-lg border border-red-500/30">
                <AlertCircle size={18} /><span className="text-sm font-bold">{errorMsg}</span>
              </div>
            )}

            <form className="auth-form fade-in" onSubmit={handleInitialSubmit}>
              {tab === 'signup' && (
                <>
                  <div className="input-group">
                    <UserIcon size={18} className="input-icon" color="#94A3B8" />
                    <input type="text" className="modern-input with-icon" placeholder="First Name"
                      value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <Phone size={18} className="input-icon" color="#94A3B8" />
                    <input type="tel" className="modern-input with-icon" placeholder="Phone Number (min 10 digits)"
                      value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    {phone && !validatePhone(phone) && (
                      <span style={{ color: '#FF0055', fontSize: '0.72rem', fontWeight: 700, marginTop: '4px', display: 'block', paddingLeft: '4px' }}>
                        ⚠ Must be at least 10 digits
                      </span>
                    )}
                  </div>
                </>
              )}

              <div className="input-group">
                <Mail size={18} className="input-icon" color="#94A3B8" />
                <input type="email" className="modern-input with-icon" placeholder="Email Address"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="input-group">
                <Lock size={18} className="input-icon" color="#94A3B8" />
                <input type="password" className="modern-input with-icon"
                  placeholder={tab === 'signup' ? 'Password (min 6 chars)' : 'Password'}
                  value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="on" />
                {tab === 'signup' && password && !validatePassword(password) && (
                  <span style={{ color: '#FF0055', fontSize: '0.72rem', fontWeight: 700, marginTop: '4px', display: 'block', paddingLeft: '4px' }}>
                    ⚠ Password must be at least 6 characters
                  </span>
                )}
              </div>

              {tab === 'login' && (
                <div style={{ textAlign: 'right', marginBottom: '8px', marginTop: '-4px' }}>
                  <button type="button"
                    style={{ background: 'none', border: 'none', color: '#00D1FF', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => { setAuthStep('forgot'); setErrorMsg(''); }}>
                    Forgot Password?
                  </button>
                </div>
              )}

              <button type="submit" className="btn-primary auth-submit mt-4" disabled={isLoading}>
                {isLoading ? <div className="spinner"></div> :
                  <>{tab === 'login' ? 'INITIATE LOGIN' : 'DESIGN AVATAR'} <ArrowRight size={18}/></>
                }
              </button>
            </form>

            <div className="auth-footer text-center mt-6">
              <p className="text-muted text-xs mb-3">Or continue quickly with</p>
              <button type="button" className="google-btn glass-morphism" onClick={handleGoogleSignIn} disabled={isLoading}>
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Continue with Google
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
