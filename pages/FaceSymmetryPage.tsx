import React from "react";
import { SEO } from "../components/SEO";
import { FaceSymmetryAnalyzer } from "../components/tools/FaceSymmetryAnalyzer";
import { Navbar } from "../components/Navbar";

export const FaceSymmetryPage: React.FC = () => {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How do you test facial symmetry from a photo?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Upload a clear, front-facing photo with even lighting and no head tilt. Our AI detects 468 facial landmarks using MediaPipe FaceMesh, then calculates the horizontal distances of paired landmarks (eyes, eyebrows, mouth corners, cheekbones, jaw angles, nostrils) from the vertical midline of your face. The left-to-right ratio for each zone is combined into an overall facial symmetry score from 0–100.",
        },
      },
      {
        "@type": "Question",
        name: "What is a good facial symmetry score?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A score of 90 or above is considered highly symmetric. 78–89 is mostly symmetric and well within the attractive range. 65–77 indicates moderate asymmetry — which is completely normal for the majority of people. Scores below 65 often reflect photo angle or lighting issues rather than true asymmetry. Almost no human face is perfectly symmetric, and minor asymmetries are invisible to most observers.",
        },
      },
      {
        "@type": "Question",
        name: "Does facial symmetry affect attractiveness?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Research shows that facial symmetry correlates with perceived attractiveness, but it is not the only factor. Facial proportions (golden ratio), feature harmony, skin quality, and canthal tilt all contribute significantly to overall facial aesthetics. A face with moderate symmetry but strong proportions can outscore a highly symmetric face with weak proportions in attractiveness studies.",
        },
      },
      {
        "@type": "Question",
        name: "Can I improve facial symmetry?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Some asymmetries can be improved through proper sleep posture (avoiding one-sided sleeping), good dental health, mewing (tongue posture), facial exercises, and in some cases medical or aesthetic procedures. However, a significant portion of apparent photo asymmetry comes from camera angle, lighting, and natural head positioning rather than true skeletal asymmetry.",
        },
      },
    ],
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Facial Symmetry Test — AI Face Symmetry Analyzer",
    url: "https://facemaxify.com/tools/face-symmetry",
    description: "Free AI tool that measures facial symmetry from a photo. Get a zone-by-zone symmetry breakdown across eyes, eyebrows, mouth, cheekbones, jaw and more.",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web Browser",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <>
      <SEO
        title="Free Facial Symmetry Test — AI Face Symmetry Analyzer | Facemaxify"
        description="Test your facial symmetry for free with AI. Upload a photo to get an instant zone-by-zone symmetry score across eyes, cheekbones, jaw, mouth corners, and more. No signup needed."
        keywords="facial symmetry test, face symmetry analyzer, facial symmetry analysis, face symmetry test free, ai facial symmetry, symmetry face score, face symmetry checker"
        canonicalUrl="https://facemaxify.com/tools/face-symmetry"
        schema={[faqSchema, webAppSchema] as any}
      />

      <div className="min-h-screen bg-[#050510] text-white">
        <Navbar />

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-4 pt-14 pb-4 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-5">
            Free · Instant · No Signup
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-4">
            Facial Symmetry Test
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Upload a front-facing photo and our AI instantly measures left-right symmetry across 8 facial zones — eyes, eyebrows, mouth corners, cheekbones, nostrils, and jaw angles.
          </p>
        </section>

        {/* Tool */}
        <FaceSymmetryAnalyzer />

        {/* SEO Content */}
        <section className="bg-slate-950/60 border-t border-white/5 py-16 px-4 mt-4">
          <div className="max-w-4xl mx-auto prose prose-invert">
            <h2 className="text-3xl font-bold text-white mb-6">What Is a Facial Symmetry Test?</h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              A <strong className="text-white">facial symmetry test</strong> measures how closely the left and right halves of your face mirror each other. Using AI landmark detection, Facemaxify maps 468 points across your face and calculates the horizontal distance of paired features — inner and outer eye corners, eyebrow peaks, mouth corners, cheekbones, nostrils, and jaw angles — from your face's vertical midline. The closer each pair's distances match, the higher your symmetry score.
            </p>

            <h3 className="text-xl font-bold text-white mt-8 mb-3">How the AI Face Symmetry Analyzer Works</h3>
            <p className="text-slate-400 leading-relaxed mb-4">
              Our <strong className="text-white">face symmetry analyzer</strong> uses Google's MediaPipe FaceMesh model to detect 468 facial landmarks from your photo. It then:
            </p>
            <ol className="text-slate-400 space-y-2 mb-6 list-decimal pl-6">
              <li>Calculates your face's vertical midline through the nose bridge and chin</li>
              <li>Measures the distance of each paired landmark from that midline on both sides</li>
              <li>Computes a left-to-right ratio for each of 8 facial zones</li>
              <li>Combines these into an overall symmetry score out of 100</li>
            </ol>

            <h3 className="text-xl font-bold text-white mt-8 mb-3">Facial Symmetry Analysis vs. Golden Ratio Analysis</h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              <strong className="text-white">Facial symmetry analysis</strong> measures left-right balance. The <strong className="text-white">golden ratio facial analysis</strong> measures whether your facial proportions match the aesthetic standard of 1.618 (phi). Both matter for attractiveness, but they're distinct metrics — a symmetric face can have poor proportions, and a proportionally ideal face can have slight asymmetry. The full Facemaxify analysis combines both into a comprehensive facial harmony score.
            </p>

            <h3 className="text-xl font-bold text-white mt-8 mb-3">Tips for an Accurate Symmetry Reading</h3>
            <ul className="text-slate-400 space-y-2 mb-6 list-disc pl-6">
              <li>Use a photo taken straight-on — no head tilt or rotation</li>
              <li>Use even, diffuse lighting — shadows create false asymmetry readings</li>
              <li>Keep your expression neutral — smiling pulls the face asymmetrically</li>
              <li>Ensure your hair is off your face so landmarks are fully visible</li>
            </ul>

            <h3 className="text-xl font-bold text-white mt-8 mb-3">What's a Good Facial Symmetry Score?</h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              In our scoring system, <strong className="text-white">90–100 is highly symmetric</strong>, placing you in the top tier aesthetically. <strong className="text-white">78–89 is mostly symmetric</strong> and still considered highly attractive. <strong className="text-white">65–77 is moderate asymmetry</strong>, which is normal for most people. Scores below 65 often reflect photo angle rather than true skeletal asymmetry.
            </p>

            {/* FAQ */}
            <h2 className="text-2xl font-bold text-white mt-10 mb-6">Frequently Asked Questions</h2>
            {[
              {
                q: "How do you test facial symmetry from a photo?",
                a: "Upload a front-facing photo with no tilt and even lighting. Our AI detects 468 facial landmarks and measures the distance of paired features from your face's vertical midline. The ratio of left-to-right distances produces a zone-by-zone symmetry score."
              },
              {
                q: "Does facial symmetry affect attractiveness?",
                a: "Yes — research consistently shows symmetry correlates with attractiveness, but it's not the only factor. Facial proportions, canthal tilt, skin quality, and harmony between features all matter. A face with good proportions but moderate symmetry can still be very attractive."
              },
              {
                q: "Can I improve my facial symmetry?",
                a: "Some asymmetry can be reduced through mewing (tongue posture), correcting sleep posture, proper dental health, and targeted facial exercises. However, many apparent photo asymmetries are caused by angle and lighting rather than bone structure."
              },
              {
                q: "Is the facial symmetry test free?",
                a: "Yes. The facial symmetry test on Facemaxify is completely free — no signup, no credit card, no limits. Upload your photo and get your result instantly."
              },
            ].map(({ q, a }) => (
              <div key={q} className="mb-5 p-5 bg-slate-900/40 rounded-2xl border border-white/5">
                <h4 className="text-white font-bold mb-2">{q}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
};
