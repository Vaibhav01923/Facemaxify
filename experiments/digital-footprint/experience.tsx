import React, { useEffect, useRef, useState } from 'react';
import { Search, Instagram, Linkedin, Github, Youtube, X, LockKeyhole, ArrowRight, Wallet, Undo2, Eye, Check, Sparkles } from 'lucide-react';

// Paid plans stay hidden until post-payment fulfilment (entitlements, report delivery) exists.
export const CHECKOUT_ENABLED = false;

const platforms = [
  { name: 'Instagram', Icon: Instagram }, { name: 'LinkedIn', Icon: Linkedin },
  { name: 'YouTube', Icon: Youtube }, { name: 'X', Icon: X }, { name: 'GitHub', Icon: Github },
];

export function SearchOrbit({ busy }: { busy: boolean }) {
  return <div className={`fp-orbit ${busy ? 'is-searching' : ''}`} aria-label={busy ? 'Searching supported public profiles' : 'Supported platforms: Instagram, LinkedIn, YouTube, X and GitHub'}>
    <div className="fp-orbit-art" aria-hidden="true">
      <div className="fp-ring fp-ring-outer"/><div className="fp-ring fp-ring-inner"/><div className="fp-radar"/>
      <div className="fp-orbit-core"><Search size={30}/><strong>{busy ? 'Searching' : 'Your footprint'}</strong><span>{busy ? 'Public web results' : 'Connect the public dots'}</span></div>
      {platforms.map(({name, Icon}, i) => <div className={`fp-planet fp-planet-${i}`} key={name}><span><Icon size={23}/></span><small>{name}</small></div>)}
      <span className="fp-orbit-dot"/>
    </div>
    <p><span className="fp-live-dot"/>{busy ? 'Search in progress · please wait' : 'Public sources. A clearer picture.'}</p>
  </div>;
}

export function OfferDialog({ open, onClose, name }: { open: boolean; onClose: () => void; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [view, setView] = useState<'plans' | 'exit'>('plans');
  const [discount, setDiscount] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  async function startCheckout() {
    if (checkingOut) return;
    setCheckingOut(true); setCheckoutError('');
    try {
      const response = await fetch('/api/footprint-checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer: discount ? 'exit' : 'standard' }),
        signal: AbortSignal.timeout(20000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Checkout is temporarily unavailable.');
      const url = new URL(data.checkout_url);
      if (url.protocol !== 'https:' || !['checkout.dodopayments.com', 'test.checkout.dodopayments.com'].includes(url.hostname)) throw new Error('Invalid checkout destination.');
      window.location.assign(url.href);
    } catch (error) {
      setCheckoutError(error instanceof Error && !error.message.includes('JSON') ? error.message : 'Checkout is temporarily unavailable. Please try again later.');
    } finally { setCheckingOut(false); }
  }
  useEffect(() => {
    if (!open) { dialog.current?.close(); return; }
    const previous = document.activeElement as HTMLElement;
    setView('plans');
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; previous?.focus(); };
  }, [open]);
  useEffect(() => { if(open) title.current?.focus(); }, [view, discount, open]);
  function exit() { if(view === 'plans') setView('exit'); else onClose(); }
  return <dialog ref={dialog} className="fp-dialog" aria-labelledby="fp-offer-title" onCancel={e => { e.preventDefault(); exit(); }} onClick={e => { if(e.target === e.currentTarget) onClose(); }}>
    <div className="fp-sheet" key={view + String(discount)}>
      <div className="fp-sheet-handle" aria-hidden="true"/>
      <button className="fp-close" aria-label={view === 'plans' ? 'Close report plans' : 'Close exit question'} onClick={exit}><X size={20}/></button>
      {view === 'exit' ? <>
        <div className="fp-sheet-symbol"><Undo2 size={25}/></div>
        <h2 id="fp-offer-title" ref={title} tabIndex={-1}>Before you go…</h2><p>What stopped you?</p>
        <div className="fp-exit-options">
          <button onClick={() => { setDiscount(true); setView('plans'); }}><Wallet/><span><strong>Too expensive</strong><small>The price doesn’t feel right</small></span><ArrowRight size={17}/></button>
          <button onClick={onClose}><Undo2/><span><strong>I changed my mind</strong><small>Not what I need right now</small></span><ArrowRight size={17}/></button>
          <button onClick={onClose}><Eye/><span><strong>Just looking around</strong><small>Only curious for now</small></span><ArrowRight size={17}/></button>
        </div><button className="fp-skip" onClick={onClose}>Skip and close</button>
      </> : <>
        <div className="fp-sheet-badge"><LockKeyhole size={13}/>{name.trim().split(/\s+/)[0] || 'Your digital footprint'}</div>
        <h2 id="fp-offer-title" ref={title} tabIndex={-1}>{discount ? 'A little easier to say yes.' : 'See your public footprint.'}</h2>
        <p>{discount ? 'Your lower daily price is ready.' : 'Explore your online presence with source links.'}</p>
        {discount && <div className="fp-discount"><Sparkles size={15}/> Save 50% on every renewal · SEARCH50</div>}
        <div className={`fp-plan ${discount ? 'is-discounted' : ''}`}>
          <div><span className="fp-label">FOOTPRINT MEMBERSHIP</span><strong>Daily plan</strong><span>Billed daily. Cancel anytime.</span></div>
          <div className="fp-price">{discount && <del>₹99</del>}<strong>₹{discount ? '49.50' : '99'}</strong><span>/day</span></div>
        </div>
        <ul className="fp-plan-features"><li><Check size={16}/> Public profile discovery</li><li><Check size={16}/> Source links you can review</li><li><Check size={16}/> A personal privacy checklist</li></ul>
        <button className="fp-button" onClick={startCheckout} disabled={checkingOut}>{checkingOut ? 'Opening secure checkout…' : `Continue for ₹${discount ? '49.50' : '99'}/day`} <ArrowRight size={18}/></button>
        {checkoutError && <p className="fp-error" role="alert">{checkoutError}</p>}
        <p className="fp-checkout-note">Secure checkout by Dodo Payments{discount ? ' · SEARCH50 applied automatically' : ''}</p>
        <p className="fp-billing">Renews at ₹{discount ? '49.50' : '99'}/day until cancelled. Possible matches are unverified; private accounts aren’t included.</p>
      </>}
    </div>
  </dialog>;
}
