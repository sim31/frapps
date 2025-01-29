
export function frappOrnodeSiteName(frappId: string) {
  return `${frappId}-ornode`;
}

export function frappOrnodeUrl(frappId: string, domain: string) {
  return `${frappOrnodeSiteName(frappId)}.${domain}`;
}

export const orclientDocsSiteName = "orclient-docs";
export function orclientDocsUrl(domain: string) {
  return `${orclientDocsSiteName}.${domain}`;
}

