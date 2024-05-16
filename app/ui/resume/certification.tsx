import Image from "next/image";
import React from "react";
import { ExternalLink } from "@/app/ui/external-link";

export function Certification(props: { link: string, imageURL: string, title?: string }) {
  return <div className="w-max h-max">
    <ExternalLink href={props.link}>
      <Image src={props.imageURL} alt="" title={props.title} width={800} height={560} />
    </ExternalLink>
  </div>;
}
