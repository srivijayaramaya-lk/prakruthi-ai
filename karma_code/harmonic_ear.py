# KARMA_CODE
# purpose: offline ශබ්ද වර්ගීකරණය — ජීවී/අජීවී සංඥා වෙන් කිරීම (pure math)
# benefit: API/ජාලය නැතුවත් phone එකේ වැඩ; කිසිදු data එකක් එකතු නොකරයි
# constraints: ප්‍රතිඵල සම්භාවිතා පමණයි — entity තහවුරු කිරීමක් නෙවෙයි
"""harmonic_ear.py — FFT + spectral entropy. Test: python karma_code/harmonic_ear.py"""
import numpy as np

PATTERNS = {
    "Human_Vocal":  (85, 255),
    "Canine_Bark":  (300, 1000),
    "Feline_Meow":  (500, 1500),
    "Test_Tone":    (480, 520),
    "Metallic":     (2000, 5000),
}
THRESHOLD = 0.70

def dominant_freq(signal, sr):
    spec = np.abs(np.fft.rfft(signal))
    freqs = np.fft.rfftfreq(len(signal), 1 / sr)
    return float(freqs[np.argmax(spec)])

def spectral_entropy(signal):
    spec = np.abs(np.fft.rfft(signal)) + 1e-12
    p = spec / spec.sum()
    return float(-np.sum(p * np.log2(p)))

def classify(signal, sr=44100):
    f, ent = dominant_freq(signal, sr), spectral_entropy(signal)
    best, score = "Unknown", 0.0
    for name, (lo, hi) in PATTERNS.items():
        if lo <= f <= hi:
            s = 1.0 - abs(f - (lo + hi) / 2) / (hi - lo)
            if s > score: best, score = name, s
    if score < THRESHOLD: best = "Unknown"
    return {"dominant_hz": f, "spectral_entropy": round(ent, 3),
            "match": best, "confidence": f"{score*100:.1f}%"}

if __name__ == "__main__":
    sr = 44100
    t = np.linspace(0, 1.0, sr)
    wave = np.sin(2 * np.pi * 500 * t)          # 500Hz test tone
    for k, v in classify(wave, sr).items():
        print(k + ":", v)