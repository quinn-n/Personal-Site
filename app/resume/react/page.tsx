import React from "react";
import { ExternalLink } from "@/app/ui/external-link";
import { SkillPage } from "@/app/ui/resume/skill-page";

export default function Page() {
  return <SkillPage professionalExperience={2} personalExperience={3}>
    <p>
      I&apos;ve used React + rxjs professionally at <ExternalLink href="https://encircleapp.com">Encircle</ExternalLink> to build new features and maintain existing ones.
    </p>
    <p>
      I&apos;ve used it with the NextJS framework to make <ExternalLink href="https://github.com/quinn-n/Personal-Site">this website</ExternalLink>.
    </p>
  </SkillPage>;
}
