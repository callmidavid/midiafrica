import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight, Sparkles, Leaf, Scissors, Globe2, Star } from "lucide-react";

import hero from "@/assets/hero.jpg";
import cw from "@/assets/collection-women.jpg";
import cm from "@/assets/collection-men.jpg";
import cb from "@/assets/collection-bridal.jpg";
import ca from "@/assets/collection-accessories.jpg";
import craft from "@/assets/craft.jpg";
import about from "@/assets/about.jpg";
import { useProducts } from "@/lib/shop-store";
import { ProductCard } from "@/components/site/ProductCard";
import { Reveal } from "@/components/site/Reveal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Midi Africa — Redefining African Luxury" },
      { name: "description", content: "A contemporary luxury fashion house where timeless craftsmanship meets modern African elegance." },
      { property: "og:title", content: "Midi Africa — Redefining African Luxury" },
      { property: "og:description", content: "Where timeless craftsmanship meets contemporary elegance." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div>
      <Hero />
      <Marquee />
      <Collections />
      <FeaturedProducts />
      <AboutStrip />
      <Craft />
      <Testimonials />
      <Instagram />
    </div>
  );
}

function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[680px] overflow-hidden bg-ink text-ivory">
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <img
          src={hero}
          alt="Midi Africa Autumn Collection"
          className="h-full w-full object-cover opacity-90"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="relative z-10 flex flex-col h-full px-6 md:px-10 pt-32 md:pt-40 pb-12 max-w-7xl mx-auto"
      >
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="eyebrow text-ivory/70"
        >
          Autumn / Winter 2026 — Volume I
        </motion.p>

        <div className="mt-auto max-w-4xl">
          <motion.h1
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 1.1, ease: [0.7, 0, 0.2, 1] }}
            className="font-display text-[13vw] md:text-[7.5vw] leading-[0.92] tracking-[-0.02em]"
          >
            Redefining <br />
            <span className="italic text-ivory/90">African</span> Luxury.
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.9 }}
            className="mt-6 md:mt-10 max-w-lg text-base md:text-lg text-ivory/80 leading-relaxed"
          >
            Where timeless craftsmanship meets contemporary elegance. Made slowly, in limited numbers, by hands that have practiced for generations.
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.9 }}
            className="mt-10 flex flex-col sm:flex-row gap-3"
          >
            <Link
              to="/shop"
              className="group inline-flex items-center justify-between gap-6 bg-ivory text-ink px-8 py-4 eyebrow hover:bg-gold transition-colors duration-500"
            >
              Explore Collection
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
            <Link
              to="/bespoke"
              className="group inline-flex items-center justify-between gap-6 border border-ivory/40 text-ivory px-8 py-4 eyebrow hover:bg-ivory/10 transition-colors duration-500"
            >
              Book Consultation
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        style={{ opacity }}
        className="absolute bottom-6 right-6 md:right-10 z-10 hidden md:flex items-center gap-3 text-ivory/70"
      >
        <span className="eyebrow">Scroll</span>
        <div className="h-8 w-px bg-ivory/40 animate-pulse" />
      </motion.div>
    </section>
  );
}

function Marquee() {
  const items = ["Handcrafted in Lagos", "Since 2018", "Slow Fashion", "Limited Editions", "Ethically Sourced", "Global Delivery"];
  const doubled = [...items, ...items];
  return (
    <section className="border-y border-border py-6 overflow-hidden bg-background">
      <div className="flex marquee-track whitespace-nowrap eyebrow text-muted-foreground">
        {doubled.map((t, i) => (
          <span key={i} className="mx-10 inline-flex items-center gap-10">
            {t} <span className="text-gold">✦</span>
          </span>
        ))}
      </div>
    </section>
  );
}

