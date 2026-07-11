# Landing Scrollytelling — Video Üretim Prompt'ları

Saat hero'su için asset pipeline'ı. Kilit kareler Gemini ile üretildi
(foto1–foto4), segment videoları Kling (plan A) veya tek parça Veo/Gemini
video (plan B) ile üretilecek.

- Arka plan rengi: `#090b0e` (sitenin `--ws-bg` değeri — saf siyah DEĞİL)
- Vurgu rengi: `#fdb85b` (amber)
- Format: 16:9, tercihen 1080p+
- Kareler: foto1 (ön cephe) → foto2 (üst-çapraz 45°) → foto3 (exploded
  view) → foto4 (caseback/mekanizma)

---

## Kilit kare prompt'ları (Gemini — görsel)

### K1 — foto1: ön cephe hero

```
Professional studio product photograph of a luxury gold wristwatch,
inspired by a classic gold Rolex Datejust: 18k yellow gold case,
fluted gold bezel, champagne sunburst dial with gold baton hour
markers and a date window at 3 o'clock, gold oyster-link bracelet.
No brand name, no logo, no text on the dial.

Watch shown perfectly upright, viewed straight-on from the front,
dial facing the camera, centered in frame, occupying about 55% of
the frame height. Time set to 10:10.

Solid flat background, exact color #090b0e, completely uniform —
no gradient, no floor, no surface, no reflection, no shadow cast on
the background. The watch appears to float.

Lighting: dramatic dark studio lighting, soft warm key light from
the upper left creating elegant amber-gold highlights on the case
and bracelet edges, deep soft shadows on the right side. Warm
highlight tone close to #fdb85b. High contrast, moody, premium.

Photorealistic, 8k detail, sharp focus across the entire watch,
macro product photography, shot on medium format camera, 16:9
aspect ratio.
```

### K2 — foto2: üst-çapraz 45° (referans: foto1)

```
Using the attached image as the exact reference: the same gold
wristwatch, identical in every detail — same fluted bezel, same
champagne dial, same gold bracelet, same hands position at 10:10,
same date window showing 28.

Only the camera angle changes: the watch is now viewed from an
elevated three-quarter perspective, camera positioned above and to
the left at roughly 45 degrees, looking down at the dial. The dial
is still clearly visible but foreshortened, the side of the case
and the crown are now visible, and the bracelet recedes into depth.

Keep everything else identical to the reference image: the same
solid flat background color #090b0e with no gradient and no
shadows, the same dark studio lighting with the warm amber key
light from the upper left, the same framing with the watch centered
and occupying about 55% of the frame height.

Photorealistic, 8k detail, sharp focus, macro product photography,
16:9 aspect ratio. No text, no logo, no watermark.
```

### K3 — foto3: exploded view (referans: foto2)

```
Using the attached image as the exact reference: the same gold
wristwatch from the same elevated three-quarter camera angle, same
lighting, same solid flat background color #090b0e.

Now show the watch as a technical exploded view: all of its
components separated and floating in mid-air, arranged along the
watch's central axis, evenly spaced apart as if disassembled with
surgical precision. From top to bottom along that axis: the sapphire
crystal glass, the gold hour and minute hands, the champagne dial,
the mechanical movement with visible gears and a golden rotor, the
fluted bezel, the gold case, and the bracelet below.

Every component keeps the exact same material, color and finish as
the reference image. The parts float perfectly aligned along one
axis, nothing scattered, nothing rotated — clean, precise,
engineering-diagram style separation.

Keep the same warm amber studio lighting from the upper left, the
same framing with the exploded stack centered and filling about 70%
of the frame height. Solid flat background #090b0e, no gradient,
no shadows on the background.

Photorealistic, 8k detail, sharp focus on all components, macro
product photography, 16:9 aspect ratio. No text, no logo, no
watermark.
```

### K4 — foto4: caseback / mekanizma (referans: foto2)

```
Using the attached image as the exact reference: the same gold
wristwatch, identical in every detail — same fluted bezel, same
gold bracelet, same case.

Now the watch has been turned around to show its back: we see the
caseback side from the same elevated three-quarter camera angle. The
caseback is a transparent sapphire exhibition window, and through it
the mechanical movement is fully visible — golden gears, jewels,
a decorated golden rotor, fine engraved bridges. The movement fills
the caseback window with rich mechanical detail.

Keep everything else identical to the reference image: the same
solid flat background color #090b0e with no gradient and no
shadows, the same warm amber studio lighting from the upper left,
the same framing with the watch centered and occupying about 55%
of the frame height.

Photorealistic, 8k detail, sharp focus, macro product photography,
16:9 aspect ratio. No text, no logo, no watermark, no engraved
lettering on the caseback.
```

---

## Plan A — Kling segment prompt'ları (start/end frame modu)

Her segment ayrı üretim: ilk kare + son kare ver, 5 sn, en yüksek
kalite modu. Segment başına 2 kareden fazlası verilemez.

