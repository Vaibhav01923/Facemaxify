## Summary

Facemaxify scores faces by **measuring proportions between facial landmarks** and comparing each measurement with a **published target**. There is no hidden attractiveness model: every score on our free tools can be traced back to specific measurements, the target each one is compared with, and the weight it carries — all listed on this page.

Our approach rests on three principles:

1. **Private by default.** The free tools analyse your photo in your browser. Your photo isn't uploaded to our servers.
2. **Transparent.** Every score is built from named measurements with stated targets and weights. Nothing is learned from hidden ratings.
3. **Honest about what can change.** Each tool's guide explains which features are mostly structural and which respond to grooming, body fat, sleep and photo technique — and points to reversible steps first.

## How a scan works

1. **Face detection and landmarks.** When you upload a photo, Google's MediaPipe face landmark model runs in your browser and places **478 landmarks** on your face — eye corners and eyelids, brows, nose, lips, cheekbones, jaw angles, chin and the top of the forehead.
2. **Measurements.** We calculate distances and angles between those landmarks and express them as **ratios** (for example, jaw width ÷ cheekbone width). Ratios don't depend on how large your face is in the photo.
3. **Comparison with targets.** Each ratio is compared with a target proportion.
4. **Scoring.** A measurement that matches its target scores 100, and the score drops the further the measurement is from the target. For most measurements the drop is a straight line; a few, such as canthal tilt and eye openness, use stepped curves. Each tool's guide describes its scoring bands.
5. **Combining.** Composite scores are weighted averages of their component scores, using the weights below.

The same photo always produces the same landmarks, measurements and scores.

## Composite scores and their weights

| Score | Scale | Components and weights |
|---|---|---|
| [Attractiveness test](/tools/attractiveness-score) | 0–100 | Symmetry 35% · jawline 25% · youthfulness (philtrum) 20% · nose proportion 10% · eye spacing 10% |
| [Face rating](/tools/face-rating) | 0–100 and 1–10 | Symmetry 30% · jawline 25% · golden ratio 20% · facial thirds 15% · nose proportion 10% |
| [Facial harmony score](/tools/harmony-score) | 0–100 | Symmetry 25% · jawline 20% · midface 15% · facial thirds 15% · nose 10% · lips 7.5% · eye spacing 7.5% |
| [Looksmax score](/tools/looksmax-score) | 0–100 | Symmetry 25% · jawline 25% · canthal tilt 20% · facial thirds 15% · eye compactness 15% |
| [PSL rating](/tools/psl-rating) | 1–10 | Symmetry 25% · jawline 25% · canthal tilt 20% · eye shape 15% · facial thirds 15% |

## Individual measurements and targets

| Measurement | How it's calculated | Target |
|---|---|---|
| [Symmetry](/tools/face-symmetry) | Distance of 8 left–right feature pairs from the facial midline (nose bridge, nose tip and chin); smaller ÷ larger distance for each pair, averaged | Perfect balance (1.0) |
| [Golden ratio](/tools/golden-ratio) | Mouth width ÷ nose width; nose-to-chin ÷ lower-lip-to-chin; outer eye distance ÷ mouth width | 1.618 each |
| [Canthal tilt](/tools/canthal-tilt) | Angle of the line from the inner to the outer eye corner, averaged over both eyes | Positive (+3.5° or more); highest around +5° to +9° |
| [Hunter eyes](/tools/hunter-eyes) | Eye openness (lid gap ÷ eye width, 55%) and tilt (45%) | Narrow, upward-tilted eyes |
| [Eye spacing](/tools/eye-spacing) | Gap between the inner eye corners ÷ eye width; face width ÷ eye width | 1.0 and 5.0 (rule of fifths) |
| [Facial thirds](/tools/facial-thirds) | Forehead, midface and lower face as a share of face height | 33.3% each |
| [Midface ratio](/tools/midface-ratio) | Brows to nose base ÷ nose base to chin | 1.0 |
| [Lower third](/tools/lower-third) | Philtrum, lips and chin as a share of the lower third | 22% / 44% / 34% |
| [Philtrum ratio](/tools/philtrum-ratio) | Nose base to upper lip ÷ nose base to chin | 0.22 |
| [Lip ratio](/tools/lip-ratio) | Upper lip height ÷ lower lip height (55%); mouth width ÷ gap between the eyes (45%) | 0.65 and 1.5 |
| [Nose ratio](/tools/nose-ratio) | Nose width ÷ face width; nose width ÷ gap between the eyes | 0.275 and 1.0 |
| [Chin ratio](/tools/chin-ratio) | Lower lip to chin ÷ lower third (55%); chin width ÷ jaw width (45%) | 0.45 and 0.50 |
| [Jawline score](/tools/jawline-score) | Jaw width ÷ cheekbone width (60%); angle at the chin between the jaw angles (40%) | 0.78 for the ratio |
| [Cheekbone width](/tools/cheekbone-width) | Cheekbone width ÷ jaw width (60%); cheekbone width ÷ face height (40%) | 1.2 and 0.75 |
| [fWHR](/tools/facial-width-height) | Cheekbone width ÷ brow-to-upper-lip height | Scored highest around 2.0 |
| [Forehead ratio](/tools/forehead-ratio) | Forehead height ÷ face height (50%); temple width ÷ cheekbone width (50%) | 0.33 and 0.85 |
| [Brow position](/tools/brow-position) | Gap between brow and upper eyelid ÷ eye width | 0.5 |
| [Face shape](/tools/facial-shape) | Face length ÷ width, forehead ÷ jaw width and chin angle, classified into 7 shapes | No score — a classification |

