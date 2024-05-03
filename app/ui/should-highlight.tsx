import { usePathname } from "next/navigation";

export function shouldHighlightLink(linkpath: string, linkLevel: number) {
  const pathname = usePathname();

  const pathnameSegment = pathname.split("/")[linkLevel];
  const linkpathSegment = linkpath.split("/")[linkLevel];

  return pathnameSegment === linkpathSegment;
}