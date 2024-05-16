"use client";
import Image from "next/image";
import { ImageInfo } from "@/app/ui/images";

export function UnderConstruction() {
  const image = IMAGE_INFO[Math.floor(Math.random() * IMAGE_INFO.length)];
  const title = image.titles[Math.floor(Math.random() * image.titles.length)];
  return <div className="flex flex-col justify-start items-center w-full p-32">
    <h1 className="text-4xl font-bold">Under Construction</h1>
    <p className="text-lg">This page is under construction by a highly trained monkey</p>
    <div className="h-8"></div> {/* Spacer */}
    <Image src={image.url} width={500} height={400} alt={image.url} title={title} />
  </div>;
}

const IMAGE_INFO: ImageInfo[] = [
  {
    url: "/under-construction/computer-monkey-glasses.jpg",
    alt: "",
    titles: [
      "Me",
    ],
  },
  {
    url: "/under-construction/hammer-monkey-working.gif",
    alt: "",
    titles: [
      "Me",
    ],
  },
  {
    url: "/under-construction/saw-monkey-working.gif",
    alt: "",
    titles: [
      "Me",
    ],
  },
  {
    url: "/under-construction/procrastinating.webp",
    alt: "",
    titles: [
      "Procrastinating",
    ],
  },
];
