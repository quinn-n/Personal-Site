import Link from "next/link";

export default function Page() {
  return <div className="flex flex-col justify-between p-16">
    <div className="flex flex-col">
      <p>
        I am a self-taught software developer living in south-western Ontario.
        I know a variety of programming languages and do both full stack and embedded development.
        I&apos;ve worked as a full stack developer for two years for <Link className="link-text" href="https://encircleapp.com">Encircle</Link>.
        I also do electrical engineering (aka dicking around with robots) and machine learning projects as a hobby.
      </p>
  
      <p>
        For a quick overview of where I am with my skillset, check out my&nbsp;
        <Link className="link-text" href="https://app.pluralsight.com/profile/quinn-neufeld">
          Pluralsight profile
        </Link>.
      </p>
    </div>

    <p>
      Hire me please :)
    </p>
  </div>
}