## Where the targets come from

The targets are aesthetic reference proportions, not universal laws. They draw on classical proportion guides such as facial thirds and the rule of fifths, on golden-ratio guidelines, and on research into facial attractiveness:

- **Averageness.** Faces close to typical proportions are consistently rated as more attractive (Langlois & Roggman, 1990). That's why most targets sit near typical proportions rather than at extremes.
- **Agreement between raters.** People agree more than you might expect about which faces are attractive, within and across cultures (Langlois et al., 2000) — which is what makes measuring faces meaningful at all.
- **Symmetry.** People prefer more symmetrical versions of the same face, though the effect is modest (Rhodes, 2006).
- **The golden ratio.** Research suggests the most attractive proportions sit close to the average face rather than at 1.618 (Pallett, Link & Lee, 2010). We still offer a golden ratio calculator because people ask for it, and its guide explains these limits.

## What our scores don't measure

- **Skin.** The free tools measure geometry only. Skin texture, tone and clarity affect how faces are perceived, but they aren't part of these scores.
- **Expression, hair, style and grooming** — all of which change how attractive people find a face in real life.
- **Personality, confidence and charisma.**
- **Depth and profile.** All measurements come from a single front-facing 2D photo, so features such as chin projection or the gonial angle (the angle at the back of the jaw) aren't measured directly.

A score describes the geometry of one photo. It isn't a measure of your worth.

## Accuracy and known limitations

- **The photo matters most.** Head turn, tilt, expression, lighting and camera distance all change the result. Close-up selfies distort the centre of the face: one study found photos taken about 30 cm away make the nose look around 30% wider than photos from 1.5 m (Ward et al., 2018).
- **Landmarks are estimates.** The landmark model is highly consistent but can misplace points when features are covered by hair or glasses, or in poor light.
- **Targets are general, not population-specific.** Typical nose width, eye spacing and face shape vary between populations, so a face can be completely typical — and very attractive — for its background while sitting further from a target.
- **Not medical advice.** Nothing in our tools diagnoses any condition. Questions about facial development or health belong with a doctor.

## Bias and fairness

The free tools don't use an AI model trained on people's attractiveness ratings, so they don't learn the taste or bias of a particular group of raters. They do rely on general proportion targets, which reflect a mostly Western aesthetic tradition. We state the targets openly so you can judge them, and each tool's guide notes where typical proportions vary.

## What happens to your photo

**Free tools:** your photo is analysed in your browser and isn't uploaded to our servers.

**Full Facemaxify analysis (signed in):** your photo is uploaded and stored with your account so you can see your scan history. To generate the written reports, your photo and measurements are sent to third-party AI providers: Google's Gemini models produce the skin report and improvement plan, and OpenAI's image models produce the personal color and hairstyle analysis.

## Wellbeing

Face-rating tools can feed insecurity, especially when scores are treated as verdicts. We'd rather you use them as structured feedback: look at the breakdown, change one or two things that are within your control, and stop there. If you find yourself constantly checking scores, avoiding people, or fixating on features others wouldn't notice, talk to someone you trust or a mental health professional. Body dysmorphic disorder is common and treatable.

## Frequently asked questions

### How does Facemaxify calculate a face score?

It places 478 landmarks on your face, measures ratios between them, compares each ratio with a published target and scores how close you are. Composite scores are weighted averages of those measurements, with the weights listed on this page.

### Does Facemaxify use AI to rate attractiveness?

The free tools use an AI landmark model to find facial points, but the scores themselves come from transparent geometry, not from a model trained on people's attractiveness ratings.

### Are my photos uploaded?

Not with the free tools — they run in your browser. The signed-in full analysis uploads your photo to store your scan history and sends it to Google and OpenAI models to generate its written and visual reports.

### How accurate are Facemaxify's scores?

The same photo always produces the same score. Accuracy depends mostly on the photo: a straight-on, neutral, well-lit picture taken from arm's length or further gives the most reliable result.

### Are the targets the same for everyone?

Yes. The free tools use the same general proportion targets for everyone, and their guides note where typical proportions differ between people and populations.

### Can a score tell me if I'm attractive?

Only partly. Scores measure facial geometry in one photo. Skin, expression, style and personality — which strongly affect real-world attractiveness — aren't measured.

## Sources

- Langlois, J. H., & Roggman, L. A. (1990). [Attractive faces are only average](https://doi.org/10.1111/j.1467-9280.1990.tb00079.x). *Psychological Science*.
- Langlois, J. H., Kalakanis, L., Rubenstein, A. J., et al. (2000). [Maxims or myths of beauty? A meta-analytic and theoretical review](https://doi.org/10.1037/0033-2909.126.3.390). *Psychological Bulletin*.
- Rhodes, G. (2006). [The evolutionary psychology of facial beauty](https://doi.org/10.1146/annurev.psych.57.102904.190208). *Annual Review of Psychology*.
- Pallett, P. M., Link, S., & Lee, K. (2010). [New "golden" ratios for facial beauty](https://doi.org/10.1016/j.visres.2009.11.003). *Vision Research*.
- Ward, B., Ward, M., Fried, O., et al. (2018). [Nasal distortion in short-distance photographs: the selfie effect](https://doi.org/10.1001/jamafacial.2018.0009). *JAMA Facial Plastic Surgery*.
- Google. [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker).
