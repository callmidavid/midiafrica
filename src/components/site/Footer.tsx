import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-ink text-ivory">
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-20 md:py-28 grid gap-12 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="eyebrow text-white/60 mb-6">The Journal</p>
            <h2 className="font-display text-4xl md:text-6xl leading-[0.95] max-w-xl">
              Join the atelier dispatches on new collections, private previews, and cultural notes.
            </h2>
          </div>
          <form className="flex flex-col justify-end gap-4">
            <div className="flex border-b border-white/30 pb-3">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 bg-transparent outline-none placeholder:text-white/40 text-sm"
              />
              <button className="eyebrow text-white/80 hover:text-white transition">
                Subscribe
              </button>
            </div>
            <p className="text-xs text-white/50">By subscribing you agree to our privacy policy.</p>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 md:px-10 py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-display text-2xl tracking-[0.2em] uppercase">Midi Africa</p>
          <p className="mt-6 text-sm text-white/60 max-w-xs leading-relaxed">
            A contemporary luxury house rooted in African heritage and modern craft.
          </p>
        </div>
        <FooterCol
          title="Collections"
          links={[
            ["Women", "/shop"],
            ["Men", "/shop"],
            ["Bridal", "/shop"],
            ["Bespoke", "/bespoke"],
            ["Accessories", "/shop"],
          ]}
        />
        <FooterCol
          title="House"
          links={[
            ["About", "/about"],
            ["Craftsmanship", "/about"],
            ["Sustainability", "/about"],
            ["Journal", "/about"],
          ]}
        />
        <FooterCol
          title="Client Care"
          links={[
            ["Contact", "/contact"],
            ["Shipping", "/contact"],
            ["Returns", "/contact"],
            ["Size Guide", "/contact"],
          ]}
        />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-white/50">
          <span>© {new Date().getFullYear()} Midi Africa. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#">Instagram</a>
            <a href="#">Pinterest</a>
            <a href="#">TikTok</a>
            <a href="#">WhatsApp</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="eyebrow text-white/50 mb-5">{title}</p>
      <ul className="space-y-3 text-sm">
        {links.map(([label, to]) => (
          <li key={label}>
            <Link to={to} className="text-white/80 hover:text-white transition">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
