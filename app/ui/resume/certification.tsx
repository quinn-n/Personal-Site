import { ExternalLink } from "@/app/ui/external-link";
import Image from "next/image";
import React from "react";

export function Certification(props: {
  link: string;
  imageURL: string;
  title?: string;
}) {
  return (
    <div className="w-max h-max max-w-full max-h-full">
      <ExternalLink href={props.link}>
        <Image
          src={props.imageURL}
          alt=""
          title={props.title}
          width={800}
          height={560}
        />
      </ExternalLink>
    </div>
  );
}
