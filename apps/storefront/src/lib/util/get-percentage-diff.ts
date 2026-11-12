export const getPercentageDiff = (original: number, calculated: number) => {
  // No honest discount exists when there is no original price, or when the
  // calculated price is not below the original. Returning "0" here keeps a
  // sale badge from ever showing "NaN" (original 0) or a negative percent
  // (calculated above original).
  if (!original || original <= 0 || calculated >= original) {
    return "0"
  }

  const diff = original - calculated
  const decrease = (diff / original) * 100

  return decrease.toFixed()
}
