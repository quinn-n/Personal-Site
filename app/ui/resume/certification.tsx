import Image from "next/image";

export function Certification(props: { link: string, imageURL: string, title?: string }) {
  return <div className="w-max h-max">
    <a rel="noopener noreferrer" href={props.link}>
      <Image src={props.imageURL} alt="" title={props.title} width={800} height={560} />
    </a>
  </div>;
}
