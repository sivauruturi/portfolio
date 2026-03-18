
"use strict";

var $body = $("body");

/*===============================================
  1. Page Preloader
===============================================*/
$(window).on("load", function () {
  $body.addClass("loaded");
});

if ($body.attr("data-preloader") === "true") {
  $body.append($("<div class='preloader'><div><span>L</span><span>O</span><span>A</span><span>D</span><span>I</span><span>N</span><span>G</span></div></div>"));
}

/*===============================================
  2. Cursor
===============================================*/
var customCursor = document.getElementById("cursor");

if (customCursor) {
  var cursor = document.getElementById("cursor");
  document.addEventListener('mousemove', function(e) {
    cursor.style.left = e.pageX + 'px';
    cursor.style.top = e.pageY + 'px';
  });

  var mouseElms = document.querySelectorAll("a, button, input, textarea, .cursor-link");

  mouseElms.forEach(function(mouseElm) {
    mouseElm.addEventListener("mouseenter", function() {
      cursor.classList.add("scale-cursor");
    });
    mouseElm.addEventListener("mouseleave", function() {
      cursor.classList.remove("scale-cursor");
    });
  });
}


/*===============================================
  3. Header Nav Menu
===============================================*/
var headerNav = $(".nav-box");

if (headerNav.length) {
  var toggleBtn = $("#nav-toggle");
  var navLinks = headerNav.find(".nav-link");
  var closeMenu = function() {
    headerNav.removeClass("show");
    toggleBtn.removeClass("active");
  };
  //
  // Menu Toggle //
  //
  toggleBtn.on("click", function() {
    if (headerNav.hasClass("show")) {
      closeMenu();
    }
    else {
      headerNav.addClass("show");
      toggleBtn.addClass("active");
    }
  });
  //
  // Navigate To Section //
  //
  navLinks.on("click", function(e) {
    var targetId = $(this).attr("href");
    var $target = targetId ? $(targetId) : $();

    if ($target.length) {
      e.preventDefault();

      var headerHeight = $(".header").outerHeight() || 0;
      var targetTop = $target.offset().top - headerHeight - 16;

      $("html, body").stop().animate({
        scrollTop: Math.max(targetTop, 0)
      }, 450);
    }

    closeMenu();
  });
  //
  // Close Menu //
  //
  $(document).on("click", function(e) {
    if ( $(e.target).closest(".nav-box, #nav-toggle").length === 0 ) {
      if (headerNav.hasClass("show")) {
        closeMenu();
      }
    }
  });
}

/*===============================================
  4. Scroll To Top
===============================================*/
var scrollTopBtn = document.querySelector(".scrolltotop");

if (scrollTopBtn) {
  // Show, Hide //
  window.addEventListener("scroll", function() {
    if (window.pageYOffset > 700) { // 700px from top
      scrollTopBtn.classList.add("show");
    } else {
      scrollTopBtn.classList.remove("show");
    }
  });
}

/*===============================================
  5. Background Audio
===============================================*/
var backgroundAudio = document.getElementById("background-audio");
var backgroundAudioToggle = document.getElementById("background-audio-toggle");
var audioPermissionPrompt = document.getElementById("audio-permission-prompt");
var audioPermissionAllow = document.getElementById("audio-permission-allow");
var audioPermissionDismiss = document.getElementById("audio-permission-dismiss");

if (backgroundAudio && backgroundAudioToggle) {
  var backgroundAudioCanvas = backgroundAudioToggle.querySelector(".jkd-sound-canvas");
  var backgroundAudioCanvasContext = backgroundAudioCanvas ? backgroundAudioCanvas.getContext("2d") : null;
  var audioConsentKey = "portfolio-audio-consent";
  var storedAudioConsent = null;
  var soundToggleAnimationFrame = null;
  var backgroundAudioResumeQueued = false;
  var backgroundAudioResumeEvents = ["pointerdown", "keydown", "touchstart"];
  backgroundAudio.volume = 0.45;
  backgroundAudio.load();

  var getAudioConsentCookie = function() {
    try {
      var cookiePattern = new RegExp("(?:^|; )" + audioConsentKey + "=([^;]*)");
      var cookieMatch = document.cookie.match(cookiePattern);
      return cookieMatch ? window.decodeURIComponent(cookieMatch[1]) : null;
    } catch (error) {
      return null;
    }
  };

  var setAudioConsentCookie = function(value) {
    try {
      document.cookie = audioConsentKey + "=" + window.encodeURIComponent(value) + "; path=/; SameSite=Lax";
    } catch (error) {
      // Ignore cookie errors so audio controls still work.
    }
  };

  var getStoredAudioConsent = function() {
    try {
      return window.sessionStorage.getItem(audioConsentKey) || getAudioConsentCookie();
    } catch (error) {
      return getAudioConsentCookie();
    }
  };

  var setStoredAudioConsent = function(value) {
    setAudioConsentCookie(value);

    try {
      window.sessionStorage.setItem(audioConsentKey, value);
    } catch (error) {
      // Ignore storage errors so audio controls still work.
    }
  };

  var setBackgroundAudioState = function(label, iconClass) {
    backgroundAudioToggle.setAttribute("aria-label", label);
    backgroundAudioToggle.setAttribute("title", label);
  };

  var drawSoundToggle = function(isPlaying, timestamp) {
    if (!backgroundAudioCanvasContext || !backgroundAudioCanvas) {
      return;
    }

    var canvasWidth = backgroundAudioCanvas.width;
    var canvasHeight = backgroundAudioCanvas.height;
    var barWidth = 10;
    var barGap = 8;
    var totalWidth = (barWidth * 5) + (barGap * 4);
    var startX = (canvasWidth - totalWidth) * 0.5;
    var baseY = canvasHeight * 0.5;
    var pausedPattern = [18, 30, 42, 30, 18];

    backgroundAudioCanvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
    backgroundAudioCanvasContext.fillStyle = isPlaying ? "rgba(198, 227, 255, 0.95)" : "rgba(255, 255, 255, 0.65)";

    for (var i = 0; i < 5; i++) {
      var barHeight = pausedPattern[i];

      if (isPlaying) {
        barHeight = 18 + Math.abs(Math.sin((timestamp * 0.008) + (i * 0.9))) * 34;
      }

      var x = startX + (i * (barWidth + barGap));
      var y = baseY - (barHeight * 0.5);
      var radius = barWidth * 0.5;

      backgroundAudioCanvasContext.beginPath();
      backgroundAudioCanvasContext.moveTo(x + radius, y);
      backgroundAudioCanvasContext.lineTo(x + barWidth - radius, y);
      backgroundAudioCanvasContext.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      backgroundAudioCanvasContext.lineTo(x + barWidth, y + barHeight - radius);
      backgroundAudioCanvasContext.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - radius, y + barHeight);
      backgroundAudioCanvasContext.lineTo(x + radius, y + barHeight);
      backgroundAudioCanvasContext.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius);
      backgroundAudioCanvasContext.lineTo(x, y + radius);
      backgroundAudioCanvasContext.quadraticCurveTo(x, y, x + radius, y);
      backgroundAudioCanvasContext.closePath();
      backgroundAudioCanvasContext.fill();
    }
  };

  var animateSoundToggle = function(timestamp) {
    drawSoundToggle(!backgroundAudio.paused, timestamp);

    if (!backgroundAudio.paused) {
      soundToggleAnimationFrame = window.requestAnimationFrame(animateSoundToggle);
    } else {
      soundToggleAnimationFrame = null;
    }
  };

  var refreshSoundToggle = function() {
    if (soundToggleAnimationFrame) {
      window.cancelAnimationFrame(soundToggleAnimationFrame);
      soundToggleAnimationFrame = null;
    }

    if (backgroundAudio.paused) {
      drawSoundToggle(false, 0);
    } else {
      soundToggleAnimationFrame = window.requestAnimationFrame(animateSoundToggle);
    }
  };

  var hideAudioPermissionPrompt = function() {
    if (!audioPermissionPrompt) {
      return;
    }

    audioPermissionPrompt.classList.remove("is-visible");
    audioPermissionPrompt.setAttribute("aria-hidden", "true");
  };

  var showAudioPermissionPrompt = function() {
    if (!audioPermissionPrompt) {
      return;
    }

    audioPermissionPrompt.classList.add("is-visible");
    audioPermissionPrompt.setAttribute("aria-hidden", "false");
  };

  var removeQueuedBackgroundAudioResume = function() {
    backgroundAudioResumeEvents.forEach(function(eventName) {
      document.removeEventListener(eventName, resumeBackgroundAudioFromGesture);
    });
    backgroundAudioResumeQueued = false;
  };

  var resumeBackgroundAudioFromGesture = function() {
    removeQueuedBackgroundAudioResume();

    if (storedAudioConsent === "granted" && backgroundAudio.paused) {
      playBackgroundAudio(false, false);
    }
  };

  var queueBackgroundAudioResume = function() {
    if (backgroundAudioResumeQueued) {
      return;
    }

    backgroundAudioResumeQueued = true;
    backgroundAudioResumeEvents.forEach(function(eventName) {
      document.addEventListener(eventName, resumeBackgroundAudioFromGesture);
    });
  };

  var playBackgroundAudio = function(showPromptOnFailure, queueResumeOnFailure) {
    if (showPromptOnFailure === undefined) {
      showPromptOnFailure = true;
    }

    backgroundAudio.muted = false;
    return backgroundAudio.play().then(function() {
      removeQueuedBackgroundAudioResume();
      syncBackgroundAudioState();
      hideAudioPermissionPrompt();
    }).catch(function() {
      setBackgroundAudioState("Play Music", "bi bi-play-fill");
      syncBackgroundAudioState();

      if (showPromptOnFailure) {
        showAudioPermissionPrompt();
      } else {
        hideAudioPermissionPrompt();
      }

      if (queueResumeOnFailure) {
        queueBackgroundAudioResume();
      }
    });
  };

  var syncBackgroundAudioState = function() {
    if (backgroundAudio.paused) {
      setBackgroundAudioState("Play Music", "bi bi-play-fill");
    } else {
      setBackgroundAudioState("Pause Music", "bi bi-pause-fill");
    }

    refreshSoundToggle();
  };

  backgroundAudioToggle.addEventListener("click", function() {
    if (backgroundAudio.paused) {
      storedAudioConsent = "granted";
      setStoredAudioConsent("granted");
      playBackgroundAudio();
      return;
    }

    backgroundAudio.pause();
    syncBackgroundAudioState();
  });

  if (audioPermissionAllow) {
    audioPermissionAllow.addEventListener("click", function() {
      storedAudioConsent = "granted";
      setStoredAudioConsent("granted");
      playBackgroundAudio();
    });
  }

  if (audioPermissionDismiss) {
    audioPermissionDismiss.addEventListener("click", function() {
      storedAudioConsent = "denied";
      setStoredAudioConsent("denied");
      removeQueuedBackgroundAudioResume();
      backgroundAudio.pause();
      hideAudioPermissionPrompt();
      syncBackgroundAudioState();
    });
  }

  backgroundAudio.addEventListener("play", syncBackgroundAudioState);
  backgroundAudio.addEventListener("pause", syncBackgroundAudioState);

  storedAudioConsent = getStoredAudioConsent();

  if (storedAudioConsent === "granted") {
    hideAudioPermissionPrompt();
    playBackgroundAudio(false, true);
  } else if (storedAudioConsent !== "denied") {
    showAudioPermissionPrompt();
  } else {
    hideAudioPermissionPrompt();
  }

  syncBackgroundAudioState();
}


