import { Fragment } from "react";

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
    text: "linkedin",
    href: "https://www.linkedin.com/in/tomzaragoza/"
  },
  {
    text: "x",
    href: "https://x.com/tomzaragoza"
  }
];

export default function Home() {
  return (
    <main className="home">
      <section className="intro" aria-labelledby="site-title">
        <h1 id="site-title">Tom Zaragoza</h1>
        <p className="building-sentence">
          building{" "}
          {projects.map((link, index) => (
            <Fragment key={link.href}>
              <a href={link.href} rel="external">
                {link.name}
              </a>
              {index < projects.length - 1 ? ", " : ""}
            </Fragment>
          ))}
        </p>
        <nav className="social-links" aria-label="Social links">
          {socialLinks.map((link) => (
            <a key={link.href} href={link.href} rel="me external">
              {link.text}
            </a>
          ))}
        </nav>
      </section>
    </main>
  );
}
