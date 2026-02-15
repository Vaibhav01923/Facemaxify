import React from "react";
import { FacialShapeAnalyzer } from "../components/tools/FacialShapeAnalyzer";
import { SEO } from "../components/SEO";

export const FacialShapePage: React.FC = () => {
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How do I determine my face shape?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Upload a clear, front-facing photo to our AI face shape detector. It analyzes your facial measurements and proportions to determine if you have an oval, round, square, heart, diamond, oblong, or triangle face shape.",
          },
        },
        {
          "@type": "Question",
          name: "What is the most common face shape?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Oval is considered the most balanced and common face shape, characterized by proportions where face length is about 1.5 times the width with gentle curves.",
          },
        },
        {
          "@type": "Question",
          name: "Is the face shape detector free?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes! Our AI face shape detector is completely free to use. No signup, no credit card, no hidden fees. Just upload your photo and get instant results.",
          },
        },
        {
          "@type": "Question",
          name: "What face shapes are there?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "There are 7 main face shapes: Oval, Round, Square, Heart, Diamond, Oblong (Rectangle), and Triangle (Pear). Each has unique characteristics and proportions.",
          },
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "AI Face Shape Detector",
      description:
        "Free AI-powered face shape detector with instant analysis and personalized recommendations",
      url: "https://facemaxify.com/tools/facial-shape",
      applicationCategory: "UtilityApplication",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "AI-powered face shape detection",
        "7 face shape classifications",
        "Personalized hairstyle recommendations",
        "Glasses frame suggestions",
        "Makeup tips",
        "Celebrity face matches",
        "No signup required",
        "Privacy friendly",
      ],
    },
  ];

  return (
    <>
      <SEO
        title="Free AI Face Shape Detector: Find Your Face Shape Instantly | Facemaxify"
        description="Discover your face shape with our free AI-powered detector. Instant analysis with personalized hairstyle, glasses, and makeup recommendations. No signup required!"
        keywords="face shape detector, AI face shape analyzer, what is my face shape, face shape calculator, determine face shape, face shape test, oval face shape, round face shape, free face shape tool"
        canonicalUrl="https://facemaxify.com/tools/facial-shape"
        schema={schemas}
      />

      <FacialShapeAnalyzer />

      {/* FAQ Section */}
      <section className="bg-slate-950 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <details className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <summary className="cursor-pointer p-6 font-semibold text-white text-lg hover:text-indigo-400 transition-colors">
                How accurate is the AI face shape detector?
              </summary>
              <div className="px-6 pb-6 text-slate-300">
                Our AI face shape detector uses advanced facial landmark
                detection (MediaPipe) combined with mathematical algorithms to
                analyze your facial proportions. The accuracy is typically
                85-95% when using a clear, front-facing photo with good
                lighting.
              </div>
            </details>

            <details className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <summary className="cursor-pointer p-6 font-semibold text-white text-lg hover:text-indigo-400 transition-colors">
                What are the 7 face shapes?
              </summary>
              <div className="px-6 pb-6 text-slate-300">
                The 7 main face shapes are: <strong>Oval</strong> (balanced
                proportions), <strong>Round</strong> (equal length and width),{" "}
                <strong>Square</strong> (angular jawline),{" "}
                <strong>Heart</strong> (wide forehead, narrow chin),{" "}
                <strong>Diamond</strong> (widest at cheekbones),{" "}
                <strong>Oblong</strong> (elongated), and{" "}
                <strong>Triangle</strong> (wide jaw, narrow forehead).
              </div>
            </details>

            <details className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <summary className="cursor-pointer p-6 font-semibold text-white text-lg hover:text-indigo-400 transition-colors">
                Is my photo stored or shared?
              </summary>
              <div className="px-6 pb-6 text-slate-300">
                No! Your privacy is our priority. All analysis happens directly
                in your browser. Your photos are never uploaded to our servers,
                stored, or shared with anyone. The analysis is completely
                private and secure.
              </div>
            </details>

            <details className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <summary className="cursor-pointer p-6 font-semibold text-white text-lg hover:text-indigo-400 transition-colors">
                What hairstyle suits my face shape?
              </summary>
              <div className="px-6 pb-6 text-slate-300">
                After detecting your face shape, our tool provides personalized
                hairstyle recommendations. Generally: Oval faces suit most
                styles, Round faces benefit from length, Square faces look great
                with soft waves, Heart shapes work well with chin-length cuts,
                and so on. The tool gives specific suggestions for your shape!
              </div>
            </details>

            <details className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <summary className="cursor-pointer p-6 font-semibold text-white text-lg hover:text-indigo-400 transition-colors">
                Can I use this on my phone?
              </summary>
              <div className="px-6 pb-6 text-slate-300">
                Yes! Our face shape detector is fully mobile-responsive. You can
                upload photos from your phone's gallery or take a selfie
                directly. The tool works perfectly on all devices - phones,
                tablets, and computers.
              </div>
            </details>
          </div>
        </div>
      </section>
    </>
  );
};
