import { SkillPage } from "@/app/ui/resume/skill-page";
import Link from "next/link";

export default function Page() {
  return <SkillPage professionalExperience={2} personalExperience={3} pluralsightIQ={221}>
    <p>
      I&apos;ve used React + rxjs professionally at <Link className="link-text" href="https://encircleapp.com">Encircle</Link> to build new features and maintain existing ones.
    </p>
    <p>
      I&apos;ve used it with the NextJS framework to make <Link className="link-text" href="https://github.com/quinn-n/Personal-Site">this website</Link>.
    </p>
  </SkillPage>;
}
