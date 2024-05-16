import React from "react";
import { ExternalLink } from "@/app/ui/external-link";
import { Certification } from "@/app/ui/resume/certification";
import { SkillPage } from "@/app/ui/resume/skill-page";

export default function Page() {
  return <SkillPage professionalExperience={2} personalExperience={7} pluralsightIQ={221}>
    <p>
      I&apos;ve used Python professionally to build private and public REST APIs with Tornado and SQLAlchemy.
      I&apos;ve used it for a huge number of personal projects and scripts, from&nbsp;
      <ExternalLink href="https://github.com/quinn-n/pip-search">small(ish) but useful scripts</ExternalLink>
      , to <ExternalLink href="https://github.com/quinn-n/worm">recreations of old games</ExternalLink>
      , to <ExternalLink href="https://github.com/quinn-n/NSFW_Detection_API">REST APIs written with FastAPI</ExternalLink>.
    </p>
    <div className="pt-16 space-x-12 flex justify-start">
      <Certification
        title="Python Institute PCAP"
        imageURL="/certifications/PCAP certificate.png"
        link="https://verify.openedg.org/?id=Bb8u.Jb9E.Gxet"
      />
      <Certification
        title="Python Institute PCEP"
        imageURL="/certifications/entry level python certificate.png"
        link="https://verify.openedg.org/?id=fB8N.HqYR.pP0U"
      />
    </div>
  </SkillPage>;
}
