"use client";
import { useEffect, useState } from "react";
import { backgroundPath, layerOpacities, type LightWeights, type WeatherCondition } from "./weather-light";
import styles from "./DashboardCards.module.css";

const phases = ["night","day","dusk","dawn"] as const;
export default function WeatherBackdrop({condition,weights}:{condition:WeatherCondition;weights:LightWeights}) {
  const [scene,setScene] = useState<{active:WeatherCondition;previous:WeatherCondition|null}>({active:"clear",previous:null});
  useEffect(() => {
    let active = true;
    // Decode the new condition's four assets before exposing it; keep the previous
    // scene visible if an image cannot be loaded.
    void Promise.all(phases.map(phase => { const image = new Image(); image.src = backgroundPath(condition,phase); return image.decode(); }))
      .then(() => { if (active) setScene(old => old.active === condition ? old : {active:condition,previous:old.active}); }).catch(() => {});
    return () => { active = false; };
  }, [condition]);
  useEffect(() => {
    if (!scene.previous) return;
    const timer = setTimeout(() => setScene(old => ({...old,previous:null})),3500);
    return () => clearTimeout(timer);
  }, [scene.active,scene.previous]);
  const opacity = layerOpacities(weights);
  const group = (name:WeatherCondition,enter:boolean) => <div key={name} className={`${styles.weatherScene} ${enter ? styles.weatherSceneEnter : ""}`}>
    {phases.map(phase => <div key={phase} className={styles.weatherLayer} style={{backgroundImage:`url('${backgroundPath(name,phase)}')`,opacity:opacity[phase]}} />)}
  </div>;
  return <div className={styles.weatherBackdrop} aria-hidden="true">{scene.previous && group(scene.previous,false)}{group(scene.active,Boolean(scene.previous))}</div>;
}
