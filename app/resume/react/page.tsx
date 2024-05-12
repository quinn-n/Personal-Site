import { SkillPage } from "@/app/ui/resume/skill-page";

export default function Page() {
  return <SkillPage professionalExperience={2} personalExperience={3}>
    <p>
      I&apos;ve used React + rxjs professionally at <a rel="noopener noreferrer" className="link-text" href="https://encircleapp.com">Encircle</a> to build new features and maintain existing ones.
    </p>
    <p>
      I&apos;ve used it with the NextJS framework to make <a rel="noopener noreferrer" className="link-text" href="https://github.com/quinn-n/Personal-Site">this website</a>.
    </p>
  </SkillPage>;
}
