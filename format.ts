export const formatRs = (num: number | null | undefined) => {
  if (num === null || num === undefined || isNaN(num)) return 'Rs. 0';
  const rounded = Math.round(num);
  return (
    'Rs. ' +
    rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  );
};
