(() => {
  const config = window.TEGA_CONFIG;

  if (!config) {
    throw new Error("La configurazione di Tega’s World non è stata caricata.");
  }

  Object.entries(config.colors).forEach(([name, value]) => {
    document.documentElement.style.setProperty(`--color-${name}`, value);
  });

  document.querySelectorAll("[data-social]").forEach((link) => {
    const profile = config[link.dataset.social];
    if (profile) link.href = profile.url;
  });

  document.querySelectorAll("[data-asset]").forEach((element) => {
    const source = config.assets[element.dataset.asset];
    if (!source) return;
    if (element instanceof HTMLSourceElement) {
      element.srcset = source;
    } else {
      element.src = source;
    }
  });

  document.querySelectorAll("[data-map-link]").forEach((link) => {
    link.href = config.map.url;
  });

  const mapFrame = document.querySelector("[data-map-frame]");
  if (mapFrame && config.features.mapEmbed) {
    mapFrame.src = config.map.url;
  } else if (mapFrame) {
    mapFrame.remove();
    document.querySelector("[data-map-fallback]")?.removeAttribute("hidden");
  }

  const serverAddress = document.querySelector("[data-server-ip]");
  if (serverAddress && config.features.showServerIp && config.serverIp) {
    serverAddress.textContent = config.serverIp;
    serverAddress.closest("[data-server-address]")?.removeAttribute("hidden");
  }

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const header = document.querySelector("[data-site-header]");
  const menuButton = document.querySelector("[data-menu-toggle]");

  if (header && menuButton) {
    const closeMenu = (returnFocus = false) => {
      header.classList.remove("is-menu-open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Apri il menu");
      if (returnFocus) menuButton.focus();
    };

    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      header.classList.toggle("is-menu-open", !isOpen);
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Apri il menu" : "Chiudi il menu");
    });

    header.querySelectorAll(".site-nav a").forEach((link) => {
      link.addEventListener("click", () => closeMenu());
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && header.classList.contains("is-menu-open")) {
        closeMenu(true);
      }
    });

    document.addEventListener("pointerdown", (event) => {
      if (!header.contains(event.target)) closeMenu();
    });
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion && "IntersectionObserver" in window) {
    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" },
    );

    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

    const parallaxTargets = [...document.querySelectorAll("[data-parallax]")];
    const activeParallaxTargets = new Set();
    const mobileViewport = window.matchMedia("(max-width: 760px)");
    let parallaxFrame = 0;

    const updateParallax = () => {
      parallaxFrame = 0;
      const viewportHeight = window.innerHeight;
      const travel = mobileViewport.matches ? 7 : 32;

      activeParallaxTargets.forEach((element) => {
        const bounds = element.getBoundingClientRect();
        const appliedOffset = Number.parseFloat(element.style.getPropertyValue("--parallax-y")) || 0;
        const top = bounds.top - appliedOffset;
        const progress = Math.min(
          1,
          Math.max(0, (viewportHeight - top) / (viewportHeight + bounds.height)),
        );
        const depth = Number(element.dataset.parallax);
        if (!Number.isFinite(depth)) return;
        const offset = (progress - 0.5) * 2 * travel * depth;
        element.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
      });
    };

    const requestParallaxUpdate = () => {
      if (parallaxFrame === 0) {
        parallaxFrame = window.requestAnimationFrame(updateParallax);
      }
    };

    if (parallaxTargets.length > 0) {
      const parallaxObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              activeParallaxTargets.add(entry.target);
              entry.target.classList.add("parallax-active");
            } else {
              activeParallaxTargets.delete(entry.target);
              entry.target.classList.remove("parallax-active");
              entry.target.style.setProperty("--parallax-y", "0px");
            }
          });
          requestParallaxUpdate();
        },
        { rootMargin: "16% 0px 16% 0px" },
      );

      parallaxTargets.forEach((element) => parallaxObserver.observe(element));
      window.addEventListener("scroll", requestParallaxUpdate, { passive: true });
      window.addEventListener("resize", requestParallaxUpdate, { passive: true });
      if (mobileViewport.addEventListener) {
        mobileViewport.addEventListener("change", requestParallaxUpdate);
      } else {
        mobileViewport.addListener(requestParallaxUpdate);
      }
    }
  }
})();
