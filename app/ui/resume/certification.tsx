import Image from "next/image";
import Link from "next/link";

export function Certification(props: { link: string, imageURL: string, title?: string }) {
  return <div className="w-max h-max">
    <Link href={props.link}>
      <Image src={props.imageURL} alt="" title={props.title} width={800} height={560} />
    </Link>
  </div>;
}
