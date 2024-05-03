import { SkillPage } from "@/app/ui/resume/skill-page";
import Link from "next/link";

export default function Page() {
  return <SkillPage professionalExperience={2} personalExperience={3} pluralsightIQ={221}>
    <p>
      I&apos;ve used React + rxjs professionally at <Link className="link-text" href="https://encircleapp.com">Encircle</Link> to build new features and maintain existing ones.
    </p>
    <p>
      { /* TODO: Add link to this website&apos;s source code */ }
      I&apos;ve used it with NextJS to make this website.
    </p>
  </SkillPage>;
}
