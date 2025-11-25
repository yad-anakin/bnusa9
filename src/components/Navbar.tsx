'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTheme } from '@/utils/themeContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollYBeforeLock, setScrollYBeforeLock] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [visible, setVisible] = useState(true);
  const { reduceMotion } = useTheme();
  const { currentUser, loading } = useAuth();
  const pathname = usePathname();
  const isAuthRoute = pathname === '/signin' || pathname === '/signup';

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Only adjust background style on scroll; navbar stays visible
      setScrolled(currentScrollY > 50);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Toggle mobile menu and prevent background scrolling when menu is open
  const lockScroll = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    setScrollYBeforeLock(scrollY);
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.touchAction = 'none';
  };

  const unlockScroll = () => {
    const top = document.body.style.top;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.touchAction = '';
    document.documentElement.style.overflow = '';
    document.documentElement.style.overscrollBehavior = '';
    // Restore previous scroll position
    const y = top ? -parseInt(top || '0') : scrollYBeforeLock;
    window.scrollTo(0, y || 0);
  };

  const toggleMenu = () => {
    const newState = !isMenuOpen;
    setIsMenuOpen(newState);
    if (newState) lockScroll(); else unlockScroll();
  };

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      unlockScroll();
    };
  }, []);

  const transitionStyle = reduceMotion ? {} : {
    transition: 'transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease'
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 w-full font-[Rabar_021] translate-y-0 pointer-events-none`}
        style={transitionStyle}
      >
        <div className="container mx-auto px-4">
          <div className="h-24 flex items-center justify-center">
            <div className={`w-full max-w-3xl rounded-full border ${scrolled || isAuthRoute ? 'bg-white/60 backdrop-blur-lg border-white/30' : 'bg-white/40 backdrop-blur-md border-white/20'} px-3 py-2 flex items-center justify-between pointer-events-auto`}>
              {/* Left: Hamburger */}
              <Link href="/" className="text-xl font-semibold" style={{ color: 'var(--primary)' }}>بنووسە</Link>
              <button
                className="p-2 rounded-full hover:bg-white/60 transition"
                onClick={toggleMenu}
                aria-label={isMenuOpen ? 'داخستنی مینیۆ' : 'کردنەوەی مینیۆ'}
                aria-expanded={isMenuOpen}
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  ) : (
                    // 2-line hamburger for minimal look
                    <>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7h16"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 17h16"></path>
                    </>
                  )}
                </svg>
              </button>
              {/* Right: Brand */}
              
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Full Screen Overlay */}
      <div 
        className={`fixed inset-0 bg-white/90 backdrop-blur-md z-40 flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ paddingTop: '96px' }}
      >
        <div className="container mx-auto px-4 flex-1 flex flex-col justify-between py-8">
          {/* Navigation Links in Middle */}
          <nav className="flex-1 flex flex-col space-y-8 mb-10">
            <Link
              href="/"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#3B82F6" d="M4 19v-9q0-.475.213-.9t.587-.7l6-4.5q.525-.4 1.2-.4t1.2.4l6 4.5q.375.275.588.7T20 10v9q0 .825-.588 1.413T18 21h-3q-.425 0-.712-.288T14 20v-5q0-.425-.288-.712T13 14h-2q-.425 0-.712.288T10 15v5q0 .425-.288.713T9 21H6q-.825 0-1.412-.587T4 19"/></svg>
                <span>سەرەکی</span>
              </span>
            </Link>
            <Link
              href="/about"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="#3B82F6" stroke="#3B82F6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"><circle cx="34" cy="14" r="9"/><circle cx="12" cy="25" r="7"/><circle cx="29" cy="37" r="5"/></g></svg>                <span>دەربارەی ئێمە</span>
              </span>
            </Link>
            <Link
              href="/writers"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 12 12"><path fill="#3B82F6" d="M6.153 7.008A1.5 1.5 0 0 1 7.5 8.5c0 .771-.47 1.409-1.102 1.83c-.635.424-1.485.67-2.398.67s-1.763-.246-2.398-.67C.969 9.91.5 9.271.5 8.5A1.5 1.5 0 0 1 2 7h4zM10.003 7a1.5 1.5 0 0 1 1.5 1.5c0 .695-.432 1.211-.983 1.528c-.548.315-1.265.472-2.017.472q-.38-.001-.741-.056c.433-.512.739-1.166.739-1.944A2.5 2.5 0 0 0 7.997 7zM4.002 1.496A2.253 2.253 0 1 1 4 6.001a2.253 2.253 0 0 1 0-4.505m4.75 1.001a1.75 1.75 0 1 1 0 3.5a1.75 1.75 0 0 1 0-3.5"/></svg>                <span>ستاف</span>
              </span>
            </Link>
            <Link
              href="/publishes"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#3B82F6" fillRule="evenodd" d="M2 6a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3zm5 1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zm1 4V9h2v2zm7-4a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2zm0 4a1 1 0 1 0 0 2h2a1 1 0 1 0 0-2zm-8 4a1 1 0 1 0 0 2h10a1 1 0 1 0 0-2z" clipRule="evenodd"/></svg>
                <span>بڵاوکراوەکان</span>
              </span>
            </Link>
            <Link
              href="/reviews"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 2048 2048"><path fill="#3B82F6" d="m448 768l-320 320V768H0V128h1664v640zm-64 256h1664v640h-128v320l-320-320H384z"/></svg>                <span>هەڵسەنگاندنەکان</span>
              </span>
            </Link>
            <Link
              href="/ktebnus"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><path fill="#3B82F6" stroke="#3B82F6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 6h34s4 2 4 7s-4 7-4 7H5s4-2 4-7s-4-7-4-7m38 22H9s-4 2-4 7s4 7 4 7h34s-4-2-4-7s4-7 4-7"/></svg>                <span>کتێب نووس</span>
              </span>
            </Link>
            <Link
              href="/bookstore"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 16"><path fill="#3B82F6" d="M3.5 2h-3c-.275 0-.5.225-.5.5v11c0 .275.225.5.5.5h3c.275 0 .5-.225.5-.5v-11c0-.275-.225-.5-.5-.5M3 5H1V4h2zm5.5-3h-3c-.275 0-.5.225-.5.5v11c0 .275.225.5.5.5h3c.275 0 .5-.225.5-.5v-11c0-.275-.225-.5-.5-.5M8 5H6V4h2z"/><path fill="#3B82F6" d="m11.954 2.773l-2.679 1.35a.5.5 0 0 0-.222.671l4.5 8.93a.5.5 0 0 0 .671.222l2.679-1.35a.5.5 0 0 0 .222-.671l-4.5-8.93a.5.5 0 0 0-.671-.222"/><path fill="#3B82F6" d="M14.5 13.5a.5.5 0 1 1-1 0a.5.5 0 0 1 1 0"/></svg>                <span>کتێبخانە</span>
              </span>
            </Link>
            <Link
              href="/write-here-landing"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#3B82F6" d="M6 11c-.483 0-1.021.725-1 1.983c.013.783.29 1.3 1.035 2.07l.107.107l.101-.134c.466-.643.714-1.266.752-1.864L7 13l-.003-.563c-.017-1.284-.13-1.422-.807-1.436zm12-9c1.673 0 3 1.327 3 3v1h-6V5c0-1.673 1.327-3 3-3m2.707 15.707l-2 2l-.08.071l-.043.034l-.084.054l-.103.052l-.084.032l-.08.023l-.143.023l-.071.004H15.5c-1.616 0-2.954-.83-4.004-2.393l-.026-.04l-.273.431l-.365.557c-1.356 2.034-2.942 1.691-4.7-.41l-.064-.076l-.176.147q-.897.727-2.045 1.438l-.332.203a1 1 0 1 1-1.03-1.714a19 19 0 0 0 2.17-1.498l.078-.065l-.147-.15c-.998-1.033-1.498-1.904-1.576-3.157L3 13.017C2.962 10.744 4.257 9 6 9c2.052 0 3 .948 3 4c0 1.218-.47 2.392-1.392 3.532l-.11.13l.28.36c.784.985.994.992 1.343.492l.047-.069q.97-1.456 1.437-2.392a1 1 0 0 1 1.814.053C13.277 17.108 14.297 18 15.5 18l.085-.001l-.292-.292A1 1 0 0 1 15 17V8h6v9a1 1 0 0 1-.293.707"/></svg>   
                <span>لێرە بنووسە</span>
              </span>
            </Link>
            <Link
              href="/write-here"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#3B82F6" d="M8.82 19.79a1 1 0 0 0-1.42 0l-1.29 1.29l-1.29-1.29a1 1 0 0 0-1.35-.06l-3 2.5a1 1 0 0 0-.13 1.41a1 1 0 0 0 1.41.13l2.3-1.92l1.35 1.36a1 1 0 0 0 1.42 0l1.29-1.3l.79.8a1 1 0 0 0 1.42-1.42ZM23.78 3.36a2.9 2.9 0 0 0-1.38-1.72L19.49.07a.51.51 0 0 0-.68.19l-8 14.46a.5.5 0 0 0 0 .38a.52.52 0 0 0 .24.3l2.48 1.37a.5.5 0 0 0 .24.06a.49.49 0 0 0 .44-.26L21.46 3.4a.9.9 0 0 1 .39.52a.87.87 0 0 1-.07.67l-3.64 6.61a1 1 0 0 0 .39 1.36a1 1 0 0 0 1.36-.39l3.64-6.61a2.9 2.9 0 0 0 .25-2.2M13.1 17.54l-2.48-1.36a.52.52 0 0 0-.51 0a.49.49 0 0 0-.23.44l.1 2.75a.47.47 0 0 0 .26.42a.5.5 0 0 0 .49 0l2.38-1.39a.47.47 0 0 0 .24-.43a.52.52 0 0 0-.25-.43"/></svg>
             <span>بڵاوکراوەیەک بنووسە</span>
              </span>
            </Link>
            
            <Link
              href="/write-review"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none" stroke="#3B82F6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"><path fill="#3B82F6" fillRule="evenodd" d="M24 24v-5L39 4l5 5l-15 15z" clipRule="evenodd"/><path d="M16 24H9a5 5 0 0 0 0 10h30a5 5 0 0 1 0 10H18"/></g></svg>                <span>هەڵسەنگاندێک بنووسە</span>
              </span>
            </Link>
            {/* Kteb Nus cluster placed here */}
            
            <Link
              href="/kteb-nus/new"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#3B82F6" d="M18.68 5.32a4.49 4.49 0 0 0-6.36 0c-1.23 1.22-2.87 8-3.06 8.81a.49.49 0 0 0 .14.47a.5.5 0 0 0 .47.14c.77-.19 7.58-1.83 8.81-3.06a4.49 4.49 0 0 0 0-6.36M15.5 10A1.5 1.5 0 1 1 17 8.5a1.5 1.5 0 0 1-1.5 1.5m8.35-5.85l-4-4a.49.49 0 0 0-.41-.15a.52.52 0 0 0-.37.24l-1.5 2.5a.49.49 0 0 0 .08.61l3 3a.47.47 0 0 0 .35.15a.5.5 0 0 0 .26-.07l2.5-1.5a.52.52 0 0 0 .24-.37a.49.49 0 0 0-.15-.41M17 18H5a.91.91 0 0 1-1-1a.91.91 0 0 1 1-1h2a1 1 0 0 0 0-2H5a2.91 2.91 0 0 0-3 3a2.91 2.91 0 0 0 3 3h12a1 1 0 1 1 0 2H1a1 1 0 0 0 0 2h16a3 3 0 0 0 0-6"/></svg>             <span>کتێبێک بنووسە</span>
              </span>
            </Link>
            <Link
              href="/kteb-nus/drafts"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#3B82F6" d="M6 22q-.825 0-1.412-.587T4 20V4q0-.825.588-1.412T6 2h12q.825 0 1.413.588T20 4v16q0 .825-.587 1.413T18 22zm5-18v6.125q0 .3.238.438t.512-.013l1.225-.725q.25-.15.513-.15t.512.15l1.225.725q.275.15.525.013t.25-.438V4z"/></svg>                <span>کتێبەکانم</span>
              </span>
            </Link>
            
            
            
            <Link
              href="/bnusa-stats"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><path fill="#3B82F6" fillRule="evenodd" d="M45.956 39.864c.266-3.271.544-8.463.544-15.864s-.278-12.593-.544-15.864c-.267-3.288-2.804-5.825-6.092-6.092C36.593 1.778 31.402 1.5 24 1.5c-7.401 0-12.593.278-15.864.544c-3.288.267-5.825 2.804-6.092 6.092C1.778 11.407 1.5 16.599 1.5 24s.278 12.593.544 15.864c.267 3.288 2.804 5.825 6.092 6.092c3.271.266 8.463.544 15.864.544s12.593-.278 15.864-.544c3.288-.267 5.825-2.804 6.092-6.092m-19.27-3.688a3.72 3.72 0 0 0 4.973-.524c3.776-4.244 6.199-8.03 7.411-10.118c.635-1.093.804-2.448-.143-3.285a6 6 0 0 0-.824-.611c-1.224-.754-2.593-.003-3.51 1.104c-1.503 1.816-3.897 4.667-5.618 6.52a.95.95 0 0 1-1.274.116c-1.53-1.151-3.436-2.79-4.958-4.138c-1.522-1.349-3.815-1.4-5.274.017c-2.498 2.428-5.075 5.273-7.225 7.79c-1.367 1.6-1.53 3.94.047 5.335a13 13 0 0 0 1.324 1.021c1.857 1.24 4.17.264 5.344-1.636c1.007-1.63 2.258-3.585 3.385-5.137a.98.98 0 0 1 1.401-.185a179 179 0 0 0 4.941 3.73M9 11a2 2 0 0 1 2-2h10a2 2 0 1 1 0 4H11a2 2 0 0 1-2-2m2 6a2 2 0 1 0 0 4h6a2 2 0 1 0 0-4z" clipRule="evenodd"/></svg>                <span>ئامارەکانی بنووسە</span>
              </span>
            </Link>
             <Link
              href="/pwa-guide"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#3B82F6" d="M9 3H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m0 10H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2m10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2M17 3a1 1 0 0 1 .993.883L18 4v2h2a1 1 0 0 1 .117 1.993L20 8h-2v2a1 1 0 0 1-1.993.117L16 10V8h-2a1 1 0 0 1-.117-1.993L14 6h2V4a1 1 0 0 1 1-1"/></svg>                <span>زیادکردنی وێب ئەپی بنووسە</span>
              </span>
            </Link>
            <Link
              href="/terms-of-use"
              className="text-2xl font-medium text-[var(--foreground)] hover:text-[var(--primary)] transition-colors"
              onClick={toggleMenu}
            >
              <span className="inline-flex items-center gap-2">
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48"><g fill="none" stroke="#3B82F6" strokeLinejoin="round" strokeWidth="4"><path d="M24 40.944A11.96 11.96 0 0 0 32 44c6.627 0 12-5.373 12-12c0-5.591-3.824-10.29-9-11.622"/><path d="M13 20.378C7.824 21.71 4 26.408 4 32c0 6.627 5.373 12 12 12s12-5.373 12-12c0-1.55-.294-3.03-.828-4.39"/><path fill="#3B82F6" d="M24 28c6.627 0 12-5.373 12-12S30.627 4 24 4S12 9.373 12 16s5.373 12 12 12Z"/></g></svg>                <span>مەرجەکانی بەکارهێنان و ناوەڕۆک</span>
              </span>
            </Link>
           
          </nav>

          {/* Account Section at Bottom */}
          <div className="mt-auto">
            {loading ? (
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin"></div>
              </div>
            ) : currentUser ? (
              <>
                <Link href="/profile" onClick={toggleMenu} className="block">
                  <div className="p-4 bg-[var(--grey-light)]/30 rounded-lg flex items-center space-x-4 hover:bg-[var(--grey-light)]/50 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                      {currentUser.profileImage ? (
                        <img 
                          src={currentUser.profileImage}
                          alt={currentUser.name || 'User'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{currentUser.name || 'User'}</p>
                      <p className="text-sm text-[var(--grey)]">بینینی پڕۆفایل</p>
                    </div>
                  </div>
                </Link>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link href="/settings" onClick={toggleMenu} className="block">
                    <button className="w-full py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors rounded-lg flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      ڕێکخستنەکان
                    </button>
                  </Link>
                  <Link href="/dashboard" onClick={toggleMenu} className="block">
                    <button className="w-full py-3 bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors rounded-lg flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      داشبۆرد
                    </button>
                  </Link>
                </div>
                <div className="mt-4">
                  {/* LogoutButton removed */}
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-[var(--grey-light)]/30 rounded-lg flex items-center space-x-4 hover:bg-[var(--grey-light)]/50 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">ژمارەی کەسی</p>
                    <p className="text-sm text-[var(--grey)]">بینینی پڕۆفایل</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Link href="/signin" onClick={toggleMenu} className="block w-full">
                    <button className="w-full py-3 bg-white border border-[var(--primary)] text-[var(--primary)] rounded-lg hover:bg-[var(--primary-light)]/10 transition-colors">
                      چوونە ژوورەوە
                    </button>
                  </Link>
                  <Link href="/signup" onClick={toggleMenu} className="block w-full">
                    <button className="w-full py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-light)] transition-colors">
                      تۆمارکردن
                    </button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar; 