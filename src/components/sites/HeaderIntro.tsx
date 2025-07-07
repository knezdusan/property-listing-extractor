import SliderIntro from "@/components/sites/SliderIntro/SliderIntro";

const IMAGES = [
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=800&q=80",
];

export default function HeaderIntro() {
  return (
    <div className="header-intro">
      <div className="header-intro-content">
        <h1>Slider Page</h1>
        <p>Intro text</p>
      </div>
      <SliderIntro images={IMAGES} transition="fade" duration={{ display: 4000, transition: 1000 }} />
    </div>
  );
}
