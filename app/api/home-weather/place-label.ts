export type AddressProperties = { name?:string; state?:string; city?:string; county?:string; district?:string; locality?:string; countrycode?:string; type?:string; osm_key?:string };
export type AddressFeature = { properties:AddressProperties; geometry:{ coordinates:number[] } };
const join=(parts:(string|undefined)[]) => [...new Set(parts.filter((part):part is string=>Boolean(part)))].join(" ");
export function labelPlace(properties:AddressProperties) {
  const {state,city,county,district,name}=properties;
  const nameParts=new Set((name||"").split(" "));
  const parents=[state,city,county].filter(value=>value&&!nameParts.has(value));
  return {name:join([...parents,district===name?undefined:district,name]),displayName:join([...parents,name])};
}
export function addressPlaces(features:AddressFeature[]) {
  const seen=new Set<string>();
  return features.flatMap(feature=>{
    const properties=feature.properties;
    const [lon,lat]=feature.geometry.coordinates;
    if (properties.countrycode!=="KR" || !properties.name || !Number.isFinite(lat) || !Number.isFinite(lon)) return [];
    if (properties.osm_key && !['place','boundary'].includes(properties.osm_key)) return [];
    if (!['locality','district','city','county','state'].includes(properties.type||"")) return [];
    const labels=labelPlace(properties);
    const key=`${labels.name}:${lat.toFixed(4)}:${lon.toFixed(4)}`;
    if(seen.has(key))return [];
    seen.add(key);
    return [{...labels,lat,lon}];
  });
}
