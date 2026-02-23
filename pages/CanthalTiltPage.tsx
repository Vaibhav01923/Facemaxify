import React from "react";
import { SEO } from "../components/SEO";
import { CanthalTiltAnalyzer } from "../components/tools/CanthalTiltAnalyzer";

export const CanthalTiltPage: React.FC = () => {
  // FAQ Schema JSON-LD
  const sidebarSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is Canthal Tilt?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Canthal tilt refers to the angle formed by drawing an imaginary line from the inner corner of your eye (medial canthus) to the outer corner of your eye (lateral canthus).",
        },
      },
      {
        "@type": "Question",
        name: "What is a positive canthal tilt?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A positive canthal tilt means that the outer corners of the eyes are higher than the inner corners. This is commonly associated with an alert, youthful, and attractive feline eye shape.",
        },
      },
      {
        "@type": "Question",
        name: "What is a negative canthal tilt?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A negative canthal tilt occurs when the outer corner of the eye drops below the inner corner. This eye shape often conveys a gentle, sensitive, or 'puppy-dog' appearance.",
        },
      },
    ],
  };

  return (
    <>
      <SEO
        title="Canthal Tilt Calculator & Angle Test | Check Your Eye Tilt"
        description="Calculate your precise canthal tilt angle instantly. Discover if you have a positive, neutral, or negative eye tilt with our free AI facial analysis tool."
        keywords="canthal tilt calculator, positive canthal tilt, negative canthal tilt, eye tilt test, hunter eyes test, facial analysis, eye shape detector"
        canonicalUrl="https://facemaxify.com/tools/canthal-tilt"
        schema={JSON.stringify(sidebarSchema)}
      />

      <CanthalTiltAnalyzer />

      {/* SEO Content Section */}
      <section className="bg-[#050510] py-16 px-4 border-t border-slate-800 mt-12">
        <div className="max-w-4xl mx-auto prose prose-invert prose-lg">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
            Canthal Tilt Angle Calculator
          </h1>

          <p className="text-slate-300 leading-relaxed mb-6 text-xl">
            Our Canthal Tilt Angle Calculator measures the exact angle of your
            eyes' tilt using advanced facial landmark mapping. Upload your photo
            to find out if your eye tilt is positive, neutral, or negative, and
            understand how it influences your facial harmony.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-6">
            What is Canthal Tilt?
          </h2>
          <p className="text-slate-400 mb-6">
            The term "canthal tilt" originates from anatomy, specifically
            referring to the angle created between the inner eye corner (the
            medial canthus) and the outer eye corner (the lateral canthus)
            relative to a perfectly horizontal line. This angle plays a massive
            role in the overall aesthetic shape and expression of the eye area.
          </p>
          <p className="text-slate-400 mb-6">
            Historically, aesthetic researchers and artists have measured
            canthal tilt to understand why some eyes look more sharp and
            striking ("hunter eyes") while others look soft and gentle ("prey
            eyes"). Whether you are exploring "looksmaxing" or simply curious
            about your facial geometry, the canthal tilt measurement is an
            essential biometric.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-6">
            The Three Types of Eye Tilt
          </h2>
          <p className="text-slate-400 mb-6">
            When you use our tool, your tilt will fall into one of three
            classifications based on the gradient of your eye line:
          </p>
          <ul className="list-disc pl-6 text-slate-400 space-y-4 mb-8">
            <li>
              <strong className="text-white">Positive Canthal Tilt:</strong> The
              outer corners sit significantly higher than the inner corners
              (usually between 3 to 8 degrees). In modern beauty standards, a
              positive tilt is highly celebrated. It lifts the face and produces
              a sharp, almond-like "feline" effect.
            </li>
            <li>
              <strong className="text-white">Neutral Canthal Tilt:</strong> Both
              the inner and outer corners rest on roughly the same horizontal
              plane (between -2 to 3 degrees). This tilt implies structural
              balance and provides a highly harmonious, approachable, and
              classic eye shape.
            </li>
            <li>
              <strong className="text-white">Negative Canthal Tilt:</strong> The
              outer corners droop slightly lower than the inner corners. While
              often maligned in intense modern aesthetic circles, natural
              negative tilt is exceedingly common and provides a sweet,
              empathetic, and innocent dimension to the face.
            </li>
          </ul>

          <h2 className="text-3xl font-bold text-white mt-12 mb-6">
            How Does the Calculator Work?
          </h2>
          <p className="text-slate-400 mb-6">
            Using a machine learning framework called MediaPipe Face Mesh, our
            canthal tilt test rapidly plots 468 discrete points on your face.
            Specifically, our mathematical module targets nodes representing
            your exact inner tear ducts and outer eye junctions.
          </p>
          <p className="text-slate-400 mb-6">
            By drawing an intersecting array of horizontal reference lines
            across these nodes, the AI engine acts as a digital protractor. The
            algorithm captures the trigonometric angles produced by the eye's
            shape, averages out slight muscular asymmetries between the left and
            right eyes, and immediately dispenses a precise orientation degree
            score along with your classification.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-6">
            Why Canthal Tilt Isn't Everything
          </h2>
          <p className="text-slate-400 mb-6">
            If you calculate a negative canthal tilt, do not panic. Eye
            aesthetics rely predominantly on dozens of interlocking metrics—such
            as palpebral fissure length, upper eyelid hooding, lower eyelid
            support, and eyebrow protrusion. A negative tilt accompanied by
            strong infraorbital support can still yield a highly striking,
            attractive gaze.
          </p>
          <p className="text-slate-400 mb-6">
            Before making any styling or makeup changes, we always recommend
            getting a full Facial Harmony test that takes into account the
            holistic balance of your entire facial structure, instead of
            hyper-fixating on a single angular metric.
          </p>
        </div>
      </section>
    </>
  );
};
