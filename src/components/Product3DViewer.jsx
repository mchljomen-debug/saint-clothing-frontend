import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import "@google/model-viewer";

const Product3DViewer = forwardRef(
  (
    {
      modelUrl,
      videoUrl = "",
      imageUrl = "",
      productName = "Product",
      className = "",
    },
    ref
  ) => {
    const viewerRef = useRef(null);

    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [autoRotate, setAutoRotate] = useState(false);

    const fileName = String(modelUrl || "").toLowerCase();

    const isVideo =
      fileName.endsWith(".mp4") ||
      fileName.endsWith(".webm") ||
      fileName.endsWith(".ogg");

    const is3DModel =
      fileName.endsWith(".glb") ||
      fileName.endsWith(".gltf");

    /* =========================================================
       IMPERATIVE CONTROLS
    ========================================================= */

    useImperativeHandle(ref, () => ({
      zoomIn() {
        const viewer = viewerRef.current;

        if (!viewer) return;

        try {
          const orbit = viewer.getCameraOrbit();

          const radius = Math.max(
            Number(orbit.radius) - 0.25,
            0.7
          );

          viewer.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${radius}m`;
        } catch (error) {
          console.error("3D ZOOM IN ERROR:", error);
        }
      },

      zoomOut() {
        const viewer = viewerRef.current;

        if (!viewer) return;

        try {
          const orbit = viewer.getCameraOrbit();

          const radius = Math.min(
            Number(orbit.radius) + 0.25,
            5
          );

          viewer.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${radius}m`;
        } catch (error) {
          console.error("3D ZOOM OUT ERROR:", error);
        }
      },

      reset() {
        const viewer = viewerRef.current;

        if (!viewer) return;

        try {
          viewer.cameraOrbit = "0deg 75deg 2.2m";
          viewer.fieldOfView = "30deg";
        } catch (error) {
          console.error("3D RESET ERROR:", error);
        }
      },

      toggleAutoRotate() {
        const viewer = viewerRef.current;

        if (!viewer) return false;

        const currentlyRotating =
          viewer.hasAttribute("auto-rotate");

        if (currentlyRotating) {
          viewer.removeAttribute("auto-rotate");
        } else {
          viewer.setAttribute("auto-rotate", "");
        }

        setAutoRotate(!currentlyRotating);

        return !currentlyRotating;
      },

      getViewer() {
        return viewerRef.current;
      },
    }));

    /* =========================================================
       RESET STATE WHEN MODEL CHANGES
    ========================================================= */

    useEffect(() => {
      setHasError(false);
      setIsLoaded(false);
      setAutoRotate(false);
    }, [modelUrl]);

    /* =========================================================
       MODEL EVENTS
    ========================================================= */

    const handleModelLoad = () => {
      console.log("3D MODEL LOADED:", modelUrl);

      setHasError(false);
      setIsLoaded(true);

      const viewer = viewerRef.current;

      if (!viewer) return;

      try {
        viewer.cameraOrbit = "0deg 75deg 2.2m";
        viewer.fieldOfView = "30deg";
      } catch (error) {
        console.error("CAMERA SETUP ERROR:", error);
      }
    };

    const handleModelError = (event) => {
      console.error("========== 3D MODEL ERROR ==========");
      console.error("URL:", modelUrl);
      console.error("Event:", event);
      console.error("====================================");

      setHasError(true);
      setIsLoaded(false);
    };

    /* =========================================================
       AUTO ROTATE
    ========================================================= */

    const toggleAutoRotate = () => {
      const viewer = viewerRef.current;

      if (!viewer) return;

      const currentlyRotating =
        viewer.hasAttribute("auto-rotate");

      if (currentlyRotating) {
        viewer.removeAttribute("auto-rotate");
        setAutoRotate(false);
      } else {
        viewer.setAttribute("auto-rotate", "");
        setAutoRotate(true);
      }
    };

    /* =========================================================
       RESET CAMERA
    ========================================================= */

    const resetCamera = () => {
      const viewer = viewerRef.current;

      if (!viewer) return;

      try {
        viewer.cameraOrbit = "0deg 75deg 2.2m";
        viewer.fieldOfView = "30deg";
      } catch (error) {
        console.error("RESET CAMERA ERROR:", error);
      }
    };

    /* =========================================================
       ZOOM
    ========================================================= */

    const zoomIn = () => {
      const viewer = viewerRef.current;

      if (!viewer) return;

      try {
        const orbit = viewer.getCameraOrbit();

        const radius = Math.max(
          Number(orbit.radius) - 0.25,
          0.7
        );

        viewer.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${radius}m`;
      } catch (error) {
        console.error("ZOOM IN ERROR:", error);
      }
    };

    const zoomOut = () => {
      const viewer = viewerRef.current;

      if (!viewer) return;

      try {
        const orbit = viewer.getCameraOrbit();

        const radius = Math.min(
          Number(orbit.radius) + 0.25,
          5
        );

        viewer.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${radius}m`;
      } catch (error) {
        console.error("ZOOM OUT ERROR:", error);
      }
    };

    /* =========================================================
       NO PREVIEW
    ========================================================= */

    if (!modelUrl && !videoUrl && !imageUrl) {
      return (
        <div
          className={`relative flex h-full w-full items-center justify-center bg-[#f5f4f0] ${className}`}
        >
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40">
              Saint / Preview
            </p>

            <h2 className="mt-4 text-4xl font-black uppercase tracking-[-0.06em]">
              No Preview
            </h2>

            <p className="mt-3 text-xs font-medium text-black/40">
              No 3D model or preview was attached.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`group relative h-full w-full overflow-hidden bg-[#f5f4f0] text-[#0A0D17] ${className}`}
      >
        {/* =====================================================
            BACKGROUND
        ===================================================== */}

        <div className="pointer-events-none absolute inset-0">
          {/* Main background */}
          <div className="absolute inset-0 bg-[#f5f4f0]" />

          {/* Soft center spotlight */}
          <div className="absolute left-1/2 top-1/2 h-[75%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-3xl" />

          {/* Giant typography */}
          <div className="absolute -left-[4vw] top-[4%] select-none text-[24vw] font-black uppercase leading-[0.72] tracking-[-0.12em] text-black/[0.035]">
            SAINT
          </div>

          {/* Vertical technical line */}
          <div className="absolute left-[8%] top-0 hidden h-full w-px bg-black/[0.06] lg:block" />

          {/* Horizontal technical line */}
          <div className="absolute left-0 right-0 top-[18%] h-px bg-black/[0.06]" />

          <div className="absolute left-0 right-0 top-[82%] h-px bg-black/[0.06]" />
        </div>

        {/* =====================================================
            TOP METADATA
        ===================================================== */}

        <div className="pointer-events-none absolute left-5 right-5 top-5 z-30 flex items-start justify-between md:left-8 md:right-8 md:top-7">
          {/* Left */}
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-black md:w-10" />

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-black/45 md:text-[9px]">
                Saint Clothing
              </p>

              <p className="mt-1 text-[8px] font-black uppercase tracking-[0.25em] text-black/25">
                Interactive Product
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-black/35 md:text-[9px]">
              3D / 01
            </p>

            <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.2em] text-black/20">
              Studio Preview
            </p>
          </div>
        </div>

        {/* =====================================================
            CORNER BRACKETS
        ===================================================== */}

        <div className="pointer-events-none absolute left-5 top-16 z-20 h-8 w-8 border-l border-t border-black/25 md:left-8 md:top-20" />

        <div className="pointer-events-none absolute right-5 top-16 z-20 h-8 w-8 border-r border-t border-black/25 md:right-8 md:top-20" />

        <div className="pointer-events-none absolute bottom-16 left-5 z-20 h-8 w-8 border-b border-l border-black/25 md:bottom-20 md:left-8" />

        <div className="pointer-events-none absolute bottom-16 right-5 z-20 h-8 w-8 border-b border-r border-black/25 md:bottom-20 md:right-8" />

        {/* =====================================================
            PRODUCT TITLE
        ===================================================== */}

        <div className="pointer-events-none absolute bottom-7 left-5 z-30 md:bottom-8 md:left-8">
          <p className="text-[8px] font-black uppercase tracking-[0.35em] text-black/30">
            Product
          </p>

          <h2 className="mt-1 max-w-[250px] truncate text-sm font-black uppercase tracking-[-0.03em] md:text-base">
            {productName}
          </h2>
        </div>

        {/* =====================================================
            MODEL STATUS
        ===================================================== */}

        <div className="pointer-events-none absolute bottom-7 right-5 z-30 text-right md:bottom-8 md:right-8">
          <div className="flex items-center justify-end gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                hasError
                  ? "bg-red-500"
                  : isLoaded
                  ? "bg-black"
                  : "bg-black/20"
              }`}
            />

            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-black/35">
              {hasError
                ? "Model Error"
                : isLoaded
                ? "Model Ready"
                : "Connecting"}
            </p>
          </div>
        </div>

        {/* =====================================================
            VIDEO
        ===================================================== */}

        {isVideo ? (
          <video
            src={modelUrl}
            controls
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            className="relative z-10 h-full w-full object-contain"
            onLoadedData={() => {
              setHasError(false);
              setIsLoaded(true);
            }}
            onError={(event) => {
              console.error("VIDEO ERROR:", event);

              setHasError(true);
              setIsLoaded(false);
            }}
          />
        ) : is3DModel ? (
          /* ===================================================
             MODEL VIEWER
          =================================================== */

          <model-viewer
            ref={viewerRef}
            src={modelUrl}
            alt={productName}
            camera-controls
            touch-action="none"
            interaction-prompt="none"
            loading="eager"
            reveal="auto"
            shadow-intensity="1"
            shadow-softness="0.8"
            exposure="1"
            environment-image="neutral"
            camera-orbit="0deg 75deg 2.2m"
            field-of-view="30deg"
            min-camera-orbit="auto auto 0.7m"
            max-camera-orbit="auto auto 5m"
            rotation-per-second="18deg"
            crossorigin="anonymous"
            style={{
              position: "relative",
              zIndex: 10,
              width: "100%",
              height: "100%",
              display: "block",
              background: "transparent",

              /* IMPORTANT:
                 Allow manual drag rotation */
              touchAction: "none",

              /* Prevent browser selection */
              userSelect: "none",
            }}
            onLoad={handleModelLoad}
            onError={handleModelError}
          />
        ) : imageUrl ? (
          /* ===================================================
             IMAGE FALLBACK
          =================================================== */

          <div className="relative z-10 flex h-full w-full items-center justify-center">
            <img
              src={imageUrl}
              alt={productName}
              className="h-full w-full object-contain p-10 transition duration-700 group-hover:scale-[1.02]"
            />
          </div>
        ) : (
          /* ===================================================
             UNSUPPORTED
          =================================================== */

          <div className="relative z-10 flex h-full w-full items-center justify-center text-center">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/35">
                Saint / Preview
              </p>

              <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.06em]">
                Preview
                <br />
                Not Supported
              </h2>

              <p className="mt-4 text-xs font-medium text-black/40">
                This file type cannot be previewed.
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            ERROR PANEL
        ===================================================== */}

        {hasError && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#f5f4f0]/90 p-6 backdrop-blur-sm">
            <div className="relative max-w-sm text-center">
              {/* Technical corner */}
              <div className="absolute -left-4 -top-4 h-5 w-5 border-l border-t border-red-500/40" />

              <div className="absolute -bottom-4 -right-4 h-5 w-5 border-b border-r border-red-500/40" />

              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-red-500">
                Error / 03
              </p>

              <h2 className="mt-4 text-4xl font-black uppercase leading-[0.85] tracking-[-0.07em]">
                Model
                <br />
                Unavailable.
              </h2>

              <p className="mt-5 text-xs font-medium leading-6 text-black/45">
                The 3D model could not be loaded. Please check the model
                storage URL or connection.
              </p>

              {modelUrl && (
                <a
                  href={modelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex border border-black bg-black px-5 py-3 text-[9px] font-black uppercase tracking-[0.25em] text-white transition hover:bg-transparent hover:text-black"
                >
                  Open Model
                </a>
              )}
            </div>
          </div>
        )}

        {/* =====================================================
            CONTROLS
        ===================================================== */}

        {is3DModel && (
          <div className="absolute bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 border border-black/10 bg-[#f5f4f0]/90 p-1 shadow-sm backdrop-blur-md md:bottom-8">
            {/* Zoom Out */}
            <button
              type="button"
              onClick={zoomOut}
              className="flex h-8 w-8 items-center justify-center text-sm font-medium text-black/60 transition hover:bg-black hover:text-white"
              aria-label="Zoom out"
            >
              −
            </button>

            {/* Divider */}
            <span className="h-4 w-px bg-black/10" />

            {/* Reset */}
            <button
              type="button"
              onClick={resetCamera}
              className="flex h-8 items-center justify-center px-3 text-[8px] font-black uppercase tracking-[0.2em] text-black/50 transition hover:bg-black hover:text-white"
            >
              Reset
            </button>

            {/* Divider */}
            <span className="h-4 w-px bg-black/10" />

            {/* Zoom In */}
            <button
              type="button"
              onClick={zoomIn}
              className="flex h-8 w-8 items-center justify-center text-sm font-medium text-black/60 transition hover:bg-black hover:text-white"
              aria-label="Zoom in"
            >
              +
            </button>

            {/* Divider */}
            <span className="h-4 w-px bg-black/10" />

            {/* Auto Rotate */}
            <button
              type="button"
              onClick={toggleAutoRotate}
              className={`flex h-8 items-center justify-center px-3 text-[8px] font-black uppercase tracking-[0.2em] transition ${
                autoRotate
                  ? "bg-black text-white"
                  : "text-black/50 hover:bg-black hover:text-white"
              }`}
            >
              {autoRotate ? "Rotate On" : "Rotate"}
            </button>
          </div>
        )}

        {/* =====================================================
            INTERACTION HINT
        ===================================================== */}

        {is3DModel && !hasError && (
          <div className="pointer-events-none absolute left-1/2 top-[20%] z-20 -translate-x-1/2 opacity-0 transition duration-500 group-hover:opacity-100">
            <div className="flex items-center gap-3 border border-black/10 bg-[#f5f4f0]/80 px-4 py-2 backdrop-blur-sm">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-black/40">
                Drag to rotate
              </span>
            </div>
          </div>
        )}

        {/* =====================================================
            TECHNICAL SIDE LABEL
        ===================================================== */}

        <div className="pointer-events-none absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rotate-90 lg:block">
          <p className="text-[8px] font-black uppercase tracking-[0.45em] text-black/20">
            Saint / Digital Product Archive
          </p>
        </div>
      </div>
    );
  }
);

Product3DViewer.displayName = "Product3DViewer";

export default Product3DViewer;