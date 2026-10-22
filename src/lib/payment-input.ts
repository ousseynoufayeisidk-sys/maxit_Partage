/** Keep the Senegal country prefix outside the editable national number. */
export function nationalPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return (digits.startsWith("00221") ? digits.slice(5) : digits.startsWith("221") ? digits.slice(3) : digits).slice(0, 9);
}

export function displayPhone(value: string) {
  return nationalPhone(value).replace(/^(\d{2})(\d{0,3})(\d{0,2})(\d{0,2})$/, (_, a, b, c, d) => [a, b, c, d].filter(Boolean).join(" "));
}