import { useEffect, useState } from "react";

// Matches the Navbar's h-[72px] so observed sections activate below it.
const NAVBAR_OFFSET = 72;

function useActiveSection(sectionIds) {
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (!sections.length) {
      return undefined;
    }

    const visibleSections = new Map();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleSections.set(entry.target.id, entry.boundingClientRect.top);
          } else {
            visibleSections.delete(entry.target.id);
          }
        });

        const nextSection = [...visibleSections.entries()].sort(
          ([, firstTop], [, secondTop]) =>
            Math.abs(firstTop - NAVBAR_OFFSET) -
            Math.abs(secondTop - NAVBAR_OFFSET),
        )[0]?.[0];

        setActiveSection(nextSection ?? null);
      },
      {
        rootMargin: `-${NAVBAR_OFFSET}px 0px -65% 0px`,
        threshold: 0,
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [sectionIds]);

  return [activeSection, setActiveSection];
}

export default useActiveSection;
