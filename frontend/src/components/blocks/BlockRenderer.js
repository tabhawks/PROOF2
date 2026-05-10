import React from 'react';
import { Link } from 'react-router-dom';

function Eyebrow({ children }) {
  return <div className="eyebrow mb-3">{children}</div>;
}

export function HeroBlock({ data }) {
  return (
    <section className="section" style={{ background: data.bg === 'dark' ? 'var(--obsidian)' : 'var(--ivory)', color: data.bg === 'dark' ? 'var(--ivory)' : 'var(--obsidian)' }}>
      <div className="container-x">
        {data.eyebrow && <div className={`eyebrow ${data.bg === 'dark' ? 'on-dark' : ''} mb-6`}>{data.eyebrow}</div>}
        <h1 className="display text-[56px] md:text-[96px] tracking-tight max-w-[1100px]">{data.title}</h1>
        {data.subtitle && <p className="font-serif text-[22px] md:text-[26px] leading-[1.45] mt-8 max-w-[760px] text-[rgba(10,10,10,0.78)]" style={{ color: data.bg === 'dark' ? 'rgba(245,241,234,0.78)' : undefined }}>{data.subtitle}</p>}
        {(data.cta_label || data.secondary_label) && (
          <div className="mt-12 flex flex-wrap gap-4">
            {data.cta_label && <Link to={data.cta_href || '/contact'} className={`btn-line gold`}>{data.cta_label}</Link>}
            {data.secondary_label && <Link to={data.secondary_href || '/services'} className={`btn-line ${data.bg === 'dark' ? 'dark' : ''}`}>{data.secondary_label}</Link>}
          </div>
        )}
      </div>
    </section>
  );
}

export function HeadingBlock({ data }) {
  const level = Math.min(Math.max(parseInt(data.level || 2, 10), 1), 6);
  const Tag = `h${level}`;
  const cls = level <= 2 ? 'display text-[42px] md:text-[64px]' : 'font-serif italic text-[28px] md:text-[36px]';
  return (
    <section className="section-tight">
      <div className="container-x">
        {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}
        <Tag className={cls + ' tracking-tight'}>{data.text}</Tag>
      </div>
    </section>
  );
}

export function ParagraphBlock({ data }) {
  return (
    <section className="section-tight">
      <div className="container-narrow">
        <p className="font-serif text-[20px] md:text-[22px] leading-[1.55] text-[rgba(10,10,10,0.85)]">{data.text}</p>
      </div>
    </section>
  );
}

export function QuoteBlock({ data }) {
  return (
    <section className="section">
      <div className="container-narrow text-center">
        <div className="gold-rule mb-12" />
        <blockquote className="display text-[36px] md:text-[56px] leading-[1.1]">{data.text}</blockquote>
        {data.attribution && <div className="meta-mono mt-8">— {data.attribution}</div>}
        <div className="gold-rule mt-12" />
      </div>
    </section>
  );
}

export function ImageBlock({ data }) {
  if (!data.src) return null;
  return (
    <section className="section-tight">
      <div className="container-x">
        <figure>
          <img src={data.src} alt={data.alt || ''} className="w-full h-auto editorial-img" />
          {data.caption && <figcaption className="meta-mono mt-3">{data.caption}</figcaption>}
        </figure>
      </div>
    </section>
  );
}

export function ImageTextBlock({ data }) {
  return (
    <section className="section-tight">
      <div className="container-x grid md:grid-cols-2 gap-12 items-center">
        <div>{data.src && <img src={data.src} alt={data.alt || ''} className="w-full h-auto editorial-img" />}</div>
        <div>
          {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}
          {data.title && <h3 className="display text-[36px] md:text-[44px] mb-4">{data.title}</h3>}
          {data.text && <p className="font-serif text-[18px] leading-[1.55] text-[rgba(10,10,10,0.78)]">{data.text}</p>}
        </div>
      </div>
    </section>
  );
}

