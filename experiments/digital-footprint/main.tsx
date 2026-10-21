import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, ArrowRight, Check, Fingerprint, Globe2, LockKeyhole, Search, ShieldCheck, X, LoaderCircle } from 'lucide-react';
import { validateInput, searchQueries } from '../../api/_lib/footprint.js';
import './style.css';
import { SearchOrbit, OfferDialog, CHECKOUT_ENABLED } from './experience';

type Match = { url: string; platform: string; handle: string; status: string };
type Report = { name: string; profile: string; queries: string[]; matches: Match[]; searchedAt?: string; unavailable?: string };

function emit(event: string) {
  // No name, handle, profile URL or result is sent to ad analytics.
  const pixel = (window as any).fbq;
  if (typeof pixel === 'function') pixel('trackCustom', event);
}

function FootprintPage() {
  const [offerOpen, setOfferOpen] = useState(false);
  const [name, setName] = useState('');
  const [profile, setProfile] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  useEffect(() => { if (report) heading.current?.focus(); }, [report]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError('');
    let input;
    try { input = validateInput({ name, profile, consent }); }
    catch (err) { setError(err instanceof Error ? err.message : 'Check your details.'); return; }
    setBusy(true);
    emit('FootprintSearchStarted');
    request.current = new AbortController();
    const timer = window.setTimeout(() => request.current?.abort(), 16_000);
    const base: Report = { name: input.name, profile: input.profile.url, queries: searchQueries(input.name, input.profile), matches: [] };
    try {
      const response = await fetch('/api/digital-footprint', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: input.name, profile: input.profile.url, consent: true }), signal: request.current.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.code === 'SEARCH_UNAVAILABLE') setReport({ ...base, unavailable: data.error });
        else setError(data.error || 'Search could not finish. Please try again.');
        return;
      }
      setReport({ ...base, matches: data.matches, searchedAt: data.searchedAt });
      emit('FootprintReportViewed');
    } catch {
      setReport({ ...base, unavailable: 'We could not connect to automatic search. Open the personalised searches below to check directly.' });
    } finally { window.clearTimeout(timer); setBusy(false); }
  }

  function clearReport() {
    request.current?.abort(); setReport(null); setName(''); setProfile(''); setConsent(false); setHidden([]); setError('');
    window.setTimeout(() => nameInput.current?.focus(), 0);
  }

  const matches = report?.matches.filter(m => !hidden.includes(m.url)) || [];
  return <div className="footprint">
    <header className="fp-header"><a href="/" className="fp-brand"><Fingerprint size={25} strokeWidth={1.5} /> Facemaxify<span> / </span><span>Footprint</span></a>{CHECKOUT_ENABLED && <button className="fp-pricing-link" onClick={() => setOfferOpen(true)}>Report plans <ArrowUpRight size={14}/></button>}</header>
    <main>
      {!report ? <>
        <section className="fp-hero">
          <div className="fp-intro"><p className="fp-eyebrow"><span /> THE DIGITAL FOOTPRINT CHECK</p>
            <h1>Your name.<br />Your online world.<br /><em>See the connections.</em></h1>
            <SearchOrbit busy={busy} />
            <p className="fp-description">Discover possible public profiles linked to your name and handle. Review the sources. Take back control of your digital footprint.</p>
            <div className="fp-assurances"><span><ShieldCheck size={17} /> Sources you can open</span><span><LockKeyhole size={17} /> No photo needed</span></div>
            <div className="fp-steps"><span>01 <b>Add your details</b></span><span>02 <b>Review possible matches</b></span><span>03 <b>Take control</b></span></div>
          </div>
          <div className="fp-form-panel"><div className="fp-form-top"><span className="fp-label">START WITH YOURSELF</span><Fingerprint size={29} strokeWidth={1.2} /></div>
            <h2>Start your self-check.</h2><p>A name and a profile you own give your search a starting point.</p>
            <form onSubmit={submit} aria-busy={busy}>
              {busy && <div className="fp-loading" role="status"><LoaderCircle className="fp-spin" size={18}/><span>Searching indexed public profiles…<small>Waiting for the search provider. No matches confirmed yet.</small></span><i /></div>}
              <label htmlFor="footprint-name">Your full name</label><input ref={nameInput} id="footprint-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aanya Sharma" autoComplete="name" maxLength={80} required disabled={busy} />
              <label htmlFor="footprint-profile">A public profile you own</label><input id="footprint-profile" type="url" value={profile} onChange={e => setProfile(e.target.value)} placeholder="https://www.linkedin.com/in/your-name" autoComplete="off" maxLength={500} required disabled={busy} />
              <p className="fp-field-help">Instagram, LinkedIn, GitHub, X or YouTube. Use the full HTTPS link.</p>
              <label className="fp-consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required disabled={busy} /><span>I’m checking my own identity and I own this profile. I agree to send my name and profile handle to Brave Search to find public matches.</span></label>
              {error && <p className="fp-error" role="alert">{error}</p>}
              <button type="submit" className="fp-button" disabled={busy}>{busy ? <><LoaderCircle className="fp-spin" size={18} /> Searching public profiles…</> : <>Check my digital footprint <ArrowRight size={18} /></>}</button>
              <p className="fp-form-note" role="status">{busy ? 'Checking public search results. This can take up to 16 seconds.' : 'Public profile check · No account needed'}</p>
            </form>
          </div>
        </section>
        <section className="fp-explainer" aria-label="What to expect"><div><span className="fp-label">A LITTLE VISIBILITY.<br />A LOT MORE CONTROL.</span></div><div><Globe2 size={22}/><h2>Public profiles</h2><p>Explore indexed social and professional profiles. Private accounts stay private.</p></div><div><Search size={22}/><h2>Evidence, not guesses</h2><p>Every finding links to a source. A shared name or username doesn’t prove identity.</p></div><div><ShieldCheck size={22}/><h2>Practical next steps</h2><p>Review what you share and find the privacy controls for accounts you recognise.</p></div></section>
      </> : <section className="fp-report">
        <div className="fp-report-top"><p className="fp-eyebrow"><span/> YOUR PUBLIC FOOTPRINT</p><button type="button" className="fp-text-button" onClick={clearReport}><X size={15}/> Clear & start over</button></div>
        <div className="fp-complete-mark"><Check size={26}/></div>
        <h1 ref={heading} tabIndex={-1}>{report.name},<br /><em>here’s your starting point.</em></h1>
        <p className="fp-description">{report.unavailable ? 'Your personalised search checklist is ready. Automatic search hasn’t completed.' : 'Search results are leads to review. Only you can confirm whether a profile belongs to you.'}</p>
        {report.unavailable && <p className="fp-notice" role="status">{report.unavailable}</p>}
        {CHECKOUT_ENABLED && !report.unavailable && <button className="fp-button fp-report-cta" onClick={() => setOfferOpen(true)}>Explore report plans <ArrowRight size={18}/></button>}
        <div className="fp-source fp-provided"><div><span className="fp-tag">PROVIDED BY YOU · OWNERSHIP NOT VERIFIED</span><h2>Your starting profile</h2><p>{report.profile}</p></div><a href={report.profile} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" aria-label="Open your supplied profile">Open profile <ArrowUpRight size={16}/></a></div>
        {!report.unavailable && <><div className="fp-results-heading"><h2>Possible matches</h2><span>{matches.length} to review</span></div><p className="fp-field-help">We searched your exact name and handle on supported platforms. These may belong to someone else.</p>
          {matches.length === 0 ? <div className="fp-notice">No additional supported profiles to show. This doesn’t mean you have no digital footprint. Try the searches below.</div> : matches.map(m => <article className="fp-source" key={m.url}><div><span className="fp-tag">POSSIBLE MATCH · {m.platform}</span><h3>@{m.handle}</h3><p>{m.url}</p></div><div className="fp-source-actions"><a href={m.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Review source <ArrowUpRight size={16}/></a><button type="button" onClick={() => setHidden(h => [...h, m.url])}>Not me — dismiss</button></div></article>)}
        </>}
        <div className="fp-results-heading"><h2>Look a little further</h2><span>OPEN IN A NEW TAB</span></div><p className="fp-field-help">These links open a search engine. They aren’t findings. Review results before treating them as yours.</p>
        <div className="fp-search-links">{report.queries.map((q, i) => <a key={q} href={`https://www.google.com/search?q=${encodeURIComponent(q)}`} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer"><Search size={18}/><span>{i === 0 ? 'Search your exact name' : 'Search your profile handle'}</span><ArrowUpRight size={18}/></a>)}</div>
        <section className="fp-next"><span className="fp-label">YOUR NEXT MOVE</span><h2>Make your footprint work for you.</h2><ul><li><Check size={17}/> Check the visibility and contact settings on profiles you recognise.</li><li><Check size={17}/> Remove unnecessary location, workplace and contact details.</li><li><Check size={17}/> Close unused accounts or ask the publisher to remove outdated pages.</li></ul><p>To request removal of personal information from Google, visit <a href="https://support.google.com/websearch/answer/9673730" target="_blank" rel="noopener noreferrer">Google’s removal guide <ArrowUpRight size={13}/></a>. Removing a search listing doesn’t delete the original page.</p></section>
      </section>}
      <section className="fp-faq"><span className="fp-label">BEFORE YOU CHECK</span><h2>A few things to know.</h2>{[
        ['Will this find everything about me?', 'No. It searches publicly indexed profiles on selected platforms. Unindexed pages, private content and other platforms can be missing. Results can be outdated.'],
        ['Why don’t you need a selfie?', 'This check uses your name and a profile handle. It doesn’t use facial recognition. A photograph alone cannot reliably identify which accounts are yours.'],
        ['Do you save my information?', 'This feature keeps your form and report in this tab’s memory. It sends your name and handle to Brave Search when you submit, and doesn’t save them to a Facemaxify database. Your search provider processes queries under its own privacy terms. Clearing the report removes it from this page.'],
        ['Can I look up somebody else?', 'This experiment is for checking your own online presence. Confirm that the supplied profile is yours. Possible matches are unverified until you review them.'],
      ].map(([q, a]) => <details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</section>
    </main>
    {CHECKOUT_ENABLED && <OfferDialog open={offerOpen} onClose={() => setOfferOpen(false)} name={name} />}
    <footer className="fp-footer"><span>© {new Date().getFullYear()} Facemaxify</span><span>A clearer view of what’s public.</span><a href="https://search.brave.com/help/privacy-policy" target="_blank" rel="noopener noreferrer">Search privacy <ArrowUpRight size={12}/></a></footer>
  </div>;
}

createRoot(document.getElementById('root')!).render(<FootprintPage />);
