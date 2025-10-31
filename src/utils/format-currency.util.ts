/**
 * Format currency with abbreviations for large numbers
 * @param value - The numeric value to format
 * @param options - Optional configuration
 * @returns Formatted currency string with abbreviations (K, M, B, T)
 */
export function formatCurrencyShort(
  value: number,
  options: {
    currency?: string
    locale?: string
    decimals?: number
  } = {}
): string {
  const { currency = "USD", locale = "en-US", decimals = 1 } = options

  const absValue = Math.abs(value)
  const sign = value < 0 ? "-" : ""

  // Determine the suffix and divisor
  let suffix = ""
  let divisor = 1

  if (absValue >= 1_000_000_000_000) {
    // Trillions
    suffix = "T"
    divisor = 1_000_000_000_000
  } else if (absValue >= 1_000_000_000) {
    // Billions
    suffix = "B"
    divisor = 1_000_000_000
  } else if (absValue >= 1_000_000) {
    // Millions
    suffix = "M"
    divisor = 1_000_000
  } else if (absValue >= 1_000) {
    // Thousands
    suffix = "K"
    divisor = 1_000
  }

  // For values less than 1000, return full format
  if (divisor === 1) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency
    }).format(value)
  }

  // Calculate the shortened value
  const shortValue = value / divisor

  // Format the number with specified decimals
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  }).format(Math.abs(shortValue))

  // Get currency symbol
  const currencySymbol = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
    .format(0)
    .replace(/\d/g, "")
    .trim()

  return `${sign}${currencySymbol}${formattedNumber}${suffix}`
}

/**
 * Standard currency formatter (non-abbreviated)
 */
export function formatCurrency(value: number, currency: string = "USD", locale: string = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency
  }).format(value)
}
