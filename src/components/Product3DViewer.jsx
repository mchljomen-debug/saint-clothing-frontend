import React,{forwardRef,useCallback,useEffect,useImperativeHandle,useRef,useState}from"react";
import"@google/model-viewer";

const Product3DViewer=forwardRef(({modelUrl,videoUrl="",imageUrl="",productName="Product",className=""},ref)=>{
  const viewerRef=useRef(null);
  const[hasError,setHasError]=useState(false);
  const[isLoaded,setIsLoaded]=useState(false);
  const[autoRotate,setAutoRotate]=useState(false);
  const[textureStatus,setTextureStatus]=useState("checking");

  const cleanModelUrl=String(modelUrl||"").trim();
  const cleanVideoUrl=String(videoUrl||"").trim();
  const cleanImageUrl=String(imageUrl||"").trim();
  const fileName=cleanModelUrl.toLowerCase().split("?")[0].split("#")[0];

  const isVideo=fileName.endsWith(".mp4")||fileName.endsWith(".webm")||fileName.endsWith(".ogg");
  const is3DModel=fileName.endsWith(".glb")||fileName.endsWith(".gltf");

  const setDefaultCamera=useCallback(()=>{
    const viewer=viewerRef.current;
    if(!viewer)return;

    try{
      viewer.cameraOrbit="0deg 75deg 2.2m";
      viewer.fieldOfView="30deg";
      viewer.jumpCameraToGoal?.();
    }catch(error){
      console.error("[3D] CAMERA ERROR:",error);
    }
  },[]);

  const zoomIn=useCallback(()=>{
    const viewer=viewerRef.current;
    if(!viewer)return;

    try{
      const orbit=viewer.getCameraOrbit();
      const radius=Math.max(Number(orbit.radius)-0.25,0.7);
      viewer.cameraOrbit=`${orbit.theta}rad ${orbit.phi}rad ${radius}m`;
      viewer.jumpCameraToGoal?.();
    }catch(error){
      console.error("[3D] ZOOM IN ERROR:",error);
    }
  },[]);

  const zoomOut=useCallback(()=>{
    const viewer=viewerRef.current;
    if(!viewer)return;

    try{
      const orbit=viewer.getCameraOrbit();
      const radius=Math.min(Number(orbit.radius)+0.25,5);
      viewer.cameraOrbit=`${orbit.theta}rad ${orbit.phi}rad ${radius}m`;
      viewer.jumpCameraToGoal?.();
    }catch(error){
      console.error("[3D] ZOOM OUT ERROR:",error);
    }
  },[]);

  const resetCamera=useCallback(()=>{
    setDefaultCamera();
  },[setDefaultCamera]);

  const toggleAutoRotate=useCallback(()=>{
    const viewer=viewerRef.current;
    if(!viewer)return false;

    const currentlyRotating=viewer.hasAttribute("auto-rotate");

    if(currentlyRotating){
      viewer.removeAttribute("auto-rotate");
      setAutoRotate(false);
      return false;
    }

    viewer.setAttribute("auto-rotate","");
    setAutoRotate(true);
    return true;
  },[]);

  useImperativeHandle(ref,()=>({
    zoomIn,
    zoomOut,
    reset:resetCamera,
    toggleAutoRotate,
    getViewer(){
      return viewerRef.current;
    }
  }),[zoomIn,zoomOut,resetCamera,toggleAutoRotate]);

  useEffect(()=>{
    setHasError(false);
    setIsLoaded(false);
    setAutoRotate(false);
    setTextureStatus("checking");

    const viewer=viewerRef.current;

    if(viewer){
      viewer.removeAttribute("auto-rotate");
    }
  },[cleanModelUrl]);

  const inspectModel=useCallback(async()=>{
    const viewer=viewerRef.current;
    if(!viewer)return;

    try{
      const model=viewer.model;

      console.log("========================================");
      console.log("[3D] MODEL INSPECTION");
      console.log("[3D] URL:",cleanModelUrl);
      console.log("[3D] FILE TYPE:",fileName.split(".").pop()?.toUpperCase()||"UNKNOWN");

      if(!model){
        console.warn("[3D] MODEL API UNAVAILABLE");
        console.log("========================================");
        setTextureStatus("unknown");
        return;
      }

      const materials=Array.from(model.materials||[]);

      console.log("[3D] MATERIAL COUNT:",materials.length);

      if(materials.length===0){
        console.warn("[3D] NO MATERIALS FOUND IN MODEL");
        setTextureStatus("missing");
        console.log("========================================");
        return;
      }

      let textureCount=0;

      materials.forEach((material,index)=>{
        try{
          const pbr=material.pbrMetallicRoughness;
          const baseColorTexture=pbr?.baseColorTexture?.texture||null;
          const normalTexture=material.normalTexture?.texture||null;
          const emissiveTexture=material.emissiveTexture?.texture||null;
          const metallicRoughnessTexture=pbr?.metallicRoughnessTexture?.texture||null;
          const occlusionTexture=material.occlusionTexture?.texture||null;

          if(baseColorTexture)textureCount++;

          console.log("----------------------------------------");
          console.log(`[3D] MATERIAL ${index}`);
          console.log("[3D] NAME:",material.name||`Material ${index}`);
          console.log("[3D] BASE COLOR FACTOR:",pbr?.baseColorFactor);
          console.log("[3D] BASE COLOR TEXTURE:",baseColorTexture);
          console.log("[3D] METALLIC FACTOR:",pbr?.metallicFactor);
          console.log("[3D] ROUGHNESS FACTOR:",pbr?.roughnessFactor);
          console.log("[3D] METALLIC ROUGHNESS TEXTURE:",metallicRoughnessTexture);
          console.log("[3D] NORMAL TEXTURE:",normalTexture);
          console.log("[3D] EMISSIVE TEXTURE:",emissiveTexture);
          console.log("[3D] OCCLUSION TEXTURE:",occlusionTexture);
          console.log("[3D] ALPHA MODE:",material.alphaMode);
          console.log("[3D] DOUBLE SIDED:",material.doubleSided);

          if(!baseColorTexture){
            console.warn(`[3D] MATERIAL ${index} HAS NO BASE COLOR TEXTURE`);
          }
        }catch(error){
          console.error(`[3D] MATERIAL ${index} INSPECTION ERROR:`,error);
        }
      });

      console.log("----------------------------------------");
      console.log("[3D] MATERIALS:",materials.length);
      console.log("[3D] MATERIALS WITH BASE COLOR TEXTURE:",textureCount);

      if(textureCount>0){
        console.log("[3D] TEXTURE STATUS: TEXTURE FOUND");
        setTextureStatus("found");
      }else{
        console.warn("[3D] TEXTURE STATUS: NO BASE COLOR TEXTURE FOUND");
        console.warn("[3D] If this model should have graphics/colors, check the Blender material and GLB export.");
        setTextureStatus("missing");
      }

      console.log("========================================");
    }catch(error){
      console.error("[3D] MODEL INSPECTION ERROR:",error);
      setTextureStatus("unknown");
    }
  },[cleanModelUrl,fileName]);

  const refreshMaterials=useCallback(async()=>{
    const viewer=viewerRef.current;
    if(!viewer?.model)return;

    try{
      const materials=Array.from(viewer.model.materials||[]);

      for(const material of materials){
        const pbr=material?.pbrMetallicRoughness;

        try{
          const baseColorTexture=pbr?.baseColorTexture?.texture;

          if(baseColorTexture){
            const source=baseColorTexture.source;

            if(source){
              console.log("[3D] BASE COLOR TEXTURE SOURCE:",source);
            }
          }
        }catch(error){
          console.log("[3D] TEXTURE REFRESH SKIPPED:",error?.message||error);
        }
      }
    }catch(error){
      console.error("[3D] MATERIAL REFRESH ERROR:",error);
    }
  },[]);

  const handleModelLoad=useCallback(async()=>{
    console.log("========================================");
    console.log("[3D] MODEL LOADED");
    console.log("[3D] URL:",cleanModelUrl);
    console.log("========================================");

    setHasError(false);
    setIsLoaded(true);
    setDefaultCamera();

    window.setTimeout(async()=>{
      await refreshMaterials();
      await inspectModel();
    },700);
  },[cleanModelUrl,inspectModel,refreshMaterials,setDefaultCamera]);

  const handleModelError=useCallback((event)=>{
    console.error("========================================");
    console.error("[3D] MODEL ERROR");
    console.error("[3D] URL:",cleanModelUrl);
    console.error("[3D] EVENT:",event);
    console.error("========================================");

    setHasError(true);
    setIsLoaded(false);
    setTextureStatus("unknown");
  },[cleanModelUrl]);

  if(!cleanModelUrl&&!cleanVideoUrl&&!cleanImageUrl){
    return(
      <div className={`relative flex h-full w-full items-center justify-center bg-[#f5f4f0] ${className}`}>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/40">Saint / Preview</p>
          <h2 className="mt-4 text-4xl font-black uppercase tracking-[-0.06em]">No Preview</h2>
          <p className="mt-3 text-xs font-medium text-black/40">No 3D model or preview was attached.</p>
        </div>
      </div>
    );
  }

  return(
    <div className={`group relative h-full w-full overflow-hidden bg-[#f5f4f0] text-[#0A0D17] ${className}`}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[#f5f4f0]"/>
        <div className="absolute left-1/2 top-1/2 h-[75%] w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-3xl"/>
        <div className="absolute -left-[4vw] top-[4%] select-none text-[24vw] font-black uppercase leading-[0.72] tracking-[-0.12em] text-black/[0.035]">SAINT</div>
        <div className="absolute left-[8%] top-0 hidden h-full w-px bg-black/[0.06] lg:block"/>
        <div className="absolute left-0 right-0 top-[18%] h-px bg-black/[0.06]"/>
        <div className="absolute left-0 right-0 top-[82%] h-px bg-black/[0.06]"/>
      </div>

      <div className="pointer-events-none absolute left-5 right-5 top-5 z-30 flex items-start justify-between md:left-8 md:right-8 md:top-7">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-black md:w-10"/>
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-black/70 md:text-[9px]">Saint Clothing</p>
            <p className="mt-1 text-[8px] font-black uppercase tracking-[0.25em] text-black/25">Interactive Product</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-black/35 md:text-[9px]">3D / 01</p>
          <p className="mt-1 text-[8px] font-medium uppercase tracking-[0.2em] text-black/20">Studio Preview</p>
        </div>
      </div>

      <div className="pointer-events-none absolute left-5 top-16 z-20 h-8 w-8 border-l border-t border-black/25 md:left-8 md:top-20"/>
      <div className="pointer-events-none absolute right-5 top-16 z-20 h-8 w-8 border-r border-t border-black/25 md:right-8 md:top-20"/>
      <div className="pointer-events-none absolute bottom-16 left-5 z-20 h-8 w-8 border-b border-l border-black/25 md:bottom-20 md:left-8"/>
      <div className="pointer-events-none absolute bottom-16 right-5 z-20 h-8 w-8 border-b border-r border-black/25 md:bottom-20 md:right-8"/>

      <div className="pointer-events-none absolute bottom-7 left-5 z-30 md:bottom-8 md:left-8">
        <p className="text-[8px] font-black uppercase tracking-[0.35em] text-black/30">Product</p>
        <h2 className="mt-1 max-w-[250px] truncate text-sm font-black uppercase tracking-[-0.03em] md:text-base">{productName}</h2>
      </div>

      <div className="pointer-events-none absolute bottom-7 right-5 z-30 text-right md:bottom-8 md:right-8">
        <div className="flex items-center justify-end gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${hasError?"bg-red-500":isLoaded?"bg-black":"bg-black/20"}`}/>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-black/35">
            {hasError?"Model Error":isLoaded?"Model Ready":"Connecting"}
          </p>
        </div>

        {isLoaded&&is3DModel&&(
          <p className={`mt-1 text-[7px] font-black uppercase tracking-[0.18em] ${
            textureStatus==="missing"
              ?"text-red-500"
              :textureStatus==="found"
                ?"text-black/35"
                :"text-black/20"
          }`}>
            {textureStatus==="found"
              ?"Texture Detected"
              :textureStatus==="missing"
                ?"Texture Missing"
                :"Checking Material"}
          </p>
        )}
      </div>

      {isVideo?(
        <video
          src={cleanModelUrl}
          controls
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="relative z-10 h-full w-full object-contain"
          onLoadedData={()=>{
            setHasError(false);
            setIsLoaded(true);
          }}
          onError={(event)=>{
            console.error("[3D] VIDEO ERROR:",event);
            setHasError(true);
            setIsLoaded(false);
          }}
        />
      ):is3DModel?(
        <model-viewer
          ref={viewerRef}
          src={cleanModelUrl}
          alt={productName}
          camera-controls
          touch-action="none"
          interaction-prompt="none"
          loading="eager"
          reveal="auto"
          shadow-intensity="0.7"
          shadow-softness="1"
          exposure="1"
          tone-mapping="neutral"
          camera-orbit="0deg 75deg 2.2m"
          field-of-view="30deg"
          min-camera-orbit="auto auto 0.7m"
          max-camera-orbit="auto auto 5m"
          rotation-per-second="18deg"
          crossorigin="anonymous"
          style={{
            position:"relative",
            zIndex:10,
            width:"100%",
            height:"100%",
            display:"block",
            background:"transparent",
            touchAction:"none",
            userSelect:"none"
          }}
          onLoad={handleModelLoad}
          onError={handleModelError}
        />
      ):cleanVideoUrl?(
        <video
          src={cleanVideoUrl}
          controls
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="relative z-10 h-full w-full object-contain"
          onLoadedData={()=>{
            setHasError(false);
            setIsLoaded(true);
          }}
          onError={(event)=>{
            console.error("[3D] VIDEO ERROR:",event);
            setHasError(true);
            setIsLoaded(false);
          }}
        />
      ):cleanImageUrl?(
        <div className="relative z-10 flex h-full w-full items-center justify-center">
          <img
            src={cleanImageUrl}
            alt={productName}
            className="h-full w-full object-contain p-10 transition duration-700 group-hover:scale-[1.02]"
          />
        </div>
      ):(
        <div className="relative z-10 flex h-full w-full items-center justify-center text-center">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-black/35">Saint / Preview</p>
            <h2 className="mt-4 text-3xl font-black uppercase tracking-[-0.06em]">Preview<br/>Not Supported</h2>
            <p className="mt-4 text-xs font-medium text-black/40">This file type cannot be previewed.</p>
          </div>
        </div>
      )}

      {hasError&&(
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#f5f4f0]/90 p-6 backdrop-blur-sm">
          <div className="relative max-w-sm text-center">
            <div className="absolute -left-4 -top-4 h-5 w-5 border-l border-t border-red-500/40"/>
            <div className="absolute -bottom-4 -right-4 h-5 w-5 border-b border-r border-red-500/40"/>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-red-500">Error / 03</p>
            <h2 className="mt-4 text-4xl font-black uppercase leading-[0.85] tracking-[-0.07em]">Model<br/>Unavailable.</h2>
            <p className="mt-5 text-xs font-medium leading-7">The 3D model could not be loaded. Please check the model storage URL or connection.</p>

            {cleanModelUrl&&(
              <a
                href={cleanModelUrl}
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

      {is3DModel&&(
        <div className="absolute bottom-20 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 border border-black/10 bg-[#f5f4f0]/90 p-1 shadow-sm backdrop-blur-md md:bottom-8">
          <button
            type="button"
            onClick={zoomOut}
            className="flex h-8 w-8 items-center justify-center text-sm font-medium text-black/60 transition hover:bg-black hover:text-white"
            aria-label="Zoom out"
          >
            −
          </button>

          <span className="h-4 w-px bg-black/10"/>

          <button
            type="button"
            onClick={resetCamera}
            className="flex h-8 items-center justify-center px-3 text-[8px] font-black uppercase tracking-[0.2em] text-black/50 transition hover:bg-black hover:text-white"
          >
            Reset
          </button>

          <span className="h-4 w-px bg-black/10"/>

          <button
            type="button"
            onClick={zoomIn}
            className="flex h-8 w-8 items-center justify-center text-sm font-medium text-black/60 transition hover:bg-black hover:text-white"
            aria-label="Zoom in"
          >
            +
          </button>

          <span className="h-4 w-px bg-black/10"/>

          <button
            type="button"
            onClick={toggleAutoRotate}
            className={`flex h-8 items-center justify-center px-3 text-[8px] font-black uppercase tracking-[0.2em] transition ${autoRotate?"bg-black text-white":"text-black/50 hover:bg-black hover:text-white"}`}
          >
            {autoRotate?"Rotate On":"Rotate"}
          </button>
        </div>
      )}

      {is3DModel&&!hasError&&(
        <div className="pointer-events-none absolute left-1/2 top-[20%] z-20 -translate-x-1/2 opacity-0 transition duration-500 group-hover:opacity-100">
          <div className="flex items-center gap-3 border border-black/10 bg-[#f5f4f0]/80 px-4 py-2 backdrop-blur-sm">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-black/40">Drag to rotate</span>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute right-3 top-1/2 z-20 hidden -translate-y-1/2 rotate-90 lg:block">
        <p className="text-[8px] font-black uppercase tracking-[0.45em] text-black/20">Saint / Digital Product Archive</p>
      </div>
    </div>
  );
});

Product3DViewer.displayName="Product3DViewer";

export default Product3DViewer;