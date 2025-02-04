
export function frappOrnodeSiteName(frappId: string) {
  return `${frappId}-ornode`;
}

export function frappOrnodeUrl(
  frappId: string,
  domain: string,
  https: boolean = true
) {
  return `${https? "https" : "http"}://${frappOrnodeSiteName(frappId)}.${domain}`;
}

export const orclientDocsSiteName = "orclient-docs";
export function orclientDocsUrl(domain: string, https: boolean = true) {
  return `${https ? "https" : "http"}://${orclientDocsSiteName}.${domain}`;
}

export function guiSiteName(frappId: string) {
  return `${frappId}`;
}

export function guiUrl(frappId: string, domain: string, https: boolean = true) {
  return `${https ? "https" : "http"}://${guiSiteName(frappId)}.${domain}`;
}



