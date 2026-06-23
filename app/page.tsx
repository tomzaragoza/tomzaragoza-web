const projects = [
  {
    name: "crawlconsole",
    href: "https://crawlconsole.com"
  },
  {
    name: "workbenchy",
    href: "https://workbenchy.com"
  },
  {
    name: "vocalmatic",
    href: "https://vocalmatic.com"
  },
  {
    name: "carpio gym",
    href: "https://carpio247.com"
  },
  {
    name: "poetrics",
    href: "https://poetrics.ai"
  }
];

const socialLinks = [
  {
    label: "linkedin:",
    text: "in/tomzaragoza",
    href: "https://www.linkedin.com/in/tomzaragoza/"
  },
  {
    label: "X:",
    text: "@tomzaragoza",
    href: "https://x.com/tomzaragoza"
  }
];

export default function Home() {
  return (
    <main className="home">
      <section className="intro" aria-labelledby="site-title">
        <h1 id="site-title">Tom Zaragoza</h1>
        <p>Building:</p>
        <nav aria-label="Projects">
          {projects.map((link) => (
            <a key={link.href} href={link.href} rel="external">
              <span>{link.name}</span>
            </a>
          ))}
        </nav>
        <nav aria-label="Social links">
          {socialLinks.map((link) => (
            <a key={link.href} href={link.href} rel="me external">
              <span>{link.label}</span>
              <span>{link.text}</span>
            </a>
          ))}
        </nav>
      </section>
    </main>
  );
}
