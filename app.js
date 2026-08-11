(() => {
  const VIDEOS = {
    1: "videos/video1.mp4",
    2: "videos/video2.mp4",
    3: "videos/video3.mp4",
  };

  const TAPS_REQUIRED = 3;

  /** @type {'gate' | 'playing1' | 'awaitingTaps' | 'playing2' | 'looping3'} */
  let state = "gate";
  let tapCount = 0;
  let frontIsA = true;
  let swapInFlight = false;

  const gate = document.getElementById("gate");
  const stage = document.getElementById("stage");
  const layerA = document.getElementById("layer-a");
  const layerB = document.getElementById("layer-b");

  /** @returns {HTMLVideoElement} */
  function frontLayer() {
    return frontIsA ? layerA : layerB;
  }

  /** @returns {HTMLVideoElement} */
  function backLayer() {
    return frontIsA ? layerB : layerA;
  }

  /**
   * @param {HTMLVideoElement} video
   * @param {string} src
   * @returns {Promise<void>}
   */
  function loadSource(video, src) {
    return new Promise((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error(`Failed to load ${src}`));
      };
      const cleanup = () => {
        video.removeEventListener("canplaythrough", onReady);
        video.removeEventListener("canplay", onReady);
        video.removeEventListener("error", onError);
      };

      if (video.getAttribute("src") === src && video.readyState >= 3) {
        resolve();
        return;
      }

      video.loop = false;
      video.muted = false;
      video.setAttribute("src", src);
      video.load();

      if (video.readyState >= 3) {
        resolve();
        return;
      }

      video.addEventListener("canplaythrough", onReady, { once: true });
      video.addEventListener("canplay", onReady, { once: true });
      video.addEventListener("error", onError, { once: true });
    });
  }

  /**
   * @param {HTMLVideoElement} video
   * @returns {Promise<void>}
   */
  function waitUntilPlaying(video) {
    return new Promise((resolve) => {
      if (!video.paused && video.readyState >= 2 && video.currentTime > 0) {
        resolve();
        return;
      }

      const done = () => {
        video.removeEventListener("playing", done);
        video.removeEventListener("timeupdate", onTime);
        resolve();
      };

      const onTime = () => {
        if (video.currentTime > 0) done();
      };

      video.addEventListener("playing", done, { once: true });
      video.addEventListener("timeupdate", onTime);
    });
  }

  /**
   * Start next clip on the back layer, then reveal it only after it is playing.
   * Keeps the front layer (including frozen last frame) visible until then.
   * @param {string} src
   * @param {{ loop?: boolean, onEnded?: () => void }} [options]
   */
  async function showNext(src, options = {}) {
    if (swapInFlight) return;
    swapInFlight = true;

    const back = backLayer();
    const front = frontLayer();

    try {
      await loadSource(back, src);
      back.loop = Boolean(options.loop);
      back.currentTime = 0;

      const playPromise = back.play();
      if (playPromise) await playPromise;
      await waitUntilPlaying(back);

      back.classList.add("is-front");
      front.classList.remove("is-front");
      frontIsA = !frontIsA;

      front.pause();
      front.removeAttribute("src");
      front.load();
      front.onended = null;

      if (options.onEnded) {
        back.onended = options.onEnded;
      } else {
        back.onended = null;
      }
    } finally {
      swapInFlight = false;
    }
  }

  function preloadUpcoming() {
    const back = backLayer();
    loadSource(back, VIDEOS[2]).catch(() => {});
    fetch(VIDEOS[3], { cache: "force-cache" }).catch(() => {});
  }

  async function startExperience() {
    if (state !== "gate") return;
    state = "playing1";
    gate.hidden = true;

    preloadUpcoming();

    const front = frontLayer();
    await loadSource(front, VIDEOS[1]);
    front.loop = false;
    front.currentTime = 0;
    front.classList.add("is-front");

    front.onended = () => {
      front.pause();
      state = "awaitingTaps";
      tapCount = 0;
    };

    try {
      const playPromise = front.play();
      if (playPromise) await playPromise;
    } catch (err) {
      state = "gate";
      gate.hidden = false;
      console.error(err);
    }
  }

  async function goToVideo2() {
    if (state !== "awaitingTaps") return;
    state = "playing2";

    await showNext(VIDEOS[2], {
      loop: false,
      onEnded: () => {
        goToVideo3();
      },
    });

    loadSource(backLayer(), VIDEOS[3]).catch(() => {});
  }

  async function goToVideo3() {
    if (state !== "playing2") return;
    state = "looping3";
    await showNext(VIDEOS[3], { loop: true });
  }

  function onPointerUp(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    if (state === "gate") {
      startExperience();
      return;
    }

    if (state === "awaitingTaps") {
      tapCount += 1;
      if (tapCount >= TAPS_REQUIRED) {
        goToVideo2();
      }
    }
  }

  // Single pointer path avoids double-counting from click + touchend.
  stage.addEventListener("pointerup", onPointerUp);
})();
