export const isProduction = (): boolean =>
  process.env.NODE_ENV === 'production';
