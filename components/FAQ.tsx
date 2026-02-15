import React from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Is the facial analysis tool free?",
    answer:
      "Yes! Facemaxify offers a free facial analysis tool. You can analyze your facial symmetry, beauty score, and proportions without any cost. No signup or credit card required.",
  },
  {
    question: "How does the AI face analyzer work?",
    answer:
      "Our tool uses advanced AI combined with mathematical calculations. First, we extract facial landmarks using computer vision. Then we calculate precise ratios, symmetry scores, and proportions based on the golden ratio. Finally, AI analyzes this data to provide personalized recommendations.",
  },
  {
    question: "What is a beauty score?",
    answer:
      "A beauty score is a numerical rating based on facial symmetry, proportions, and adherence to the golden ratio. Our AI analyzes multiple facial features including eye spacing, jawline definition, facial thirds, and overall harmony to calculate your score.",
  },
  {
    question: "Is my photo data private and secure?",
    answer:
      "Absolutely! We prioritize your privacy. Your photos are processed securely and are not stored on our servers. The analysis happens in real-time, and your data is immediately discarded after processing. No signup required means no data collection.",
  },
  {
    question: "What is LooksMax analysis?",
    answer:
      "LooksMax analysis provides personalized recommendations to enhance your facial aesthetics. Based on your facial metrics, our AI suggests specific improvements for symmetry, proportions, and overall appearance using scientific principles.",
  },
  {
    question: "How accurate is the facial symmetry analysis?",
    answer:
      "Our facial symmetry analysis uses mathematical precision with AI-powered computer vision. We measure facial landmarks to calculate symmetry scores with high accuracy. The analysis is based on established beauty standards and the golden ratio.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No! You can use our free facial analysis tool without creating an account. Simply upload your photo and get instant results. No signup, no login, no hassle.",
  },
  {
    question: "What facial features does the analyzer measure?",
    answer:
      "Our AI face analyzer measures facial symmetry, eye spacing, jawline definition, nose proportions, facial thirds, golden ratio adherence, cheekbone prominence, and overall facial harmony. You get detailed metrics for each feature.",
  },
];

export const FAQ: React.FC = () => {
  // Generate JSON-LD schema for FAQ
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqData.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      {/* FAQ Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* FAQ Section */}
      <section className="py-24 px-6 bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-bold text-white text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-400 text-center mb-12 text-lg">
            Everything you need to know about our free AI face analyzer
          </p>

          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <details
                key={index}
                className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/30 transition-colors"
              >
                <summary className="cursor-pointer p-6 font-semibold text-white text-lg flex items-center justify-between hover:text-indigo-400 transition-colors">
                  {faq.question}
                  <span className="text-indigo-400 group-open:rotate-180 transition-transform">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-slate-300 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
