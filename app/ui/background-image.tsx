"use client";
import React from "react";
import { ImageInfo } from "@/app/ui/images";

export function BackgroundImage() {
  const image = IMAGE_INFO[Math.floor(Math.random() * IMAGE_INFO.length)];
  const title = image.titles[Math.floor(Math.random() * image.titles.length)];

  // NextJS's `Image` doesn't support CSS resizing.
  /* eslint-disable @next/next/no-img-element */
  return <div className="flex justify-center items-center max-h-full max-w-full">
    <img src={image.url} title={title} alt={image.alt} className="object-contain max-h-full max-w-full"/>
  </div>;
  /* eslint-enable @next/next/no-img-element */
}

const IMAGE_INFO: ImageInfo[] = [
  {
    url: "/background-images/cat-computer.jpg",
    alt: "A kitten sleeping inside a computer",
    titles: [
      "A cat-nap",
      "Sleeping on the job",
    ],
  },
  {
    url: "/background-images/computer-cleaning.png",
    alt: "A computer being rinsed with a hose",
    titles: [
      "Washing the bugs out",
    ],
  },
  {
    url: "/background-images/concerned-monero-chan.png",
    alt: undefined,
    titles: [
      "",
    ],
  },
  {
    url: "/background-images/depressed-frieren.jpg",
    alt: "Depressed Frieren",
    titles: [
      "",
    ],
  },
  {
    url: "/background-images/find-the-curved-line.webp",
    alt: undefined,
    titles: [
      "AAAAAAAAA",
      "",
    ],
  },
  {
    url: "/background-images/frieren-burger.jpg",
    alt: "No burgers here!",
    titles: [
      "Mogu mogu",
      "I definitely would've remembered seeing something like that",
    ],
  },
  {
    url: "/background-images/frieren-sleeping.jpg",
    alt: "Frieren sleeping",
    titles: [
      "zzzzzz",
    ],
  },
  {
    url: "/background-images/frieren-staring-out-window.jpg",
    alt: "Frieren staring out a window",
    titles: [
      "",
    ],
  },
  {
    url: "/background-images/frizbee.jpg",
    alt: undefined,
    titles: [
      ">_<",
    ],
  },
  {
    url: "/background-images/gigachad-computer.jpg",
    alt: undefined,
    titles: [
      "Haters will say it's photoshop",
      "He is literally me",
    ],
  },
  {
    url: "/background-images/monke-computer.jpg",
    alt: "A monkey using a computer",
    titles: [
      "Quit monkeying around!",
      "Serious monkey business",
    ],
  },
  {
    url: "/background-images/not-forklift-certified.jpg",
    alt: "A cat driving a forklift",
    titles: [
      "",
    ],
  },
  {
    url: "/background-images/nothing-wacky-going-on-here-taxes.jpeg",
    alt: undefined,
    titles: [
      "Nothing to see here",
      "Move along",
    ],
  },
  {
    url: "/background-images/post-this-cat-when-they-least-expect-it.jpeg",
    alt: "A cat",
    titles: [
      "",
    ],
  },
  {
    url: "/background-images/studying-man-made-horrors.jpg",
    alt: undefined,
    titles: [
      "It is important to stay up to date with the latest technologies",
      "Reading is important, you know?",
    ],
  },
  {
    url: "/background-images/upside-down-cat.jpeg",
    alt: "An upside-down cat standing on the ceiling",
    titles: [
      "Sir you can't park there",
    ],
  }
];