export function TwoColBlock({ data }) {
  const cols = data.columns || [{ title: 'Column A', text: '' }, { title: 'Column B', text: '' }];
  return (
    <section className="section">
      <div className="container-x grid md:grid-cols-2 gap-16">
        {cols.map((c, i) => (
          <div key={i} className="pt-6" style={{ borderTop: '1px solid var(--gold-line)' }}>
            {c.eyebrow && <Eyebrow>{c.eyebrow}</Eyebrow>}
            {c.title && <h3 className="display text-[28px] md:text-[36px] mb-3">{c.title}</h3>}
            {c.text && <p className="font-serif text-[17px] leading-[1.55] text-[rgba(10,10,10,0.78)]">{c.text}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ThreeColBlock({ data }) {
  const cols = data.columns || [];
  return (
    <section className="section">
      <div className="container-x grid md:grid-cols-3 gap-12">
        {cols.map((c, i) => (
          <div key={i} className="pt-6" style={{ borderTop: '1px solid var(--gold-line)' }}>
            <div className="meta-mono mb-3">{String(i + 1).padStart(2, '0')}</div>
            {c.title && <h3 className="display text-[26px] md:text-[32px] mb-3">{c.title}</h3>}
            {c.text && <p className="font-serif text-[16px] leading-[1.55] text-[rgba(10,10,10,0.75)]">{c.text}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function ListBlock({ data }) {
  const items = data.items || [];
  return (
    <section className="section-tight">
      <div className="container-narrow">
        {data.eyebrow && <Eyebrow>{data.eyebrow}</Eyebrow>}
        <ul className="meta-strip">
          {items.map((it, i) => (
            <li key={i} className="row">
              <div className="meta-mono">{String(i + 1).padStart(2, '0')}</div>
              <div className="font-serif text-[20px] italic">{typeof it === 'string' ? it : it.label}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function StatStripBlock({ data }) {
  const items = data.items || [];
  return (
    <section className="section-tight" style={{ borderTop: '1px solid var(--gold-line)', borderBottom: '1px solid var(--gold-line)' }}>
      <div className="container-x grid grid-cols-2 md:grid-cols-4 gap-8">
        {items.map((it, i) => (
          <div key={i}>
            <div className="display text-[36px] md:text-[44px] tabular">{it.value}</div>
            <div className="meta-mono mt-2">{it.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CTABlock({ data }) {
  return (
    <section className="section" style={{ background: 'var(--obsidian)', color: 'var(--ivory)' }}>
      <div className="container-narrow text-center">
        {data.eyebrow && <div className="eyebrow on-dark mb-6">{data.eyebrow}</div>}
        <h2 className="display text-[40px] md:text-[64px]">{data.title}</h2>
        {data.text && <p className="font-serif text-[18px] mt-6 text-[rgba(245,241,234,0.78)]">{data.text}</p>}
        <div className="mt-10">
          <Link to={data.cta_href || '/contact'} className="btn-line gold">{data.cta_label || 'request consideration'}</Link>
        </div>
      </div>
    </section>
  );
}

export function PressListBlock({ data }) {
  const items = data.items || [];
  return (
    <section className="section">
      <div className="container-x">
        <div className="meta-strip">
          {items.map((it, i) => (
            <Link key={i} to={it.href || '#'} className="row hover:bg-[rgba(200,169,106,0.05)] -mx-4 px-4">
              <div className="meta-mono">{it.date}</div>
              <div className="font-serif italic text-[22px] md:text-[28px]">{it.title}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AthleteGridBlock({ data }) {
  const items = data.items || [];
  return (
    <section className="section">
      <div className="container-x grid grid-cols-1 md:grid-cols-3 gap-8">
        {items.map((a, i) => (
          <Link key={i} to={a.href || '#'} className="group block">
            <div className="aspect-[4/5] overflow-hidden" style={{ background: 'var(--charcoal)' }}>
              {a.photo_url && <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover editorial-img group-hover:scale-[1.02]" />}
            </div>
            <div className="mt-4 flex justify-between items-baseline">
              <div className="meta-mono">{a.sport}</div>
              <div className="meta-mono">{a.status}</div>
            </div>
            <div className="font-serif italic text-[24px] mt-1">{a.name}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function EmbedBlock({ data }) {
  if (!data.url) return null;
  return (
    <section className="section-tight">
      <div className="container-x">
        <div className="aspect-video w-full">
          <iframe src={data.url} title={data.title || 'embed'} className="w-full h-full" allowFullScreen></iframe>
        </div>
      </div>
    </section>
  );
}

export function CustomHTMLBlock({ data }) {
  return (
    <section className="section-tight">
      <div className="container-x" dangerouslySetInnerHTML={{ __html: data.html || '' }} />
    </section>
  );
}

export function SpacerBlock({ data }) {
  const h = data.size === 'lg' ? 160 : data.size === 'sm' ? 40 : 80;
  return <div style={{ height: h }} />;
}

export function DividerBlock() {
  return (
    <div className="section-tight">
      <div className="container-x"><div className="gold-rule" /></div>
    </div>
  );
}

export const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero' },
  { type: 'heading', label: 'Heading' },
  { type: 'paragraph', label: 'Paragraph' },
  { type: 'quote', label: 'Quote' },
  { type: 'image', label: 'Image' },
  { type: 'image_text', label: 'Image + Text' },
  { type: 'two_col', label: 'Two Columns' },
  { type: 'three_col', label: 'Three Columns' },
  { type: 'list', label: 'List' },
  { type: 'stat_strip', label: 'Stat Strip' },
  { type: 'cta', label: 'CTA' },
  { type: 'press_list', label: 'Press List' },
  { type: 'athlete_grid', label: 'Athlete Grid' },
  { type: 'embed', label: 'Embed' },
  { type: 'custom_html', label: 'Custom HTML' },
  { type: 'spacer', label: 'Spacer' },
  { type: 'divider', label: 'Divider' },
];

export function BlockRenderer({ blocks }) {
  if (!blocks) return null;
  return blocks.map((b, i) => {
    const data = b.data || {};
    switch (b.type) {
      case 'hero': return <HeroBlock key={b.id || i} data={data} />;
      case 'heading': return <HeadingBlock key={b.id || i} data={data} />;
      case 'paragraph': return <ParagraphBlock key={b.id || i} data={data} />;
      case 'quote': return <QuoteBlock key={b.id || i} data={data} />;
      case 'image': return <ImageBlock key={b.id || i} data={data} />;
      case 'image_text': return <ImageTextBlock key={b.id || i} data={data} />;
      case 'two_col': return <TwoColBlock key={b.id || i} data={data} />;
      case 'three_col': return <ThreeColBlock key={b.id || i} data={data} />;
      case 'list': return <ListBlock key={b.id || i} data={data} />;
      case 'stat_strip': return <StatStripBlock key={b.id || i} data={data} />;
      case 'cta': return <CTABlock key={b.id || i} data={data} />;
      case 'press_list': return <PressListBlock key={b.id || i} data={data} />;
      case 'athlete_grid': return <AthleteGridBlock key={b.id || i} data={data} />;
      case 'embed': return <EmbedBlock key={b.id || i} data={data} />;
      case 'custom_html': return <CustomHTMLBlock key={b.id || i} data={data} />;
      case 'spacer': return <SpacerBlock key={b.id || i} data={data} />;
      case 'divider': return <DividerBlock key={b.id || i} />;
      default: return null;
    }
  });
}
