import React, { useState } from 'react';
import { X, Mail, Lock, Phone, User as UserIcon, ArrowRight, ShieldCheck, AlertCircle, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
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
  const { isAuthModalOpen, closeAuthModal, loginUser, registerUser, loginGoogle, updateAvatar, setShouldOpenProfile } = useAuth();
  
  const [tab, setTab] = useState('signup'); // Default to 'signup' as requested
  const [authStep, setAuthStep] = useState('form'); // 'form', 'avatar', 'success'
  const [isGoogleSignupFlow, setIsGoogleSignupFlow] = useState(false);
  
  // Form State
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  // Avatar Creation State
  const [gender, setGender] = useState('boy');
  const [skinIdx, setSkinIdx] = useState(0);
  const [hairIdx, setHairIdx] = useState(0);
  const [glassIdx, setGlassIdx] = useState(0);
  const [beardIdx, setBeardIdx] = useState(0);
  const [eyeIdx, setEyeIdx] = useState(0);
  const [mouthIdx, setMouthIdx] = useState(0);

  const [errorMsg, setErrorMsg] = useState('');
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
    
    if (tab === 'login') {
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
    } else {
      setAuthStep('avatar');
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
      setAuthStep('form'); // kick back to form to fix e.g. duplicate email
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setTab('login');
    setAuthStep('form');
    setIsGoogleSignupFlow(false);
    setFirstName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setErrorMsg('');
    setSkinIdx(0);
    setHairIdx(0);
    setGlassIdx(0);
    setBeardIdx(0);
    setEyeIdx(0);
    setMouthIdx(0);
    setGender('boy');
  };

  const cycleArr = (val, setVal, arr, maxIdx) => {
    setVal(val + 1 > maxIdx ? 0 : val + 1);
  };
  const cycleArrBack = (val, setVal, arr, maxIdx) => {
    setVal(val - 1 < 0 ? maxIdx : val - 1);
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
           <h2 className="text-white-shimmer-rtl">
             {authStep === 'success' ? 'ACCESS GRANTED' : 
              authStep === 'avatar' ? 'DESIGN YOUR AVATAR' :
              tab === 'login' ? 'WELCOME BACK' : 'JOIN THE CREW'}
           </h2>
           <p className="auth-subtitle text-muted">
             {authStep === 'success' ? 'Secure connection established...' :
              authStep === 'avatar' ? 'Stand out in the SPAR network!' :
              tab === 'login' ? 'Sign in to access your digital tickets.' : 'Sign up to lock in your arcade rewards!'}
           </p>
        </div>

        {authStep === 'success' ? (
           <div className="auth-success-view flex-center">
              <div className="shield-loader scale-in">
                <ShieldCheck size={80} color="#C7FF00" />
              </div>
           </div>
        ) : authStep === 'avatar' ? (
           <div className="avatar-builder fade-in">
              <div className="avatar-preview-box">
                <img src={getAvatarUrl()} alt="Avatar Preview" className="avatar-preview-img" />
              </div>
              
              <div className="avatar-controls">
                
                <div className="builder-row">
                  <span className="builder-label">GENDER</span>
                  <div className="gender-toggles flex gap-2">
                     <button 
                       className={`builder-gender-btn ${gender === 'boy' ? 'active' : ''}`}
                       onClick={() => { setGender('boy'); setHairIdx(0); }}
                     >
                       BOY
                     </button>
                     <button 
                       className={`builder-gender-btn ${gender === 'girl' ? 'active' : ''}`}
                       onClick={() => { setGender('girl'); setHairIdx(0); }}
                     >
                       GIRL
                     </button>
                  </div>
                </div>

                <div className="builder-row">
                  <span className="builder-label">SKIN COLOR</span>
                  <div className="builder-toggles">
                    <button onClick={() => cycleArrBack(skinIdx, setSkinIdx, SKIN_COLORS, SKIN_COLORS.length-1)}><ChevronLeft size={16}/></button>
                    <span className="builder-val">Variant {skinIdx + 1}</span>
                    <button onClick={() => cycleArr(skinIdx, setSkinIdx, SKIN_COLORS, SKIN_COLORS.length-1)}><ChevronRight size={16}/></button>
                  </div>
                </div>

                <div className="builder-row">
                  <span className="builder-label">HAIR</span>
                  <div className="builder-toggles">
                    <button onClick={() => cycleArrBack(hairIdx, setHairIdx, gender === 'boy' ? HAIR_BOY : HAIR_GIRL, (gender === 'boy' ? HAIR_BOY : HAIR_GIRL).length-1)}><ChevronLeft size={16}/></button>
                    <span className="builder-val">Style {hairIdx + 1}</span>
                    <button onClick={() => cycleArr(hairIdx, setHairIdx, gender === 'boy' ? HAIR_BOY : HAIR_GIRL, (gender === 'boy' ? HAIR_BOY : HAIR_GIRL).length-1)}><ChevronRight size={16}/></button>
                  </div>
                </div>

                <div className="builder-row">
                  <span className="builder-label">GLASSES</span>
                  <div className="builder-toggles">
                    <button onClick={() => cycleArrBack(glassIdx, setGlassIdx, GLASSES, GLASSES.length-1)}><ChevronLeft size={16}/></button>
                    <span className="builder-val">{GLASSES[glassIdx].toUpperCase()}</span>
                    <button onClick={() => cycleArr(glassIdx, setGlassIdx, GLASSES, GLASSES.length-1)}><ChevronRight size={16}/></button>
                  </div>
                </div>

                <div className="builder-row">
                  <span className="builder-label">EYES</span>
                  <div className="builder-toggles">
                    <button onClick={() => cycleArrBack(eyeIdx, setEyeIdx, EYES, EYES.length-1)}><ChevronLeft size={16}/></button>
                    <span className="builder-val">{EYES[eyeIdx].toUpperCase()}</span>
                    <button onClick={() => cycleArr(eyeIdx, setEyeIdx, EYES, EYES.length-1)}><ChevronRight size={16}/></button>
                  </div>
                </div>

                <div className="builder-row">
                  <span className="builder-label">MOUTH</span>
                  <div className="builder-toggles">
                    <button onClick={() => cycleArrBack(mouthIdx, setMouthIdx, MOUTHS, MOUTHS.length-1)}><ChevronLeft size={16}/></button>
                    <span className="builder-val">{MOUTHS[mouthIdx].toUpperCase()}</span>
                    <button onClick={() => cycleArr(mouthIdx, setMouthIdx, MOUTHS, MOUTHS.length-1)}><ChevronRight size={16}/></button>
                  </div>
                </div>

                {gender === 'boy' && (
                  <div className="builder-row">
                    <span className="builder-label">BEARD</span>
                    <div className="builder-toggles">
                      <button onClick={() => cycleArrBack(beardIdx, setBeardIdx, BEARDS, BEARDS.length-1)}><ChevronLeft size={16}/></button>
                      <span className="builder-val">{beardIdx === 0 ? 'NONE' : `STYLE ${beardIdx}`}</span>
                      <button onClick={() => cycleArr(beardIdx, setBeardIdx, BEARDS, BEARDS.length-1)}><ChevronRight size={16}/></button>
                    </div>
                  </div>
                )}

                {isGoogleSignupFlow && (
                  <div className="builder-row google-extra-fields" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '15px' }}>
                    <span className="builder-label" style={{ textAlign: 'left', opacity: 0.8 }}>Add Phone Number (Required for Bookings)</span>
                    <input 
                      type="tel" 
                      className="modern-input" 
                      placeholder="Enter Phone Number..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ padding: '10px 14px', fontSize: '14px', borderRadius: '8px' }}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6 builder-actions">
                <button className="builder-nav-btn glass-morphism" onClick={() => setAuthStep('form')}>BACK</button>
                <button className="builder-nav-btn glass-morphism" style={{opacity: 0.7}} onClick={handleFinalizeRegistration} disabled={isLoading}>SKIP</button>
                <button className="btn-primary builder-finish-btn flex-1 shrink-0" onClick={handleFinalizeRegistration} disabled={isLoading}>
                  {isLoading ? <div className="spinner"></div> : <><CheckCircle2 size={18}/> FINALIZE</>}
                </button>
              </div>
           </div>
        ) : (
          <>
            <div className="auth-tabs">
              <button 
                 type="button"
                 className={`tab-btn ${tab === 'login' ? 'active' : ''}`} 
                 onClick={() => {setTab('login'); setErrorMsg('');}}
              >
                LOGIN
              </button>
              <button 
                 type="button"
                 className={`tab-btn ${tab === 'signup' ? 'active' : ''}`} 
                 onClick={() => {setTab('signup'); setErrorMsg('');}}
              >
                SIGN UP
              </button>
            </div>

            {errorMsg && (
              <div className="auth-error glass-morphism mb-4 flex items-center gap-2 text-red-400 p-3 rounded-lg border border-red-500/30">
                <AlertCircle size={18} />
                <span className="text-sm font-bold">{errorMsg}</span>
              </div>
            )}

            <form className="auth-form fade-in" onSubmit={handleInitialSubmit}>
              
              {tab === 'signup' && (
                <>
                  <div className="input-group">
                    <UserIcon size={18} className="input-icon" color="#94A3B8" />
                    <input 
                      type="text" 
                      className="modern-input with-icon" 
                      placeholder="First Name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <Phone size={18} className="input-icon" color="#94A3B8" />
                    <input 
                      type="tel" 
                      className="modern-input with-icon" 
                      placeholder="Phone Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              <div className="input-group">
                <Mail size={18} className="input-icon" color="#94A3B8" />
                <input 
                  type="email" 
                  className="modern-input with-icon" 
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <Lock size={18} className="input-icon" color="#94A3B8" />
                <input 
                  type="password" 
                  className="modern-input with-icon" 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="on"
                />
              </div>

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
