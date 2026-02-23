import React, { useEffect } from "react";
import { SEO } from "../components/SEO";
import { GoldenRatioAnalyzer } from "../components/tools/GoldenRatioAnalyzer";

export const GoldenRatioPage: React.FC = () => {
  // FAQ Schema JSON-LD
  const sidebarSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the Golden Ratio face test?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The Golden Ratio face test measures how closely your facial features align with the mathematical ratio of 1.618 (Phi). It analyzes proportions like face length to width, nose width to mouth width, and eye distance to determine a symmetry score.",
        },
      },
      {
        "@type": "Question",
        name: "Is the Golden Ratio face calculator accurate?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our tool uses advanced AI to detect precise facial landmarks and calculate ratios mathematically. While highly accurate for geometric analysis, beauty is subjective and cultural.",
        },
      },
      {
        "@type": "Question",
        name: "What is a good Golden Ratio face score?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A score above 1.6 or within the 1.6-1.7 range is traditionally considered ideal. In our 0-100 scoring system, a score above 70 indicates good harmony, while 90+ is exceptional.",
        },
      },
    ],
  };

  return (
    <>
      <SEO
        title="Golden Ratio Face Calculator: Test Your Facial Symmetry Score (Free)"
        description="Calculate your Golden Ratio face score instantly with AI. Measure your facial proportions against the perfect 1.618 Phi ratio. Free, fast, and private."
        keywords="golden ratio face calculator, face symmetry test, phi ratio face, beauty calculator, facial proportions test, golden ratio mask"
        canonicalUrl="https://facemaxify.com/tools/golden-ratio"
        schema={JSON.stringify(sidebarSchema)}
      />

      <GoldenRatioAnalyzer />

      {/* SEO Content Section */}
      <section className="bg-[#050510] py-16 px-4 border-t border-slate-800 mt-12">
        <div className="max-w-4xl mx-auto prose prose-invert prose-lg">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
            Golden Ratio Face Analysis Tool
          </h1>

          <p className="text-slate-300 leading-relaxed mb-6 text-xl">
            Our Golden Ratio Face Analysis Tool measures facial proportions
            using the Phi ratio (1.618) to determine facial harmony and
            symmetry. Upload your photo to analyze key facial landmarks and get
            a beauty score.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-6">
            What is the Golden Ratio in Facial Aesthetics?
          </h2>
          <p className="text-slate-400 mb-6">
            The Golden Ratio, often represented by the Greek letter Phi (φ), is
            an irrational mathematical constant approximately equal to 1.618.
            For centuries, artists, architects, and mathematicians have studied
            this ratio, discovering its prevalence throughout the natural world.
            From the spiral of a nautilus shell to the arrangement of leaves on
            a stem, the Golden Ratio is nature’s signature of balance and
            proportion.
          </p>
          <p className="text-slate-400 mb-6">
            When applied to human faces, the Golden Ratio Face Analysis Tool
            uses these same classical principles. Researchers and beauty experts
            have found that faces generally considered universally attractive
            tend to share proportions that strongly correlate with the 1.618
            ratio. Our face test leverages this concept by plotting geometric
            distances between your core facial features—eyes, nose, lips,
            jawline, and chin—and comparing them against this optimal
            mathematical standard.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-6">
            How It Works
          </h2>
          <p className="text-slate-400 mb-6">
            The tool calculates distances between eyes, nose, lips and jaw based
            on classical golden ratio mathematics. Using state-of-the-art
            computer vision and machine learning, our tool maps specific
            landmarks on your face instantly. Here is a breakdown of the
            specific ratios we measure:
          </p>
          <ul className="list-disc pl-6 text-slate-400 space-y-4 mb-8">
            <li>
              <strong className="text-white">
                Face Length vs. Face Width:
              </strong>{" "}
              Ideally, the length of the face should be about 1.618 times its
              width. We measure from the top of the hairline to the lowest point
              of the chin, and across the widest part of the cheekbones.
            </li>
            <li>
              <strong className="text-white">Nose Proportions:</strong> We
              measure the length of the nose from its base to its tip, comparing
              it to the width of the nose. We also analyze the distance from the
              bottom of the nose to the bottom of the chin.
            </li>
            <li>
              <strong className="text-white">Eye Spacing and Width:</strong> The
              perfect distance between the eyes should ideally equal the width
              of one single eye. We calculate your interpupillary distance and
              the inner/outer canthus points to determine your eye symmetry
              score.
            </li>
            <li>
              <strong className="text-white">Lip and Mouth Dimensions:</strong>{" "}
              The width of the lips compared to the width of the nose, and the
              exact placement of the mouth in the lower third of the face, are
              scored against the Phi multiplier.
            </li>
          </ul>

          <h2 className="text-3xl font-bold text-white mt-12 mb-6">
            Why Take the Golden Ratio Face Test?
          </h2>
          <p className="text-slate-400 mb-6">
            Finding out your Golden Ratio face score is more than just a fun
            experiment; it's a way to objectively understand your unique facial
            structure. While human beauty is incredibly diverse and culturally
            subjective, mathematical symmetry plays an undeniable subconscious
            role in how we perceive attractiveness.
          </p>
          <p className="text-slate-400 mb-6">
            By determining your facial harmony through our calculator, you can
            discover your strongest features. Many users utilize this
            information for styling decisions—such as choosing the right haircut
            to balance a longer face, selecting glasses frames that complement
            their natural eye spacing, or applying makeup that highlights their
            most symmetrical traits.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-6">
            Is the Golden Ratio Beauty Calculator Accurate?
          </h2>
          <p className="text-slate-400 mb-6">
            Our app provides highly precise geometric measurements. We do not
            use "AI judging" filters that arbitrarily decide what looks good
            based on social media trends. Instead, we provide a quantifiable
            score based entirely on distances and ratios. However, it is
            essential to remember that a "perfect score" of 100% or an exact
            1.618 match on every feature is incredibly rare, even among top
            models and celebrities.
          </p>
          <p className="text-slate-400 mb-6">
            A score above 70% typically indicates very strong facial harmony,
            while anything above 85% to 90% is considered exceptionally
            symmetrical. True beauty encompasses personality, expressiveness,
            skin health, and confidence. Use this tool as a definitive guide to
            your facial geometry, but never as the sole arbiter of your
            self-worth.
          </p>

          <h2 className="text-3xl font-bold text-white mt-12 mb-6">
            Take Your Free Facial Symmetry Test Today
          </h2>
          <p className="text-slate-400 mb-6">
            Ready to find out if you have a mathematically perfect face? Scroll
            up and try the Golden Ratio Face Analysis Tool now. It's completely
            free, fast, and processes your photo securely without storing your
            private images on our servers. Get your instant symmetry score and
            start your looksmaxing journey with verifiable data.
          </p>
        </div>
      </section>
    </>
  );
};
