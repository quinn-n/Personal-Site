import Link from "next/link";

export default function Page() {
  return <div className="flex flex-col justify-between p-16">
    <div className="flex flex-col space-y-4">
      <p>
        I am a self-taught software developer living in south-western Ontario.
        I know a variety of programming languages and do both full stack and embedded development.
        I&apos;ve worked as a full stack developer for two years for <Link className="link-text" href="https://encircleapp.com">Encircle</Link>, and can provide references from them.
        I also do electrical engineering (dicking around with arduinos and robots) and machine learning projects as a hobby.
      </p>
      <div>
        <p>I&apos;m a fast learner and adapt quickly to new situations.</p>
        <p>I have helped bring new developers up to speed in the past.</p>
        <p>I have professional experience working in a collaborative SCRUM environment.</p>
      </div>
  
      <p>
        For a quick overview of where I am with my skillset, check out my&nbsp;
        <Link className="link-text" href="https://app.pluralsight.com/profile/quinn-neufeld">
          Pluralsight profile
        </Link>.
      </p>
    </div>

    <p>
      Looking for work :)
    </p>
  </div>
}