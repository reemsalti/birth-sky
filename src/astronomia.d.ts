// astronomia doesn't ship TypeScript types, so this keeps the compiler happy
declare module "astronomia" {
  export const planetposition: any;
  export const elliptic: any;
  export const kepler: any;
  export const moonposition: any;
  export const coord: any;
  export const nutation: any;
  export const solar: any;
  export const sidereal: any;
  export const globe: any;
  export const base: any;
}

declare module "astronomia/data/*" {
  const data: any;
  export default data;
}
