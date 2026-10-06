export type WeatherCondition = "clear" | "cloudy" | "rain" | "snow";
export type LightPhase = "night" | "dawn" | "day" | "dusk";
export type LightWeights = Record<LightPhase, number>;
const fade = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };

// Unix timestamps already represent the selected location's sunrise/sunset.
// Each half of dawn/dusk lasts 45 minutes, with a smooth continuous dissolve.
export function daylightWeights(now: number, sunrise: number, sunset: number): LightWeights {
  const result: LightWeights = { night:0, dawn:0, day:0, dusk:0 };
  if (![now,sunrise,sunset].every(Number.isFinite) || sunrise <= 0 || sunset <= sunrise) return {...result,day:1};
  const span = Math.min(2700, (sunset - sunrise) / 4);
  if (now < sunrise - span || now >= sunset + span) result.night = 1;
  else if (now < sunrise) { result.dawn = fade((now - sunrise + span) / span); result.night = 1 - result.dawn; }
  else if (now < sunrise + span) { result.day = fade((now - sunrise) / span); result.dawn = 1 - result.day; }
  else if (now < sunset - span) result.day = 1;
  else if (now < sunset) { result.dusk = fade((now - sunset + span) / span); result.day = 1 - result.dusk; }
  else { result.night = fade((now - sunset) / span); result.dusk = 1 - result.night; }
  return result;
}

export function backgroundPath(condition: WeatherCondition, phase: LightPhase) {
  if (condition === "clear") return `/images/weather/${({day:"dashboard-preview",dusk:"dashboard-sunset",night:"dashboard-night",dawn:"clear-dawn"})[phase]}.png`;
  return `/images/weather/${condition}-${phase}.png`;
}

// Convert desired image weights to CSS alpha for stacked layers without darkening.
export function layerOpacities(weights: LightWeights): LightWeights {
  const dayBase = weights.night + weights.day;
  const duskBase = dayBase + weights.dusk;
  return {night:1,day:dayBase ? weights.day/dayBase : 0,dusk:duskBase ? weights.dusk/duskBase : 0,dawn:weights.dawn};
}