function Collections() {
  const items = [
    { title: "Women", tag: "AW26", image: cw, span: "md:col-span-8 md:row-span-2" },
    { title: "Bridal", tag: "Atelier", image: cb, span: "md:col-span-4" },
    { title: "Accessories", tag: "Essentials", image: ca, span: "md:col-span-4" },
    { title: "Men", tag: "AW26", image: cm, span: "md:col-span-6" },
    { title: "Bespoke", tag: "Made to Measure", image: craft, span: "md:col-span-6" },
  ];

  return (
    <section className="px-6 md:px-10 py-24 md:py-40 max-w-[1600px] mx-auto">
      <div className="flex items-end justify-between gap-8 mb-12 md:mb-20">
        <Reveal>
          <p className="eyebrow text-muted-foreground mb-4">The Collections</p>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-2xl">
            Five worlds, one <span className="italic">philosophy</span>.
          </h2>
        </Reveal>
        <Reveal delay={0.15} className="hidden md:block">
          <Link to="/shop" className="eyebrow hover-underline">View All →</Link>
        </Reveal>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 md:auto-rows-[28rem] gap-3 md:gap-4">
        {items.map((c, i) => (
          <Reveal
            key={c.title}
            delay={i * 0.08}
            className={`group relative overflow-hidden ${c.span} h-[62svh] md:h-auto`}
          >
            <Link to="/shop" className="block h-full">
              <img
                src={c.image}
                alt={c.title}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-6 bottom-6 md:inset-x-8 md:bottom-8 text-ivory flex items-end justify-between">
                <div>
                  <p className="eyebrow text-ivory/70 mb-2">{c.tag}</p>
                  <h3 className="font-display text-4xl md:text-5xl">{c.title}</h3>
                </div>
                <div className="translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-ivory text-ink">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FeaturedProducts() {
  const { products } = useProducts();
  const featured = products.filter((p) => p.published && p.featured).slice(0, 8);
  return (
    <section className="px-4 sm:px-6 md:px-10 py-20 md:py-32 bg-muted/40 border-y border-border">
      <div className="max-w-[1600px] mx-auto">
        <div className="flex items-end justify-between gap-8 mb-12 md:mb-16">
          <Reveal>
            <p className="eyebrow text-muted-foreground mb-4">Featured</p>
            <h2 className="font-display text-4xl md:text-6xl leading-tight max-w-xl">
              Objects of quiet <span className="italic">devotion</span>.
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <Link to="/shop" className="eyebrow hover-underline">Shop All →</Link>
          </Reveal>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 sm:gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-20">
          {featured.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutStrip() {
  return (
    <section className="px-6 md:px-10 py-24 md:py-40 max-w-[1600px] mx-auto">
      <div className="grid gap-12 md:gap-20 md:grid-cols-2 items-center">
        <Reveal className="relative aspect-[4/5] overflow-hidden order-2 md:order-1">
          <img src={about} alt="Midi Africa atelier" loading="lazy" className="h-full w-full object-cover" />
        </Reveal>
        <div className="order-1 md:order-2 md:pl-8 lg:pl-16">
          <Reveal>
            <p className="eyebrow text-muted-foreground mb-6">Our House</p>
            <h2 className="font-display text-4xl md:text-6xl leading-[1] mb-8">
              A modern love letter to the <span className="italic">continent</span>.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-lg mb-6">
              Founded in Lagos in 2018, Midi Africa began as a conversation between old-world tailoring and new African confidence — between the ancestral gestures of West African textile masters and the discipline of contemporary Parisian ateliers.
            </p>
            <p className="text-base md:text-lg leading-relaxed text-muted-foreground max-w-lg mb-10">
              Every piece we make is a slow, considered act: dyed by hand, cut with intention, finished by artisans we know by name.
            </p>
            <Link to="/about" className="eyebrow hover-underline">Read Our Story →</Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Craft() {
  const pillars = [
    { icon: Scissors, title: "Handcrafted", body: "Each garment is cut and finished by hand in our Lagos atelier." },
    { icon: Leaf, title: "Sustainable", body: "Deadstock silks, plant dyes, and repair-first design principles." },
    { icon: Sparkles, title: "Premium Fabrics", body: "Belgian linen, Italian wool, and mulberry silk woven with heritage." },
    { icon: Globe2, title: "African Heritage", body: "In dialogue with the makers of Osogbo, Kano and Accra." },
  ];

  return (
    <section className="relative bg-ink text-ivory overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: `url(${craft})`, backgroundSize: "cover", backgroundPosition: "center" }}
      />
      <div className="absolute inset-0 bg-ink/70" />
      <div className="relative max-w-[1600px] mx-auto px-6 md:px-10 py-24 md:py-40">
        <Reveal>
          <p className="eyebrow text-ivory/60 mb-6">Craft</p>
          <h2 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-3xl mb-16">
            Made slowly, <span className="italic">on purpose</span>.
          </h2>
        </Reveal>
        <div className="grid gap-10 md:gap-6 md:grid-cols-4">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.1} className="border-t border-ivory/20 pt-8">
              <p.icon className="h-6 w-6 text-gold mb-8" strokeWidth={1.2} />
              <h3 className="font-display text-2xl mb-3">{p.title}</h3>
              <p className="text-sm text-ivory/70 leading-relaxed">{p.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { quote: "The tailoring is architectural. The fabric feels like a second skin — I've never owned anything so quietly powerful.", name: "Amara O.", role: "Curator, Lagos" },
    { quote: "My bridal gown was a conversation. Six months, five fittings, one dress that made my mother weep.", name: "Zainab K.", role: "Client, Marrakech" },
    { quote: "You feel the intention in every seam. This is what modern luxury should feel like.", name: "Etienne D.", role: "Editor, Paris" },
  ];
  return (
    <section className="px-6 md:px-10 py-24 md:py-40 max-w-[1400px] mx-auto">
      <Reveal>
        <p className="eyebrow text-muted-foreground mb-6 text-center">Notes from Clients</p>
      </Reveal>
      <div className="grid md:grid-cols-3 gap-10 md:gap-16 mt-12">
        {items.map((t, i) => (
          <Reveal key={i} delay={i * 0.1} className="text-center">
            <div className="flex justify-center gap-1 mb-6 text-gold">
              {[...Array(5)].map((_, s) => <Star key={s} className="h-3.5 w-3.5 fill-current" />)}
            </div>
            <blockquote className="font-display text-xl md:text-2xl leading-snug mb-8">
              "{t.quote}"
            </blockquote>
            <p className="eyebrow">{t.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.role}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Instagram() {
  const imgs = [cw, cb, ca, cm, craft, about];
  return (
    <section className="pb-24 md:pb-32">
      <div className="flex items-end justify-between px-6 md:px-10 max-w-[1600px] mx-auto mb-8">
        <Reveal>
          <p className="eyebrow text-muted-foreground mb-3">@midi.africa</p>
          <h2 className="font-display text-3xl md:text-5xl">Follow the atelier</h2>
        </Reveal>
        <Reveal delay={0.15}>
          <a href="#" className="eyebrow hover-underline">Instagram →</a>
        </Reveal>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-1">
        {imgs.map((src, i) => (
          <a key={i} href="#" className="group relative aspect-square overflow-hidden">
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/30 transition-colors duration-500" />
          </a>
        ))}
      </div>
    </section>
  );
}
