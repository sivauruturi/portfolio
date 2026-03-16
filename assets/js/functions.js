
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
  var soundToggleAnimationFrame = null;
  backgroundAudio.volume = 0.45;
  backgroundAudio.load();

  var getStoredAudioConsent = function() {
    try {
      return window.localStorage.getItem(audioConsentKey);
    } catch (error) {
      return null;
    }
  };

  var setStoredAudioConsent = function(value) {
    try {
      window.localStorage.setItem(audioConsentKey, value);
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

  var playBackgroundAudio = function() {
    backgroundAudio.muted = false;
    return backgroundAudio.play().then(function() {
      syncBackgroundAudioState();
      hideAudioPermissionPrompt();
    }).catch(function() {
      setBackgroundAudioState("Play Music", "bi bi-play-fill");
      showAudioPermissionPrompt();
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
      setStoredAudioConsent("granted");
      playBackgroundAudio();
      return;
    }

    backgroundAudio.pause();
    syncBackgroundAudioState();
  });

  if (audioPermissionAllow) {
    audioPermissionAllow.addEventListener("click", function() {
      setStoredAudioConsent("granted");
      playBackgroundAudio();
    });
  }

  if (audioPermissionDismiss) {
    audioPermissionDismiss.addEventListener("click", function() {
      setStoredAudioConsent("denied");
      backgroundAudio.pause();
      hideAudioPermissionPrompt();
      syncBackgroundAudioState();
    });
  }

  backgroundAudio.addEventListener("play", syncBackgroundAudioState);
  backgroundAudio.addEventListener("pause", syncBackgroundAudioState);

  if (getStoredAudioConsent() === "granted") {
    playBackgroundAudio();
  } else if (getStoredAudioConsent() !== "denied") {
    showAudioPermissionPrompt();
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

function initContinuousScroller() {
  var scrollers = document.querySelectorAll(".scroller[data-animated='true']");

  scrollers.forEach(function(scroller) {
    var scrollerInner = scroller.querySelector(".scroller__inner");

    if (!scrollerInner || scroller.dataset.loopReady === "true") {
      return;
    }

    var originalItems = Array.prototype.slice.call(scrollerInner.children);

    originalItems.forEach(function(item) {
      var duplicatedItem = item.cloneNode(true);

      duplicatedItem.setAttribute("aria-hidden", "true");
      duplicatedItem.setAttribute("data-scroller-clone", "true");
      scrollerInner.appendChild(duplicatedItem);
    });

    scroller.dataset.loopReady = "true";
  });
}

window.addEventListener("load", initContinuousScroller);

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


document.querySelector("#smooth-content > main > div.company-design-area")


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
  9. Liquid Ripple Background
===============================================*/
(function() {
  var rippleCanvas = document.getElementById("liquid-ripple-canvas");
  var backgroundVideo = document.querySelector(".body-overlay");

  if (!rippleCanvas) {
    return;
  }

  var rippleContext = rippleCanvas.getContext("2d");

  if (!rippleContext) {
    return;
  }

  var rippleConfig = {
    // Main ring color. Increase alpha for a brighter ripple.
    strokeColor: "rgba(190, 228, 255, 0.14)",
    // Secondary inner ring for a more liquid look.
    secondaryColor: "rgba(255, 255, 255, 0.05)",
    // Soft glow behind each ripple.
    glowColor: "rgba(120, 180, 255, 0.08)",
    // Background vignette glow. Keep subtle for a premium look.
    ambientGlowColor: "rgba(110, 150, 200, 0.035)",
    // Ripple line thickness.
    lineWidth: 1.35,
    // Starting ripple size.
    startRadius: 14,
    // Max ripple size before it fades out.
    maxRadius: 220,
    // Ripple growth speed.
    growthSpeed: 2.4,
    // How quickly the ripple fades.
    fadeSpeed: 0.012,
    // Canvas blur used for the glow pass.
    blurAmount: 14,
    // Minimum distance before another ripple is spawned.
    pointerSpacing: 18,
    // Minimum delay between ripples for performance.
    spawnInterval: 36,
    // Idle pulse timing so mobile/background still feels alive.
    idlePulseInterval: 1800
  };

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var ripples = [];
  var lastSpawnTime = 0;
  var lastIdlePulse = 0;
  var pointerState = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.35,
    lastX: window.innerWidth * 0.5,
    lastY: window.innerHeight * 0.35
  };
  var canvasMetrics = {
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: 1
  };

  function resizeRippleCanvas() {
    canvasMetrics.width = window.innerWidth;
    canvasMetrics.height = window.innerHeight;
    canvasMetrics.dpr = Math.min(window.devicePixelRatio || 1, 1.75);

    rippleCanvas.width = canvasMetrics.width * canvasMetrics.dpr;
    rippleCanvas.height = canvasMetrics.height * canvasMetrics.dpr;
    rippleCanvas.style.width = canvasMetrics.width + "px";
    rippleCanvas.style.height = canvasMetrics.height + "px";

    rippleContext.setTransform(canvasMetrics.dpr, 0, 0, canvasMetrics.dpr, 0, 0);
  }

  function addRipple(x, y, radiusBoost) {
    ripples.push({
      x: x,
      y: y,
      radius: rippleConfig.startRadius + (radiusBoost || 0),
      alpha: 1
    });

    if (ripples.length > 18) {
      ripples.shift();
    }
  }

  function spawnRippleFromPoint(x, y, now) {
    var deltaX = x - pointerState.lastX;
    var deltaY = y - pointerState.lastY;
    var distance = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));

    pointerState.x = x;
    pointerState.y = y;

    if ((now - lastSpawnTime) < rippleConfig.spawnInterval || distance < rippleConfig.pointerSpacing) {
      return;
    }

    pointerState.lastX = x;
    pointerState.lastY = y;
    lastSpawnTime = now;

    addRipple(x, y, Math.min(distance * 0.08, 14));
  }

  function handlePointerMove(clientX, clientY) {
    if (prefersReducedMotion.matches) {
      return;
    }

    spawnRippleFromPoint(clientX, clientY, performance.now());
  }

  function handlePointerDown(clientX, clientY) {
    if (prefersReducedMotion.matches) {
      return;
    }

    pointerState.lastX = clientX;
    pointerState.lastY = clientY;
    pointerState.x = clientX;
    pointerState.y = clientY;
    lastSpawnTime = performance.now();
    addRipple(clientX, clientY, 6);
  }

  function drawBackdrop() {
    var centerGradient = rippleContext.createRadialGradient(
      pointerState.x,
      pointerState.y,
      0,
      pointerState.x,
      pointerState.y,
      Math.max(canvasMetrics.width, canvasMetrics.height) * 0.42
    );

    centerGradient.addColorStop(0, rippleConfig.ambientGlowColor);
    centerGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    rippleContext.globalCompositeOperation = "source-over";
    rippleContext.clearRect(0, 0, canvasMetrics.width, canvasMetrics.height);

    if (backgroundVideo) {
      rippleContext.fillStyle = "rgba(0, 0, 0, 0.12)";
    } else {
      rippleContext.fillStyle = "#000000";
    }

    rippleContext.fillRect(0, 0, canvasMetrics.width, canvasMetrics.height);

    rippleContext.globalCompositeOperation = "screen";
    rippleContext.fillStyle = centerGradient;
    rippleContext.fillRect(0, 0, canvasMetrics.width, canvasMetrics.height);
    rippleContext.globalCompositeOperation = "source-over";
  }

  function drawRipples() {
    for (var i = ripples.length - 1; i >= 0; i--) {
      var ripple = ripples[i];

      ripple.radius += rippleConfig.growthSpeed;
      ripple.alpha -= rippleConfig.fadeSpeed;

      if (ripple.alpha <= 0 || ripple.radius > rippleConfig.maxRadius) {
        ripples.splice(i, 1);
        continue;
      }

      rippleContext.save();
      rippleContext.globalAlpha = ripple.alpha;
      rippleContext.filter = "blur(" + rippleConfig.blurAmount + "px)";
      rippleContext.beginPath();
      rippleContext.fillStyle = rippleConfig.glowColor;
      rippleContext.arc(ripple.x, ripple.y, ripple.radius * 0.82, 0, Math.PI * 2);
      rippleContext.fill();
      rippleContext.restore();

      rippleContext.save();
      rippleContext.globalAlpha = ripple.alpha * 0.9;
      rippleContext.lineWidth = rippleConfig.lineWidth;
      rippleContext.strokeStyle = rippleConfig.strokeColor;
      rippleContext.beginPath();
      rippleContext.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      rippleContext.stroke();

      rippleContext.globalAlpha = ripple.alpha * 0.45;
      rippleContext.strokeStyle = rippleConfig.secondaryColor;
      rippleContext.beginPath();
      rippleContext.arc(ripple.x, ripple.y, ripple.radius * 0.68, 0, Math.PI * 2);
      rippleContext.stroke();
      rippleContext.restore();
    }
  }

  function animateRipples(now) {
    drawBackdrop();

    if (!prefersReducedMotion.matches && (now - lastIdlePulse) > rippleConfig.idlePulseInterval) {
      lastIdlePulse = now;
      addRipple(pointerState.x, pointerState.y, 0);
    }

    drawRipples();
    window.requestAnimationFrame(animateRipples);
  }

  resizeRippleCanvas();
  drawBackdrop();

  window.addEventListener("resize", resizeRippleCanvas);
  if (window.PointerEvent) {
    window.addEventListener("pointerdown", function(event) {
      handlePointerDown(event.clientX, event.clientY);
    }, { passive: true });
    window.addEventListener("pointermove", function(event) {
      handlePointerMove(event.clientX, event.clientY);
    }, { passive: true });
  } else {
    window.addEventListener("mousemove", function(event) {
      handlePointerMove(event.clientX, event.clientY);
    }, { passive: true });
    window.addEventListener("touchstart", function(event) {
      if (!event.touches.length) {
        return;
      }

      var touch = event.touches[0];
      handlePointerDown(touch.clientX, touch.clientY);
    }, { passive: true });
    window.addEventListener("touchmove", function(event) {
      if (!event.touches.length) {
        return;
      }

      var touch = event.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    }, { passive: true });
  }

  if (prefersReducedMotion.addEventListener) {
    prefersReducedMotion.addEventListener("change", function() {
      ripples = [];
      drawBackdrop();
    });
  }

  window.requestAnimationFrame(animateRipples);
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

  var portfolioAssistantData = {
    profile: {
      name: "Siva Uruturi",
      role: "UI/UX Designer",
      summary: "Siva Uruturi is a data-driven UI/UX Designer with 5+ years of experience leading end-to-end product design for SaaS and e-commerce platforms.",
      location: "Valparaiso, IN"
    },
    resumeUrl: "https://drive.google.com/file/d/1h3f0GoBVo8ag_i18pCyXQG8w3fOqqIdU/preview",
    contact: {
      email: "shiva.uruturi@gmail.com",
      phonePrimary: "+1 (605) 671 9582",
      phoneSecondary: "+91 94905 07052"
    },
    availability: "Siva is open to opportunities aligned with UI/UX, product design, design systems, and e-commerce or SaaS experience design.",
    services: [
      "Product Design",
      "UX Strategy",
      "Design Systems"
    ],
    skills: [
      "Figma",
      "Sketch",
      "Adobe XD",
      "Invision",
      "Balsamiq",
      "Webflow",
      "Framer",
      "Principle",
      "Miro",
      "Optimal Workshop",
      "UsabilityHub",
      "UserTesting",
      "Photoshop",
      "After Effects",
      "Adobe Creative Suite",
      "Product Design",
      "Interaction Design",
      "Visual Design",
      "User Research",
      "Usability Testing",
      "A/B Testing",
      "Wireframing",
      "Prototyping",
      "Design Systems",
      "HTML",
      "CSS",
      "JavaScript"
    ],
    projects: [
      "Aasaan Webpannel",
      "UX/UI Design for a Real Estate App",
      "LearnEasy E-Learning website",
      "Craving Catch - Logo Design",
      "iWay Infotech",
      "Pink-Blue",
      "Hashnet",
      "Vertu"
    ],
    portfolioProjects: [
      "Aasaan Webpannel",
      "UX/UI Design for a Real Estate App",
      "LearnEasy E-Learning website",
      "Craving Catch - Logo Design",
      "iWay Infotech",
      "Pink-Blue",
      "Hashnet",
      "Vertu"
    ],
    portfolioProjectLinks: [
      { title: "Aasaan Webpannel", href: "portfolio-aasaan.html" },
      { title: "UX/UI Design for a Real Estate App", href: "portfolio-realestate.html" },
      { title: "LearnEasy E-Learning website", href: "portfolio-learneasy.html" },
      { title: "Craving Catch - Logo Design", href: "portfolio-cravingcatch.html" },
      { title: "iWay Infotech", href: "portfolio-iway.html" },
      { title: "Pink-Blue", href: "portfolio-pinkblue.html" },
      { title: "Hashnet", href: "portfolio-hashnet.html" },
      { title: "Vertu", href: "portfolio-vertu.html" }
    ],
    experience: [
      {
        company: "Wayfair",
        role: "UI/UX Designer",
        period: "Jul. 2024 - Present",
        location: "Boston, MA",
        highlights: [
          "Conducts user research, stakeholder interviews, and usability testing across large-scale e-commerce platforms.",
          "Designs wireframes, prototypes, and UI solutions for homepage, category, PDP, cart, and order tracking experiences.",
          "Improved conversion rates by 18%, reduced checkout drop-offs by 22%, and improved engagement by 30%.",
          "Maintains design systems, accessibility guidelines, and scalable component libraries."
        ]
      },
      {
        company: "Lightbooks Technologies Pvt Ltd",
        role: "UX Designer",
        period: "Jul. 2019 - Nov. 2022",
        location: "Hyderabad, India",
        highlights: [
          "Led end-to-end UX strategy and product design for Aasaan.app.",
          "Reduced onboarding drop-offs by 38% through research-led interface optimization.",
          "Designed responsive interfaces, prototypes, UI flows, and admin dashboards.",
          "Reduced design-to-development turnaround time by 40% through Agile collaboration."
        ]
      },
      {
        company: "Streebo Inc",
        role: "Graphic Designer",
        period: "Dec. 2018 - Jun. 2019",
        location: "Hyderabad, India",
        highlights: [
          "Designed UI graphics, wireframes, icons, and layout components for banking web and mobile apps.",
          "Created marketing creatives, landing pages, and presentation assets.",
          "Built reusable UI components and visual libraries for consistency and scalability."
        ]
      }
    ],
    education: {
      degree: "Master of Science in Information Technology",
      school: "Valparaiso University",
      period: "Jan. 2023 - May 2024",
      location: "Valparaiso, IN"
    },
    certifications: [
      "Foundations of User Experience (UX) Design - Coursera"
    ],
    achievements: [
      "Increased conversion rates by 18%",
      "Reduced checkout drop-offs by 22%",
      "Improved engagement by 30%",
      "Reduced onboarding drop-offs by 38%",
      "Reduced design-to-development turnaround time by 40%"
    ],
    servicesSummary: "Siva specializes in UI/UX design, UX strategy, product design, research-led optimization, and scalable design systems.",
    toolsSummary: "Siva works with Figma, Sketch, Adobe XD, Invision, Balsamiq, Webflow, Framer, Principle, Miro, UserTesting, Photoshop, After Effects, HTML, CSS, and JavaScript.",
    projectSummary: "Portfolio highlights include Aasaan Webpannel, a Real Estate App, LearnEasy, Craving Catch, iWay Infotech, Pink-Blue, Hashnet, and Vertu.",
    resumeProjectSummary: "Resume highlights include large-scale e-commerce UX at Wayfair, end-to-end product design for Aasaan.app, and banking app design work at Streebo.",
    fallback: "I can help with Siva's background, resume, experience, tools, education, achievements, availability, and contact details."
  };

  var globalAssistantConfig = window.portfolioAssistantConfig || {};
  var portfolioAssistantConfig = {
    apiEndpoint: globalAssistantConfig.apiEndpoint || assistantRoot.getAttribute("data-chat-api-url") || "",
    bookingApiBaseUrl: assistantRoot.getAttribute("data-booking-api-base") || globalAssistantConfig.bookingApiBaseUrl || "",
    resumeDataUrl: globalAssistantConfig.resumeDataUrl || assistantRoot.getAttribute("data-resume-api-url") || "",
    resumeRefreshMs: Number(globalAssistantConfig.resumeRefreshMs || 300000),
    defaultTimeZone: globalAssistantConfig.defaultTimeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Chicago",
    requestHeaders: {
      "Content-Type": "application/json"
    }
  };

  var bookingFlow = {
    active: false,
    step: null,
    isBusy: false,
    selectedSlot: null,
    availableSlots: [],
    draft: {}
  };
  var resumeState = {
    loadedAt: 0,
    isLoading: false,
    promise: null
  };

  function uniqueList(values) {
    return values.filter(function(value, index, array) {
      return value && array.indexOf(value) === index;
    });
  }

  function normalizeUserMessage(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function mergeResumeData(resumeData) {
    if (!resumeData) {
      return;
    }

    portfolioAssistantData.profile = {
      ...portfolioAssistantData.profile,
      ...(resumeData.profile || {})
    };
    portfolioAssistantData.contact = {
      ...portfolioAssistantData.contact,
      ...(resumeData.contact || {})
    };

    if (Array.isArray(resumeData.experience) && resumeData.experience.length > 0) {
      portfolioAssistantData.experience = resumeData.experience;
    }

    if (Array.isArray(resumeData.skills) && resumeData.skills.length > 0) {
      portfolioAssistantData.skills = uniqueList(resumeData.skills);
    }

    if (resumeData.education) {
      portfolioAssistantData.education = resumeData.education;
    }

    if (Array.isArray(resumeData.certifications)) {
      portfolioAssistantData.certifications = resumeData.certifications;
    }

    if (Array.isArray(resumeData.achievements) && resumeData.achievements.length > 0) {
      portfolioAssistantData.achievements = resumeData.achievements;
    }

    portfolioAssistantData.skillsByCategory = resumeData.skillsByCategory || portfolioAssistantData.skillsByCategory || {};
    portfolioAssistantData.rawResumeText = resumeData.rawText || portfolioAssistantData.rawResumeText || "";
    portfolioAssistantData.resumeUpdatedAt = resumeData.updatedAt || portfolioAssistantData.resumeUpdatedAt || "";

    var tools = portfolioAssistantData.skillsByCategory.tools || [];
    var companies = (portfolioAssistantData.experience || []).map(function(item) {
      return item.company;
    }).filter(Boolean);

    if (tools.length > 0) {
      portfolioAssistantData.toolsSummary =
        "Siva works with " + tools.slice(0, 10).join(", ") + ".";
    }

    if (companies.length > 0) {
      portfolioAssistantData.resumeProjectSummary =
        "Resume highlights include experience at " + companies.join(", ") + ".";
    }
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
    resumeState.promise = fetch(
      portfolioAssistantConfig.resumeDataUrl +
        (forceRefresh ? "?refresh=true" : ""),
      {
        method: "GET",
        headers: portfolioAssistantConfig.requestHeaders
      }
    )
      .then(function(response) {
        if (!response.ok) {
          throw new Error("Unable to refresh resume data.");
        }

        return response.json();
      })
      .then(function(payload) {
        if (payload && payload.resumeData) {
          mergeResumeData(payload.resumeData);
          resumeState.loadedAt = Date.now();
        }

        return payload;
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

  function getExperienceByKeyword(keywords) {
    return (portfolioAssistantData.experience || []).find(function(item) {
      var haystack = normalizeUserMessage(
        [item.company, item.role, item.location].join(" ")
      );

      return keywords.some(function(keyword) {
        return haystack.indexOf(keyword) !== -1;
      });
    });
  }

  function buildExperienceResponse(experienceItem) {
    if (!experienceItem) {
      return "";
    }

    var highlights = (experienceItem.highlights || []).slice(0, 2);
    var lines = [
      experienceItem.role + " at " + experienceItem.company + " (" + experienceItem.period + ")."
    ];

    if (experienceItem.location) {
      lines.push("Location: " + experienceItem.location + ".");
    }

    highlights.forEach(function(highlight) {
      lines.push(highlight);
    });

    return formatAssistantParagraphs(lines);
  }

  function buildResumeSearchFallback(userMessage) {
    var rawText = String(portfolioAssistantData.rawResumeText || "");

    if (!rawText) {
      return "";
    }

    var stopWords = {
      the: true,
      and: true,
      for: true,
      with: true,
      what: true,
      tell: true,
      about: true,
      does: true,
      did: true,
      from: true,
      have: true,
      has: true,
      his: true,
      her: true,
      siva: true,
      uruturi: true
    };
    var query = normalizeUserMessage(userMessage);
    var tokens = query.split(" ").filter(function(token) {
      return token.length > 2 && !stopWords[token];
    });

    if (tokens.indexOf("master") !== -1 || tokens.indexOf("masters") !== -1) {
      tokens.push("education", "degree", "university", "information", "technology");
    }

    if (tokens.length === 0) {
      return "";
    }

    var matches = rawText
      .split("\n")
      .map(function(line) {
        return line.trim();
      })
      .filter(function(line) {
        return line && line.length > 8 && !/^(summary|experience|skills|education)$/i.test(line);
      })
      .map(function(line) {
        var normalizedLine = normalizeUserMessage(line);
        var score = tokens.reduce(function(total, token) {
          return total + (normalizedLine.indexOf(token) !== -1 ? 1 : 0);
        }, 0);

        return {
          line: line,
          score: score
        };
      })
      .filter(function(item) {
        return item.score > 0;
      })
      .sort(function(a, b) {
        return b.score - a.score;
      })
      .slice(0, 2)
      .map(function(item) {
        return item.line;
      });

    if (!matches.length) {
      return "";
    }

    return formatAssistantParagraphs(matches);
  }

  function buildPortfolioProjectsResponse() {
    var projects = portfolioAssistantData.portfolioProjectLinks || [];
    var projectLinksHtml = projects.map(function(project) {
      return '<a href="' + escapeHtml(project.href) + '">' + escapeHtml(project.title) + "</a>";
    }).join("<br>");

    return (
      formatAssistantParagraphs([
        portfolioAssistantData.projectSummary,
        "Project highlights:"
      ]) +
      "<p>" + projectLinksHtml + "</p>"
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

  function renderActionButtons(buttons) {
    if (!buttons || buttons.length === 0) {
      return "";
    }

    return (
      '<div class="portfolio-assistant__message-actions">' +
      buttons.map(function(button) {
        var variantClass = button.variant === "primary" ? " portfolio-assistant__action--primary" : "";
        return (
          '<button type="button" class="portfolio-assistant__action' + variantClass + '"' +
          ' data-assistant-action="' + escapeHtml(button.action) + '"' +
          ' data-assistant-value="' + escapeHtml(button.value || "") + '"' +
          ' data-assistant-label="' + escapeHtml(button.label || "") + '">' +
          escapeHtml(button.label) +
          "</button>"
        );
      }).join("") +
      "</div>"
    );
  }

  function buildAssistantHtml(options) {
    var html = "";

    if (options.paragraphs && options.paragraphs.length > 0) {
      html += formatAssistantParagraphs(options.paragraphs);
    }

    if (options.summaryHtml) {
      html += '<div class="portfolio-assistant__summary">' + options.summaryHtml + "</div>";
    }

    if (options.statusText) {
      html += '<div class="portfolio-assistant__status portfolio-assistant__status--' +
        escapeHtml(options.statusType || "success") + '">' +
        escapeHtml(options.statusText) +
        "</div>";
    }

    if (options.actions && options.actions.length > 0) {
      html += renderActionButtons(options.actions);
    }

    return html;
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

  function openAssistant() {
    assistantRoot.classList.add("is-open");
    toggleButton.setAttribute("aria-expanded", "true");
    panel.setAttribute("aria-hidden", "false");
    loadLatestResumeData(true).catch(function(error) {
      console.error(error);
    });
    fetchRemoteResponse("").catch(function(error) {
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

  function resetBookingFlow() {
    bookingFlow.active = false;
    bookingFlow.step = null;
    bookingFlow.isBusy = false;
    bookingFlow.selectedSlot = null;
    bookingFlow.availableSlots = [];
    bookingFlow.draft = {};
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function isValidDateInput(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
  }

  function isValidTimeInput(value) {
    return /^([01]?\d|2[0-3])(:[0-5]\d)?(\s?[ap]m)?$/i.test(String(value || "").trim());
  }

  function isValidTimeZone(value) {
    try {
      Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
      return true;
    } catch (error) {
      return false;
    }
  }

  function isSchedulingIntent(message) {
    return /(schedule|book|meeting|meet|call|portfolio discussion|intro call)/i.test(message);
  }

  function findSlotById(slotId) {
    return bookingFlow.availableSlots.find(function(slot) {
      return slot.slotId === slotId;
    });
  }

  function buildLocalResponse(userMessage) {
    var normalizedMessage = userMessage.toLowerCase().trim();
    var normalizedPlain = normalizeUserMessage(userMessage);

    if (!normalizedMessage) {
      return formatAssistantParagraphs([portfolioAssistantData.fallback]);
    }

    if (
      normalizedMessage.indexOf("resume") !== -1 ||
      normalizedMessage.indexOf("cv") !== -1
    ) {
      return formatAssistantParagraphs([
        "You can view Siva's resume here:",
        '<a href="' + portfolioAssistantData.resumeUrl + '" target="_blank" rel="noopener noreferrer">Open Resume</a>'
      ]);
    }

    if (
      normalizedMessage.indexOf("contact") !== -1 ||
      normalizedMessage.indexOf("email") !== -1 ||
      normalizedMessage.indexOf("phone") !== -1 ||
      normalizedMessage.indexOf("reach") !== -1
    ) {
      return formatAssistantParagraphs([
        "You can reach Siva directly using the details below.",
        'Email: <a href="mailto:' + portfolioAssistantData.contact.email + '">' + portfolioAssistantData.contact.email + "</a>",
        'Phone: <a href="tel:+16056719582">' + portfolioAssistantData.contact.phonePrimary + '</a> | <a href="tel:+919490507052">' + portfolioAssistantData.contact.phoneSecondary + "</a>",
        "Feel free to reach out directly if you'd like to discuss an opportunity."
      ]);
    }

    if (
      normalizedMessage.indexOf("experience") !== -1 ||
      normalizedMessage.indexOf("background") !== -1 ||
      normalizedMessage.indexOf("work history") !== -1
    ) {
      var latestExperience = (portfolioAssistantData.experience || [])[0];
      return formatAssistantParagraphs([
        portfolioAssistantData.profile.summary,
        latestExperience
          ? "Most recently, Siva works as " + latestExperience.role + " at " + latestExperience.company + "."
          : "Siva has experience across UI/UX, product design, and digital product workflows."
      ]);
    }

    var wayfairExperience = getExperienceByKeyword(["wayfair"]);

    if (normalizedPlain.indexOf("wayfair") !== -1 && wayfairExperience) {
      return buildExperienceResponse(wayfairExperience);
    }

    var lightbooksExperience = getExperienceByKeyword(["lightbooks", "aasaan"]);

    if (
      (normalizedPlain.indexOf("aasaan") !== -1 ||
        normalizedPlain.indexOf("lightbooks") !== -1) &&
      lightbooksExperience
    ) {
      return buildExperienceResponse(lightbooksExperience);
    }

    var streeboExperience = getExperienceByKeyword(["streebo", "banking"]);

    if (
      (normalizedPlain.indexOf("streebo") !== -1 ||
        normalizedPlain.indexOf("banking") !== -1) &&
      streeboExperience
    ) {
      return buildExperienceResponse(streeboExperience);
    }

    if (
      normalizedMessage.indexOf("education") !== -1 ||
      normalizedMessage.indexOf("degree") !== -1 ||
      normalizedMessage.indexOf("university") !== -1 ||
      /\bmaster\b/.test(normalizedPlain) ||
      /\bmasters\b/.test(normalizedPlain) ||
      /\bms\b/.test(normalizedPlain)
    ) {
      var education = portfolioAssistantData.education || {};
      return formatAssistantParagraphs([
        education.degree && education.school
          ? "Siva holds " + education.degree + " from " + education.school + "."
          : "Siva's education details are available on the latest resume.",
        (portfolioAssistantData.certifications || []).length > 0
          ? "Certification: " + portfolioAssistantData.certifications[0] + "."
          : "You can also view the resume for the latest certification details."
      ]);
    }

    if (
      normalizedMessage.indexOf("achievement") !== -1 ||
      normalizedMessage.indexOf("result") !== -1 ||
      normalizedMessage.indexOf("impact") !== -1 ||
      normalizedMessage.indexOf("conversion") !== -1
    ) {
      return formatAssistantParagraphs([
        (portfolioAssistantData.achievements || []).slice(0, 2).join(" "),
        (portfolioAssistantData.achievements || []).slice(2, 4).join(" ")
      ]);
    }

    if (
      normalizedMessage.indexOf("location") !== -1 ||
      normalizedMessage.indexOf("where are you based") !== -1 ||
      normalizedMessage.indexOf("based") !== -1
    ) {
      return formatAssistantParagraphs([
        "Siva is based in " + (portfolioAssistantData.profile.location || "Valparaiso, Indiana") + "."
      ]);
    }

    if (
      normalizedMessage.indexOf("service") !== -1 ||
      normalizedMessage.indexOf("offer") !== -1
    ) {
      return formatAssistantParagraphs([
        portfolioAssistantData.servicesSummary,
        "Core services: " + portfolioAssistantData.services.join(", ") + "."
      ]);
    }

    if (
      normalizedMessage.indexOf("skill") !== -1 ||
      normalizedMessage.indexOf("tool") !== -1 ||
      normalizedMessage.indexOf("stack") !== -1 ||
      normalizedMessage.indexOf("tech") !== -1 ||
      normalizedMessage.indexOf("figma") !== -1 ||
      normalizedMessage.indexOf("react") !== -1
    ) {
      return formatAssistantParagraphs([
        portfolioAssistantData.toolsSummary,
        "Core skills include " + (portfolioAssistantData.skills || []).slice(0, 10).join(", ") + "."
      ]);
    }

    if (
      normalizedMessage.indexOf("project") !== -1 ||
      normalizedMessage.indexOf("portfolio") !== -1 ||
      normalizedMessage.indexOf("work") !== -1 ||
      normalizedMessage.indexOf("real estate") !== -1 ||
      normalizedMessage.indexOf("learneasy") !== -1 ||
      normalizedMessage.indexOf("craving catch") !== -1 ||
      normalizedMessage.indexOf("iway") !== -1 ||
      normalizedMessage.indexOf("pink-blue") !== -1 ||
      normalizedMessage.indexOf("pink blue") !== -1 ||
      normalizedMessage.indexOf("hashnet") !== -1 ||
      normalizedMessage.indexOf("vertu") !== -1
    ) {
      return buildPortfolioProjectsResponse();
    }

    if (
      normalizedMessage.indexOf("available") !== -1 ||
      normalizedMessage.indexOf("freelance") !== -1 ||
      normalizedMessage.indexOf("full-time") !== -1 ||
      normalizedMessage.indexOf("full time") !== -1 ||
      normalizedMessage.indexOf("hire") !== -1
    ) {
      return formatAssistantParagraphs([
        portfolioAssistantData.availability,
        'You can get in touch via <a href="mailto:' + portfolioAssistantData.contact.email + '">' + portfolioAssistantData.contact.email + "</a>."
      ]);
    }

    if (
      normalizedMessage.indexOf("schedule") !== -1 ||
      normalizedMessage.indexOf("book a call") !== -1 ||
      normalizedMessage.indexOf("meeting") !== -1 ||
      normalizedMessage.indexOf("talk to shiva") !== -1 ||
      normalizedMessage.indexOf("talk to siva") !== -1
    ) {
      return formatAssistantParagraphs([
        'Please contact Siva directly at <a href="mailto:' + portfolioAssistantData.contact.email + '">' + portfolioAssistantData.contact.email + "</a> to coordinate a call."
      ]);
    }

    if (
      normalizedMessage.indexOf("who is") !== -1 ||
      normalizedMessage.indexOf("about") !== -1 ||
      normalizedMessage.indexOf("siva") !== -1
    ) {
      return formatAssistantParagraphs([
        portfolioAssistantData.profile.summary,
        "Siva focuses on UX strategy, product design, and research-driven digital experiences."
      ]);
    }

    var resumeSearchResponse = buildResumeSearchFallback(userMessage);

    if (resumeSearchResponse) {
      return resumeSearchResponse;
    }

    return formatAssistantParagraphs([
      portfolioAssistantData.fallback,
      "You can also open the latest resume here: <a href=\"" + portfolioAssistantData.resumeUrl + "\" target=\"_blank\" rel=\"noopener noreferrer\">Open Resume</a>"
    ]);
  }

  async function fetchRemoteResponse(userMessage) {
    if (!portfolioAssistantConfig.apiEndpoint) {
      return null;
    }

    var response = await fetch(portfolioAssistantConfig.apiEndpoint, {
      method: "POST",
      headers: portfolioAssistantConfig.requestHeaders,
      body: JSON.stringify({
        message: userMessage
      })
    });

    if (!response.ok) {
      throw new Error("Portfolio assistant API request failed.");
    }

    var payload = await response.json();

    if (!payload || !payload.reply) {
      throw new Error("Portfolio assistant API response was empty.");
    }

    return payload.reply;
  }

  async function getAssistantResponse(userMessage) {
    await loadLatestResumeData(false);

    try {
      var remoteReply = await fetchRemoteResponse(userMessage);

      if (remoteReply) {
        return remoteReply;
      }
    } catch (error) {
      console.error(error);
    }

    return buildLocalResponse(userMessage);
  }

  async function postBookingJson(path, payload) {
    var response = await fetch(
      portfolioAssistantConfig.bookingApiBaseUrl.replace(/\/$/, "") + path,
      {
        method: "POST",
        headers: portfolioAssistantConfig.requestHeaders,
        body: JSON.stringify(payload)
      }
    );

    var data = await response.json().catch(function() {
      return {};
    });

    if (!response.ok) {
      var requestError = new Error(
        data.error || "Something went wrong while talking to the booking service."
      );
      requestError.data = data;
      throw requestError;
    }

    return data;
  }

  function beginBookingFlow(intentPrompt) {
    resetBookingFlow();
    bookingFlow.active = true;
    bookingFlow.step = "name";
    bookingFlow.draft.intent = intentPrompt;

    appendMessage(
      "assistant",
      buildAssistantHtml({
        paragraphs: [
          "Happy to help.",
          "Let's start with your name."
        ]
      }),
      true
    );
  }

  function buildSlotSelectionMessage(slotPayload, isAlternativeSet) {
    var introLine = isAlternativeSet
      ? "That exact time is unavailable, but here are the closest open options."
      : "Here are the best available time slots I found.";

    return buildAssistantHtml({
      paragraphs: [
        introLine,
        "Choose one option below to continue."
      ],
      summaryHtml:
        "<strong>Requested:</strong> " +
        escapeHtml(bookingFlow.draft.preferredDate) +
        " at " +
        escapeHtml(bookingFlow.draft.preferredTime) +
        "<br><strong>Time zone:</strong> " +
        escapeHtml(bookingFlow.draft.timeZone),
      actions: slotPayload.map(function(slot) {
        return {
          label: slot.label + " (" + slot.timeLabel + ")",
          action: "select-slot",
          value: slot.slotId
        };
      }).concat([
        {
          label: "Start Over",
          action: "restart-booking",
          value: "restart"
        }
      ])
    });
  }

  function buildConfirmationMessage(slot) {
    return buildAssistantHtml({
      paragraphs: [
        "Here is your booking summary.",
        "If everything looks good, confirm and I'll create the calendar invite."
      ],
      summaryHtml:
        "<strong>Name:</strong> " + escapeHtml(bookingFlow.draft.name) +
        "<br><strong>Email:</strong> " + escapeHtml(bookingFlow.draft.email) +
        "<br><strong>Purpose:</strong> " + escapeHtml(bookingFlow.draft.reason) +
        "<br><strong>Date:</strong> " + escapeHtml(slot.dateLabel) +
        "<br><strong>Time:</strong> " + escapeHtml(slot.timeLabel) +
        "<br><strong>Time zone:</strong> " + escapeHtml(slot.visitorTimeZone),
      actions: [
        {
          label: "Confirm Booking",
          action: "confirm-booking",
          value: slot.slotId,
          variant: "primary"
        },
        {
          label: "Choose Another Time",
          action: "restart-booking",
          value: "restart"
        },
        {
          label: "Cancel",
          action: "cancel-booking",
          value: "cancel"
        }
      ]
    });
  }

  async function loadAvailableSlots() {
    bookingFlow.isBusy = true;
    showTypingState("Checking available slots...");

    try {
      var slotResult = await postBookingJson("/booking/slots", {
        preferredDate: bookingFlow.draft.preferredDate,
        preferredTime: bookingFlow.draft.preferredTime,
        timeZone: bookingFlow.draft.timeZone
      });

      hideTypingState();
      bookingFlow.isBusy = false;

      var slotList = slotResult.slots && slotResult.slots.length > 0
        ? slotResult.slots
        : slotResult.alternatives || [];

      if (!slotList.length) {
        appendMessage(
          "assistant",
          buildAssistantHtml({
            paragraphs: [
              "I couldn't find an open slot around that time.",
              "Please try another date or time and I'll check again."
            ],
            actions: [
              {
                label: "Pick Another Date",
                action: "restart-booking",
                value: "restart"
              }
            ],
            statusText: "No open slots found",
            statusType: "error"
          }),
          true
        );
        bookingFlow.step = "preferredDate";
        return;
      }

      bookingFlow.availableSlots = slotList;
      bookingFlow.step = "slotSelect";
      appendMessage(
        "assistant",
        buildSlotSelectionMessage(
          slotList,
          !(slotResult.slots && slotResult.slots.length > 0)
        ),
        true
      );
    } catch (error) {
      hideTypingState();
      bookingFlow.isBusy = false;
      appendMessage(
        "assistant",
        buildAssistantHtml({
          paragraphs: [
            error.message || "I couldn't load slots right now.",
            "Please try again in a moment."
          ],
          statusText: "Booking service unavailable",
          statusType: "error"
        }),
        true
      );
    }
  }

  async function createBooking() {
    if (!bookingFlow.selectedSlot) {
      return;
    }

    bookingFlow.isBusy = true;
    showTypingState("Booking your call...");

    try {
      var bookingResponse = await postBookingJson("/booking/create", {
        name: bookingFlow.draft.name,
        email: bookingFlow.draft.email,
        reason: bookingFlow.draft.reason,
        timeZone: bookingFlow.draft.timeZone,
        startUtc: bookingFlow.selectedSlot.startUtc,
        endUtc: bookingFlow.selectedSlot.endUtc
      });

      hideTypingState();
      bookingFlow.isBusy = false;

      var booking = bookingResponse.booking;
      appendMessage(
        "assistant",
        buildAssistantHtml({
          paragraphs: [
            "Booking confirmed.",
            "I've created the Google Calendar event, generated a fresh Google Meet link, and sent the invite email."
          ],
          summaryHtml:
            "<strong>Date:</strong> " + escapeHtml(booking.dateLabel) +
            "<br><strong>Time:</strong> " + escapeHtml(booking.timeLabel) +
            "<br><strong>Time zone:</strong> " + escapeHtml(booking.timeZone) +
            '<br><strong>Google Meet:</strong> <a href="' + escapeHtml(booking.meetLink) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(booking.meetLink) + "</a>",
          statusText: "Calendar invite sent to both attendees",
          statusType: "success"
        }),
        true
      );

      resetBookingFlow();
    } catch (error) {
      hideTypingState();
      bookingFlow.isBusy = false;

      if (error.data && error.data.alternatives && error.data.alternatives.length) {
        bookingFlow.availableSlots = error.data.alternatives;
        bookingFlow.step = "slotSelect";
        appendMessage(
          "assistant",
          buildSlotSelectionMessage(error.data.alternatives, true),
          true
        );
        return;
      }

      appendMessage(
        "assistant",
        buildAssistantHtml({
          paragraphs: [
            error.message || "I couldn't finish the booking.",
            "Please choose another slot or try again in a moment."
          ],
          actions: bookingFlow.availableSlots.length > 0 ? [
            {
              label: "Pick Another Slot",
              action: "restart-booking",
              value: "restart"
            }
          ] : [],
          statusText: "Booking failed",
          statusType: "error"
        }),
        true
      );

      bookingFlow.step = "slotSelect";
    }
  }

  async function handleBookingStep(rawPrompt) {
    var prompt = String(rawPrompt || "").trim();
    var lowerPrompt = prompt.toLowerCase();

    if (lowerPrompt === "cancel" || lowerPrompt === "stop") {
      resetBookingFlow();
      appendMessage(
        "assistant",
        buildAssistantHtml({
          paragraphs: [
            "No problem. I cancelled the booking flow.",
            "If you'd like to continue later, just send another message."
          ]
        }),
        true
      );
      return;
    }

    if (bookingFlow.step === "name") {
      if (prompt.length < 2) {
        appendMessage("assistant", formatAssistantParagraphs(["Please share your full name so I can book the call correctly."]), true);
        return;
      }

      bookingFlow.draft.name = prompt;
      bookingFlow.step = "email";
      appendMessage("assistant", formatAssistantParagraphs(["Thanks. What's the best email address for the invite?"]), true);
      return;
    }

    if (bookingFlow.step === "email") {
      if (!isValidEmail(prompt)) {
        appendMessage("assistant", formatAssistantParagraphs(["That email doesn't look right. Please enter a valid email address."]), true);
        return;
      }

      bookingFlow.draft.email = prompt;
      bookingFlow.step = "reason";
      appendMessage("assistant", formatAssistantParagraphs(["What is the purpose of the call?"]), true);
      return;
    }

    if (bookingFlow.step === "reason") {
      if (prompt.length < 3) {
        appendMessage("assistant", formatAssistantParagraphs(["Please share a short reason for the call so Siva has context."]), true);
        return;
      }

      bookingFlow.draft.reason = prompt;
      bookingFlow.step = "preferredDate";
      appendMessage("assistant", formatAssistantParagraphs(["What date works best for you? Please use `YYYY-MM-DD`."]), true);
      return;
    }

    if (bookingFlow.step === "preferredDate") {
      if (!isValidDateInput(prompt)) {
        appendMessage("assistant", formatAssistantParagraphs(["Please enter the date in `YYYY-MM-DD` format."]), true);
        return;
      }

      var requestedDate = new Date(prompt + "T00:00:00");
      var today = new Date();
      today.setHours(0, 0, 0, 0);

      if (Number.isNaN(requestedDate.getTime())) {
        appendMessage("assistant", formatAssistantParagraphs(["That date looks invalid. Please use a real calendar date in `YYYY-MM-DD` format."]), true);
        return;
      }

      if (requestedDate < today) {
        appendMessage("assistant", formatAssistantParagraphs(["Please choose a future date."]), true);
        return;
      }

      bookingFlow.draft.preferredDate = prompt;
      bookingFlow.step = "preferredTime";
      appendMessage("assistant", formatAssistantParagraphs(["Great. What time do you prefer? Example: `2:30 PM` or `14:30`."]), true);
      return;
    }

    if (bookingFlow.step === "preferredTime") {
      if (!isValidTimeInput(prompt)) {
        appendMessage("assistant", formatAssistantParagraphs(["Please enter a valid time like `2:30 PM` or `14:30`."]), true);
        return;
      }

      bookingFlow.draft.preferredTime = prompt;
      bookingFlow.step = "timeZone";
      appendMessage(
        "assistant",
        formatAssistantParagraphs([
          "What time zone should I use?",
          "Press Enter to use `" + portfolioAssistantConfig.defaultTimeZone + "`, or type something like `America/New_York`."
        ]),
        true
      );
      return;
    }

    if (bookingFlow.step === "timeZone") {
      var chosenTimeZone = prompt || portfolioAssistantConfig.defaultTimeZone;

      if (!isValidTimeZone(chosenTimeZone)) {
        appendMessage("assistant", formatAssistantParagraphs(["Please enter a valid IANA time zone like `America/Chicago`."]), true);
        return;
      }

      bookingFlow.draft.timeZone = chosenTimeZone;
      await loadAvailableSlots();
    }
  }

  async function handleAssistantAction(action, value, label) {
    if (bookingFlow.isBusy) {
      return;
    }

    if (action === "select-slot") {
      var slot = findSlotById(value);

      if (!slot) {
        appendMessage("assistant", formatAssistantParagraphs(["That slot is no longer available. Please choose another option."]), true);
        return;
      }

      bookingFlow.selectedSlot = slot;
      bookingFlow.step = "confirm";
      appendMessage("user", label || slot.label, false);
      appendMessage("assistant", buildConfirmationMessage(slot), true);
      return;
    }

    if (action === "confirm-booking") {
      appendMessage("user", "Confirm booking", false);
      await createBooking();
      return;
    }

    if (action === "restart-booking") {
      appendMessage("user", "Pick another time", false);
      bookingFlow.step = "preferredDate";
      bookingFlow.selectedSlot = null;
      bookingFlow.availableSlots = [];
      appendMessage(
        "assistant",
        formatAssistantParagraphs([
          "Sure. What new date would you like to try?",
          "Please use `YYYY-MM-DD`."
        ]),
        true
      );
      return;
    }

    if (action === "cancel-booking") {
      appendMessage("user", "Cancel", false);
      resetBookingFlow();
      appendMessage(
        "assistant",
        formatAssistantParagraphs([
          "The booking request has been cancelled.",
          "If you'd like to continue later, just send another message."
        ]),
        true
      );
    }
  }

  async function handlePrompt(prompt) {
    var rawPrompt = String(prompt || "");
    var cleanedPrompt = rawPrompt.trim();

    if (bookingFlow.isBusy) {
      return;
    }

    if (bookingFlow.active) {
      if (!cleanedPrompt && bookingFlow.step !== "timeZone") {
        return;
      }

      appendMessage("user", cleanedPrompt || portfolioAssistantConfig.defaultTimeZone, false);
      input.value = "";
      await handleBookingStep(rawPrompt);
      return;
    }

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
    buildAssistantHtml({
      paragraphs: [
        "Hi, I'm Siva's AI assistant.",
        "Ask me about work, skills, projects, education, or contact details. I answer from the latest resume data when available."
      ]
    }),
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

  messages.addEventListener("click", function(event) {
    var actionButton = event.target.closest("[data-assistant-action]");

    if (!actionButton) {
      return;
    }

    event.preventDefault();
    handleAssistantAction(
      actionButton.getAttribute("data-assistant-action"),
      actionButton.getAttribute("data-assistant-value"),
      actionButton.getAttribute("data-assistant-label")
    );
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