/*===============================================
  6. Sliders
===============================================*/
var statCounters = document.querySelectorAll(".js-count-up");

if (statCounters.length) {
  var animateCountUp = function(counter) {
    if (counter.dataset.countAnimated === "true") {
      return;
    }

    var target = parseInt(counter.dataset.countTo || "0", 10);
    var suffix = counter.dataset.countSuffix || "";
    var duration = 1400;
    var startTime = null;

    counter.dataset.countAnimated = "true";

    var updateCounter = function(timestamp) {
      if (startTime === null) {
        startTime = timestamp;
      }

      var progress = Math.min((timestamp - startTime) / duration, 1);
      var easedProgress = 1 - Math.pow(1 - progress, 3);
      var currentValue = Math.round(target * easedProgress);

      counter.textContent = currentValue + suffix;

      if (progress < 1) {
        window.requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target + suffix;
      }
    };

    window.requestAnimationFrame(updateCounter);
  };

  if ("IntersectionObserver" in window) {
    var counterObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) {
          return;
        }

        animateCountUp(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.45
    });

    statCounters.forEach(function(counter) {
      counterObserver.observe(counter);
    });
  } else {
    statCounters.forEach(function(counter) {
      animateCountUp(counter);
    });
  }
}

function initLogoLoops() {
  var loops = document.querySelectorAll(".js-logo-loop");
  var smoothTau = 0.25;
  var minCopies = 2;
  var copyHeadroom = 2;
  var reduceMotionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  loops.forEach(function(loop) {
    if (loop.dataset.logoLoopReady === "true") {
      return;
    }

    var track = loop.querySelector(".logo-loop__track");
    var baseList = loop.querySelector(".logo-loop__list");

    if (!track || !baseList) {
      return;
    }

    var state = {
      animationFrame: null,
      lastTimestamp: null,
      offset: 0,
      velocity: 0,
      sequenceWidth: 0,
      isHovered: false,
      refreshFrame: null
    };

    var getSpeedValue = function(attributeName, fallbackValue) {
      var rawValue = Number(loop.getAttribute(attributeName));
      return Number.isFinite(rawValue) ? rawValue : fallbackValue;
    };

    var wrapOffset = function() {
      if (state.sequenceWidth <= 0) {
        state.offset = 0;
        return;
      }

      state.offset = ((state.offset % state.sequenceWidth) + state.sequenceWidth) % state.sequenceWidth;
    };

    var applyTransform = function() {
      track.style.transform = "translate3d(" + (-state.offset) + "px, 0, 0)";
    };

    var clearCopies = function() {
      Array.prototype.slice.call(track.querySelectorAll("[data-logo-loop-copy='true']")).forEach(function(copy) {
        copy.remove();
      });
    };

    var rebuildCopies = function() {
      clearCopies();

      state.sequenceWidth = Math.ceil(baseList.getBoundingClientRect().width);

      if (state.sequenceWidth <= 0) {
        applyTransform();
        return;
      }

      var containerWidth = Math.ceil(loop.clientWidth);
      var copiesNeeded = Math.max(minCopies, Math.ceil(containerWidth / state.sequenceWidth) + copyHeadroom);

      for (var copyIndex = 1; copyIndex < copiesNeeded; copyIndex++) {
        var copy = baseList.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.setAttribute("data-logo-loop-copy", "true");
        track.appendChild(copy);
      }

      wrapOffset();
      applyTransform();
    };

    var scheduleRefresh = function() {
      if (state.refreshFrame !== null) {
        window.cancelAnimationFrame(state.refreshFrame);
      }

      state.refreshFrame = window.requestAnimationFrame(function() {
        state.refreshFrame = null;
        rebuildCopies();
      });
    };

    var animate = function(timestamp) {
      if (state.lastTimestamp === null) {
        state.lastTimestamp = timestamp;
      }

      var deltaTime = Math.max(0, timestamp - state.lastTimestamp) / 1000;
      state.lastTimestamp = timestamp;

      var targetVelocity = reduceMotionQuery && reduceMotionQuery.matches ? 0 : getSpeedValue("data-logo-speed", 88);
      var hoverVelocity = reduceMotionQuery && reduceMotionQuery.matches ? 0 : getSpeedValue("data-logo-hover-speed", 0);
      var activeVelocity = state.isHovered ? hoverVelocity : targetVelocity;
      var easingFactor = 1 - Math.exp(-deltaTime / smoothTau);

      state.velocity += (activeVelocity - state.velocity) * easingFactor;

      if (state.sequenceWidth > 0) {
        state.offset += state.velocity * deltaTime;
        wrapOffset();
        applyTransform();
      }

      state.animationFrame = window.requestAnimationFrame(animate);
    };

    var watchImages = function() {
      Array.prototype.slice.call(baseList.querySelectorAll("img")).forEach(function(image) {
        if (image.complete) {
          return;
        }

        image.addEventListener("load", scheduleRefresh, { once: true });
        image.addEventListener("error", scheduleRefresh, { once: true });
      });
    };

    if (window.ResizeObserver) {
      var resizeObserver = new ResizeObserver(scheduleRefresh);
      resizeObserver.observe(loop);
      resizeObserver.observe(baseList);
    } else {
      window.addEventListener("resize", scheduleRefresh);
    }

    loop.addEventListener("mouseenter", function() {
      state.isHovered = true;
    });

    loop.addEventListener("mouseleave", function() {
      state.isHovered = false;
    });

    watchImages();
    scheduleRefresh();
    state.animationFrame = window.requestAnimationFrame(animate);
    loop.dataset.logoLoopReady = "true";
  });
}

window.addEventListener("load", initLogoLoops);