| Segment | İlk kare | Son kare | Sahne |
|---|---|---|---|
| S1 | foto1 | foto2 | açı değişimi |
| S2 | foto2 | foto3 | parçalara ayrılma |
| S3 | foto3 | foto2 | birleşme |
| S4 | foto2 | foto4 | arkaya dönüş, mekanizma |

### S1 — foto1 → foto2

```
A luxury gold wristwatch floating on a dark background slowly and
elegantly tilts backward and rotates, transitioning from a perfect
front view to an elevated three-quarter angle. Smooth, precise,
mechanical motion like a museum turntable. Static camera, no camera
movement, no zoom. The watch stays centered. Consistent warm studio
lighting, subtle golden reflections sliding across the polished
surfaces as it turns.
```

### S2 — foto2 → foto3

```
The gold wristwatch gently disassembles in mid-air: the crystal,
hands, dial, movement, bezel, case and bracelet slowly separate and
float apart along a single vertical axis, evenly spaced, with
surgical engineering precision. Slow, calm, controlled motion — no
scattering, no spinning parts. Static camera, no zoom. Dark solid
background, warm golden studio lighting.
```

### S3 — foto3 → foto2

```
The floating separated components of a gold wristwatch — crystal,
hands, dial, movement, bezel, case and bracelet — slowly glide back
together along a single axis and reassemble into a complete watch
with surgical precision, like a reverse explosion. Smooth, satisfying,
mechanical motion. Static camera, no zoom. Dark solid background,
warm golden studio lighting.
```

### S4 — foto2 → foto4

```
The assembled gold wristwatch slowly flips over in mid-air, rotating
to reveal its back: a transparent sapphire caseback showing the
golden mechanical movement with gears and a decorated rotor. Elegant,
slow, weightless rotation. Static camera, no zoom. The watch stays
centered. Dark solid background, warm golden studio lighting with
reflections sweeping across the bracelet as it turns.
```

### Negative prompt (tüm segmentlerde aynı)

```
camera movement, camera shake, zoom, text, watermark, logo, extra
parts, deformed watch, changing colors, background change, flicker
```

---

## Plan B — Tek parça video (Gemini / Veo, 4 foto referanslı, ~10 sn)

foto1–foto4'ü sırayla referans olarak ver. Not: video modelleri çoklu
görseli "keyframe sırası" olarak değil "referans malzeme" olarak
alabilir — sıra tutmazsa Plan A'ya dön.

```
A cinematic 10-second luxury product film of a single gold
wristwatch, using the four attached reference images in order as the
exact key moments of the sequence.

The film tells one continuous story in four acts:

Act 1 (0–2.5s): The watch floats perfectly centered, seen straight-on
from the front exactly as in the first reference image — gold case,
fluted bezel, champagne dial. It hangs almost still, breathing with
a barely perceptible drift.

Act 2 (2.5–5s): The watch slowly and elegantly tilts backward and
rotates into the elevated three-quarter angle of the second reference
image, like a museum turntable, golden reflections sliding across
the polished case.

Act 3 (5–7.5s): The watch gently disassembles in mid-air into the
exploded view of the third reference image: crystal, hands, dial,
mechanical movement, bezel, case and bracelet separate and float
apart along a single vertical axis, evenly spaced, with surgical
engineering precision. No scattering, no spinning.

Act 4 (7.5–10s): The components glide back together, the watch
reassembles, then slowly flips over to reveal the transparent
sapphire caseback of the fourth reference image, exposing the golden
mechanical movement with its gears and decorated rotor. The film
ends holding on this view.

Composition: the watch is always centered horizontally and occupies
roughly the middle 50% of the frame, leaving the left and right
thirds of the frame visually clean and empty — text overlays will be
added there later in the website. Nothing important ever touches the
edges of the frame.

Background: one single solid, perfectly uniform very dark color,
exactly #090b0e, identical in every frame — not pure black, a very
dark blue-tinted charcoal. No gradient, no vignette, no floor, no
surface, no particles, no light glow bleeding into the background.
The background must look like a flat solid color layer so the video
blends seamlessly into a website with the same background color.

Camera: completely static, locked-off camera. No camera movement, no
zoom, no shake. All motion comes from the watch itself.

Lighting: consistent dramatic dark studio lighting throughout, one
warm amber key light from the upper left (highlight tone close to
#fdb85b), deep soft shadows. Lighting never changes between acts.

Style: photorealistic macro product cinematography, ultra sharp,
premium and calm. Slow, weightless, mechanically precise motion
throughout — nothing fast, nothing chaotic.

No text, no captions, no logo, no watermark, no people, no hands.
```

---

## Üretim sonrası (Claude yapacak)

1. Segment/videoların ilk-son kareleri fotolarla eşleşiyor mu kontrol
2. ffmpeg: birleştirme (Plan A) + her kare keyframe (`-g 1`) scrub
   encode + arka plan ton eşitleme (`#090b0e`) + filigran temizliği
3. Poster kareleri çıkarma
4. `VideoScrollytelling.tsx` → tek video + 4 beat'in kare aralıklarına
   ve sol/sağ alternating layout'a güncelleme
5. Reduced-motion / no-JS fallback korunacak
