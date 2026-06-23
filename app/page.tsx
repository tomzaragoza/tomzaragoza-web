const links = [
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
        <p>building things</p>
        <nav aria-label="Social links">
          {links.map((link) => (
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
