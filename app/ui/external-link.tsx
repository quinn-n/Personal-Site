import React from "react";

export function ExternalLink(props: {href: string, children: React.ReactNode}) {
  return <a rel="noopener noreferrer" className="link-text" href={props.href}>{props.children}</a>;
}
