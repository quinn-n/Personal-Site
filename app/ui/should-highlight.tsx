export function shouldHighlightLink(
  pathname: string,
  linkpath: string,
  linkLevel: number,
) {
  const pathnameSegment = pathname.split("/")[linkLevel];
  const linkpathSegment = linkpath.split("/")[linkLevel];

  return pathnameSegment === linkpathSegment;
}