//
// Portfolio Slider //
//
var swiper = new Swiper(".portfolio-slider", {
  slidesPerView: 1,
  spaceBetween: 30,
  loop: true,
  speed: 500,
  autoplay: {
    delay: 1500,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  breakpoints: {
    640: {
      slidesPerView: 1,
      spaceBetween: 30,
    },
    768: {
      slidesPerView: 2,
      spaceBetween: 30,
    },
    1024: {
      slidesPerView: 2,
      spaceBetween: 50,
    },
    1408: {
       slidesPerView: 2,
       spaceBetween: 60,
    }
  },
  navigation: {
    nextEl: ".swiper-portfolio-next",
    prevEl: ".swiper-portfolio-prev",
  },
  pagination: {
    el: ".swiper-portfolio-pagination",
    clickable: true,
  },
});

//
// Blog Slider //
//
var swiper = new Swiper(".blog-slider", {
  slidesPerView: 1,
  spaceBetween: 24,
  loop: true,
  speed: 700,
  autoplay: {
    delay: 2200,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  breakpoints: {
    640: {
      slidesPerView: 1,
      spaceBetween: 24,
    },
    768: {
      slidesPerView: 2,
      spaceBetween: 30,
    },
    1024: {
      slidesPerView: 2,
      spaceBetween: 50,
    },
  },
  navigation: {
    nextEl: ".swiper-blog-next",
    prevEl: ".swiper-blog-prev",
  },
});

//
// Clients Slider //
//
var swiper = new Swiper(".clients-slider", {
  slidesPerView: 2,
  spaceBetween: 24,
  loop: true,
  speed: 800,
  autoplay: {
    delay: 1800,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  breakpoints: {
    640: {
      slidesPerView: 3,
      spaceBetween: 24,
    },
    768: {
      slidesPerView: 4,
      spaceBetween: 30,
    },
    1024: {
      slidesPerView: 5,
      spaceBetween: 50,
    },
  },
});

//
// Testimonial Slider //
//
var swiper = new Swiper(".testimonial-slider", {
  slidesPerView: 1,
  spaceBetween: 40,
  loop: true,
  speed: 900,
  autoplay: {
    delay: 2000,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  pagination: {
    el: ".swiper-testimonial-pagination",
    type: "progressbar",
  },
});
/*===============================================
  6. Lightbox
===============================================*/
//
// Lightbox - Image //
//
var $lightboxImage = $(".lightbox-image-box");

$lightboxImage.each(function () {
  var $this = $(this);
  $this.magnificPopup({
    type: 'image',
    fixedContentPos: false,
    removalDelay: 200,
    closeOnContentClick: true, 
    image: {
      titleSrc: 'data-image-title'
    }
  });
});

//
// Lightbox - Media //
//
var $lightboxMedia = $(".lightbox-media-box");

$lightboxMedia.each(function() {
  var $this = $(this);
  $this.magnificPopup({
    type: "iframe",
    fixedContentPos: false,
    removalDelay: 200,
    preloader: false,
    iframe: {
      patterns: {
        youtube: {
          index: 'youtube.com/',
          id: 'v=',
          src: '//www.youtube.com/embed/%id%?autoplay=1&rel=0'
        },
          vimeo: {
          index: 'vimeo.com/',
          id: '/',
          src: '//player.vimeo.com/video/%id%?autoplay=1'
        }
      },
      srcAction: "iframe_src" 
    }
  });
});


/*===============================================
  7. Google Maps
===============================================*/
var mapCanvas = $(".gmap");

if (mapCanvas.length) {
  var m,divId,initLatitude, initLongitude, map;

  for (var i = 0; i < mapCanvas.length; i++) {
    m = mapCanvas[i];

    initLatitude = m.dataset["latitude"];
    initLongitude = m.dataset["longitude"];
    divId = "#"+ m["id"];

    map = new GMaps({
      el: divId,
      lat: initLatitude,
      lng: initLongitude,
      zoom: 16,
      scrollwheel: false,
      styles: [
          /* style your map at https://snazzymaps.com/editor and paste JSON here */
      ]
    });

    map.addMarker({
      lat : initLatitude,
      lng : initLongitude
    });
  }
}


/*===============================================
  8. Contact Form
===============================================*/
$("#contactform").on("submit", function(e) {
  var name = $("#name").val();
  var email = $("#email").val();
  var subject = $("#subject").val();
  var message = $("#message").val();

  if (name === "") {
    $("#name").addClass("error-color");
  }
  if (email === "") {
    $("#email").addClass("error-color");
  }
  if (subject === "") {
    $("#subject").addClass("error-color");
  }
  if (message === "") {
    $("#message").addClass("error-color");
  }

  else {
    $.ajax({
      url:"assets/php/contact-form.php",
      data:$(this).serialize(),
      type:"POST",
      success:function(data){
        $("#success").addClass("show-result"); //=== Show Success Message==
        $("#contactform").each(function(){
          this.reset();
        });
      },
      error:function(data){
        $("#error").addClass("show-result"); //===Show Error Message====
      }
    });
    var forms = $("#contactform input, #contactform textarea");
    forms.removeClass("error-color");
  }

  e.preventDefault();
});

/*===============================================
  9. Liquid Ether Background
===============================================*/
(function() {
  var mount = document.getElementById("liquid-ether-overlay");
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!mount || typeof THREE === "undefined") {
    return;
  }

  var effectOptions = {
    mouseForce: 20,
    cursorSize: 80,
    isViscous: false,
    viscous: 30,
    iterationsViscous: 32,
    iterationsPoisson: 32,
    dt: 0.014,
    BFECC: true,
    desktopResolution: 0.5,
    mobileResolution: 0.34,
    resolution: window.innerWidth < 768 ? 0.34 : 0.5,
    isBounce: false,
    colors: ["#a43324", "#ec7f7b", "#2b2b2c"],
    autoDemo: !prefersReducedMotion.matches,
    autoSpeed: 0.5,
    autoIntensity: 2.2,
    takeoverDuration: 0.25,
    autoResumeDelay: 1000,
    autoRampDuration: 0.6
  };

  function makePaletteTexture(stops) {
    var paletteStops;

    if (Array.isArray(stops) && stops.length > 0) {
      paletteStops = stops.length === 1 ? [stops[0], stops[0]] : stops;
    } else {
      paletteStops = ["#ffffff", "#ffffff"];
    }

    var width = paletteStops.length;
    var data = new Uint8Array(width * 4);

    for (var i = 0; i < width; i++) {
      var color = new THREE.Color(paletteStops[i]);
      data[(i * 4) + 0] = Math.round(color.r * 255);
      data[(i * 4) + 1] = Math.round(color.g * 255);
      data[(i * 4) + 2] = Math.round(color.b * 255);
      data[(i * 4) + 3] = 255;
    }

    var texture = new THREE.DataTexture(data, width, 1, THREE.RGBAFormat);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  var faceVertexShader = "\n    precision highp float;\n    attribute vec3 position;\n    uniform vec2 boundarySpace;\n    varying vec2 uv;\n    void main() {\n      vec3 pos = position;\n      vec2 scale = 1.0 - boundarySpace * 2.0;\n      pos.xy = pos.xy * scale;\n      uv = vec2(0.5) + pos.xy * 0.5;\n      gl_Position = vec4(pos, 1.0);\n    }\n  ";
  var lineVertexShader = "\n    precision highp float;\n    attribute vec3 position;\n    uniform vec2 px;\n    varying vec2 uv;\n    void main() {\n      vec3 pos = position;\n      uv = 0.5 + pos.xy * 0.5;\n      vec2 n = sign(pos.xy);\n      pos.xy = abs(pos.xy) - px;\n      pos.xy *= n;\n      gl_Position = vec4(pos, 1.0);\n    }\n  ";
  var mouseVertexShader = "\n    precision highp float;\n    attribute vec3 position;\n    attribute vec2 uv;\n    uniform vec2 center;\n    uniform vec2 scale;\n    uniform vec2 px;\n    varying vec2 vUv;\n    void main() {\n      vec2 pos = position.xy * scale * 2.0 * px + center;\n      vUv = uv;\n      gl_Position = vec4(pos, 0.0, 1.0);\n    }\n  ";
  var advectionFragmentShader = "\n    precision highp float;\n    uniform sampler2D velocity;\n    uniform float dt;\n    uniform bool isBFECC;\n    uniform vec2 fboSize;\n    varying vec2 uv;\n    void main() {\n      vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;\n      if (!isBFECC) {\n        vec2 vel = texture2D(velocity, uv).xy;\n        vec2 uv2 = uv - vel * dt * ratio;\n        vec2 newVel = texture2D(velocity, uv2).xy;\n        gl_FragColor = vec4(newVel, 0.0, 0.0);\n      } else {\n        vec2 spotNew = uv;\n        vec2 velOld = texture2D(velocity, uv).xy;\n        vec2 spotOld = spotNew - velOld * dt * ratio;\n        vec2 velNew = texture2D(velocity, spotOld).xy;\n        vec2 spotNew2 = spotOld + velNew * dt * ratio;\n        vec2 error = spotNew2 - spotNew;\n        vec2 spotNew3 = spotNew - error * 0.5;\n        vec2 vel2 = texture2D(velocity, spotNew3).xy;\n        vec2 spotOld2 = spotNew3 - vel2 * dt * ratio;\n        vec2 newVel2 = texture2D(velocity, spotOld2).xy;\n        gl_FragColor = vec4(newVel2, 0.0, 0.0);\n      }\n    }\n  ";
  var colorFragmentShader = "\n    precision highp float;\n    uniform sampler2D velocity;\n    uniform sampler2D palette;\n    uniform vec4 bgColor;\n    varying vec2 uv;\n    void main() {\n      vec2 vel = texture2D(velocity, uv).xy;\n      float strength = clamp(length(vel), 0.0, 1.0);\n      vec3 color = texture2D(palette, vec2(strength, 0.5)).rgb;\n      vec3 rgb = mix(bgColor.rgb, color, strength);\n      float alpha = mix(bgColor.a, 1.0, strength);\n      gl_FragColor = vec4(rgb, alpha);\n    }\n  ";
  var divergenceFragmentShader = "\n    precision highp float;\n    uniform sampler2D velocity;\n    uniform float dt;\n    uniform vec2 px;\n    varying vec2 uv;\n    void main() {\n      float x0 = texture2D(velocity, uv - vec2(px.x, 0.0)).x;\n      float x1 = texture2D(velocity, uv + vec2(px.x, 0.0)).x;\n      float y0 = texture2D(velocity, uv - vec2(0.0, px.y)).y;\n      float y1 = texture2D(velocity, uv + vec2(0.0, px.y)).y;\n      float divergence = (x1 - x0 + y1 - y0) * 0.5;\n      gl_FragColor = vec4(divergence / dt);\n    }\n  ";
  var externalForceFragmentShader = "\n    precision highp float;\n    uniform vec2 force;\n    varying vec2 vUv;\n    void main() {\n      vec2 circle = (vUv - 0.5) * 2.0;\n      float d = 1.0 - min(length(circle), 1.0);\n      d *= d;\n      gl_FragColor = vec4(force * d, 0.0, 1.0);\n    }\n  ";
  var poissonFragmentShader = "\n    precision highp float;\n    uniform sampler2D pressure;\n    uniform sampler2D divergence;\n    uniform vec2 px;\n    varying vec2 uv;\n    void main() {\n      float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;\n      float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;\n      float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;\n      float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;\n      float div = texture2D(divergence, uv).r;\n      float nextPressure = (p0 + p1 + p2 + p3) * 0.25 - div;\n      gl_FragColor = vec4(nextPressure);\n    }\n  ";
  var pressureFragmentShader = "\n    precision highp float;\n    uniform sampler2D pressure;\n    uniform sampler2D velocity;\n    uniform vec2 px;\n    uniform float dt;\n    varying vec2 uv;\n    void main() {\n      float p0 = texture2D(pressure, uv + vec2(px.x, 0.0)).r;\n      float p1 = texture2D(pressure, uv - vec2(px.x, 0.0)).r;\n      float p2 = texture2D(pressure, uv + vec2(0.0, px.y)).r;\n      float p3 = texture2D(pressure, uv - vec2(0.0, px.y)).r;\n      vec2 vel = texture2D(velocity, uv).xy;\n      vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;\n      gl_FragColor = vec4(vel - gradP * dt, 0.0, 1.0);\n    }\n  ";
  var viscousFragmentShader = "\n    precision highp float;\n    uniform sampler2D velocity;\n    uniform sampler2D velocity_new;\n    uniform float v;\n    uniform vec2 px;\n    uniform float dt;\n    varying vec2 uv;\n    void main() {\n      vec2 oldVel = texture2D(velocity, uv).xy;\n      vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0.0)).xy;\n      vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0.0)).xy;\n      vec2 new2 = texture2D(velocity_new, uv + vec2(0.0, px.y * 2.0)).xy;\n      vec2 new3 = texture2D(velocity_new, uv - vec2(0.0, px.y * 2.0)).xy;\n      vec2 nextVel = 4.0 * oldVel + v * dt * (new0 + new1 + new2 + new3);\n      nextVel /= 4.0 * (1.0 + v * dt);\n      gl_FragColor = vec4(nextVel, 0.0, 0.0);\n    }\n  ";

  function ShaderPass(props) {
    this.props = props || {};
    this.uniforms = this.props.material ? this.props.material.uniforms : null;
    this.scene = null;
    this.camera = null;
    this.material = null;
    this.geometry = null;
    this.plane = null;
  }

  ShaderPass.prototype.init = function(common) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.common = common;

    if (!this.uniforms) {
      return;
    }

    this.material = new THREE.RawShaderMaterial(this.props.material);
    this.geometry = new THREE.PlaneGeometry(2.0, 2.0);
    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.plane);
  };

  ShaderPass.prototype.update = function() {
    this.common.renderer.setRenderTarget(this.props.output || null);
    this.common.renderer.render(this.scene, this.camera);
    this.common.renderer.setRenderTarget(null);
  };

  function Advection(common, simProps) {
    ShaderPass.call(this, {
      material: {
        vertexShader: faceVertexShader,
        fragmentShader: advectionFragmentShader,
        uniforms: {
          boundarySpace: { value: simProps.cellScale },
          px: { value: simProps.cellScale },
          fboSize: { value: simProps.fboSize },
          velocity: { value: simProps.src.texture },
          dt: { value: simProps.dt },
          isBFECC: { value: true }
        }
      },
      output: simProps.dst
    });
    this.init(common);
    this.createBoundary();
  }

  Advection.prototype = Object.create(ShaderPass.prototype);
  Advection.prototype.constructor = Advection;
  Advection.prototype.createBoundary = function() {
    var boundaryGeometry = new THREE.BufferGeometry();
    var boundaryVertices = new Float32Array([
      -1, -1, 0, -1, 1, 0,
      -1, 1, 0, 1, 1, 0,
      1, 1, 0, 1, -1, 0,
      1, -1, 0, -1, -1, 0
    ]);
    boundaryGeometry.setAttribute("position", new THREE.BufferAttribute(boundaryVertices, 3));
    var boundaryMaterial = new THREE.RawShaderMaterial({
      vertexShader: lineVertexShader,
      fragmentShader: advectionFragmentShader,
      uniforms: this.uniforms
    });
    this.line = new THREE.LineSegments(boundaryGeometry, boundaryMaterial);
    this.scene.add(this.line);
  };
  Advection.prototype.updatePass = function(props) {
    this.uniforms.dt.value = props.dt;
    this.uniforms.isBFECC.value = props.BFECC;
    this.line.visible = props.isBounce;
    ShaderPass.prototype.update.call(this);
  };

  function ExternalForce(common, simProps, mouse) {
    ShaderPass.call(this, { output: simProps.dst });
    this.mouse = mouse;
    this.init(common);

    var mouseGeometry = new THREE.PlaneGeometry(1, 1);
    var mouseMaterial = new THREE.RawShaderMaterial({
      vertexShader: mouseVertexShader,
      fragmentShader: externalForceFragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      uniforms: {
        px: { value: simProps.cellScale },
        force: { value: new THREE.Vector2(0, 0) },
        center: { value: new THREE.Vector2(0, 0) },
        scale: { value: new THREE.Vector2(simProps.cursor_size, simProps.cursor_size) }
      }
    });

    this.mouseMesh = new THREE.Mesh(mouseGeometry, mouseMaterial);
    this.scene.add(this.mouseMesh);
  }

  ExternalForce.prototype = Object.create(ShaderPass.prototype);
  ExternalForce.prototype.constructor = ExternalForce;
  ExternalForce.prototype.updatePass = function(props) {
    var forceX = (this.mouse.diff.x * 0.5) * props.mouse_force;
    var forceY = (this.mouse.diff.y * 0.5) * props.mouse_force;
    var cursorSizeX = props.cursor_size * props.cellScale.x;
    var cursorSizeY = props.cursor_size * props.cellScale.y;
    var centerX = Math.min(Math.max(this.mouse.coords.x, -1 + cursorSizeX + props.cellScale.x * 2), 1 - cursorSizeX - props.cellScale.x * 2);
    var centerY = Math.min(Math.max(this.mouse.coords.y, -1 + cursorSizeY + props.cellScale.y * 2), 1 - cursorSizeY - props.cellScale.y * 2);
    var uniforms = this.mouseMesh.material.uniforms;

    uniforms.force.value.set(forceX, forceY);
    uniforms.center.value.set(centerX, centerY);
    uniforms.scale.value.set(props.cursor_size, props.cursor_size);
    ShaderPass.prototype.update.call(this);
  };

  function Viscous(common, simProps) {
    ShaderPass.call(this, {
      material: {
        vertexShader: faceVertexShader,
        fragmentShader: viscousFragmentShader,
        uniforms: {
          boundarySpace: { value: simProps.boundarySpace },
          velocity: { value: simProps.src.texture },
          velocity_new: { value: simProps.dst_.texture },
          v: { value: simProps.viscous },
          px: { value: simProps.cellScale },
          dt: { value: simProps.dt }
        }
      },
      output: simProps.dst,
      output0: simProps.dst_,
      output1: simProps.dst
    });
    this.init(common);
  }

  Viscous.prototype = Object.create(ShaderPass.prototype);
  Viscous.prototype.constructor = Viscous;
  Viscous.prototype.updatePass = function(props) {
    var inputTarget;
    var outputTarget;

    this.uniforms.v.value = props.viscous;

    for (var i = 0; i < props.iterations; i++) {
      if (i % 2 === 0) {
        inputTarget = this.props.output0;
        outputTarget = this.props.output1;
      } else {
        inputTarget = this.props.output1;
        outputTarget = this.props.output0;
      }

      this.uniforms.velocity_new.value = inputTarget.texture;
      this.props.output = outputTarget;
      this.uniforms.dt.value = props.dt;
      ShaderPass.prototype.update.call(this);
    }

    return outputTarget;
  };

  function Divergence(common, simProps) {
    ShaderPass.call(this, {
      material: {
        vertexShader: faceVertexShader,
        fragmentShader: divergenceFragmentShader,
        uniforms: {
          boundarySpace: { value: simProps.boundarySpace },
          velocity: { value: simProps.src.texture },
          px: { value: simProps.cellScale },
          dt: { value: simProps.dt }
        }
      },
      output: simProps.dst
    });
    this.init(common);
  }

  Divergence.prototype = Object.create(ShaderPass.prototype);
  Divergence.prototype.constructor = Divergence;
  Divergence.prototype.updatePass = function(props) {
    this.uniforms.velocity.value = props.vel.texture;
    ShaderPass.prototype.update.call(this);
  };

  function Poisson(common, simProps) {
    ShaderPass.call(this, {
      material: {
        vertexShader: faceVertexShader,
        fragmentShader: poissonFragmentShader,
        uniforms: {
          boundarySpace: { value: simProps.boundarySpace },
          pressure: { value: simProps.dst_.texture },
          divergence: { value: simProps.src.texture },
          px: { value: simProps.cellScale }
        }
      },
      output: simProps.dst,
      output0: simProps.dst_,
      output1: simProps.dst
    });
    this.init(common);
  }

  Poisson.prototype = Object.create(ShaderPass.prototype);
  Poisson.prototype.constructor = Poisson;
  Poisson.prototype.updatePass = function(props) {
    var inputTarget;
    var outputTarget;

    for (var i = 0; i < props.iterations; i++) {
      if (i % 2 === 0) {
        inputTarget = this.props.output0;
        outputTarget = this.props.output1;
      } else {
        inputTarget = this.props.output1;
        outputTarget = this.props.output0;
      }

      this.uniforms.pressure.value = inputTarget.texture;
      this.props.output = outputTarget;
      ShaderPass.prototype.update.call(this);
    }

    return outputTarget;
  };

  function Pressure(common, simProps) {
    ShaderPass.call(this, {
      material: {
        vertexShader: faceVertexShader,
        fragmentShader: pressureFragmentShader,
        uniforms: {
          boundarySpace: { value: simProps.boundarySpace },
          pressure: { value: simProps.src_p.texture },
          velocity: { value: simProps.src_v.texture },
          px: { value: simProps.cellScale },
          dt: { value: simProps.dt }
        }
      },
      output: simProps.dst
    });
    this.init(common);
  }

  Pressure.prototype = Object.create(ShaderPass.prototype);
  Pressure.prototype.constructor = Pressure;
  Pressure.prototype.updatePass = function(props) {
    this.uniforms.velocity.value = props.vel.texture;
    this.uniforms.pressure.value = props.pressure.texture;
    ShaderPass.prototype.update.call(this);
  };

  function MouseState(container) {
    this.container = container;
    this.mouseMoved = false;
    this.coords = new THREE.Vector2();
    this.coordsOld = new THREE.Vector2();
    this.diff = new THREE.Vector2();
    this.timer = null;
    this.isHoverInside = false;
    this.hasUserControl = false;
    this.isAutoActive = false;
    this.autoIntensity = effectOptions.autoIntensity;
    this.takeoverActive = false;
    this.takeoverStartTime = 0;
    this.takeoverDuration = effectOptions.takeoverDuration;
    this.takeoverFrom = new THREE.Vector2();
    this.takeoverTo = new THREE.Vector2();
    this.onInteract = null;
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleWindowLeave = this.handleWindowLeave.bind(this);
  }

  MouseState.prototype.init = function() {
    window.addEventListener("mousemove", this.handleMouseMove, { passive: true });
    window.addEventListener("touchstart", this.handleTouchStart, { passive: true });
    window.addEventListener("touchmove", this.handleTouchMove, { passive: true });
    window.addEventListener("touchend", this.handleTouchEnd, { passive: true });
    document.addEventListener("mouseleave", this.handleWindowLeave);
  };

  MouseState.prototype.dispose = function() {
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("touchstart", this.handleTouchStart);
    window.removeEventListener("touchmove", this.handleTouchMove);
    window.removeEventListener("touchend", this.handleTouchEnd);
    document.removeEventListener("mouseleave", this.handleWindowLeave);

    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  };

  MouseState.prototype.isPointInside = function(clientX, clientY) {
    var rect = this.container.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 && clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  };

  MouseState.prototype.updateHoverState = function(clientX, clientY) {
    this.isHoverInside = this.isPointInside(clientX, clientY);
    return this.isHoverInside;
  };

  MouseState.prototype.setCoords = function(clientX, clientY) {
    var rect = this.container.getBoundingClientRect();

    if (!rect.width || !rect.height) {
      return;
    }

    if (this.timer) {
      window.clearTimeout(this.timer);
    }

    var nx = (clientX - rect.left) / rect.width;
    var ny = (clientY - rect.top) / rect.height;

    this.coords.set((nx * 2) - 1, -((ny * 2) - 1));
    this.mouseMoved = true;
    this.timer = window.setTimeout(function(scope) {
      scope.mouseMoved = false;
    }, 100, this);
  };

  MouseState.prototype.setNormalized = function(nx, ny) {
    this.coords.set(nx, ny);
    this.mouseMoved = true;
  };

  MouseState.prototype.handleMouseMove = function(event) {
    if (!this.updateHoverState(event.clientX, event.clientY)) {
      return;
    }

    if (this.onInteract) {
      this.onInteract();
    }

    if (this.isAutoActive && !this.hasUserControl && !this.takeoverActive) {
      var rect = this.container.getBoundingClientRect();

      if (!rect.width || !rect.height) {
        return;
      }

      var nx = (event.clientX - rect.left) / rect.width;
      var ny = (event.clientY - rect.top) / rect.height;
      this.takeoverFrom.copy(this.coords);
      this.takeoverTo.set((nx * 2) - 1, -((ny * 2) - 1));
      this.takeoverStartTime = performance.now();
      this.takeoverActive = true;
      this.hasUserControl = true;
      this.isAutoActive = false;
      return;
    }

    this.setCoords(event.clientX, event.clientY);
    this.hasUserControl = true;
  };

  MouseState.prototype.handleTouchStart = function(event) {
    if (event.touches.length !== 1) {
      return;
    }

    var touch = event.touches[0];

    if (!this.updateHoverState(touch.clientX, touch.clientY)) {
      return;
    }

    if (this.onInteract) {
      this.onInteract();
    }

    this.setCoords(touch.clientX, touch.clientY);
    this.hasUserControl = true;
  };

  MouseState.prototype.handleTouchMove = function(event) {
    if (event.touches.length !== 1) {
      return;
    }

    var touch = event.touches[0];

    if (!this.updateHoverState(touch.clientX, touch.clientY)) {
      return;
    }

    if (this.onInteract) {
      this.onInteract();
    }

    this.setCoords(touch.clientX, touch.clientY);
  };

  MouseState.prototype.handleTouchEnd = function() {
    this.isHoverInside = false;
  };

  MouseState.prototype.handleWindowLeave = function() {
    this.isHoverInside = false;
  };

  MouseState.prototype.update = function() {
    if (this.takeoverActive) {
      var takeoverProgress = (performance.now() - this.takeoverStartTime) / (this.takeoverDuration * 1000);

      if (takeoverProgress >= 1) {
        this.takeoverActive = false;
        this.coords.copy(this.takeoverTo);
        this.coordsOld.copy(this.coords);
        this.diff.set(0, 0);
      } else {
        var eased = takeoverProgress * takeoverProgress * (3 - (2 * takeoverProgress));
        this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo, eased);
      }
    }

    this.diff.subVectors(this.coords, this.coordsOld);
    this.coordsOld.copy(this.coords);

    if (this.coordsOld.x === 0 && this.coordsOld.y === 0) {
      this.diff.set(0, 0);
    }

    if (this.isAutoActive && !this.takeoverActive) {
      this.diff.multiplyScalar(this.autoIntensity);
    }
  };

  function AutoDriver(mouse, manager, options) {
    this.mouse = mouse;
    this.manager = manager;
    this.enabled = options.enabled;
    this.speed = options.speed;
    this.resumeDelay = options.resumeDelay;
    this.rampDurationMs = options.rampDuration * 1000;
    this.active = false;
    this.current = new THREE.Vector2(0, 0);
    this.target = new THREE.Vector2();
    this.lastTime = performance.now();
    this.activationTime = 0;
    this.margin = 0.2;
    this.direction = new THREE.Vector2();
    this.pickNewTarget();
  }

  AutoDriver.prototype.pickNewTarget = function() {
    this.target.set((Math.random() * 2 - 1) * (1 - this.margin), (Math.random() * 2 - 1) * (1 - this.margin));
  };

  AutoDriver.prototype.forceStop = function() {
    this.active = false;
    this.mouse.isAutoActive = false;
  };

  AutoDriver.prototype.update = function() {
    if (!this.enabled) {
      return;
    }

    var now = performance.now();
    var idleTime = now - this.manager.lastUserInteraction;

    if (idleTime < this.resumeDelay || this.mouse.isHoverInside) {
      if (this.active) {
        this.forceStop();
      }
      return;
    }

    if (!this.active) {
      this.active = true;
      this.current.copy(this.mouse.coords);
      this.lastTime = now;
      this.activationTime = now;
    }

    this.mouse.isAutoActive = true;

    var deltaSeconds = (now - this.lastTime) / 1000;
    this.lastTime = now;

    if (deltaSeconds > 0.2) {
      deltaSeconds = 0.016;
    }

    var direction = this.direction.subVectors(this.target, this.current);
    var distance = direction.length();

    if (distance < 0.01) {
      this.pickNewTarget();
      return;
    }

    direction.normalize();

    var ramp = 1;
    if (this.rampDurationMs > 0) {
      var rampProgress = Math.min(1, (now - this.activationTime) / this.rampDurationMs);
      ramp = rampProgress * rampProgress * (3 - (2 * rampProgress));
    }

    var step = this.speed * deltaSeconds * ramp;
    this.current.addScaledVector(direction, Math.min(step, distance));
    this.mouse.setNormalized(this.current.x, this.current.y);
  };

  function CommonState(container) {
    this.container = container;
    this.width = 1;
    this.height = 1;
    this.aspect = 1;
    this.pixelRatio = 1;
    this.time = 0;
    this.delta = 0;
    this.renderer = null;
    this.clock = null;
  }

  CommonState.prototype.init = function() {
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    this.renderer.autoClear = false;
    this.renderer.setClearColor(new THREE.Color(0x000000), 0);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.clock = new THREE.Clock();
  };

  CommonState.prototype.resize = function() {
    var rect = this.container.getBoundingClientRect();
    this.width = Math.max(1, Math.floor(rect.width));
    this.height = Math.max(1, Math.floor(rect.height));
    this.aspect = this.width / this.height;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    if (this.renderer) {
      this.renderer.setPixelRatio(this.pixelRatio);
      this.renderer.setSize(this.width, this.height, false);
    }
  };

  CommonState.prototype.update = function() {
    if (!this.clock) {
      return;
    }

    this.delta = Math.min(this.clock.getDelta(), 0.033);
    this.time += this.delta;
  };

  function Simulation(common, mouse, options) {
    this.common = common;
    this.mouse = mouse;
    this.options = {
      iterations_poisson: options.iterationsPoisson,
      iterations_viscous: options.iterationsViscous,
      mouse_force: options.mouseForce,
      resolution: options.resolution,
      cursor_size: options.cursorSize,
      viscous: options.viscous,
      isBounce: options.isBounce,
      dt: options.dt,
      isViscous: options.isViscous,
      BFECC: options.BFECC
    };
    this.fbos = {
      vel_0: null,
      vel_1: null,
      vel_viscous0: null,
      vel_viscous1: null,
      div: null,
      pressure_0: null,
      pressure_1: null
    };
    this.fboSize = new THREE.Vector2();
    this.cellScale = new THREE.Vector2();
    this.boundarySpace = new THREE.Vector2();
    this.zeroBoundary = new THREE.Vector2(0, 0);
    this.init();
  }

  Simulation.prototype.getFloatType = function() {
    return /(iPad|iPhone|iPod)/i.test(navigator.userAgent) ? THREE.HalfFloatType : THREE.FloatType;
  };

  Simulation.prototype.calcSize = function() {
    var width = Math.max(1, Math.round(this.options.resolution * this.common.width));
    var height = Math.max(1, Math.round(this.options.resolution * this.common.height));
    this.cellScale.set(1 / width, 1 / height);
    this.fboSize.set(width, height);
  };

  Simulation.prototype.createAllFBO = function() {
    var type = this.getFloatType();
    var renderTargetOptions = {
      type: type,
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping
    };

    for (var key in this.fbos) {
      if (Object.prototype.hasOwnProperty.call(this.fbos, key)) {
        this.fbos[key] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, renderTargetOptions);
      }
    }
  };

  Simulation.prototype.clearAllFBO = function() {
    var currentTarget = this.common.renderer.getRenderTarget();

    for (var key in this.fbos) {
      if (Object.prototype.hasOwnProperty.call(this.fbos, key) && this.fbos[key]) {
        this.common.renderer.setRenderTarget(this.fbos[key]);
        this.common.renderer.clear();
      }
    }

    this.common.renderer.setRenderTarget(currentTarget);
  };

  Simulation.prototype.createShaderPasses = function() {
    this.advection = new Advection(this.common, {
      cellScale: this.cellScale,
      fboSize: this.fboSize,
      dt: this.options.dt,
      src: this.fbos.vel_0,
      dst: this.fbos.vel_1
    });
    this.externalForce = new ExternalForce(this.common, {
      cellScale: this.cellScale,
      cursor_size: this.options.cursor_size,
      dst: this.fbos.vel_1
    }, this.mouse);
    this.viscous = new Viscous(this.common, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      viscous: this.options.viscous,
      src: this.fbos.vel_1,
      dst: this.fbos.vel_viscous1,
      dst_: this.fbos.vel_viscous0,
      dt: this.options.dt
    });
    this.divergence = new Divergence(this.common, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      src: this.fbos.vel_viscous0,
      dst: this.fbos.div,
      dt: this.options.dt
    });
    this.poisson = new Poisson(this.common, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      src: this.fbos.div,
      dst: this.fbos.pressure_1,
      dst_: this.fbos.pressure_0
    });
    this.pressure = new Pressure(this.common, {
      cellScale: this.cellScale,
      boundarySpace: this.boundarySpace,
      src_p: this.fbos.pressure_0,
      src_v: this.fbos.vel_viscous0,
      dst: this.fbos.vel_0,
      dt: this.options.dt
    });
  };

  Simulation.prototype.init = function() {
    this.calcSize();
    this.createAllFBO();
    this.clearAllFBO();
    this.createShaderPasses();
  };

  Simulation.prototype.resize = function() {
    this.calcSize();

    for (var key in this.fbos) {
      if (Object.prototype.hasOwnProperty.call(this.fbos, key) && this.fbos[key]) {
        this.fbos[key].setSize(this.fboSize.x, this.fboSize.y);
      }
    }

    this.clearAllFBO();
  };

  Simulation.prototype.update = function() {
    this.boundarySpace.copy(this.options.isBounce ? this.zeroBoundary : this.cellScale);

    this.advection.updatePass({
      dt: this.options.dt,
      isBounce: this.options.isBounce,
      BFECC: this.options.BFECC
    });

    this.externalForce.updatePass({
      cursor_size: this.options.cursor_size,
      mouse_force: this.options.mouse_force,
      cellScale: this.cellScale
    });

    var velocity = this.fbos.vel_1;

    if (this.options.isViscous) {
      velocity = this.viscous.updatePass({
        viscous: this.options.viscous,
        iterations: this.options.iterations_viscous,
        dt: this.options.dt
      });
    }

    this.divergence.updatePass({ vel: velocity });
    var pressure = this.poisson.updatePass({ iterations: this.options.iterations_poisson });
    this.pressure.updatePass({ vel: velocity, pressure: pressure });
  };

  function OutputLayer(common, mouse, options, paletteTexture) {
    this.common = common;
    this.mouse = mouse;
    this.simulation = new Simulation(common, mouse, options);
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    this.output = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.RawShaderMaterial({
        vertexShader: faceVertexShader,
        fragmentShader: colorFragmentShader,
        depthWrite: false,
        uniforms: {
          velocity: { value: this.simulation.fbos.vel_0.texture },
          boundarySpace: { value: new THREE.Vector2() },
          palette: { value: paletteTexture },
          bgColor: { value: new THREE.Vector4(0, 0, 0, 0) }
        }
      })
    );
    this.scene.add(this.output);
  }

  OutputLayer.prototype.resize = function() {
    this.simulation.resize();
  };

  OutputLayer.prototype.render = function() {
    this.common.renderer.setRenderTarget(null);
    this.common.renderer.clear();
    this.common.renderer.render(this.scene, this.camera);
  };

  OutputLayer.prototype.update = function() {
    this.simulation.update();
    this.render();
  };

  function WebGLManager(container, options) {
    this.container = container;
    this.options = options;
    this.common = new CommonState(container);
    this.common.init();
    this.mouse = new MouseState(container);
    this.mouse.init();
    this.mouse.autoIntensity = options.autoIntensity;
    this.mouse.takeoverDuration = options.takeoverDuration;
    this.paletteTexture = makePaletteTexture(options.colors);
    this.lastUserInteraction = performance.now();
    this.output = null;
    this.autoDriver = null;
    this.running = false;
    this.animationFrame = null;

    this.handleResize = this.handleResize.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleMotionPreference = this.handleMotionPreference.bind(this);
    this.loop = this.loop.bind(this);

    this.mouse.onInteract = function(scope) {
      scope.lastUserInteraction = performance.now();
      if (scope.autoDriver) {
        scope.autoDriver.forceStop();
      }
    }.bind(null, this);

    this.output = new OutputLayer(this.common, this.mouse, options, this.paletteTexture);
    this.autoDriver = new AutoDriver(this.mouse, this, {
      enabled: options.autoDemo,
      speed: options.autoSpeed,
      resumeDelay: options.autoResumeDelay,
      rampDuration: options.autoRampDuration
    });

    this.container.prepend(this.common.renderer.domElement);
    window.addEventListener("resize", this.handleResize, { passive: true });
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    if (prefersReducedMotion.addEventListener) {
      prefersReducedMotion.addEventListener("change", this.handleMotionPreference);
    } else if (prefersReducedMotion.addListener) {
      prefersReducedMotion.addListener(this.handleMotionPreference);
    }
  }

  WebGLManager.prototype.handleResize = function() {
    if (window.innerWidth < 768) {
      this.output.simulation.options.resolution = effectOptions.mobileResolution;
    } else {
      this.output.simulation.options.resolution = effectOptions.desktopResolution;
    }

    this.common.resize();
    this.output.resize();
  };

  WebGLManager.prototype.handleVisibilityChange = function() {
    if (document.hidden) {
      this.pause();
    } else {
      this.start();
    }
  };

  WebGLManager.prototype.handleMotionPreference = function() {
    this.autoDriver.enabled = !prefersReducedMotion.matches && this.options.autoDemo;

    if (prefersReducedMotion.matches) {
      this.autoDriver.forceStop();
    }
  };

  WebGLManager.prototype.render = function() {
    if (this.autoDriver) {
      this.autoDriver.update();
    }

    this.mouse.update();
    this.common.update();
    this.output.update();
  };

  WebGLManager.prototype.loop = function() {
    if (!this.running) {
      return;
    }

    this.render();
    this.animationFrame = window.requestAnimationFrame(this.loop);
  };

  WebGLManager.prototype.start = function() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.loop();
  };

  WebGLManager.prototype.pause = function() {
    this.running = false;

    if (this.animationFrame) {
      window.cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  };

  WebGLManager.prototype.dispose = function() {
    this.pause();
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);

    if (prefersReducedMotion.removeEventListener) {
      prefersReducedMotion.removeEventListener("change", this.handleMotionPreference);
    } else if (prefersReducedMotion.removeListener) {
      prefersReducedMotion.removeListener(this.handleMotionPreference);
    }

    this.mouse.dispose();

    if (this.paletteTexture) {
      this.paletteTexture.dispose();
    }

    if (this.common.renderer) {
      if (this.common.renderer.domElement && this.common.renderer.domElement.parentNode) {
        this.common.renderer.domElement.parentNode.removeChild(this.common.renderer.domElement);
      }
      this.common.renderer.dispose();
      if (typeof this.common.renderer.forceContextLoss === "function") {
        this.common.renderer.forceContextLoss();
      }
    }
  };

  try {
    mount.style.position = "fixed";
    mount.style.overflow = "hidden";

    var liquidEther = new WebGLManager(mount, effectOptions);
    liquidEther.start();
  } catch (error) {
    // Fail silently so the rest of the portfolio still loads if WebGL is unavailable.
  }
})();

/*===============================================
  10. Portfolio Assistant
===============================================*/
(function() {
  var assistantRoot = document.getElementById("portfolio-assistant-root");

  if (!assistantRoot) {
    return;
  }

  var toggleButton = document.getElementById("portfolio-assistant-toggle");
  var panel = document.getElementById("portfolio-assistant-panel");
  var closeButton = document.getElementById("portfolio-assistant-close");
  var form = document.getElementById("portfolio-assistant-form");
  var input = document.getElementById("portfolio-assistant-input");
  var messages = document.getElementById("portfolio-assistant-messages");
  var quickReplyButtons = assistantRoot.querySelectorAll("[data-chatbot-prompt]");
  var typingMessage = null;

  document.body.classList.add("portfolio-assistant-enabled");

  var assistantFallbackContact = {
    email: "connect@sivauruturi.com",
    phonePrimary: "+1 (605) 671-9582"
  };
  var localApiOrigin = "http://localhost:3001";
  var portfolioAssistantData = {
    sourceUrl: "",
    updatedAt: "",
    rawText: "",
    profile: {},
    contact: {},
    experience: [],
    skills: [],
    skillsByCategory: {},
    education: null,
    certifications: [],
    achievements: [],
    projects: [],
    resumeUrl: ""
  };

  function toAbsoluteApiUrl(value) {
    var rawValue = String(value || "").trim();

    if (!rawValue) {
      return "";
    }

    if (/^https?:\/\//i.test(rawValue)) {
      return rawValue;
    }

    if (rawValue.charAt(0) === "/") {
      if (
        window.location.protocol === "file:" ||
        window.location.origin === "null" ||
        window.location.origin.indexOf("localhost:3001") === -1
      ) {
        return localApiOrigin + rawValue;
      }

      return window.location.origin + rawValue;
    }

    return rawValue;
  }

  var globalAssistantConfig = window.portfolioAssistantConfig || {};
  var portfolioAssistantConfig = {
    resumeDataUrl: toAbsoluteApiUrl(globalAssistantConfig.resumeDataUrl || assistantRoot.getAttribute("data-resume-api-url") || ""),
    resumeRefreshMs: Number(globalAssistantConfig.resumeRefreshMs || 300000),
    requestHeaders: {
      "Content-Type": "application/json"
    }
  };
  var resumeState = {
    loadedAt: 0,
    isLoading: false,
    promise: null
  };
  var resumeStopWords = {
    a: true,
    an: true,
    and: true,
    are: true,
    about: true,
    can: true,
    did: true,
    does: true,
    for: true,
    from: true,
    has: true,
    have: true,
    he: true,
    her: true,
    his: true,
    i: true,
    is: true,
    me: true,
    tell: true,
    the: true,
    their: true,
    them: true,
    what: true,
    where: true,
    with: true,
    you: true,
    siva: true,
    uruturi: true
  };
  var resumeKeywordAliases = {
    skill: ["skills", "tools", "technical"],
    skills: ["tools", "technical", "design"],
    tool: ["tools", "figma", "sketch"],
    tools: ["figma", "sketch", "adobe"],
    work: ["experience", "company", "role"],
    worked: ["experience", "company", "role"],
    experience: ["company", "role"],
    education: ["degree", "university", "master"],
    achievements: ["impact", "improved", "conversion"],
    achievement: ["impact", "improved", "conversion"],
    contact: ["email", "phone"],
    reach: ["email", "phone"]
  };

  function uniqueList(values) {
    return values.filter(function(value, index, array) {
      return value && array.indexOf(value) === index;
    });
  }

  function toArray(value) {
    return Array.isArray(value) ? value.filter(Boolean) : [];
  }

  function normalizeUserMessage(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeResumePayload(resumeData) {
    if (!resumeData) {
      return null;
    }

    if (typeof resumeData === "string") {
      return {
        rawText: resumeData
      };
    }

    if (typeof resumeData !== "object") {
      return null;
    }

    return resumeData;
  }

  function mergeResumeData(resumeData) {
    var normalizedResumeData = normalizeResumePayload(resumeData);

    if (!normalizedResumeData) {
      return false;
    }

    portfolioAssistantData.sourceUrl = String(normalizedResumeData.sourceUrl || "");
    portfolioAssistantData.updatedAt = String(normalizedResumeData.updatedAt || "");
    portfolioAssistantData.rawText = String(normalizedResumeData.rawText || "");
    portfolioAssistantData.profile = normalizedResumeData.profile || {};
    portfolioAssistantData.contact = normalizedResumeData.contact || {};
    portfolioAssistantData.experience = toArray(normalizedResumeData.experience);
    portfolioAssistantData.skills = uniqueList(toArray(normalizedResumeData.skills));
    portfolioAssistantData.skillsByCategory = normalizedResumeData.skillsByCategory || {};
    portfolioAssistantData.education = normalizedResumeData.education || null;
    portfolioAssistantData.certifications = uniqueList(toArray(normalizedResumeData.certifications));
    portfolioAssistantData.achievements = uniqueList(toArray(normalizedResumeData.achievements));
    portfolioAssistantData.projects = uniqueList(
      toArray(normalizedResumeData.projects).concat(
        toArray(normalizedResumeData.portfolioProjects)
      )
    );

    if (portfolioAssistantData.sourceUrl) {
      portfolioAssistantData.resumeUrl = portfolioAssistantData.sourceUrl;
    }

    return true;
  }

  // The backend is the single source of truth for the latest Google Drive resume.
  async function fetchResumePayload(url, forceRefresh) {
    if (!url) {
      return null;
    }

    var requestUrl = url;
    var hasQuery = requestUrl.indexOf("?") !== -1;

    if (forceRefresh) {
      requestUrl += (hasQuery ? "&" : "?") + "refresh=true";
    }

    var response = await fetch(requestUrl, {
      method: "GET",
      headers: portfolioAssistantConfig.requestHeaders
    });

    if (!response.ok) {
      throw new Error("Unable to load resume data from " + url + ".");
    }

    return response.json();
  }

  async function loadLatestResumeData(forceRefresh) {
    if (!portfolioAssistantConfig.resumeDataUrl) {
      return null;
    }

    var isFresh =
      resumeState.loadedAt &&
      Date.now() - resumeState.loadedAt < portfolioAssistantConfig.resumeRefreshMs;

    if (!forceRefresh && isFresh) {
      return portfolioAssistantData;
    }

    if (resumeState.isLoading && resumeState.promise) {
      return resumeState.promise;
    }

    resumeState.isLoading = true;
    resumeState.promise = fetchResumePayload(
      portfolioAssistantConfig.resumeDataUrl,
      forceRefresh
    )
      .then(function(payload) {
        var resumePayload =
          payload && Object.prototype.hasOwnProperty.call(payload, "resumeData")
            ? payload.resumeData
            : payload;

        if (!mergeResumeData(resumePayload)) {
          throw new Error("Resume payload was empty.");
        }

        resumeState.loadedAt = Date.now();
        return portfolioAssistantData;
      })
      .catch(function(error) {
        console.error(error);
        return null;
      })
      .finally(function() {
        resumeState.isLoading = false;
        resumeState.promise = null;
      });

    return resumeState.promise;
  }

  // Expand a few common question patterns so resume matching is more forgiving.
  function extractKeywords(userMessage) {
    var normalizedQuestion = normalizeUserMessage(userMessage);
    var tokens = normalizedQuestion.split(" ").filter(function(token) {
      return token.length > 1 && !resumeStopWords[token];
    });

    if (/^(tell me about siva|who is siva|about siva)$/.test(normalizedQuestion)) {
      tokens = tokens.concat(["summary", "designer", "ux"]);
    }

    if (/\bwhere\b.*\bwork\b/.test(normalizedQuestion)) {
      tokens = tokens.concat(["experience", "company", "role"]);
    }

    if (/\bwhat\b.*\btools\b/.test(normalizedQuestion)) {
      tokens = tokens.concat(["skills", "tools"]);
    }

    return uniqueList(
      tokens.reduce(function(allKeywords, token) {
        allKeywords.push(token);

        if (resumeKeywordAliases[token]) {
          allKeywords = allKeywords.concat(resumeKeywordAliases[token]);
        }

        return allKeywords;
      }, [])
    );
  }

  function formatAssistantParagraphs(lines) {
    return lines.map(function(line) {
      return "<p>" + line + "</p>";
    }).join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function createMessageElement(role, content, useHtml) {
    var messageElement = document.createElement("div");
    messageElement.className = "portfolio-assistant__message portfolio-assistant__message--" + role;

    if (useHtml) {
      messageElement.innerHTML = content;
    } else {
      messageElement.textContent = content;
    }

    return messageElement;
  }

  function appendMessage(role, content, useHtml) {
    var messageElement = createMessageElement(role, content, useHtml);
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
    return messageElement;
  }

  function showTypingState(label) {
    hideTypingState();
    typingMessage = appendMessage("assistant", label || "Thinking...", false);
    typingMessage.classList.add("portfolio-assistant__message--typing");
  }

  function hideTypingState() {
    if (typingMessage && typingMessage.parentNode) {
      typingMessage.parentNode.removeChild(typingMessage);
    }

    typingMessage = null;
  }

  function ensureSentence(value) {
    var text = String(value || "").trim();

    if (!text) {
      return "";
    }

    if (!/[.!?]$/.test(text)) {
      text += ".";
    }

    return text;
  }

  function isPresentLabel(value) {
    return /^present$/i.test(String(value || "").trim());
  }

  function parseMonthYear(value) {
    var normalizedValue = String(value || "").trim();
    var monthMap = {
      jan: 0,
      feb: 1,
      mar: 2,
      apr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      aug: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dec: 11
    };
    var match = normalizedValue.match(/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i);

    if (!match) {
      return null;
    }

    return new Date(Number(match[2]), monthMap[match[1].slice(0, 3).toLowerCase()], 1);
  }

  function parseExperiencePeriod(period) {
    var normalizedPeriod = String(period || "").trim();
    var parts = normalizedPeriod.split(/\s*-\s*/);

    if (parts.length < 2) {
      return null;
    }

    var startDate = parseMonthYear(parts[0]);
    var endDate = isPresentLabel(parts[1]) ? new Date() : parseMonthYear(parts[1]);

    if (!startDate || !endDate) {
      return null;
    }

    return {
      start: startDate,
      end: endDate
    };
  }

  function getMonthDifference(startDate, endDate) {
    return (
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth())
    );
  }

  function formatMonthYear(dateValue) {
    return dateValue.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric"
    });
  }

  function formatDurationMonths(totalMonths) {
    var safeMonths = Math.max(0, totalMonths);
    var years = Math.floor(safeMonths / 12);
    var remainingMonths = safeMonths % 12;
    var parts = [];

    if (years > 0) {
      parts.push(years + " year" + (years === 1 ? "" : "s"));
    }

    if (remainingMonths > 0) {
      parts.push(remainingMonths + " month" + (remainingMonths === 1 ? "" : "s"));
    }

    return parts.join(" and ");
  }

  function isExperienceDurationQuestion(userMessage) {
    var normalizedQuestion = normalizeUserMessage(userMessage);

    return (
      /\byears?\s+of\s+experience\b/.test(normalizedQuestion) ||
      /\bhow\s+many\b.*\byears?\b.*\bexperience\b/.test(normalizedQuestion) ||
      /\btotal\s+experience\b/.test(normalizedQuestion)
    );
  }

  // Build a concise timeline answer directly from structured resume periods.
  function buildExperienceDurationAnswer(resumeData) {
    var dateRanges = toArray(resumeData.experience)
      .map(function(item) {
        return parseExperiencePeriod(item.period);
      })
      .filter(Boolean);

    if (!dateRanges.length) {
      return "";
    }

    var earliestStart = dateRanges[0].start;
    var latestEnd = dateRanges[0].end;

    dateRanges.forEach(function(range) {
      if (range.start < earliestStart) {
        earliestStart = range.start;
      }

      if (range.end > latestEnd) {
        latestEnd = range.end;
      }
    });

    var durationMonths = getMonthDifference(earliestStart, latestEnd) + 1;
    var formattedDuration = formatDurationMonths(durationMonths);

    if (!formattedDuration) {
      return "";
    }

    return (
      "<p>" +
      escapeHtml(
        "Based on the resume timeline, Siva has about " +
        formattedDuration +
        " of experience, spanning " +
        formatMonthYear(earliestStart) +
        " to " +
        formatMonthYear(latestEnd) +
        "."
      ) +
      "</p>"
    );
  }

  function addResumeCandidate(candidates, section, text) {
    var cleanedText = String(text || "").trim();
    var normalizedText = normalizeUserMessage(cleanedText);

    if (!cleanedText || !normalizedText) {
      return;
    }

    candidates.push({
      section: section,
      text: cleanedText,
      normalizedText: normalizedText
    });
  }

  // Build one searchable pool from both structured resume fields and raw text lines.
  function buildResumeCandidates(resumeData) {
    var candidates = [];
    var profile = resumeData.profile || {};
    var contact = resumeData.contact || {};
    var education = resumeData.education || {};
    var skillsByCategory = resumeData.skillsByCategory || {};

    if (profile.summary) {
      addResumeCandidate(candidates, "profile", ensureSentence(profile.summary));
    }

    if (profile.role || profile.location) {
      addResumeCandidate(
        candidates,
        "profile",
        ensureSentence(
          [
            profile.name,
            [profile.role, profile.location].filter(Boolean).join(" - ")
          ].filter(Boolean).join(": ")
        )
      );
    }

    toArray(resumeData.experience).forEach(function(item) {
      var summary = item.role && item.company
        ? item.role + " at " + item.company
        : item.role || item.company || "";

      if (item.period) {
        summary += " (" + item.period + ")";
      }

      if (item.location) {
        summary += ". Location: " + item.location;
      }

      addResumeCandidate(candidates, "experience", ensureSentence(summary));
      toArray(item.highlights).forEach(function(highlight) {
        addResumeCandidate(candidates, "experience", ensureSentence(highlight));
      });
    });

    if (toArray(skillsByCategory.tools).length > 0) {
      addResumeCandidate(
        candidates,
        "skills",
        ensureSentence("Tools: " + skillsByCategory.tools.join(", "))
      );
    }

    if (toArray(skillsByCategory.design).length > 0) {
      addResumeCandidate(
        candidates,
        "skills",
        ensureSentence("Design skills: " + skillsByCategory.design.join(", "))
      );
    }

    if (toArray(skillsByCategory.technical).length > 0) {
      addResumeCandidate(
        candidates,
        "skills",
        ensureSentence("Technical skills: " + skillsByCategory.technical.join(", "))
      );
    }

    if (
      toArray(resumeData.skills).length > 0 &&
      toArray(skillsByCategory.tools).length === 0 &&
      toArray(skillsByCategory.design).length === 0 &&
      toArray(skillsByCategory.technical).length === 0
    ) {
      addResumeCandidate(
        candidates,
        "skills",
        ensureSentence("Skills: " + resumeData.skills.join(", "))
      );
    }

    if (education.degree || education.school || education.period || education.location) {
      addResumeCandidate(
        candidates,
        "education",
        ensureSentence(
          [
            [education.degree, education.school].filter(Boolean).join(" - "),
            education.period,
            education.location
          ].filter(Boolean).join(". ")
        )
      );
    }

    toArray(resumeData.certifications).forEach(function(certification) {
      addResumeCandidate(candidates, "certifications", ensureSentence(certification));
    });

    toArray(resumeData.achievements).forEach(function(achievement) {
      addResumeCandidate(candidates, "achievements", ensureSentence(achievement));
    });

    toArray(resumeData.projects).forEach(function(project) {
      addResumeCandidate(candidates, "projects", ensureSentence(project));
    });

    if (contact.email) {
      addResumeCandidate(candidates, "contact", "Email: " + contact.email);
    }

    if (contact.phonePrimary) {
      addResumeCandidate(candidates, "contact", "Phone: " + contact.phonePrimary);
    }

    if (contact.phoneSecondary) {
      addResumeCandidate(candidates, "contact", "Alternate phone: " + contact.phoneSecondary);
    }

    String(resumeData.rawText || "")
      .split("\n")
      .map(function(line) {
        return line.trim();
      })
      .filter(function(line) {
        return (
          line &&
          line.length > 4 &&
          !/^(summary|experience|skills|education|certifications)$/i.test(line)
        );
      })
      .forEach(function(line) {
        addResumeCandidate(candidates, "raw", ensureSentence(line));
      });

    return candidates;
  }

  function getQuestionContext(userMessage) {
    var normalizedQuestion = normalizeUserMessage(userMessage);
    var hasGenericBackgroundIntent = /\bbackground\b/.test(normalizedQuestion);
    var wantsProfile =
      /\bwho is\b/.test(normalizedQuestion) ||
      /\babout\b/.test(normalizedQuestion) ||
      normalizedQuestion === "about me";
    var wantsExperience =
      /\bexperience\b/.test(normalizedQuestion) ||
      /\bcareer\b/.test(normalizedQuestion) ||
      /\bcompany\b/.test(normalizedQuestion) ||
      /\bcompanies\b/.test(normalizedQuestion) ||
      /\bworked\b/.test(normalizedQuestion) ||
      /\bwhere\b.*\bwork\b/.test(normalizedQuestion) ||
      /\bwayfair\b/.test(normalizedQuestion) ||
      /\blightbooks\b/.test(normalizedQuestion) ||
      /\bstreebo\b/.test(normalizedQuestion) ||
      /\baasaan\b/.test(normalizedQuestion);
    var wantsSkills =
      /\bskill\b/.test(normalizedQuestion) ||
      /\bskills\b/.test(normalizedQuestion) ||
      /\btool\b/.test(normalizedQuestion) ||
      /\btools\b/.test(normalizedQuestion) ||
      /\bfigma\b/.test(normalizedQuestion);
    var wantsEducation =
      /\beducation\b/.test(normalizedQuestion) ||
      /\bdegree\b/.test(normalizedQuestion) ||
      /\buniversity\b/.test(normalizedQuestion) ||
      /\bmaster\b/.test(normalizedQuestion) ||
      /\bmasters\b/.test(normalizedQuestion) ||
      /\bms\b/.test(normalizedQuestion);
    var wantsCertifications =
      /\bcertification\b/.test(normalizedQuestion) ||
      /\bcertifications\b/.test(normalizedQuestion) ||
      /\bcertified\b/.test(normalizedQuestion);
    var wantsAchievements =
      /\bachievement\b/.test(normalizedQuestion) ||
      /\bachievements\b/.test(normalizedQuestion) ||
      /\bimpact\b/.test(normalizedQuestion) ||
      /\bresult\b/.test(normalizedQuestion) ||
      /\bresults\b/.test(normalizedQuestion) ||
      /\bconversion\b/.test(normalizedQuestion);
    var wantsProjects =
      /\bproject\b/.test(normalizedQuestion) ||
      /\bprojects\b/.test(normalizedQuestion) ||
      /\bportfolio\b/.test(normalizedQuestion);
    var wantsContact =
      /\bcontact\b/.test(normalizedQuestion) ||
      /\bemail\b/.test(normalizedQuestion) ||
      /\bphone\b/.test(normalizedQuestion) ||
      /\breach\b/.test(normalizedQuestion);
    var preferredSections = [];

    if (wantsContact) {
      preferredSections = preferredSections.concat(["contact"]);
    }

    if (wantsEducation) {
      preferredSections = preferredSections.concat(["education", "certifications"]);
    }

    if (wantsSkills) {
      preferredSections = preferredSections.concat(["skills"]);
    }

    if (wantsAchievements) {
      preferredSections = preferredSections.concat(["achievements"]);
    }

    if (wantsProjects) {
      preferredSections = preferredSections.concat(["projects"]);
    }

    if (
      wantsExperience ||
      (hasGenericBackgroundIntent &&
        !wantsEducation &&
        !wantsSkills &&
        !wantsAchievements &&
        !wantsProjects &&
        !wantsContact)
    ) {
      preferredSections = preferredSections.concat(["experience"]);
    }

    if (
      wantsProfile &&
      preferredSections.length === 0
    ) {
      preferredSections = preferredSections.concat(["profile"]);
    }

    return {
      normalizedQuestion: normalizedQuestion,
      keywords: extractKeywords(userMessage),
      preferredSections: uniqueList(preferredSections),
      sectionBonuses: {
        profile: wantsProfile ? 4 : 0,
        experience: wantsExperience ? 4 : 0,
        skills: wantsSkills ? 4 : 0,
        education: wantsEducation ? 4 : 0,
        certifications: wantsCertifications || wantsEducation ? 3 : 0,
        achievements: wantsAchievements ? 4 : 0,
        projects: wantsProjects ? 4 : 0,
        contact: wantsContact ? 5 : 0,
        raw: 0
      }
    };
  }

  function scoreResumeCandidate(candidate, context) {
    var score = context.sectionBonuses[candidate.section] || 0;
    var matchedKeywords = [];

    context.keywords.forEach(function(keyword) {
      if (candidate.normalizedText.indexOf(keyword) !== -1) {
        matchedKeywords.push(keyword);
        score += keyword.length > 4 ? 4 : 3;
      }
    });

    if (
      context.normalizedQuestion &&
      candidate.normalizedText.indexOf(context.normalizedQuestion) !== -1
    ) {
      score += 6;
    }

    if (matchedKeywords.length > 1) {
      score += matchedKeywords.length * 2;
    }

    if (candidate.section !== "raw" && matchedKeywords.length > 0) {
      score += 1;
    }

    if (candidate.section === "raw") {
      score -= 1;
    }

    return {
      score: score,
      matchedKeywords: uniqueList(matchedKeywords)
    };
  }

  function rankResumeMatches(candidates, context) {
    var seenTexts = {};
    var rankedCandidates = candidates
      .map(function(candidate) {
        var scoring = scoreResumeCandidate(candidate, context);

        return {
          section: candidate.section,
          text: candidate.text,
          normalizedText: candidate.normalizedText,
          score: scoring.score,
          matchedKeywords: scoring.matchedKeywords
        };
      })
      .filter(function(candidate) {
        return candidate.score > 0;
      })
      .sort(function(a, b) {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        if (a.section === "raw" && b.section !== "raw") {
          return 1;
        }

        if (a.section !== "raw" && b.section === "raw") {
          return -1;
        }

        return a.text.length - b.text.length;
      })
      .filter(function(candidate) {
        if (seenTexts[candidate.normalizedText]) {
          return false;
        }

        seenTexts[candidate.normalizedText] = true;
        return true;
      });
    var focusedMatches = [];

    if (context.preferredSections && context.preferredSections.length > 0) {
      focusedMatches = rankedCandidates.filter(function(candidate) {
        return context.preferredSections.indexOf(candidate.section) !== -1;
      });
    }

    return (focusedMatches.length > 0 ? focusedMatches : rankedCandidates).slice(0, 3);
  }

  function searchResumeContent(resumeData, userMessage) {
    var context = getQuestionContext(userMessage);
    var candidates = buildResumeCandidates(resumeData);

    return {
      context: context,
      matches: rankResumeMatches(candidates, context)
    };
  }

  function hasConfidentResumeMatch(searchResult) {
    if (!searchResult.matches.length) {
      return false;
    }

    var bestMatch = searchResult.matches[0];
    var sectionBonus = searchResult.context.sectionBonuses[bestMatch.section] || 0;

    if (bestMatch.score >= 6) {
      return true;
    }

    if (bestMatch.matchedKeywords.length > 0 && bestMatch.score >= 4) {
      return true;
    }

    return sectionBonus >= 4 && bestMatch.score >= 4;
  }

  function buildResumeAnswer(matches, context) {
    if (!matches || matches.length === 0) {
      return "";
    }

    var relatedSectionsBySection = {
      profile: ["profile"],
      experience: ["experience"],
      skills: ["skills"],
      education: ["education", "certifications"],
      certifications: ["education", "certifications"],
      achievements: ["achievements"],
      projects: ["projects"],
      contact: ["contact"],
      raw: ["raw"]
    };
    var bestMatch = matches[0];
    var allowedSections = relatedSectionsBySection[bestMatch.section] || [bestMatch.section];
    var answerMatches = matches.filter(function(match) {
      return allowedSections.indexOf(match.section) !== -1;
    });

    if (
      context &&
      context.preferredSections &&
      context.preferredSections.length > 0
    ) {
      answerMatches = answerMatches.filter(function(match) {
        return context.preferredSections.indexOf(match.section) !== -1;
      });
    }

    if (answerMatches.length === 0) {
      answerMatches = [bestMatch];
    }

    var combinedAnswer = answerMatches
      .slice(0, 3)
      .map(function(match) {
        return ensureSentence(match.text);
      })
      .join(" ");

    return "<p>" + escapeHtml(combinedAnswer) + "</p>";
  }

  function getFallbackContactResponse() {
    return (
      "<p>For more information, please connect with Siva directly.</p>" +
      '<p>Email: <a href="mailto:' + assistantFallbackContact.email + '">' + assistantFallbackContact.email + "</a></p>" +
      '<p>Phone: <a href="tel:+16056719582">' + assistantFallbackContact.phonePrimary + "</a></p>"
    );
  }

  function openAssistant() {
    assistantRoot.classList.add("is-open");
    toggleButton.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");
    loadLatestResumeData(true).catch(function(error) {
      console.error(error);
    });
    window.setTimeout(function() {
      input.focus();
    }, 120);
  }

  function closeAssistant() {
    assistantRoot.classList.remove("is-open");
    toggleButton.setAttribute("aria-expanded", "false");
    panel.setAttribute("aria-hidden", "true");
    toggleButton.focus();
  }

  async function getAssistantResponse(userMessage) {
    var latestResumeData = await loadLatestResumeData(true);

    if (!latestResumeData) {
      return getFallbackContactResponse();
    }

    if (isExperienceDurationQuestion(userMessage)) {
      var durationAnswer = buildExperienceDurationAnswer(latestResumeData);

      if (durationAnswer) {
        return durationAnswer;
      }
    }

    var searchResult = searchResumeContent(latestResumeData, userMessage);

    if (!hasConfidentResumeMatch(searchResult)) {
      return getFallbackContactResponse();
    }

    var resumeAnswer = buildResumeAnswer(searchResult.matches, searchResult.context);

    return resumeAnswer || getFallbackContactResponse();
  }

  async function handlePrompt(prompt) {
    var rawPrompt = String(prompt || "");
    var cleanedPrompt = rawPrompt.trim();

    if (!cleanedPrompt) {
      return;
    }

    appendMessage("user", cleanedPrompt, false);
    input.value = "";

    showTypingState();

    var assistantReply = await getAssistantResponse(cleanedPrompt);

    window.setTimeout(function() {
      hideTypingState();
      appendMessage("assistant", assistantReply, true);
    }, 240);
  }

  appendMessage(
    "assistant",
    formatAssistantParagraphs([
      "Hi, I'm Siva's AI assistant.",
      "Ask me about Siva's background, skills, experience, education, achievements, or contact details. I answer only from the latest resume data."
    ]),
    true
  );

  loadLatestResumeData(false);

  toggleButton.addEventListener("click", function() {
    if (assistantRoot.classList.contains("is-open")) {
      closeAssistant();
      return;
    }

    openAssistant();
  });

  closeButton.addEventListener("click", function() {
    closeAssistant();
  });

  quickReplyButtons.forEach(function(button) {
    button.addEventListener("click", function() {
      openAssistant();
      handlePrompt(button.getAttribute("data-chatbot-prompt"));
    });
  });

  form.addEventListener("submit", function(event) {
    event.preventDefault();
    handlePrompt(input.value);
  });

  input.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && assistantRoot.classList.contains("is-open")) {
      closeAssistant();
    }
  });

  document.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && assistantRoot.classList.contains("is-open")) {
      closeAssistant();
    }
  });

  document.addEventListener("click", function(event) {
    if (
      assistantRoot.classList.contains("is-open") &&
      !assistantRoot.contains(event.target)
    ) {
      closeAssistant();
    }
  });
})();
